import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken, registerLogoutHandler } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuth = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    setAccessToken(accessToken);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setAccessToken(null);
  }, []);

  // Silent refresh on initial app load to restore session from httpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const res = await api.post('/auth/refresh');
        if (isMounted && res.data?.data) {
          applyAuth(res.data.data.user, res.data.data.accessToken);
        }
      } catch {
        if (isMounted) {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    registerLogoutHandler(clearAuth);
    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [applyAuth, clearAuth]);

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user: userData, accessToken } = res.data.data;
    applyAuth(userData, accessToken);
    return userData;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    const { user: userData, accessToken } = res.data.data;
    applyAuth(userData, accessToken);
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
    }
  };

  const verifyEmail = async (verificationToken) => {
    const res = await api.post('/auth/verify-email', { token: verificationToken });
    if (user) {
      setUser({ ...user, emailVerified: true });
    }
    return res.data.data;
  };

  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data.data;
  };

  const resetPassword = async (payload) => {
    const res = await api.post('/auth/reset-password', payload);
    return res.data.data;
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

