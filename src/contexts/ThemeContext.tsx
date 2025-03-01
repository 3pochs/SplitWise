
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppTheme } from '@/types';
import { Capacitor } from '@capacitor/core';

type ThemeContextType = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDarkMode: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<AppTheme>('system');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const applyTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme to document
    const root = window.document.documentElement;
    
    if (newTheme === 'system') {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      
      root.classList.remove('light', 'dark');
      root.classList.add(systemPreference);
      setIsDarkMode(systemPreference === 'dark');
      
      // Set status bar style on mobile devices
      updateStatusBarStyle(systemPreference === 'dark');
    } else {
      root.classList.remove('light', 'dark');
      root.classList.add(newTheme);
      setIsDarkMode(newTheme === 'dark');
      
      // Set status bar style on mobile devices
      updateStatusBarStyle(newTheme === 'dark');
    }
  };

  // Function to update status bar style for mobile devices
  const updateStatusBarStyle = (isDark: boolean) => {
    if (Capacitor.isPluginAvailable('StatusBar')) {
      try {
        const { StatusBar } = Capacitor.Plugins;
        if (isDark) {
          StatusBar.setStyle({ style: 'DARK' });
        } else {
          StatusBar.setStyle({ style: 'LIGHT' });
        }
      } catch (error) {
        console.error('Error setting status bar style:', error);
      }
    }
  };

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as AppTheme | null;
    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      applyTheme('system');
    }
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: applyTheme,
        isDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
