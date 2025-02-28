
import { useState } from "react";
import { Expense, Friend } from "@/types";
import { formatCurrency, getExpenseStatusColor, getNameById } from "@/utils/expenseUtils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DollarSign, Edit, Plus, Trash2 } from "lucide-react";
import ExpenseDetailModal from "./ExpenseDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type ExpenseListProps = {
  expenses: Expense[];
  friends: Friend[];
  currentUserId: string;
  currentUserName: string;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

const ExpenseList = ({
  expenses,
  friends,
  currentUserId,
  currentUserName,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpenseListProps) => {
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  const handleDelete = (expense: Expense) => {
    onDeleteExpense(expense.id);
    toast({
      title: "Expense deleted",
      description: `"${expense.description}" has been removed.`,
    });
  };

  // Sort expenses by date, newest first
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getSummaryText = (expense: Expense): string => {
    if (expense.payerId === currentUserId) {
      return `You paid and split with ${expense.splits.length - 1} people`;
    } else {
      const payer = friends.find(f => f.id === expense.payerId);
      const userSplit = expense.splits.find(s => s.friendId === currentUserId);
      
      if (userSplit) {
        return `${payer?.name || 'Someone'} paid, you owe ${formatCurrency(userSplit.amount)}`;
      } else {
        return `${payer?.name || 'Someone'} paid, you're not involved`;
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Expenses</h2>
        <Button onClick={onAddExpense} className="button-hover">
          <Plus className="mr-1 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <AnimatePresence>
        {sortedExpenses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent/50 rounded-lg p-8 text-center"
          >
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No expenses yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first expense to start tracking who owes who.
            </p>
            <Button onClick={onAddExpense}>
              <Plus className="mr-1 h-4 w-4" /> Add Your First Expense
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {sortedExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                className="bg-card rounded-lg shadow-sm overflow-hidden expense-item card-hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setSelectedExpense(expense)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{expense.description}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                        {expense.category && ` • ${expense.category}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`font-semibold ${getExpenseStatusColor(expense, currentUserId)}`}>
                        {formatCurrency(expense.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getSummaryText(expense)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border">
                    <span className="text-sm">
                      Paid by: <strong>{getNameById(expense.payerId, friends, currentUserName)}</strong>
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditExpense(expense);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(expense);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <ExpenseDetailModal
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        friends={friends}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
};

export default ExpenseList;
