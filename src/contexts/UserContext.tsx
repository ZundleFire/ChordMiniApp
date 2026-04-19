'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { useIsClientSide } from '@/utils/clientOnlyFirebase';

export interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isReady = useIsClientSide();
  const auth = useMemo(() => {
    if (!isReady) return null;
    try {
      return getAuth();
    } catch {
      return null;
    }
  }, [isReady]);

  // Set up auth state listener
  useEffect(() => {
    if (!isReady || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isReady, auth]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) {
      const authError = new Error('Firebase Auth is not initialized');
      setError(authError.message);
      throw authError;
    }

    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(message);
      console.error('Google Sign-In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) {
      const authError = new Error('Firebase Auth is not initialized');
      setError(authError.message);
      throw authError;
    }

    try {
      setError(null);
      await signOut(auth);
      setUser(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to log out';
      setError(message);
      console.error('Logout Error:', err);
      throw err;
    }
  }, [auth]);

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        logout,
        isAuthenticated: !!user && user.isAnonymous === false,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
