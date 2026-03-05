// Transaction types
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  walletId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdBy: string; // Added to track user
  createdAt: number;
  synced: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  budget?: number;
  order: number;
  synced?: boolean;
}

// Wallet types
export interface Wallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  order: number;
}

// Budget types
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
  synced?: boolean;
}
