
import { supabase } from './client';
import { Expense, Friend, ExpenseSplit, Settlement, UserProfile } from '@/types';

// Profile functions
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url,
    preferences: {
      darkMode: false,
      currency: 'USD',
      language: 'en',
      notificationsEnabled: true,
    }
  };
};

export const updateUserProfile = async (profile: Partial<UserProfile> & { id: string }): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      name: profile.name,
      avatar_url: profile.avatarUrl,
    })
    .eq('id', profile.id);
    
  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }
  
  return true;
};

// Friend functions
export const fetchFriends = async (userId: string): Promise<Friend[]> => {
  // First get the friend connections
  const { data: connections, error: connectionsError } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
    .eq('status', 'accepted');
    
  if (connectionsError || !connections) {
    console.error('Error fetching friend connections:', connectionsError);
    return [];
  }
  
  // Extract friend IDs (the other user in each connection)
  const friendIds = connections.map(conn => 
    conn.user_id === userId ? conn.friend_id : conn.user_id
  );
  
  if (friendIds.length === 0) return [];
  
  // Then fetch the profiles for these friends
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', friendIds);
    
  if (profilesError || !profiles) {
    console.error('Error fetching friend profiles:', profilesError);
    return [];
  }
  
  // Transform to Friend objects
  return profiles.map(profile => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    username: profile.name, // Use name as username
    avatarUrl: profile.avatar_url,
    isUser: true // They're all app users if found in profiles
  }));
};

export const addFriend = async (userId: string, usernameOrEmail: string): Promise<Friend | null> => {
  console.log(`Attempting to add friend with username/email: ${usernameOrEmail}`);
  
  // First try to add by username using our new function
  const { data: friendIdData, error: functionError } = await supabase
    .rpc('add_friend_by_username', {
      user_id: userId,
      friend_username: usernameOrEmail
    });
    
  if (functionError) {
    console.error('Error adding friend by username:', functionError);
    // Continue to try by email as fallback
  } else if (friendIdData) {
    // Successfully added by username, now fetch the friend's profile
    const { data: friendProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendIdData)
      .single();
      
    if (profileError || !friendProfile) {
      console.error('Error fetching added friend profile:', profileError);
      return null;
    }
    
    return {
      id: friendProfile.id,
      name: friendProfile.name,
      email: friendProfile.email,
      username: friendProfile.name, // Use name as username
      avatarUrl: friendProfile.avatar_url,
      isUser: true
    };
  }
  
  // If we get here, either there was an error with the function call or the friend wasn't found by username
  // Try the original method of searching by email (as a fallback)
  const { data: friendData, error: friendError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', usernameOrEmail)
    .maybeSingle();
    
  if (friendError) {
    console.error('Error finding friend by email:', friendError);
    return null;
  }
  
  // If friend not found by either username or email, return null
  if (!friendData) {
    console.error('Friend not found by username or email');
    return null;
  }
  
  // Check if friendship already exists
  const { data: existingFriend, error: existingError } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendData.id}),and(user_id.eq.${friendData.id},friend_id.eq.${userId})`)
    .maybeSingle();
    
  if (existingFriend) {
    console.log('Friendship already exists');
    return {
      id: friendData.id,
      name: friendData.name,
      email: friendData.email,
      username: friendData.name, // Use name as username
      avatarUrl: friendData.avatar_url,
      isUser: true
    };
  }
  
  // Create the friendship
  const { data: newFriend, error } = await supabase
    .from('friends')
    .insert({
      user_id: userId,
      friend_id: friendData.id,
      status: 'accepted' // Auto-accept for now
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding friend:', error);
    return null;
  }
  
  return {
    id: friendData.id,
    name: friendData.name,
    email: friendData.email,
    username: friendData.name, // Use name as username
    avatarUrl: friendData.avatar_url,
    isUser: true
  };
};

export const removeFriend = async (userId: string, friendId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
    
  if (error) {
    console.error('Error removing friend:', error);
    return false;
  }
  
  return true;
};

// Expense functions
export const fetchExpenses = async (userId: string): Promise<Expense[]> => {
  // Get all expenses where the user is involved
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_splits(*)
    `)
    .or(`created_by.eq.${userId},payer_id.eq.${userId},expense_splits(user_id).eq.${userId}`);
    
  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  
  if (!data) return [];
  
  // Transform the data to match the Expense type
  return data.map(expense => {
    const splits: ExpenseSplit[] = expense.expense_splits.map((split: any) => ({
      friendId: split.user_id,
      amount: split.amount,
      percentage: split.percentage || 0
    }));
    
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date),
      payerId: expense.payer_id,
      splits: splits,
      category: expense.category || 'Other',
      notes: expense.notes,
      proofOfPaymentUrl: expense.proof_of_payment_url
    };
  });
};

export const addExpense = async (expense: Omit<Expense, 'id'>): Promise<Expense | null> => {
  // First, create the expense
  const { data: expenseData, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toISOString(),
      payer_id: expense.payerId,
      category: expense.category,
      notes: expense.notes,
      proof_of_payment_url: expense.proofOfPaymentUrl,
      created_by: expense.payerId // Assuming the payer is creating the expense
    })
    .select()
    .single();
    
  if (expenseError || !expenseData) {
    console.error('Error adding expense:', expenseError);
    return null;
  }
  
  // Then, add the splits
  const splitInserts = expense.splits.map(split => ({
    expense_id: expenseData.id,
    user_id: split.friendId,
    amount: split.amount,
    percentage: split.percentage
  }));
  
  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitInserts);
    
  if (splitsError) {
    console.error('Error adding expense splits:', splitsError);
    // Consider rolling back the expense creation here
    return null;
  }
  
  return {
    id: expenseData.id,
    description: expense.description,
    amount: expense.amount,
    date: expense.date,
    payerId: expense.payerId,
    splits: expense.splits,
    category: expense.category,
    notes: expense.notes,
    proofOfPaymentUrl: expense.proofOfPaymentUrl
  };
};

export const updateExpense = async (expense: Expense): Promise<boolean> => {
  // Update the expense
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      description: expense.description,
      amount: expense.amount,
      date: expense.date.toISOString(),
      payer_id: expense.payerId,
      category: expense.category,
      notes: expense.notes,
      proof_of_payment_url: expense.proofOfPaymentUrl
    })
    .eq('id', expense.id);
    
  if (expenseError) {
    console.error('Error updating expense:', expenseError);
    return false;
  }
  
  // Delete existing splits
  const { error: deleteError } = await supabase
    .from('expense_splits')
    .delete()
    .eq('expense_id', expense.id);
    
  if (deleteError) {
    console.error('Error deleting expense splits:', deleteError);
    return false;
  }
  
  // Add updated splits
  const splitInserts = expense.splits.map(split => ({
    expense_id: expense.id,
    user_id: split.friendId,
    amount: split.amount,
    percentage: split.percentage
  }));
  
  const { error: splitsError } = await supabase
    .from('expense_splits')
    .insert(splitInserts);
    
  if (splitsError) {
    console.error('Error updating expense splits:', splitsError);
    return false;
  }
  
  return true;
};

export const deleteExpense = async (expenseId: string): Promise<boolean> => {
  // Splits will be automatically deleted due to the foreign key constraint
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId);
    
  if (error) {
    console.error('Error deleting expense:', error);
    return false;
  }
  
  return true;
};

// Settlement functions
export const fetchSettlements = async (userId: string): Promise<Settlement[]> => {
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .or(`from_id.eq.${userId},to_id.eq.${userId}`);
    
  if (error) {
    console.error('Error fetching settlements:', error);
    return [];
  }
  
  if (!data) return [];
  
  return data.map(settlement => ({
    fromId: settlement.from_id,
    toId: settlement.to_id,
    amount: settlement.amount,
    status: settlement.status as 'pending' | 'completed',
    proofOfPaymentUrl: settlement.proof_of_payment_url
  }));
};

export const addSettlement = async (settlement: Omit<Settlement, 'id'>): Promise<boolean> => {
  const { error } = await supabase
    .from('settlements')
    .insert({
      from_id: settlement.fromId,
      to_id: settlement.toId,
      amount: settlement.amount,
      status: settlement.status || 'pending',
      proof_of_payment_url: settlement.proofOfPaymentUrl
    });
    
  if (error) {
    console.error('Error adding settlement:', error);
    return false;
  }
  
  return true;
};

export const updateSettlementStatus = async (fromId: string, toId: string, status: 'pending' | 'completed'): Promise<boolean> => {
  const { error } = await supabase
    .from('settlements')
    .update({ status })
    .eq('from_id', fromId)
    .eq('to_id', toId);
    
  if (error) {
    console.error('Error updating settlement status:', error);
    return false;
  }
  
  return true;
};

// File upload functions
export const uploadPaymentProof = async (file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(filePath, file);
    
  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(filePath);
    
  return publicUrl;
};

export const getPublicUrl = (path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from('payment-proofs')
    .getPublicUrl(path);
    
  return publicUrl;
};
