import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getTOC } from "@/lib/toc";
import { DEFAULT_SITE_ID } from "@/lib/registry";
import SidebarWrapper from "@/components/SidebarWrapper";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "모던 자바스크립트 튜토리얼",
  description: "ko.javascript.info 기반 자바스크립트 학습 사이트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const toc = getTOC(DEFAULT_SITE_ID);

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex flex-col h-full bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Top header */}
        <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm flex items-center px-4 gap-4">
          <Link href="/" className="font-bold text-yellow-600 dark:text-yellow-400 shrink-0 text-sm">
            JS 튜토리얼
          </Link>
          <div className="flex-1 flex justify-center">
            <SearchBar />
          </div>
        </header>

        <div className="flex pt-14 h-[calc(100vh-0px)]">
          <SidebarWrapper toc={toc} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
