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

const Index = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<Friend[]>([
    { id: "friend-1", name: "Alex", isUser: true, email: "alex@example.com" },
    { id: "friend-2", name: "Taylor", isUser: false },
  ]);
  const [currentTab, setCurrentTab] = useState<Tab>("expenses");
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentUserId = user?.id || "current-user";
  const currentUserName = user?.name || "You";

  const balances = useMemo(() => {
    return calculateBalances(expenses, [...friends, { id: currentUserId, name: currentUserName }], currentUserId);
  }, [expenses, friends, currentUserId, currentUserName]);

  const settlements = useMemo(() => {
    return generateSettlements(balances, friends);
  }, [balances, friends]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleAddExpense = () => {
    setExpenseToEdit(undefined);
    setIsExpenseFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsExpenseFormOpen(true);
  };

  const handleSaveExpense = (expense: Expense) => {
    const isEdit = expenses.some((e) => e.id === expense.id);
    
    if (isEdit) {
      setExpenses(expenses.map((e) => (e.id === expense.id ? expense : e)));
      toast({
        title: "Expense updated",
        description: `"${expense.description}" has been updated.`,
      });
    } else {
      setExpenses([...expenses, expense]);
      toast({
        title: "Expense added",
        description: `"${expense.description}" has been added.`,
      });
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(expenses.filter((e) => e.id !== expenseId));
  };

  const handleAddFriend = (friend: Friend) => {
    setFriends([...friends, friend]);
    toast({
      title: "Friend added",
      description: `${friend.name} has been added to your friends list.`,
    });
  };

  const handleDeleteFriend = (friendId: string) => {
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

    setFriends(friends.filter((f) => f.id !== friendId));
  };

  const handleInviteFriend = (email: string) => {
    toast({
      title: "Invitation sent",
      description: `An invitation has been sent to ${email}.`,
    });
  };

  const handleSettlementComplete = (settlement: Settlement) => {
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

    setExpenses([...expenses, settlementExpense]);
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
