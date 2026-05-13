'use client';

import { DarkModeProvider } from '@/context/DarkModeContext';
import Navbar from './Navbar';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
    </DarkModeProvider>
  );
}
