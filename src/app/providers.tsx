'use client';

import React from 'react';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { ProcessingProvider } from '../contexts/ProcessingContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { UserProvider } from '../contexts/UserContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HeroUIProvider>
      <ToastProvider
        placement="top-center"
        toastOffset={16}
        maxVisibleToasts={3}
      />
      <UserProvider>
        <ProcessingProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ProcessingProvider>
      </UserProvider>
    </HeroUIProvider>
  );
}
