
import { Balance, Expense, Friend, Settlement } from "@/types";

export const calculateBalances = (expenses: Expense[], friends: Friend[], currentUserId: string): Balance[] => {
  // Initialize balances for each friend
  const balances: Record<string, number> = {};
  friends.forEach(friend => {
    balances[friend.id] = 0;
  });

  // Calculate the balance for each expense
  expenses.forEach(expense => {
    const { payerId, splits, amount } = expense;
    
    // If the current user paid
    if (payerId === currentUserId) {
      splits.forEach(split => {
        if (split.friendId !== currentUserId) {
          balances[split.friendId] += split.amount;
        }
      });
    } 
    // If someone else paid
    else {
      // Find how much the current user owes
      const userSplit = splits.find(split => split.friendId === currentUserId);
      if (userSplit) {
        balances[payerId] -= userSplit.amount;
      }
      
      // Check for other splits where the user might be involved
      splits.forEach(split => {
        if (split.friendId !== currentUserId && split.friendId !== payerId) {
          // No adjustment needed for other participants
        }
      });
    }
  });
  
  // Convert to array format
  return friends
    .filter(friend => friend.id !== currentUserId)
    .map(friend => ({
      friendId: friend.id,
      amount: balances[friend.id]
    }));
};

export const generateSettlements = (balances: Balance[], friends: Friend[]): Settlement[] => {
  // Deep copy the balances to avoid modifying the original
  const workingBalances = balances.map(b => ({ ...b }));
  
  // Sort balances by amount (ascending to get negatives first)
  workingBalances.sort((a, b) => a.amount - b.amount);
  
  const settlements: Settlement[] = [];
  
  // Iterate until all balances are resolved
  while (workingBalances.length > 1) {
    const negativeBalance = workingBalances[0]; // Person who is owed money (negative balance)
    const positiveBalance = workingBalances[workingBalances.length - 1]; // Person who owes money (positive balance)
    
    // No significant balances left
    if (Math.abs(negativeBalance.amount) < 0.01 && Math.abs(positiveBalance.amount) < 0.01) {
      break;
    }
    
    // Calculate settlement amount
    const settlementAmount = Math.min(Math.abs(negativeBalance.amount), positiveBalance.amount);
    
    if (settlementAmount > 0) {
      settlements.push({
        fromId: positiveBalance.friendId,
        toId: negativeBalance.friendId,
        amount: Number(settlementAmount.toFixed(2))
      });
      
      // Update balances
      negativeBalance.amount += settlementAmount;
      positiveBalance.amount -= settlementAmount;
    }
    
    // Remove settled balances
    if (Math.abs(negativeBalance.amount) < 0.01) {
      workingBalances.shift();
    }
    if (Math.abs(positiveBalance.amount) < 0.01) {
      workingBalances.pop();
    }
  }
  
  return settlements;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const distributeExpenseEvenly = (amount: number, friendIds: string[]): Record<string, number> => {
  const perPersonAmount = amount / friendIds.length;
  const result: Record<string, number> = {};
  
  friendIds.forEach(id => {
    result[id] = Number(perPersonAmount.toFixed(2));
  });
  
  // Ensure sum is exactly equal to amount
  const sum = Object.values(result).reduce((a, b) => a + b, 0);
  const diff = amount - sum;
  
  if (diff !== 0 && friendIds.length > 0) {
    result[friendIds[0]] = Number((result[friendIds[0]] + diff).toFixed(2));
  }
  
  return result;
};

export const getExpenseStatusColor = (expense: Expense, currentUserId: string): string => {
  if (expense.payerId === currentUserId) {
    // User paid for others
    return "text-emerald-600";
  }
  
  // Find what the user owes in this expense
  const userSplit = expense.splits.find(split => split.friendId === currentUserId);
  if (!userSplit || userSplit.amount === 0) {
    return "text-gray-600"; // Not involved or no amount owed
  }
  
  return "text-rose-600"; // User owes money
};

export const getNameById = (id: string, friends: Friend[], currentUserName: string): string => {
  if (id === 'current-user') return currentUserName;
  const friend = friends.find(f => f.id === id);
  return friend ? friend.name : 'Unknown';
};
