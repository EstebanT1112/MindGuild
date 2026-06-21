import { pool } from '../../../common/config/db.js';
import { walletRepository } from '../repository/wallet.repository.js';
import type { CreditCoinsInput, DebitCoinsInput, WalletSummary } from '../types/wallet.types.js';

export const walletService = {
  async getWallet(userId: string): Promise<WalletSummary> {
    return walletRepository.getWallet(userId);
  },

  async creditCoins(input: CreditCoinsInput): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const balance = await walletRepository.creditCoins(client, input);
      await client.query('COMMIT');
      return balance;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async debitCoins(input: DebitCoinsInput): Promise<number> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const balance = await walletRepository.debitCoins(client, input);
      await client.query('COMMIT');
      return balance;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  creditCoinsInTransaction: walletRepository.creditCoins,
  debitCoinsInTransaction: walletRepository.debitCoins,
};
