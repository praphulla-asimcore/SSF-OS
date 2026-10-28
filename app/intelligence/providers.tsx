'use client';

import { SessionProvider } from 'next-auth/react';

export function IntelProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
