'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserContextType {
  user: {
    userId?: string;
    email: string;
    name: string;
    isAdmin?: boolean;
  } | null;
  isLoggedIn: boolean;
  login: (email: string, name: string, userId: string, isAdmin?: boolean) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check localStorage for existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (e) {
        // Clear invalid stored user
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = (email: string, name: string, userId: string, isAdmin: boolean = false) => {
    const userData = { userId, email, name, isAdmin };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
  };

  const value: UserContextType = {
    user,
    isLoggedIn,
    login,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
