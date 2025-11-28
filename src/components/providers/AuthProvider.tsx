'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/services/authApi";
import { persistAuthResponse, storage } from "@/lib/storage";
import { AuthResponse, AuthTokens, User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  initializing: boolean;
  login: (payload: { email: string; password: string }) => Promise<AuthResponse>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    role: "USER" | "ADMIN" | "TEACHER";
  }) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper function to normalize user data from backend
const normalizeAuthData = (data: any): { user: User; tokens: AuthTokens } | null => {
    if (!data) return null;

    // Handle nested user structure: {user: {user: ..., tokens: ...}} or {user: ..., tokens: ...}
    let userData = data.user || data;
    let tokensData = data.tokens;

    // If userData is still nested (has user.user), extract it
    if (userData && userData.user) {
      tokensData = userData.tokens || tokensData;
      userData = userData.user;
    }

    if (!userData || !tokensData) return null;

    // Normalize role: "USER" -> "student", "ADMIN" -> "admin"
    const normalizeRole = (role: string): UserRole => {
      const upperRole = role.toUpperCase();
      if (upperRole === "ADMIN") return "admin";
      if (upperRole === "USER" || upperRole === "STUDENT") return "student";
      return role.toLowerCase() as UserRole;
    };

    // Normalize field names: fullName -> full_name
    const normalizedUser: User = {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      full_name: userData.full_name || userData.fullName,
      role: normalizeRole(userData.role),
    };

    return { user: normalizedUser, tokens: tokensData };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Rehydrates persisted credentials after hydration; React lint rule is disabled for this block.
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const existing = storage.load();
      if (existing) {
        const normalized = normalizeAuthData(existing);
        if (normalized) {
          setUser(normalized.user);
          setTokens(normalized.tokens);
        } else {
          // Clear invalid data
          storage.clear();
        }
      }
    } catch (error) {
      console.error("Error loading auth state:", error);
      // Clear corrupted storage
      storage.clear();
    } finally {
      setInitializing(false);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleAuthSuccess = useCallback((response: any) => {
    // Normalize response from API (có thể có cấu trúc khác nhau)
    const normalized = normalizeAuthData(response);
    if (!normalized) {
      throw new Error("Invalid auth response");
    }

    // Save normalized data
    persistAuthResponse({
      user: normalized.user,
      tokens: normalized.tokens,
      message: response.message || "Success",
    });

    setUser(normalized.user);
    setTokens(normalized.tokens);

    return {
      user: normalized.user,
      tokens: normalized.tokens,
      message: response.message || "Success",
    };
  }, []);

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      const response = await authApi.login(payload);
      return handleAuthSuccess(response);
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      fullName: string;
      role: "USER" | "ADMIN" | "TEACHER";
    }) => {
      const response = await authApi.register(payload);
      return handleAuthSuccess(response);
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    storage.clear();
    setUser(null);
    setTokens(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      tokens,
      initializing,
      login,
      register,
      logout,
    }),
    [user, tokens, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

