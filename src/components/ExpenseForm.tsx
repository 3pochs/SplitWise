
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense, Friend, ExpenseSplit } from "@/types";
import { formatCurrency, distributeExpenseEvenly } from "@/utils/expenseUtils";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon, Divide, DollarSign, Loader2, SplitSquareVertical, UploadCloud, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { uploadPaymentProof } from '@/integrations/supabase/api';

type ExpenseFormProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  friends: Friend[];
  currentUserId: string;
  expenseToEdit?: Expense;
};

const categories = [
  "Food & Drinks",
  "Groceries",
  "Transportation",
  "Entertainment",
  "Housing",
  "Utilities",
  "Travel",
  "Shopping",
  "Other",
];

const ExpenseForm = ({
  isOpen,
  onClose,
  onSave,
  friends,
  currentUserId,
  expenseToEdit,
}: ExpenseFormProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [payerId, setPayerId] = useState(currentUserId);
  const [category, setCategory] = useState("Food & Drinks");
  const [notes, setNotes] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [splits, setSplits] = useState<Record<string, number>>({});
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setDescription(expenseToEdit.description);
        setAmount(expenseToEdit.amount.toString());
        setDate(expenseToEdit.date);
        setPayerId(expenseToEdit.payerId);
        setCategory(expenseToEdit.category || "Food & Drinks");
        setNotes(expenseToEdit.notes || "");

        const expenseFriends = expenseToEdit.splits.map(split => split.friendId);
        setSelectedFriends(expenseFriends);

        const splitAmounts: Record<string, number> = {};
        const splitPercs: Record<string, number> = {};
        
        expenseToEdit.splits.forEach(split => {
          splitAmounts[split.friendId] = split.amount;
          
          const percentage = split.percentage || 
            (expenseToEdit.amount > 0 ? (split.amount / expenseToEdit.amount) * 100 : 0);
          
          splitPercs[split.friendId] = percentage;
        });
        
        setSplits(splitAmounts);
        setSplitPercentages(splitPercs);
        
        const isEqual = Object.values(splitAmounts).every(
          value => Math.abs(value - Object.values(splitAmounts)[0]) < 0.01
        );
        setSplitMode(isEqual ? "equal" : "custom");
      } else {
        setDescription("");
        setAmount("");
        setDate(new Date());
        setPayerId(currentUserId);
        setCategory("Food & Drinks");
        setNotes("");
        setSelectedFriends([currentUserId]);
        setSplits({});
        setSplitPercentages({});
        setSplitMode("equal");
      }
    }
  }, [isOpen, expenseToEdit, currentUserId]);

  useEffect(() => {
    if (selectedFriends.length === 0 || !amount || isNaN(parseFloat(amount))) {
      return;
    }

    const totalAmount = parseFloat(amount);

    if (splitMode === "equal") {
      const evenSplits = distributeExpenseEvenly(totalAmount, selectedFriends);
      setSplits(evenSplits);

      const percentages: Record<string, number> = {};
      for (const [friendId, splitAmount] of Object.entries(evenSplits)) {
        percentages[friendId] = (splitAmount / totalAmount) * 100;
      }
      setSplitPercentages(percentages);
    }
  }, [amount, selectedFriends, splitMode]);

  const handleSplitChange = (friendId: string, value: number) => {
    if (splitMode === "custom") {
      const newSplits = { ...splits };
      newSplits[friendId] = value;
      setSplits(newSplits);

      const totalAmount = parseFloat(amount);
      if (totalAmount > 0) {
        const newPercentages = { ...splitPercentages };
        newPercentages[friendId] = (value / totalAmount) * 100;
        setSplitPercentages(newPercentages);
      }
    }
  };

  const handlePercentageChange = (friendId: string, percentage: number) => {
    if (splitMode === "custom") {
      const newPercentages = { ...splitPercentages };
      newPercentages[friendId] = percentage;
      setSplitPercentages(newPercentages);

      const totalAmount = parseFloat(amount);
      if (totalAmount > 0) {
        const newSplits = { ...splits };
        newSplits[friendId] = (percentage / 100) * totalAmount;
        setSplits(newSplits);
      }
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      if (selectedFriends.length > 1) {
        setSelectedFriends(selectedFriends.filter(id => id !== friendId));
      }
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const handleProofOfPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofOfPayment(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (selectedFriends.length === 0) {
      setError("Please select at least one person");
      return;
    }

    const totalAmount = parseFloat(amount);
    const totalSplit = Object.values(splits).reduce((sum, val) => sum + val, 0);

    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      setError(`Split amounts must add up to the total (${formatCurrency(totalAmount)})`);
      return;
    }

    try {
      let proofOfPaymentUrl = expenseToEdit?.proofOfPaymentUrl || '';
      
      if (proofOfPayment) {
        setIsUploading(true);
        setUploadProgress(10);
        
        const uploadedUrl = await uploadPaymentProof(proofOfPayment);
        
        setUploadProgress(100);
        
        if (uploadedUrl) {
          proofOfPaymentUrl = uploadedUrl;
        }
      }

      const expenseSplits: ExpenseSplit[] = Object.entries(splits).map(([friendId, amount]) => ({
        friendId,
        amount,
        percentage: splitPercentages[friendId] || 0,
      }));

      const newExpense: Expense = {
        id: expenseToEdit?.id || `expense-${Date.now()}`,
        description,
        amount: parseFloat(amount),
        date,
        payerId,
        splits: expenseSplits,
        category,
        notes,
        proofOfPaymentUrl,
      };

      onSave(newExpense);
      onClose();
    } catch (error) {
      console.error("Error saving expense:", error);
      setError("Failed to save expense. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader className="bg-primary text-primary-foreground p-6">
            <DialogTitle className="text-2xl font-semibold">
              {expenseToEdit ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for?"
                className="glass-panel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-9 glass-panel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal glass-panel"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payer">Paid by</Label>
              <Select value={payerId} onValueChange={setPayerId}>
                <SelectTrigger className="glass-panel">
                  <SelectValue placeholder="Who paid?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentUserId}>You</SelectItem>
                  {friends
                    .filter((friend) => friend.id !== currentUserId)
                    .map((friend) => (
                      <SelectItem key={friend.id} value={friend.id}>
                        {friend.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="glass-panel">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="split">Split with</Label>
                <div className="flex gap-2">
                  <Button
                    variant={splitMode === "equal" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMode("equal")}
                    className="h-8"
                  >
                    <Divide className="h-4 w-4 mr-1" /> Equal
                  </Button>
                  <Button
                    variant={splitMode === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMode("custom")}
                    className="h-8"
                  >
                    <SplitSquareVertical className="h-4 w-4 mr-1" /> Custom
                  </Button>
                </div>
              </div>

              <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-2">
                  <span>Person</span>
                  <div className="flex gap-4 pr-2">
                    <span className="w-16 text-right">Amount</span>
                    {splitMode === "custom" && <span className="w-12 text-right">%</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant={selectedFriends.includes(currentUserId) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleFriendSelection(currentUserId)}
                      className={cn(
                        "flex-1 h-10 justify-start",
                        selectedFriends.includes(currentUserId) ? "bg-primary" : "bg-secondary/50"
                      )}
                    >
                      <Users className="h-4 w-4 mr-2" /> You
                    </Button>
                    <div className="flex gap-2 items-center">
                      <div className="w-16 font-mono text-sm text-right">
                        {selectedFriends.includes(currentUserId) && amount && !isNaN(parseFloat(amount))
                          ? formatCurrency(splits[currentUserId] || 0)
                          : "-"}
                      </div>
                      {splitMode === "custom" && selectedFriends.includes(currentUserId) && (
                        <div className="w-12">
                          <Slider
                            value={[splitPercentages[currentUserId] || 0]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(values) => handlePercentageChange(currentUserId, values[0])}
                            className="w-12"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {friends
                    .filter((friend) => friend.id !== currentUserId)
                    .map((friend) => (
                      <div key={friend.id} className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant={selectedFriends.includes(friend.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={cn(
                            "flex-1 h-10 justify-start",
                            selectedFriends.includes(friend.id) ? "bg-primary" : "bg-secondary/50"
                          )}
                        >
                          <Users className="h-4 w-4 mr-2" /> {friend.name}
                        </Button>
                        <div className="flex gap-2 items-center">
                          <div className="w-16 font-mono text-sm text-right">
                            {selectedFriends.includes(friend.id) && amount && !isNaN(parseFloat(amount))
                              ? formatCurrency(splits[friend.id] || 0)
                              : "-"}
                          </div>
                          {splitMode === "custom" && selectedFriends.includes(friend.id) && (
                            <div className="w-12">
                              <Slider
                                value={[splitPercentages[friend.id] || 0]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(values) => handlePercentageChange(friend.id, values[0])}
                                className="w-12"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proofOfPayment">Proof of Payment (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin mb-2" />
                    <div className="w-full bg-secondary h-2 rounded-full mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
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
                      htmlFor="file-upload" 
                      className="flex flex-col items-center justify-center cursor-pointer py-2"
                    >
                      <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload a receipt or screenshot</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or PDF (max. 5MB)</p>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={handleProofOfPaymentChange}
                    />
                  </div>
                )}
                
                {expenseToEdit?.proofOfPaymentUrl && !proofOfPayment && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Current proof of payment:</p>
                    <a 
                      href={expenseToEdit.proofOfPaymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      View document
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details?"
                className="glass-panel"
              />
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={onClose} className="glass-panel">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="button-hover"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : expenseToEdit ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
