
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Expense, Friend } from "@/types";
import { formatCurrency, getNameById } from "@/utils/expenseUtils";
import { format } from "date-fns";
import { motion } from "framer-motion";

type ExpenseDetailModalProps = {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  currentUserId: string;
  currentUserName: string;
};

const ExpenseDetailModal = ({
  expense,
  isOpen,
  onClose,
  friends,
  currentUserId,
  currentUserName,
}: ExpenseDetailModalProps) => {
  if (!expense) return null;

  const payerName = getNameById(expense.payerId, friends, currentUserName);
  const date = format(new Date(expense.date), "MMMM d, yyyy");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="bg-primary text-primary-foreground p-6">
            <DialogTitle className="text-2xl font-semibold">{expense.description}</DialogTitle>
            <p className="text-primary-foreground/80 mt-1">
              {date} • {expense.category}
            </p>
          </DialogHeader>

          <div className="p-6">
            <div className="mb-6 text-center">
              <h3 className="text-lg text-muted-foreground">Total amount</h3>
              <p className="text-3xl font-bold">{formatCurrency(expense.amount)}</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Paid by</h3>
              <div className="bg-secondary/50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{payerName}</span>
                  <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Split between</h3>
              <div className="bg-secondary/50 rounded-lg divide-y divide-border">
                {expense.splits.map((split) => (
                  <div key={split.friendId} className="p-3 flex justify-between items-center">
                    <span className="font-medium">
                      {getNameById(split.friendId, friends, currentUserName)}
                      {split.friendId === currentUserId && " (you)"}
                    </span>
                    <div className="text-right">
                      <span className="font-semibold">{formatCurrency(split.amount)}</span>
                      <div className="text-xs text-muted-foreground">
                        {split.percentage ? `${split.percentage.toFixed(1)}%` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {expense.notes && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Notes</h3>
                <div className="bg-secondary/50 p-3 rounded-lg">
                  <p>{expense.notes}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDetailModal;
