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

function getFriendlyAuthError(err: unknown): string {
  const errorWithCode = err as { code?: string; message?: string };

  switch (errorWithCode?.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked. Please allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Add it in Firebase Authentication settings.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled in Firebase. Enable it in Authentication > Sign-in method.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please try again.';
    case 'auth/user-not-found':
      return 'No account exists for that email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error while contacting Firebase. Please check your connection and try again.';
    default:
      return errorWithCode?.message || 'Authentication failed. Please try again.';
  }
}

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

        const message = getFriendlyAuthError(err) || 'Failed to initialize Google sign-in';
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
    let activeAuth = auth;
    if (!activeAuth) {
      const initialized = await ensureFirebaseInitialized();
      activeAuth = initialized.auth;
      if (activeAuth) {
        setAuth(activeAuth);
      }
    }

    if (!activeAuth) {
      const authError = new Error('Google sign-in is unavailable. Check Firebase public configuration.');
      setError(authError.message);
      throw authError;
    }

    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(activeAuth, provider);
    } catch (err) {
      const message = getFriendlyAuthError(err);
      setError(message);
      console.error('Google Sign-In Error:', err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const signInWithEmailPassword = useCallback(async (email: string, password: string) => {
    let activeAuth = auth;
    if (!activeAuth) {
      const initialized = await ensureFirebaseInitialized();
      activeAuth = initialized.auth;
      if (activeAuth) {
        setAuth(activeAuth);
      }
    }

    if (!activeAuth) {
      const authError = new Error('Email sign-in is unavailable. Check Firebase public configuration.');
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
      await signInWithEmailAndPassword(activeAuth, email.trim(), password);
    } catch (err) {
      const message = getFriendlyAuthError(err);
      setError(message);
      console.error('Email Sign-In Error:', err);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  const signUpWithEmailPassword = useCallback(async (email: string, password: string) => {
    let activeAuth = auth;
    if (!activeAuth) {
      const initialized = await ensureFirebaseInitialized();
      activeAuth = initialized.auth;
      if (activeAuth) {
        setAuth(activeAuth);
      }
    }

    if (!activeAuth) {
      const authError = new Error('Email sign-up is unavailable. Check Firebase public configuration.');
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
      await createUserWithEmailAndPassword(activeAuth, email.trim(), password);
    } catch (err) {
      const message = getFriendlyAuthError(err);
      setError(message);
      console.error('Email Sign-Up Error:', err);
      throw new Error(message);
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
