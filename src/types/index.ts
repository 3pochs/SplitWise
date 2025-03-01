
export type Friend = {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  username?: string; // Added username field
  isUser?: boolean; // To distinguish between app users and external friends
};

export type ExpenseSplit = {
  friendId: string;
  amount: number;
  percentage?: number;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  payerId: string;
  splits: ExpenseSplit[];
  category?: string;
  notes?: string;
  proofOfPaymentUrl?: string; // URL to the proof of payment image
};

export type Balance = {
  friendId: string;
  amount: number; // Positive: friend owes user, Negative: user owes friend
};

export type Settlement = {
  fromId: string;
  toId: string;
  amount: number;
  status?: 'pending' | 'completed';
  proofOfPaymentUrl?: string;
};

export type Tab = 'expenses' | 'friends' | 'balances' | 'settlements' | 'settings';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferences: {
    darkMode: boolean;
    currency: string;
    language: string;
    notificationsEnabled: boolean;
  };
};

export type AppTheme = 'light' | 'dark' | 'system';
