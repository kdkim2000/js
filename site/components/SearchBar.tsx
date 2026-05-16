"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Result {
  slug: string;
  title: string;
  chapter: string;
  snippet: string;
}

interface Props {
  siteId?: string;
}

function extractSlug(url: string): string {
  const m = url.match(/\/sites\/[^/]+\/(.+?)(?:\/index\.html)?$/) ||
            url.match(/^\/(.+?)(?:\/index\.html)?$/);
  return m ? m[1] : url.replace(/^\//, "").replace(/\/index\.html$/, "");
}

// Loads pagefind by injecting an ES module script — bypasses the bundler entirely
// so Turbopack never sees the runtime-only `/pagefind/pagefind.js` path.
function loadPagefind(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") { reject(new Error("SSR")); return; }
    const win = window as Window & { __pagefind__?: Record<string, unknown> };
    if (win.__pagefind__) { resolve(win.__pagefind__); return; }

    if (!document.getElementById("__pf_loader__")) {
      const s = document.createElement("script");
      s.id = "__pf_loader__";
      s.type = "module";
      s.textContent = [
        "import * as pf from '/pagefind/pagefind.js';",
        "window.__pagefind__ = pf;",
        "window.dispatchEvent(new CustomEvent('__pf_ready__'));",
      ].join("\n");
      s.onerror = () => reject(new Error("pagefind not found"));
      document.head.appendChild(s);
    }

    window.addEventListener("__pf_ready__", () => {
      resolve((window as Window & { __pagefind__?: Record<string, unknown> }).__pagefind__!);
    }, { once: true });
  });
}

async function pagefindSearch(query: string, siteId?: string): Promise<Result[]> {
  const pf = await loadPagefind();
  const search = pf.search as (q: string) => Promise<{ results: { data: () => Promise<Record<string, unknown>> }[] }>;
  const { results } = await search(query);
  const data = await Promise.all(results.slice(0, 10).map((r) => r.data()));
  return data.map((r) => ({
    slug: extractSlug(String((r.url as string) ?? "")),
    title: String(((r.meta as Record<string, unknown>)?.title) ?? r.url ?? ""),
    chapter: String(((r.meta as Record<string, unknown>)?.chapter) ?? ""),
    snippet: String((r.excerpt as string) ?? ""),
  }));
}

async function apiSearch(query: string, siteId?: string): Promise<Result[]> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, siteId }),
  });
  if (!res.ok) return [];
  return res.json();
}

export default function SearchBar({ siteId }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Pagefind first (static export), fall back to API (dev server)
        let data: Result[] = [];
        try {
          data = await pagefindSearch(q, siteId);
        } catch {
          data = await apiSearch(q, siteId);
        }
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
  }

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <span className="text-gray-400">🔍</span>
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="검색..."
          className="flex-1 outline-none text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
        />
        {loading && <span className="text-xs text-gray-400 animate-pulse">검색 중</span>}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.map((r) => (
            <Link
              key={r.slug}
              href={siteId ? `/sites/${siteId}/${r.slug}` : `/${r.slug}`}
              onClick={() => { setOpen(false); setQuery(""); }}
              className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{r.title}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{r.chapter}</div>
              <div
                className="text-xs text-gray-500 dark:text-gray-400 mt-1 [&>mark]:bg-yellow-200 [&>mark]:dark:bg-yellow-800 [&>mark]:rounded"
                dangerouslySetInnerHTML={{ __html: r.snippet }}
              />
            </Link>
          ))}
        </div>
      )}

      {open && results.length === 0 && query.trim() && !loading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 px-4 py-3 text-sm text-gray-400">
          검색 결과 없음
        </div>
      )}
    </div>
  );
}
