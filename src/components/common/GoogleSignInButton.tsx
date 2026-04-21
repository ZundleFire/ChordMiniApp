'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@/contexts/UserContext';

export function GoogleSignInButton() {
  const {
    user,
    isAuthenticated,
    signInWithGoogle,
    signInWithEmailPassword,
    signUpWithEmailPassword,
    logout,
    loading,
    error,
  } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setLocalError(null);
      await signInWithGoogle();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Sign in error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      setIsLoading(true);
      setLocalError(null);

      if (authMode === 'signup') {
        await signUpWithEmailPassword(email, password);
      } else {
        await signInWithEmailPassword(email, password);
      }

      setIsModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Email auth error:', err);
      setLocalError(err instanceof Error ? err.message : 'Email authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setLocalError(null);
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to log out');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setLocalError(null);
  };

  const closeModal = () => {
    if (isLoading) {
      return;
    }
    setIsModalOpen(false);
    setLocalError(null);
  };

  if (loading) {
    return (
      <button
        disabled
        className="px-4 py-2 rounded-lg bg-gray-300 text-gray-700 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user?.displayName || user?.email}
          </p>
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-8 h-8 rounded-full mt-1"
            />
          )}
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={openModal}
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
      >
        Sign in
      </button>

      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-16 backdrop-blur-sm sm:items-center sm:pt-4">
          <div className="my-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-2xl dark:border-white/15 dark:bg-gray-900/95">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sign in to ChordMini</h3>
                <button
                  onClick={closeModal}
                  disabled={isLoading}
                  className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  aria-label="Close sign-in window"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Save favorites, keep playlists, and sync your analysis history.</p>
            </div>

            <div className="space-y-4 p-5">
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-blue-500 dark:hover:bg-gray-700"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isLoading ? 'Please wait...' : 'Continue with Google'}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">or use email</span>
                </div>
              </div>

              <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    authMode === 'signin'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    authMode === 'signup'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label htmlFor="auth-email" className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Password</label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder={authMode === 'signup' ? 'Create a secure password' : 'Enter your password'}
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-blue-700 hover:to-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading
                    ? 'Processing...'
                    : authMode === 'signup'
                      ? 'Create account with email'
                      : 'Sign in with email'}
                </button>
              </form>

              {(localError || error) && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-200">
                  {localError || error}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
