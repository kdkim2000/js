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
}

export default function ProgressTracker({ slug }: Props) {
  const [progress, mark] = useProgress();
  const done = progress[slug] ?? false;

  return (
    <button
      onClick={() => mark(slug, !done)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        done
          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700"
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${done ? "bg-green-500 border-green-500" : "border-gray-400"}`}>
        {done && <span className="text-white text-xs">✓</span>}
      </span>
      {done ? "학습 완료" : "완료로 표시"}
    </button>
  );
}
