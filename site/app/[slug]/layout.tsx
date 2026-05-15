import { getTOC } from "@/lib/toc";
import { DEFAULT_SITE_ID } from "@/lib/registry";
import SidebarWrapper from "@/components/SidebarWrapper";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

export default function SlugLayout({ children }: { children: React.ReactNode }) {
  const toc = getTOC(DEFAULT_SITE_ID);

  return (
    <div className="flex flex-col h-full">
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm flex items-center px-4 gap-4">
        <Link
          href={`/sites/${DEFAULT_SITE_ID}`}
          className="font-bold text-yellow-600 dark:text-yellow-400 shrink-0 text-sm"
        >
          JS 튜토리얼
        </Link>
        <Link
          href="/"
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
        >
          ← 홈
        </Link>
        <div className="flex-1 flex justify-center">
          <SearchBar siteId={DEFAULT_SITE_ID} />
        </div>
      </header>

      <div className="flex pt-14 h-screen">
        <SidebarWrapper toc={toc} siteId={DEFAULT_SITE_ID} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
