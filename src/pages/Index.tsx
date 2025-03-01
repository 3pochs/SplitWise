
import { useState, useEffect } from "react";
import { Expense, Friend, Balance, Settlement, Tab } from "@/types";
import Header from "@/components/Header";
import ExpenseList from "@/components/ExpenseList";
import FriendsList from "@/components/FriendsList";
import BalanceSummary from "@/components/BalanceSummary";
import SettlementSuggestions from "@/components/SettlementSuggestions";
import ExpenseForm from "@/components/ExpenseForm";
import { calculateBalances, generateSettlements } from "@/utils/expenseUtils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import { Loader } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { 
  fetchExpenses, 
  fetchFriends, 
  addExpense, 
  updateExpense, 
  deleteExpense,
  addFriend,
  removeFriend,
  addSettlement
} from "@/integrations/supabase/api";

const Index = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentTab, setCurrentTab] = useState<Tab>("expenses");
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentUserId = user?.id || "current-user";
  const currentUserName = user?.name || "You";

  // Load data on mount and when user changes
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load friends
      const friendsData = await fetchFriends(user.id);
      setFriends(friendsData);
      
      // Load expenses
      const expensesData = await fetchExpenses(user.id);
      setExpenses(expensesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const balances = useMemo(() => {
    const allParticipants = [...friends, { id: currentUserId, name: currentUserName }];
    return calculateBalances(expenses, allParticipants, currentUserId);
  }, [expenses, friends, currentUserId, currentUserName]);

  const settlements = useMemo(() => {
    return generateSettlements(balances, friends);
  }, [balances, friends]);

  const handleAddExpense = () => {
    setExpenseToEdit(undefined);
    setIsExpenseFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseFormOpen(true);
  };

  const handleSaveExpense = async (expense: Expense) => {
    const isEdit = expenses.some((e) => e.id === expense.id);
    
    try {
      if (isEdit) {
        await updateExpense(expense);
        setExpenses(expenses.map((e) => (e.id === expense.id ? expense : e)));
        toast({
          title: "Expense updated",
          description: `"${expense.description}" has been updated.`,
        });
      } else {
        const newExpense = await addExpense(expense);
        if (newExpense) {
          setExpenses([...expenses, newExpense]);
          toast({
            title: "Expense added",
            description: `"${expense.description}" has been added.`,
          });
        }
      }
      
      // Refresh data to ensure we have the latest
      loadData();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "Failed to save the expense. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      setExpenses(expenses.filter((e) => e.id !== expenseId));
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete the expense. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleAddFriend = async (friend: Friend) => {
    try {
      if (!user) return;
      
      const newFriend = await addFriend(user.id, friend.email || friend.name + '@example.com');
      
      if (newFriend) {
        setFriends([...friends, newFriend]);
        toast({
          title: "Friend added",
          description: `${newFriend.name} has been added to your friends list.`,
        });
      } else {
        toast({
          title: "Friend not found",
          description: "Could not find a user with that email address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      toast({
        title: "Error",
        description: "Failed to add friend. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFriend = async (friendId: string) => {
    try {
      if (!user) return;
      
      const hasExpenses = expenses.some(
        (e) => e.payerId === friendId || e.splits.some((s) => s.friendId === friendId)
      );

      if (hasExpenses) {
        toast({
          title: "Cannot remove friend",
          description: "This friend has expenses. Please delete those expenses first.",
          variant: "destructive",
        });
        return;
      }

      await removeFriend(user.id, friendId);
      setFriends(friends.filter((f) => f.id !== friendId));
      toast({
        title: "Friend removed",
        description: "Your friend has been removed.",
      });
    } catch (error) {
      console.error("Error deleting friend:", error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleInviteFriend = (email: string) => {
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${email}.`,
    });
  };

  const handleSettlementComplete = async (settlement: Settlement) => {
    try {
      await addSettlement(settlement);
      
      const settlementExpense: Expense = {
        id: `settlement-${Date.now()}`,
        description: "Settlement",
        amount: settlement.amount,
        date: new Date(),
        payerId: settlement.fromId,
        splits: [
          {
            friendId: settlement.toId,
            amount: settlement.amount,
            percentage: 100,
          },
        ],
        category: "Settlement",
        notes: "Debt settlement",
        proofOfPaymentUrl: settlement.proofOfPaymentUrl,
      };

      await addExpense(settlementExpense);
      loadData(); // Refresh all data
      
      toast({
        title: "Settlement recorded",
        description: "The settlement has been recorded successfully.",
      });
    } catch (error) {
      console.error("Error completing settlement:", error);
      toast({
        title: "Error",
        description: "Failed to record settlement. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <Loader className="h-10 w-10 text-primary animate-spin mb-4" />
          <h2 className="text-2xl font-semibold">Loading...</h2>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center max-w-md p-6 text-center"
        >
          <h2 className="text-2xl font-semibold mb-4">Welcome to SplitBills</h2>
          <p className="mb-6">Please log in to start tracking and splitting expenses with your friends.</p>
          <Link 
            to="/auth" 
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Log In or Sign Up
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab as Tab)} />
      
      <motion.div
        className="container pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {currentTab === "expenses" && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ExpenseList
                expenses={expenses}
                friends={friends}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onAddExpense={handleAddExpense}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            </motion.div>
          )}

          {currentTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <FriendsList
                friends={friends}
                currentUserName={currentUserName}
                onAddFriend={handleAddFriend}
                onDeleteFriend={handleDeleteFriend}
                onInviteFriend={handleInviteFriend}
              />
            </motion.div>
          )}

          {currentTab === "balances" && (
            <motion.div
              key="balances"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <BalanceSummary
                balances={balances}
                friends={friends}
                currentUserName={currentUserName}
              />
            </motion.div>
          )}

          {currentTab === "settlements" && (
            <motion.div
              key="settlements"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SettlementSuggestions
                settlements={settlements}
                friends={friends}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onSettlementComplete={handleSettlementComplete}
              />
            </motion.div>
          )}

          {currentTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                <p className="mb-6">Please visit the settings page to manage your preferences.</p>
                <Link 
                  to="/settings" 
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Go to Settings
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSave={handleSaveExpense}
        friends={friends}
        currentUserId={currentUserId}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
};

export default Index;
