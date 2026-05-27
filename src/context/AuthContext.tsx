"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  phone: string;
  name: string;
  initial: string;
}

interface AuthContextType {
  user: User | null;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  login: (phone: string, name: string) => void;
  logout: () => void;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Rehydrate user state from localStorage on load
    const savedUser = localStorage.getItem("chasha_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("chasha_user");
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (phone: string, name: string) => {
    const trimmedName = name.trim() || "Guest";
    const initial = trimmedName.charAt(0).toUpperCase();
    const newUser = { phone, name: trimmedName, initial };
    
    setUser(newUser);
    localStorage.setItem("chasha_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("chasha_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        showLoginModal,
        setShowLoginModal,
        login,
        logout,
        isInitialized
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
