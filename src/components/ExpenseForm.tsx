
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expense, Friend, ExpenseSplit } from "@/types";
import { formatCurrency, distributeExpenseEvenly } from "@/utils/expenseUtils";
import { Slider } from "@/components/ui/slider";
import { CalendarIcon, Divide, DollarSign, SplitSquareVertical, Users } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  // Reset form when dialog opens or expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setDescription(expenseToEdit.description);
        setAmount(expenseToEdit.amount.toString());
        setDate(expenseToEdit.date);
        setPayerId(expenseToEdit.payerId);
        setCategory(expenseToEdit.category || "Food & Drinks");
        setNotes(expenseToEdit.notes || "");

        // Extract selected friends from expense splits
        const expenseFriends = expenseToEdit.splits.map(split => split.friendId);
        setSelectedFriends(expenseFriends);

        // Initialize splits and percentages
        const splitAmounts: Record<string, number> = {};
        const splitPercs: Record<string, number> = {};
        
        expenseToEdit.splits.forEach(split => {
          splitAmounts[split.friendId] = split.amount;
          
          // Calculate percentage if not provided
          const percentage = split.percentage || 
            (expenseToEdit.amount > 0 ? (split.amount / expenseToEdit.amount) * 100 : 0);
          
          splitPercs[split.friendId] = percentage;
        });
        
        setSplits(splitAmounts);
        setSplitPercentages(splitPercs);
        
        // Determine if it's an equal or custom split
        const isEqual = Object.values(splitAmounts).every(
          value => Math.abs(value - Object.values(splitAmounts)[0]) < 0.01
        );
        setSplitMode(isEqual ? "equal" : "custom");
      } else {
        // Reset form for new expense
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

  // Update splits when amount, selected friends, or split mode changes
  useEffect(() => {
    if (selectedFriends.length === 0 || !amount || isNaN(parseFloat(amount))) {
      return;
    }

    const totalAmount = parseFloat(amount);

    if (splitMode === "equal") {
      const evenSplits = distributeExpenseEvenly(totalAmount, selectedFriends);
      setSplits(evenSplits);

      // Calculate percentages
      const percentages: Record<string, number> = {};
      for (const [friendId, splitAmount] of Object.entries(evenSplits)) {
        percentages[friendId] = (splitAmount / totalAmount) * 100;
      }
      setSplitPercentages(percentages);
    }
  }, [amount, selectedFriends, splitMode]);

  const handleSplitChange = (friendId: string, value: number) => {
    if (splitMode === "custom") {
      // Update the individual split
      const newSplits = { ...splits };
      newSplits[friendId] = value;
      setSplits(newSplits);

      // Recalculate percentages
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
      // Update the percentage
      const newPercentages = { ...splitPercentages };
      newPercentages[friendId] = percentage;
      setSplitPercentages(newPercentages);

      // Recalculate the split amount
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

  const handleSubmit = () => {
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

    // Check if split amounts add up to total (with small margin for floating point errors)
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      setError(`Split amounts must add up to the total (${formatCurrency(totalAmount)})`);
      return;
    }

    // Prepare expense splits
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
    };

    onSave(newExpense);
    onClose();
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
            <Button onClick={handleSubmit} className="button-hover">
              {expenseToEdit ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;
