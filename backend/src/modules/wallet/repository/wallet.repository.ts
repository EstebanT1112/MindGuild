import { pool } from '../../../common/config/db.js';
import {
  WalletConflictError,
  WalletNotFoundError,
  WalletValidationError,
  type CreditCoinsInput,
  type DebitCoinsInput,
  type StoreEquipResult,
  type StoreItem,
  type StorePurchaseResult,
  type WalletSummary,
} from '../types/wallet.types.js';

type DbClient = {
  query: (text: string, params?: any[]) => Promise<any>;
};

const ALLOWED_SHOP_ITEM_TYPES = ['squirrel_skin', 'profile_frame', 'badge_effect', 'streak_shield'];
const EQUIPPABLE_SHOP_ITEM_TYPES = ['squirrel_skin', 'profile_frame', 'badge_effect'];
const APP_TIMEZONE = 'America/Argentina/Buenos_Aires';

export const walletRepository = {
  async getWallet(userId: string): Promise<WalletSummary> {
    const { rows: profileRows } = await pool.query(
      `
        SELECT coins_balance
        FROM profiles
        WHERE id = $1
          AND is_active = true
        LIMIT 1;
      `,
      [userId]
    );

    if (!profileRows[0]) {
      throw new WalletNotFoundError('Usuario no encontrado');
    }

    return {
      coins_balance: Number(profileRows[0].coins_balance) || 0,
      store_items: await this.getStoreItems(userId),
    };
  },

  async getStoreItems(userId: string): Promise<StoreItem[]> {
    const { rows } = await pool.query(
      `
        SELECT
          si.id,
          si.name,
          si.description,
          si.price,
          si.item_type AS category,
          si.item_type,  -- ✅ Agregamos el campo original para el frontend
          EXISTS (
            SELECT 1
            FROM user_cosmetic_items uci
            WHERE uci.user_id = $1
              AND uci.shop_item_id = si.id
          ) AS owned,
          COALESCE((
            SELECT uci.is_equipped
            FROM user_cosmetic_items uci
            WHERE uci.user_id = $1
              AND uci.shop_item_id = si.id
            LIMIT 1
          ), false) AS is_equipped
        FROM shop_items si
        WHERE COALESCE(si.is_active, true) = true
          AND si.item_type = ANY($2)
        ORDER BY si.item_type ASC NULLS LAST, si.price ASC, si.name ASC;
      `,
      [userId, ALLOWED_SHOP_ITEM_TYPES]
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      price: Number(row.price) || 0,
      category: row.category ?? null,
      item_type: row.item_type ?? null, // ✅ Mapeamos el nuevo campo
      owned: Boolean(row.owned),
      is_equipped: Boolean(row.is_equipped),
    }));
  },

  async purchaseStoreItem(userId: string, itemId: string): Promise<StorePurchaseResult> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const item = await findActiveStoreItem(client, itemId);

      if (item.category !== 'streak_shield') {
        const { rows: ownedRows } = await client.query(
          `
            SELECT id
            FROM user_cosmetic_items
            WHERE user_id = $1
              AND shop_item_id = $2
            LIMIT 1;
          `,
          [userId, itemId]
        );

        if (ownedRows[0]) {
          throw new WalletConflictError('El cosmético ya fue comprado');
        }
      }

      const coinsBalance = await this.debitCoins(client, {
        userId,
        amount: item.price,
        type: 'purchase',
        referenceType: 'shop_item',
        referenceId: item.id,
        description: `Compra de cosmético: ${item.name}`,
      });

      if (item.category === 'streak_shield') {
        await activateStreakShield(client, userId, item);
      } else {
        await client.query(
          `
            INSERT INTO user_cosmetic_items (
              user_id,
              shop_item_id,
              source,
              is_equipped
            )
            VALUES ($1, $2, 'purchase', false);
          `,
          [userId, item.id]
        );
      }

      await client.query('COMMIT');

      return {
        coins_balance: coinsBalance,
        item: {
          ...item,
          owned: item.category !== 'streak_shield',
          is_equipped: false,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async equipStoreItem(userId: string, itemId: string): Promise<StoreEquipResult> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const item = await findActiveStoreItem(client, itemId);

      if (!item.category || !EQUIPPABLE_SHOP_ITEM_TYPES.includes(item.category)) {
        throw new WalletValidationError('Este cosmético no se puede equipar');
      }

      const { rows: ownedRows } = await client.query(
        `
          SELECT id
          FROM user_cosmetic_items
          WHERE user_id = $1
            AND shop_item_id = $2
          LIMIT 1;
        `,
        [userId, itemId]
      );

      if (!ownedRows[0]) {
        throw new WalletConflictError('Primero tenés que comprar este cosmético');
      }

      await client.query(
        `
          UPDATE user_cosmetic_items uci
          SET is_equipped = false
          FROM shop_items si
          WHERE uci.shop_item_id = si.id
            AND uci.user_id = $1
            AND si.item_type = $2;
        `,
        [userId, item.category]
      );

      await client.query(
        `
          UPDATE user_cosmetic_items
          SET is_equipped = true
          WHERE user_id = $1
            AND shop_item_id = $2;
        `,
        [userId, item.id]
      );

      await client.query('COMMIT');

      return {
        item: {
          ...item,
          owned: true,
          is_equipped: true,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async creditCoins(client: DbClient, input: CreditCoinsInput): Promise<number> {
    if (input.amount <= 0) {
      throw new WalletValidationError('El monto a acreditar debe ser mayor a cero');
    }

    const alreadyCreditedBalance = await findExistingCreditBalance(client, input);
    if (alreadyCreditedBalance !== null) {
      return alreadyCreditedBalance;
    }

    const balanceBefore = await lockUserBalance(client, input.userId);
    const balanceAfter = balanceBefore + input.amount;

    await client.query(
      `
        UPDATE profiles
        SET coins_balance = $2,
            updated_at = NOW()
        WHERE id = $1;
      `,
      [input.userId, balanceAfter]
    );

    try {
      await client.query(
        `
          INSERT INTO wallet_movements (
            user_id,
            type,
            amount,
            balance_before,
            balance_after,
            reference_type,
            reference_id,
            description
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `,
        [
          input.userId,
          input.type,
          input.amount,
          balanceBefore,
          balanceAfter,
          input.referenceType ?? null,
          input.referenceId ?? null,
          input.description,
        ]
      );
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new WalletConflictError('La recompensa ya fue acreditada');
      }

      throw error;
    }

    return balanceAfter;
  },

  async debitCoins(client: DbClient, input: DebitCoinsInput): Promise<number> {
    if (input.amount <= 0) {
      throw new WalletValidationError('El monto a debitar debe ser mayor a cero');
    }

    const balanceBefore = await lockUserBalance(client, input.userId);

    if (balanceBefore < input.amount) {
      throw new WalletConflictError('Saldo insuficiente');
    }

    const balanceAfter = balanceBefore - input.amount;

    await client.query(
      `
        UPDATE profiles
        SET coins_balance = $2,
            updated_at = NOW()
        WHERE id = $1;
      `,
      [input.userId, balanceAfter]
    );

    await client.query(
      `
        INSERT INTO wallet_movements (
          user_id,
          type,
          amount,
          balance_before,
          balance_after,
          reference_type,
          reference_id,
          description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `,
      [
        input.userId,
        input.type,
        -input.amount,
        balanceBefore,
        balanceAfter,
        input.referenceType ?? null,
        input.referenceId ?? null,
        input.description,
      ]
    );

    return balanceAfter;
  },
};

async function findActiveStoreItem(client: DbClient, itemId: string): Promise<StoreItem> {
  const { rows } = await client.query(
    `
      SELECT
        id,
        name,
        description,
        price,
        item_type AS category,
        item_type,  -- ✅ Agregamos el campo original
        metadata
      FROM shop_items
      WHERE id = $1
        AND COALESCE(is_active, true) = true
        AND item_type = ANY($2)
      LIMIT 1;
    `,
    [itemId, ALLOWED_SHOP_ITEM_TYPES]
  );

  const item = rows[0];

  if (!item) {
    throw new WalletNotFoundError('Cosmético no encontrado');
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    price: Number(item.price) || 0,
    category: item.category ?? null,
    item_type: item.item_type ?? null, // ✅ Mapeamos el nuevo campo
    owned: false,
    is_equipped: false,
    metadata: item.metadata ?? null,
  };
}

async function activateStreakShield(client: DbClient, userId: string, item: StoreItem): Promise<void> {
  const rawShieldDays = Number(item.metadata?.shield_days ?? 1);
  const shieldDays = Math.min(Math.max(Math.trunc(rawShieldDays) || 1, 1), 30);

  await client.query(
    `
      WITH last_protection AS (
        SELECT GREATEST(
          (NOW() AT TIME ZONE $3)::date,
          COALESCE(MAX(protected_date) + 1, (NOW() AT TIME ZONE $3)::date)
        ) AS start_date
        FROM user_streak_protections
        WHERE user_id = $1
          AND protected_date >= (NOW() AT TIME ZONE $3)::date
      ),
      protected_days AS (
        SELECT (last_protection.start_date + day_offset)::date AS protected_date
        FROM last_protection
        CROSS JOIN generate_series(0, $4::int - 1) AS day_offset
      )
      INSERT INTO user_streak_protections (
        user_id,
        protected_date,
        shop_item_id
      )
      SELECT $1, protected_date, $2
      FROM protected_days
      ON CONFLICT (user_id, protected_date)
      DO NOTHING;
    `,
    [userId, item.id, APP_TIMEZONE, shieldDays]
  );

  await applyTodayStreakProtection(client, userId);
}

async function applyTodayStreakProtection(client: DbClient, userId: string): Promise<void> {
  await client.query(
    `
      UPDATE user_streak_protections
      SET applied_at = NOW()
      WHERE user_id = $1
        AND protected_date = (NOW() AT TIME ZONE $2)::date
        AND applied_at IS NULL;
    `,
    [userId, APP_TIMEZONE]
  );
}

async function lockUserBalance(client: DbClient, userId: string): Promise<number> {
  const { rows } = await client.query(
    `
      SELECT coins_balance
      FROM profiles
      WHERE id = $1
        AND is_active = true
      FOR UPDATE;
    `,
    [userId]
  );

  if (!rows[0]) {
    throw new WalletNotFoundError('Usuario no encontrado');
  }

  return Number(rows[0].coins_balance) || 0;
}

async function findExistingCreditBalance(
  client: DbClient,
  input: CreditCoinsInput
): Promise<number | null> {
  if (!input.referenceType || !input.referenceId) {
    return null;
  }

  const { rows } = await client.query(
    `
      SELECT p.coins_balance
      FROM wallet_movements wm
      INNER JOIN profiles p ON p.id = wm.user_id
      WHERE wm.user_id = $1
        AND wm.type = $2
        AND wm.reference_type = $3
        AND wm.reference_id = $4
      ORDER BY wm.created_at DESC
      LIMIT 1;
    `,
    [input.userId, input.type, input.referenceType, input.referenceId]
  );

  if (!rows[0]) {
    return null;
  }

  return Number(rows[0].coins_balance) || 0;
}