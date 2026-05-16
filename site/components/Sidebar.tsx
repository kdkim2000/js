"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { TOC } from "@/lib/toc";

interface Props {
  toc: TOC;
  progress: Record<string, boolean>;
  siteId?: string;
}

export default function Sidebar({ toc, progress, siteId }: Props) {
  const pathname = usePathname();
  const currentSlug = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  function toggleChapter(key: string) {
    setOpenChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isChapterOpen(key: string, articles: { slug: string }[]) {
    if (key in openChapters) return openChapters[key];
    return articles.some((a) => a.slug === currentSlug);
  }

  const homeHref = siteId ? `/sites/${siteId}` : "/";

  return (
    <nav className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-screen sticky top-0 py-4">
      <Link href={homeHref} className="block px-4 pb-4 font-bold text-lg text-yellow-600 dark:text-yellow-400 hover:text-yellow-700">
        모던 자바스크립트
      </Link>

      {toc.parts.map((part) => {
        const partCount = part.chapters.reduce((s, c) => s + c.articles.length, 0);
        const partDone = part.chapters.reduce(
          (s, c) => s + c.articles.filter((a) => progress[a.slug]).length,
          0
        );

        return (
          <div key={part.partIndex} className="mb-2">
            <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex justify-between">
              <span>파트 {part.partIndex}: {part.title}</span>
              <span className="text-gray-400">{partDone}/{partCount}</span>
            </div>

            {part.chapters.map((chapter, ci) => {
              const key = `${part.partIndex}-${ci}`;
              const open = isChapterOpen(key, chapter.articles);
              const chDone = chapter.articles.filter((a) => progress[a.slug]).length;

              return (
                <div key={ci}>
                  <button
                    onClick={() => toggleChapter(key)}
                    className="w-full px-4 py-1.5 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between items-center"
                  >
                    <span className={`${open ? "" : "truncate"} flex-1 text-left`}>
                      {open ? "▾" : "▸"} {chapter.title}
                    </span>
                    {chDone > 0 && (
                      <span className="ml-1 text-xs text-green-500">{chDone}/{chapter.articles.length}</span>
                    )}
                  </button>

                  {open && (
                    <ul className="pl-5 pb-1">
                      {chapter.articles.map((article) => {
                        const isActive = article.slug === currentSlug;
                        const isDone = progress[article.slug];
                        return (
                          <li key={article.slug}>
                            <Link
                              href={siteId ? `/sites/${siteId}/${article.slug}` : `/${article.slug}`}
                              className={`flex items-center gap-1.5 px-3 py-1 text-sm rounded-md my-0.5 ${
                                isActive
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 font-medium"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}
                            >
                              <span className={`w-3 h-3 rounded-full border shrink-0 ${isDone ? "bg-green-400 border-green-400" : "border-gray-300 dark:border-gray-600"}`} />
                              <span className="truncate">{article.title}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
