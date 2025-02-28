
export type Friend = {
  id: string;
  name: string;
  avatarUrl?: string;
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
};

export type Balance = {
  friendId: string;
  amount: number; // Positive: friend owes user, Negative: user owes friend
};

export type Settlement = {
  fromId: string;
  toId: string;
  amount: number;
};

export type Tab = 'expenses' | 'friends' | 'balances' | 'settlements';
