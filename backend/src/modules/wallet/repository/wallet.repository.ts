import { pool } from '../../../common/config/db.js';
import {
  WalletConflictError,
  WalletNotFoundError,
  WalletValidationError,
  type CreditCoinsInput,
  type DebitCoinsInput,
  type StoreItem,
  type WalletSummary,
} from '../types/wallet.types.js';

type DbClient = {
  query: (text: string, params?: any[]) => Promise<any>;
};

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
          si.category,
          EXISTS (
            SELECT 1
            FROM user_cosmetic_items uci
            WHERE uci.user_id = $1
              AND uci.item_id = si.id
          ) AS owned
        FROM shop_items si
        WHERE COALESCE(si.is_active, true) = true
        ORDER BY si.category ASC NULLS LAST, si.price ASC, si.name ASC;
      `,
      [userId]
    );

    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      price: Number(row.price) || 0,
      category: row.category ?? null,
      owned: Boolean(row.owned),
    }));
  },

  async creditCoins(client: DbClient, input: CreditCoinsInput): Promise<number> {
    if (input.amount <= 0) {
      throw new WalletValidationError('El monto a acreditar debe ser mayor a cero');
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
