import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import authService from '../services/auth.service';
import { tokenStore } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      // Attempt silent refresh using the httpOnly cookie to restore a session
      const { data } = await authService.refresh();
      const token = data?.data?.accessToken || data?.accessToken;
      if (token) {
        tokenStore.set(token);
        const me = await authService.me();
        setUser(me.data?.data || me.data?.user || null);
      }
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    tokenStore.setUnauthorizedHandler(() => {
      setUser(null);
    });
    bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (payload) => {
    const { data } = await authService.login(payload);
    const token = data?.data?.accessToken || data?.accessToken;
    const loggedInUser = data?.data?.user || data?.user;
    tokenStore.set(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const adminLogin = useCallback(async (payload) => {
    const { data } = await authService.adminLogin(payload);
    const token = data?.data?.accessToken || data?.accessToken;
    const loggedInUser = data?.data?.user || data?.user;
    tokenStore.set(token);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authService.register(formData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await authService.me();
    const freshUser = me.data?.data || me.data?.user || null;
    setUser(freshUser);
    return freshUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      initializing,
      isAuthenticated: !!user,
      role: user?.role,
      login,
      adminLogin,
      register,
      logout,
      refreshMe,
    }),
    [user, initializing, login, adminLogin, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
