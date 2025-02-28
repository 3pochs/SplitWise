
import { useState } from "react";
import { motion } from "framer-motion";

type HeaderProps = {
  currentTab: string;
  onTabChange: (tab: string) => void;
};

const Header = ({ currentTab, onTabChange }: HeaderProps) => {
  const tabs = [
    { id: "expenses", label: "Expenses" },
    { id: "friends", label: "Friends" },
    { id: "balances", label: "Balances" },
    { id: "settlements", label: "Settle Up" },
  ];

  return (
    <header className="w-full px-4 py-6 flex flex-col items-center">
      <motion.h1 
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        Split<span className="text-primary">Wise</span>
      </motion.h1>
      
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
