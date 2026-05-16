import '../globals.css';
import Link from 'next/link';

// Fixed overlay so root layout's header/sidebar don't bleed through.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-auto">
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          ← 학습 사이트
        </Link>
        <h1 className="font-bold text-lg">크롤 관리</h1>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
