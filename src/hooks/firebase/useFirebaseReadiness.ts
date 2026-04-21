import { useState, useEffect } from 'react';

/**
 * Custom hook to manage Firebase readiness state
 * Extracted from the main page component to isolate Firebase connection logic
 *
 * MIGRATION: Updated to use @/config/firebase instead of @/lib/firebase-lazy
 */
export const useFirebaseReadiness = () => {
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const maxRetries = 6;
    let hasLoggedFailure = false;

    const hasRequiredFirebaseConfig = async (): Promise<boolean> => {
      const { getFirebaseConfig, hasUsableFirebaseConfig } = await import('@/config/publicConfig');
      const config = await getFirebaseConfig();
      return hasUsableFirebaseConfig(config);
    };

    const checkFirebaseReady = async () => {
      try {
        const hasConfig = await hasRequiredFirebaseConfig();
        if (!hasConfig) {
          if (!cancelled) {
            // Config is missing by deployment choice/misconfiguration; don't retry-loop.
            setFirebaseReady(false);
          }
          return;
        }

        const { ensureFirebaseInitialized } = await import('@/config/firebase');
        const { db } = await ensureFirebaseInitialized();

        if (!db) {
          throw new Error('Firestore instance not available');
        }

        if (cancelled) {
          return;
        }

        attempts = 0;
        hasLoggedFailure = false;
        setFirebaseReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        const isNonRecoverable =
          message.includes('Missing required Firebase configuration') ||
          message.includes('Firestore initialization failed - db is null after initialization') ||
          message.includes('Firestore instance not available');

        attempts += 1;
        if (!hasLoggedFailure || attempts === maxRetries) {
          console.error('❌ Firebase connection failed:', error);
          hasLoggedFailure = true;
        }
        setFirebaseReady(false);

        if (!isNonRecoverable && attempts < maxRetries) {
          // Retry with backoff for transient network/startup timing issues.
          const delay = Math.min(2000 * Math.pow(2, attempts - 1), 15000);
          retryTimeout = setTimeout(() => {
            if (cancelled) {
              return;
            }

            void checkFirebaseReady();
          }, delay);
        }
      }
    };

    void checkFirebaseReady();

    return () => {
      cancelled = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  return { firebaseReady };
};
