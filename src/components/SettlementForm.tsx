
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Friend, Settlement } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2 } from 'lucide-react';
import PaymentProofUploader from './PaymentProofUploader';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type SettlementFormProps = {
  isOpen: boolean;
  onClose: () => void;
  settlement: Settlement;
  onComplete: (settlement: Settlement) => void;
  friends: Friend[];
  currentUserName: string;
};

const SettlementForm = ({
  isOpen,
  onClose,
  settlement,
  onComplete,
  friends,
  currentUserName,
}: SettlementFormProps) => {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fromFriend = friends.find(f => f.id === settlement.fromId) || { id: 'user', name: currentUserName };
  const toFriend = friends.find(f => f.id === settlement.toId) || { id: 'user', name: currentUserName };

  const handleFileChange = (file: File | null) => {
    setProofFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In a real implementation with Supabase, we would upload the file here
      // For now, we'll create a local URL
      let proofOfPaymentUrl = undefined;
      
      if (proofFile) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        proofOfPaymentUrl = URL.createObjectURL(proofFile);
      }

      // Mark the settlement as completed with the proof of payment
      const completedSettlement: Settlement = {
        ...settlement,
        status: 'completed',
        proofOfPaymentUrl,
      };

      onComplete(completedSettlement);
      toast({
        title: 'Settlement marked as complete',
        description: 'The debt has been settled successfully.',
      });
      onClose();
    } catch (error) {
      console.error('Error completing settlement:', error);
      toast({
        title: 'Error',
        description: 'There was an error processing the settlement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Settlement as Complete</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-accent/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={fromFriend.avatarUrl} />
                  <AvatarFallback>
                    {fromFriend.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{fromFriend.name}</span>
              </div>
              <div className="font-medium">
                ${settlement.amount.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{toFriend.name}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={toFriend.avatarUrl} />
                  <AvatarFallback>
                    {toFriend.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {fromFriend.name} pays ${settlement.amount.toFixed(2)} to {toFriend.name}
            </div>
          </div>

          <PaymentProofUploader
            initialUrl={settlement.proofOfPaymentUrl}
            onFileChange={handleFileChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Complete
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SettlementForm;
