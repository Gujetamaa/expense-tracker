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
        sidebar-wrapper
        ${isCollapsed ? 'w-16' : 'w-60'}
        ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-gray-900 border-slate-200'}
      `}
    >
      {/* Header: hamburger + logo */}
      <div className={`sidebar-header ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
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
      <nav className={`sidebar-nav ${isDark ? '' : ''}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              sidebar-item
              ${
                isActive(item.href, pathname)
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                  : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
              }
            `}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span
              className={`
                sidebar-label
                ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
              `}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Dark mode toggle at bottom */}
      <div className={`sidebar-footer ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <button
          onClick={toggleTheme}
          className={`
            sidebar-item w-full
            ${isDark
              ? 'text-slate-300 hover:bg-slate-800'
              : 'text-slate-600 hover:bg-slate-100'
            }
          `}
        >
          <span className="sidebar-icon">{isDark ? '🌙' : '☀️'}</span>
          <span
            className={`
              sidebar-label
              ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}
            `}
          >
          </span>
        </button>
      </div>
    </aside>
  );
}
