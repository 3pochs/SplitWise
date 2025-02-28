
import { useState } from "react";
import { Friend } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, User, Users, X } from "lucide-react";
import AddFriendModal from "./AddFriendModal";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type FriendsListProps = {
  friends: Friend[];
  currentUserName: string;
  onAddFriend: (friend: Friend) => void;
  onDeleteFriend: (friendId: string) => void;
};

const FriendsList = ({
  friends,
  currentUserName,
  onAddFriend,
  onDeleteFriend,
}: FriendsListProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = (friend: Friend) => {
    onDeleteFriend(friend.id);
    toast({
      title: "Friend removed",
      description: `${friend.name} has been removed from your friends list.`,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Friends</h2>
        <Button onClick={() => setIsAddModalOpen(true)} className="button-hover">
          <Plus className="mr-1 h-4 w-4" /> Add Friend
        </Button>
      </div>

      <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-6 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {currentUserName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{currentUserName} (You)</h3>
            <p className="text-xs text-muted-foreground">This is you</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {friends.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-accent/50 rounded-lg p-8 text-center"
          >
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No friends yet</h3>
            <p className="text-muted-foreground mb-4">
              Add friends to split expenses with them.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Your First Friend
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {friends.map((friend, index) => (
              <motion.div
                key={friend.id}
                className="bg-card rounded-lg shadow-sm overflow-hidden card-hover"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                      {friend.avatarUrl ? (
                        <AvatarImage src={friend.avatarUrl} />
                      ) : (
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          {friend.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{friend.name}</h3>
                      <p className="text-xs text-muted-foreground">Friend</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(friend)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AddFriendModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFriend={onAddFriend}
      />
    </div>
  );
};

export default FriendsList;
