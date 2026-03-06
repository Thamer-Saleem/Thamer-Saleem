import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, TokenResponse } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginNafath: (nationalId: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  full_name_en: string;
  full_name_ar?: string;
  phone?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('muaafah_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('muaafah_token');
    if (savedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('muaafah_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleAuthResponse = (data: TokenResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('muaafah_token', data.access_token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
  };

  const login = async (email: string, password: string) => {
    const res = await api.post<TokenResponse>('/auth/login', { email, password });
    handleAuthResponse(res.data);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post<TokenResponse>('/auth/register', data);
    handleAuthResponse(res.data);
  };

  const loginNafath = async (nationalId: string) => {
    const res = await api.post<TokenResponse>('/auth/nafath', {
      national_id: nationalId,
      nafath_token: 'mock-nafath-token'
    });
    handleAuthResponse(res.data);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('muaafah_token');
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, loginNafath, logout,
      isLoading, isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
