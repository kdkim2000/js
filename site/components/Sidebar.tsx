"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo } from "react";
import type { TOC } from "@/lib/toc";
import SiteGlyph from "@/components/SiteGlyph";

interface Props {
  toc: TOC;
  progress: Record<string, boolean>;
  siteId: string;
  siteName: string;
  siteUrl?: string;
}

export default function Sidebar({ toc, progress, siteId, siteName, siteUrl }: Props) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const currentSlug = useMemo(() => {
    const m = pathname.match(/\/sites\/[^/]+\/(.+)/);
    return m ? m[1] : null;
  }, [pathname]);

  const allArticles = useMemo(
    () => toc.parts.flatMap(p => p.chapters.flatMap(c => c.articles.map(a => ({ ...a, chapter: c.title })))),
    [toc]
  );

  const doneCount = allArticles.filter(a => progress[a.slug]).length;
  const pct = allArticles.length > 0 ? Math.round((doneCount / allArticles.length) * 100) : 0;

  const filtered = search.trim()
    ? allArticles.filter(a => a.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <aside className="w-[304px] shrink-0 flex flex-col bg-canvas border-r border-gray-200 h-full overflow-hidden">
      {/* Site header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <Link href="/" className="text-[12px] text-gray-500 hover:text-purple-700 transition-colors mb-3 inline-block">
          ← 학습 허브
        </Link>

        <div className="flex items-center gap-2.5 mb-3">
          <SiteGlyph name={siteName} id={siteId} size={32} radius={8} fontSize={12} />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-gray-900 truncate">{siteName}</div>
            {siteUrl && (
              <a href={siteUrl} target="_blank" rel="noreferrer"
                className="text-[11px] font-mono text-gray-400 hover:text-purple-700 truncate block transition-colors">
                {siteUrl.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* Progress pill */}
        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 mb-3"
          style={{ boxShadow: 'var(--shadow-xs)' }}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wide text-gray-500">진도</span>
            <span className="text-[11px] font-mono text-gray-700 font-semibold">
              {doneCount}/{allArticles.length} · {pct}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="글 검색…"
            className="w-full h-8 pl-7 pr-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
          />
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <div className="text-[10px] font-mono uppercase tracking-wide text-gray-400 px-2 py-2">
          아티클 {allArticles.length}개
        </div>

        {filtered ? (
          /* Search results */
          <ul>
            {filtered.length === 0 ? (
              <li className="px-2 py-3 text-sm text-gray-400 text-center">결과 없음</li>
            ) : filtered.map(article => (
              <ArticleItem
                key={article.slug}
                slug={article.slug}
                title={article.title}
                siteId={siteId}
                isActive={article.slug === currentSlug}
                isDone={!!progress[article.slug]}
              />
            ))}
          </ul>
        ) : (
          /* Grouped by chapter */
          toc.parts.flatMap(part =>
            part.chapters.map((chapter, ci) => (
              <div key={`${part.partIndex}-${ci}`}>
                <div className="px-2 pt-3 pb-1 text-[10px] font-mono uppercase tracking-wide text-gray-400 truncate">
                  {chapter.title}
                </div>
                <ul>
                  {chapter.articles.map(article => (
                    <ArticleItem
                      key={article.slug}
                      slug={article.slug}
                      title={article.title}
                      siteId={siteId}
                      isActive={article.slug === currentSlug}
                      isDone={!!progress[article.slug]}
                    />
                  ))}
                </ul>
              </div>
            ))
          )
        )}
      </div>
    </aside>
  );
}

function ArticleItem({
  slug, title, siteId, isActive, isDone,
}: {
  slug: string; title: string; siteId: string; isActive: boolean; isDone: boolean;
}) {
  return (
    <li>
      <Link
        href={`/sites/${siteId}/${slug}`}
        className={`grid items-start gap-2.5 px-2 py-2 rounded-lg transition-colors my-0.5 ${
          isActive
            ? 'bg-purple-50 text-purple-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ gridTemplateColumns: '16px 1fr' }}
      >
        {/* Completion circle */}
        <span className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
          isDone
            ? 'bg-green-500 border-green-500'
            : isActive
              ? 'border-purple-400'
              : 'border-gray-300'
        }`}>
          {isDone && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
        </span>

        <span className={`text-[13px] leading-[18px] line-clamp-2 ${
          isDone ? 'text-gray-400 line-through' : isActive ? 'text-purple-700 font-medium' : 'text-gray-700'
        }`}>
          {title}
        </span>
      </Link>
    </li>
  );
}
