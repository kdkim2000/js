'use client';
import { useEffect, useRef, useState } from 'react';

interface ProgressState {
  phase: string;
  done: number;
  total: number;
  errors: number;
  status: string;
}

export default function CrawlProgress({ siteId, onDone }: { siteId: string; onDone: () => void }) {
  const [prog, setProg] = useState<ProgressState>({ phase: 'discover', done: 0, total: 0, errors: 0, status: 'running' });
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/crawl`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, statusOnly: true }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.type === 'progress') {
          setProg({ phase: data.phase, done: data.done, total: data.total, errors: data.errors, status: 'running' });
        } else if (data.type === 'done') {
          setProg(p => ({ ...p, status: 'done' }));
          doneRef.current = true;
          onDone();
        } else if (data.type === 'error') {
          setProg(p => ({ ...p, status: 'error', phase: data.message ?? '오류' }));
          doneRef.current = true;
        }
      } catch { /* ignore */ }
    };

    poll();
    const id = setInterval(() => { if (!doneRef.current) poll(); else clearInterval(id); }, 1500);
    return () => clearInterval(id);
  }, [siteId, onDone]);

  const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
  const phaseLabel: Record<string, string> = { discover: 'URL 수집', articles: '아티클 크롤', index: '인덱스 빌드', done: '완료' };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>{phaseLabel[prog.phase] ?? prog.phase}</span>
        <span>{prog.done}/{prog.total} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {prog.errors > 0 && <p className="text-xs text-red-400">오류 {prog.errors}건</p>}
    </div>
  );
}
