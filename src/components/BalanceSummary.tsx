
import { useMemo } from "react";
import { Balance, Friend } from "@/types";
import { formatCurrency } from "@/utils/expenseUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BalanceSummaryProps = {
  balances: Balance[];
  friends: Friend[];
  currentUserName: string;
};

const BalanceSummary = ({ balances, friends, currentUserName }: BalanceSummaryProps) => {
  const { totalOwed, totalOwe, netBalance } = useMemo(() => {
    let totalOwed = 0;
    let totalOwe = 0;

    balances.forEach((balance) => {
      if (balance.amount > 0) {
        totalOwed += balance.amount;
      } else {
        totalOwe += Math.abs(balance.amount);
      }
    });

    const netBalance = totalOwed - totalOwe;

    return { totalOwed, totalOwe, netBalance };
  }, [balances]);

  const getFriendName = (friendId: string): string => {
    const friend = friends.find((f) => f.id === friendId);
    return friend ? friend.name : "Unknown";
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Balances</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total you are owed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalOwed)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total you owe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalOwe)}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  netBalance > 0
                    ? "text-emerald-600"
                    : netBalance < 0
                    ? "text-rose-600"
                    : "text-gray-600"
                }`}
              >
                {formatCurrency(netBalance)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {balances.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent/50 rounded-lg p-8 text-center"
          >
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No balances yet</h3>
            <p className="text-muted-foreground">
              Add some expenses to see your balances with friends.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-lg font-medium mb-2">Individual Balances</h3>

            {balances.map((balance, index) => (
              <motion.div
                key={balance.friendId}
                className="bg-card rounded-lg shadow-sm overflow-hidden card-hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{getFriendName(balance.friendId)}</h3>
                    {balance.amount > 0 ? (
                      <div className="flex items-center text-emerald-600 text-sm">
                        <ArrowDown className="h-3 w-3 mr-1" /> Owes you
                      </div>
                    ) : balance.amount < 0 ? (
                      <div className="flex items-center text-rose-600 text-sm">
                        <ArrowUp className="h-3 w-3 mr-1" /> You owe
                      </div>
                    ) : (
                      <div className="text-gray-600 text-sm">All settled up</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        balance.amount > 0
                          ? "text-emerald-600"
                          : balance.amount < 0
                          ? "text-rose-600"
                          : "text-gray-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(balance.amount))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BalanceSummary;
