
import { useMemo } from "react";
import { Friend, Settlement } from "@/types";
import { formatCurrency } from "@/utils/expenseUtils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type SettlementSuggestionsProps = {
  settlements: Settlement[];
  friends: Friend[];
  currentUserId: string;
  currentUserName: string;
  onSettlementComplete: (settlement: Settlement) => void;
};

const SettlementSuggestions = ({
  settlements,
  friends,
  currentUserId,
  currentUserName,
  onSettlementComplete,
}: SettlementSuggestionsProps) => {
  const { toast } = useToast();

  const filteredSettlements = useMemo(() => {
    // Only include settlements that involve the current user
    return settlements.filter(
      (settlement) => settlement.fromId === currentUserId || settlement.toId === currentUserId
    );
  }, [settlements, currentUserId]);

  const getFriendName = (friendId: string): string => {
    if (friendId === currentUserId) return currentUserName;
    const friend = friends.find((f) => f.id === friendId);
    return friend ? friend.name : "Unknown";
  };

  const handleSettlementComplete = (settlement: Settlement) => {
    onSettlementComplete(settlement);
    
    const fromName = getFriendName(settlement.fromId);
    const toName = getFriendName(settlement.toId);
    
    toast({
      title: "Settlement recorded",
      description: `${formatCurrency(settlement.amount)} payment from ${fromName} to ${toName} has been recorded.`,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Settle Up</h2>

      <AnimatePresence>
        {filteredSettlements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent/50 rounded-lg p-8 text-center"
          >
            <Check className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">All settled up!</h3>
            <p className="text-muted-foreground">
              There are no outstanding balances that need to be settled.
            </p>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-lg font-medium mb-4">
              Suggested settlements to simplify debts:
            </h3>

            {filteredSettlements.map((settlement, index) => (
              <motion.div
                key={`${settlement.fromId}-${settlement.toId}-${settlement.amount}`}
                className="bg-card rounded-lg shadow-sm overflow-hidden card-hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{getFriendName(settlement.fromId)}</div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium">{getFriendName(settlement.toId)}</div>
                    </div>
                    <div className="font-semibold">{formatCurrency(settlement.amount)}</div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleSettlementComplete(settlement)}
                      className="button-hover"
                      size="sm"
                    >
                      <CreditCard className="h-4 w-4 mr-2" /> Mark as Settled
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="mt-6 bg-secondary/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">How to settle up</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Make the payment using your preferred method (cash, Venmo, etc.)</li>
                <li>Mark the settlement as complete after the payment is made</li>
                <li>This will update your balances automatically</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettlementSuggestions;
