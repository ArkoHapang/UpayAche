"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type UserRole = "ADMIN" | "ANALYST" | "VIEWER" | "CUSTOMER";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithRole: (targetRole: UserRole) => Promise<boolean>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "upayache_auth_token";
const USER_KEY = "upayache_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session from localStorage on initial load
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser) as AuthUser;
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error("Failed to restore session from localStorage:", err);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }

    // Optional Supabase listener if remote Supabase is configured
    if (isSupabaseConfigured()) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session && event === "SIGNED_IN") {
          const supabaseUser = session.user;
          const assignedRole = (
            supabaseUser.app_metadata?.role ||
            supabaseUser.user_metadata?.role ||
            "ANALYST"
          ).toUpperCase() as UserRole;

          const authUser: AuthUser = {
            id: supabaseUser.id,
            email: supabaseUser.email || "user@upayache.internal",
            role: assignedRole,
            full_name: supabaseUser.user_metadata?.full_name || "MFS Investigator",
          };

          setToken(session.access_token);
          setUser(authUser);
          localStorage.setItem(TOKEN_KEY, session.access_token);
          localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const login = useCallback(async (email: string, password: string = "secret123"): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Authentication failed. Check credentials.");
      }

      const data = await response.json();
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role as UserRole,
        full_name: data.user.full_name,
      };

      setToken(data.access_token);
      setUser(authUser);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in.";
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithRole = useCallback(
    async (targetRole: UserRole): Promise<boolean> => {
      const demoEmails: Record<UserRole, string> = {
        ADMIN: "admin@upayache.internal",
        ANALYST: "analyst@upayache.internal",
        VIEWER: "viewer@upayache.internal",
        CUSTOMER: "customer@example.com",
      };

      return login(demoEmails[targetRole]);
    },
    [login]
  );

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(() => {});
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        loginWithRole,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
