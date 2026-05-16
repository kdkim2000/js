'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { label: '학습 허브', href: '/' },
  { label: '크롤 관리', href: '/admin' },
  { label: '진도 관리', href: '/progress' },
];

export default function GNB() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-gray-200 bg-white/95 backdrop-blur-sm flex items-center px-5 gap-6 shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
          style={{ background: 'linear-gradient(135deg,#9B8AFB,#6941C6)' }}
        >
          L
        </span>
        <span className="font-bold text-[16px] leading-snug text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          학습 크롤러
        </span>
      </Link>

      {/* Tabs */}
      <nav className="flex items-center gap-1">
        {NAV.map(({ label, href }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
