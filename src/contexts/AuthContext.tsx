import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { fetchUserProfile } from '@/integrations/supabase/api';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Check for session on load and set up auth subscription
  useEffect(() => {
    setIsLoading(true);

    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSupabaseUser(session.user);
          await fetchAndSetUserProfile(session.user);
        } else {
          // Important: Make sure to set loading to false even when no session is found
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        toast({
          title: 'Authentication Error',
          description: 'There was a problem checking your login status.',
          variant: 'destructive',
        });
        // Important: Make sure to set loading to false on error
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSupabaseUser(session?.user || null);
        
        if (session?.user) {
          await fetchAndSetUserProfile(session.user);
        } else {
          setUser(null);
          // Important: Make sure to set loading to false when auth state changes to signed out
          setIsLoading(false);
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile from database
  const fetchAndSetUserProfile = async (authUser: User) => {
    try {
      const userProfile = await fetchUserProfile(authUser.id);
      
      if (userProfile) {
        setUser(userProfile);
      } else {
        // If no profile exists, create a default one
        const defaultProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || '',
          preferences: {
            darkMode: false,
            currency: 'USD',
            language: 'en',
            notificationsEnabled: true,
          },
        };
        setUser(defaultProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Profile Error',
        description: 'Could not load your profile. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      // Important: Always set loading to false after profile fetch attempt
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      const authError = error as AuthError;
      toast({
        title: 'Login Failed',
        description: authError.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Registration Successful',
        description: 'Please check your email to confirm your account.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      const authError = error as AuthError;
      toast({
        title: 'Registration Failed',
        description: authError.message || 'Could not create your account. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'There was a problem logging you out. Please try again.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    try {
      setIsLoading(true);
      if (!user) throw new Error('No user logged in');
      
      // Update user metadata if name is provided
      if (profile.name) {
        const { error } = await supabase.auth.updateUser({
          data: { name: profile.name }
        });
        
        if (error) throw error;
      }
      
      // Update profile in the database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name || user.name,
          avatar_url: profile.avatarUrl || user.avatarUrl,
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedUser = { ...user, ...profile };
      setUser(updatedUser);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again later.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
