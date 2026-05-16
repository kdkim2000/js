"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "js-tutorial-progress";

export type Progress = Record<string, boolean>;

export function useProgress(): [Progress, (slug: string, done: boolean) => void] {
  const [progress, setProgress] = useState<Progress>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function mark(slug: string, done: boolean) {
    setProgress((prev) => {
      const next = { ...prev, [slug]: done };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  return [progress, mark];
}

interface Props {
  slug: string;
  compact?: boolean;
}

export default function ProgressTracker({ slug, compact }: Props) {
  const [progress, mark] = useProgress();
  const done = progress[slug] ?? false;

  if (compact) {
    return (
      <button
        onClick={() => mark(slug, !done)}
        className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-colors ${
          done
            ? "bg-white border border-green-300 text-green-700 hover:bg-green-50"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        }`}
        style={{ boxShadow: 'var(--shadow-xs)' }}
      >
        {done && (
          <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">✓</span>
          </span>
        )}
        {done ? "완료됨" : "완료로 표시"}
      </button>
    );
  }

  return (
    <button
      onClick={() => mark(slug, !done)}
      className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-[12px] font-medium transition-colors ${
        done
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-white border border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-700"
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
        done ? "bg-green-500 border-green-500" : "border-gray-400"
      }`}>
        {done && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
      </span>
      {done ? "완료" : "완료로 표시"}
    </button>
  );
}
