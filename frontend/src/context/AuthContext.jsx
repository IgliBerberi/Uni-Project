import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentBusiness,
  fetchCurrentUser,
  loginBusiness,
  loginUser,
  logoutBusiness,
  logoutUser,
  registerBusiness,
  registerUser,
} from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const data = await fetchCurrentUser();
      setUser(data.user);
    } catch {
      setUser(null);
    }

    try {
      const data = await fetchCurrentBusiness();
      setBusiness(data.business);
    } catch {
      setBusiness(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await restoreSession();
      setLoading(false);
    })();
  }, [restoreSession]);

  const signInUser = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    setUser(data.user);
    return data.user;
  }, []);

  const signUpUser = useCallback(async (payload) => {
    const data = await registerUser(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const signInBusiness = useCallback(async (credentials) => {
    const data = await loginBusiness(credentials);
    setBusiness(data.business);
    return data.business;
  }, []);

  const signUpBusiness = useCallback(async (payload) => {
    const data = await registerBusiness(payload);
    setBusiness(data.business);
    return data.business;
  }, []);

  const signOutBusiness = useCallback(async () => {
    try {
      await logoutBusiness();
    } catch {
      /* ignore */
    }
    setBusiness(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      business,
      loading,
      isUserLoggedIn: Boolean(user),
      isBusinessLoggedIn: Boolean(business),
      signInUser,
      signUpUser,
      signOutUser,
      signInBusiness,
      signUpBusiness,
      signOutBusiness,
    }),
    [
      user,
      business,
      loading,
      signInUser,
      signUpUser,
      signOutUser,
      signInBusiness,
      signUpBusiness,
      signOutBusiness,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
