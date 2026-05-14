"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Result {
  slug: string;
  title: string;
  chapter: string;
  snippet: string;
}

export default function SearchBar() {
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) return;
        const data = await res.json();
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
              href={`/${r.slug}`}
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
