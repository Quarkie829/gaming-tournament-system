import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (loginText: string, passwordText: string) => Promise<void>;
  register: (userData: { username: string; email: string; password: string; country?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  demoLogin: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          setToken(savedToken);
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (loginText: string, passwordText: string) => {
    const res = await authApi.login({ login: loginText, password: passwordText });
    if (res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (userData: { username: string; email: string; password: string; country?: string }) => {
    const res = await authApi.register(userData);
    if (res.token && res.user) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (token) {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    }
  };

  const demoLogin = async (username: string) => {
    await login(username, 'Password123!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        demoLogin
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
