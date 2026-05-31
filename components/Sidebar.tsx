'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDarkMode } from '@/context/DarkModeContext';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/transactions', label: 'Transactions', icon: '💸' },
  { href: '/savings-accounts', label: 'Savings', icon: '🏦' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/credit-cards', label: 'Cards', icon: '💳' },
  { href: '/salary-calculator', label: 'Salary', icon: '💵' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const isActive = (path: string, pathname: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <aside
      className={`
        hidden md:flex flex-col
        bg-slate-900 text-white
        transition-[width] duration-300 ease-in-out overflow-hidden
        ${isCollapsed ? 'w-16' : 'w-60'}
        min-h-screen shrink-0
        border-r border-slate-700
      `}
    >
      {/* Header: hamburger + logo */}
      <div className="flex items-center h-16 px-3 border-b border-slate-700">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span
          className={`
            ml-3 font-bold text-lg whitespace-nowrap overflow-hidden
            transition-opacity duration-200
            ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
          `}
        >
          💰 Tracker
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors
              ${
                isActive(item.href, pathname)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }
            `}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span
              className={`
                text-sm font-medium whitespace-nowrap overflow-hidden
                transition-opacity duration-200
                ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
              `}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Dark mode toggle at bottom */}
      <div className="px-2 py-4 border-t border-slate-700">
        <button
          onClick={toggleTheme}
          className={`
            flex items-center gap-3 w-full px-2 py-2.5 rounded-lg
            text-slate-300 hover:bg-slate-800 hover:text-white transition-colors
          `}
        >
          <span className="text-xl flex-shrink-0">{isDark ? '☀️' : '🌙'}</span>
          <span
            className={`
              text-sm font-medium whitespace-nowrap overflow-hidden
              transition-opacity duration-200
              ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
            `}
          >
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </aside>
  );
}
