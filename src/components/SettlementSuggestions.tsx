
import { useMemo, useState } from "react";
import { Friend, Settlement } from "@/types";
import { formatCurrency } from "@/utils/expenseUtils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, CreditCard, UploadCloud, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { uploadPaymentProof } from "@/integrations/supabase/api";

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
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleSettlementClick = (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setIsUploadDialogOpen(true);
  };

  const handleProofOfPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofOfPayment(e.target.files[0]);
    }
  };

  const handleCompleteSettlement = async () => {
    if (!selectedSettlement) return;
    
    try {
      setIsUploading(true);
      
      let proofOfPaymentUrl = '';
      
      if (proofOfPayment) {
        // Upload the file to Supabase storage
        const uploadedUrl = await uploadPaymentProof(proofOfPayment);
        
        if (uploadedUrl) {
          proofOfPaymentUrl = uploadedUrl;
        }
      }

      const finalSettlement: Settlement = {
        ...selectedSettlement,
        status: 'completed',
        proofOfPaymentUrl
      };

      onSettlementComplete(finalSettlement);
      setIsUploadDialogOpen(false);
      setSelectedSettlement(null);
      setProofOfPayment(null);
      
      const fromName = getFriendName(selectedSettlement.fromId);
      const toName = getFriendName(selectedSettlement.toId);
      
      toast({
        title: "Settlement recorded",
        description: `${formatCurrency(selectedSettlement.amount)} payment from ${fromName} to ${toName} has been recorded.`,
      });
    } catch (error) {
      console.error("Error completing settlement:", error);
      toast({
        title: "Error",
        description: "Failed to complete settlement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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
                      onClick={() => handleSettlementClick(settlement)}
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
                <li>Upload a proof of payment (optional)</li>
                <li>Mark the settlement as complete after the payment is made</li>
                <li>This will update your balances automatically</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proof of Payment Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader className="bg-primary text-primary-foreground p-6">
              <DialogTitle className="text-2xl font-semibold">Record Payment</DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-4">
              {selectedSettlement && (
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">{getFriendName(selectedSettlement.fromId)}</span>
                    {' '} pays {' '}
                    <span className="font-medium">{getFriendName(selectedSettlement.toId)}</span>
                  </p>
                  <p className="text-lg font-bold">{formatCurrency(selectedSettlement.amount)}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Proof of Payment (Optional)</p>
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : proofOfPayment ? (
                    <div className="py-2">
                      <p className="text-sm font-medium">{proofOfPayment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(proofOfPayment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setProofOfPayment(null)}
                        className="mt-2"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <label 
                        htmlFor="payment-proof-upload" 
                        className="flex flex-col items-center justify-center cursor-pointer py-4"
                      >
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Click to upload proof of payment</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max. 5MB)</p>
                      </label>
                      <input
                        id="payment-proof-upload"
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,application/pdf"
                        onChange={handleProofOfPaymentChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0">
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} className="glass-panel">
                Cancel
              </Button>
              <Button 
                onClick={handleCompleteSettlement} 
                className="button-hover"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Mark as Settled'
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettlementSuggestions;
