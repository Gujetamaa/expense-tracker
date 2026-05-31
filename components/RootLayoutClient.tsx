'use client';

import { DarkModeProvider } from '@/context/DarkModeContext';
import Sidebar from './Sidebar';
import BottomTabBar from './BottomTabBar';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      <div className="flex h-full bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
      </div>
      <BottomTabBar />
    </DarkModeProvider>
  );
}
