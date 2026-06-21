export type WalletMovementType =
  | 'mission_reward'
  | 'achievement_reward'
  | 'ranking_reward'
  | 'purchase'
  | 'refund'
  | 'adjustment';

export interface CreditCoinsInput {
  userId: string;
  amount: number;
  type: WalletMovementType;
  referenceType?: string | null;
  referenceId?: string | null;
  description: string;
}

export interface DebitCoinsInput extends CreditCoinsInput {}

export interface WalletMovement {
  id: string;
  user_id: string;
  type: WalletMovementType;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string;
  created_at: string;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  owned: boolean;
}

export interface WalletSummary {
  coins_balance: number;
  store_items: StoreItem[];
}

export class WalletValidationError extends Error {}
export class WalletConflictError extends Error {}
export class WalletNotFoundError extends Error {}
