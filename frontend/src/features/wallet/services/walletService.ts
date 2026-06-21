import { API_BASE_URL } from '../../../services/apiConfig';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

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

export async function fetchMyWallet(accessToken: string): Promise<WalletSummary> {
  const response = await authenticatedFetch(`${API_BASE_URL}/wallet/me`, {}, accessToken);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar la wallet');
  }

  return data.data;
}
