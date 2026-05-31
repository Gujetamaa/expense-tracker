'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/transactions', label: 'Txns', icon: '💸' },
  { href: '/savings-accounts', label: 'Savings', icon: '🏦' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
  { href: '/credit-cards', label: 'Cards', icon: '💳' },
];

const isActive = (path: string, pathname: string) =>
  path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className={`
        md:hidden fixed bottom-0 left-0 right-0 z-50
        bg-white dark:bg-slate-900
        border-t border-gray-200 dark:border-slate-700
        flex items-center justify-around
        h-16 px-2
      `}
    >
      {tabItems.map((item) => {
        const active = isActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex flex-col items-center justify-center gap-0.5
              flex-1 h-full rounded-lg transition-colors
              ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
              }
            `}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
