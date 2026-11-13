import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginWithPassword: (email: string, password: string, bypassTotp?: boolean) => Promise<LoginResponse>;
  verifyTotp: (tempToken: string, code: string) => Promise<User>;
  resetTotp: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserState: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('shiftpe_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async (authToken?: string) => {
    try {
      const activeToken = authToken || token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      const res = await fetch('/api/auth/me', {
        headers,
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('shiftpe_token');
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithPassword = async (email: string, password: string, bypassTotp?: boolean): Promise<LoginResponse> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, bypassTotp })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in. Please verify your credentials.');
    }

    if (data.status === 'authenticated' && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('shiftpe_token', data.token);
    }

    return data as LoginResponse;
  };

  const resetTotp = async (email: string, password: string): Promise<string> => {
    const res = await fetch('/api/auth/reset-totp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset 2FA');
    }
    return data.message;
  };

  const verifyTotp = async (tempToken: string, code: string): Promise<User> => {
    const res = await fetch('/api/auth/totp-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tempToken, code })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid TOTP code.');
    }

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('shiftpe_token', data.token);
    return data.user;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout API error:', e);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('shiftpe_token');
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginWithPassword,
        verifyTotp,
        resetTotp,
        logout,
        refreshUser,
        updateUserState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
