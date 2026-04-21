'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from 'firebase/auth';
import { ensureFirebaseInitialized } from '@/config/firebase';
import { useIsClientSide } from '@/utils/clientOnlyFirebase';

export interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isReady = useIsClientSide();
  const isAuthenticated = useMemo(() => !!user && user.isAnonymous === false, [user]);

  // Set up auth state listener
  useEffect(() => {
    if (!isReady) {
      setLoading(true);
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const { auth: initializedAuth } = await ensureFirebaseInitialized();

        if (cancelled) {
          return;
        }

        if (!initializedAuth) {
          setAuth(null);
          setLoading(false);
          setError('Google sign-in is unavailable. Check Firebase public configuration.');
          return;
        }

        setAuth(initializedAuth);
        unsubscribe = onAuthStateChanged(initializedAuth, (currentUser) => {
          if (cancelled) {
            return;
          }

          setUser(currentUser);
          setLoading(false);
        });
      } catch (err) {
        if (cancelled) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Failed to initialize Google sign-in';
        setAuth(null);
        setLoading(false);
        setError(message);
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isReady]);

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

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!auth) {
      const authError = new Error('Authentication is not initialized');
      setError(authError.message);
      throw authError;
    }

    if (!email.trim() || !password.trim()) {
      const validationError = new Error('Email and password are required');
      setError(validationError.message);
      throw validationError;
    }

    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with email and password';
      setError(message);
      console.error('Email Sign-In Error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const signUpWithEmailPassword = useCallback(async (email: string, password: string) => {
    if (!auth) {
      const authError = new Error('Authentication is not initialized');
      setError(authError.message);
      throw authError;
    }

    if (!email.trim() || !password.trim()) {
      const validationError = new Error('Email and password are required');
      setError(validationError.message);
      throw validationError;
    }

    try {
      setError(null);
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account with email and password';
      setError(message);
      console.error('Email Sign-Up Error:', err);
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
        signInWithEmailPassword,
        signUpWithEmailPassword,
        logout,
        isAuthenticated,
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
