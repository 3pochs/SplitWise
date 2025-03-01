
import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Tab } from "@/types";

type HeaderProps = {
  currentTab: string;
  onTabChange: (tab: string) => void;
};

const Header = ({ currentTab, onTabChange }: HeaderProps) => {
  const { user } = useAuth();
  const { isDarkMode, setTheme } = useTheme();

  const tabs = [
    { id: "expenses", label: "Expenses" },
    { id: "friends", label: "Friends" },
    { id: "balances", label: "Balances" },
    { id: "settlements", label: "Settle Up" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <header className="w-full px-4 py-6 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <motion.h1 
          className="text-3xl font-bold text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          Split<span className="text-primary">Wise</span>
        </motion.h1>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="text-foreground"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </Button>

          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.avatarUrl} />
                    <AvatarFallback>
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-2">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="border-t my-2"></div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm"
                  onClick={() => onTabChange("settings")}
                >
                  Settings
                </Button>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      
      <nav className="w-full max-w-md mb-2">
        <motion.ul 
          className="w-full flex justify-between items-center p-1 bg-secondary rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {tabs.map((tab) => (
            <li key={tab.id} className="relative">
              <button
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  currentTab === tab.id
                    ? "text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
              {currentTab === tab.id && (
                <motion.div
                  className="absolute inset-0 bg-primary rounded-lg shadow-sm"
                  layoutId="tab-indicator"
                  initial={false}
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </li>
          ))}
        </motion.ul>
      </nav>
    </header>
  );
};

export default Header;
