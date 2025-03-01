
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Friend } from "@/types";
import { motion } from "framer-motion";

type AddFriendModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddFriend: (friend: Friend) => void;
};

const AddFriendModal = ({ isOpen, onClose, onAddFriend }: AddFriendModalProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    const newFriend: Friend = {
      id: `friend-${Date.now()}`, // This will be replaced with the actual ID from the server
      name: username.trim(),
      username: username.trim(), // Adding username field
    };

    onAddFriend(newFriend);
    setUsername("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="bg-primary text-primary-foreground p-6">
            <DialogTitle className="text-2xl font-semibold">Add a Friend</DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friend-username">Username</Label>
              <Input
                id="friend-username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter friend's username"
                className="glass-panel"
                autoFocus
              />
              {error && <p className="text-destructive text-sm">{error}</p>}
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={onClose} className="glass-panel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="button-hover">
              Add Friend
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFriendModal;
