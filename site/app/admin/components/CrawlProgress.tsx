'use client';
import { useEffect, useState } from 'react';

interface ProgressState {
  phase: string;
  done: number;
  total: number;
  errors: number;
  status: string;
}

export default function CrawlProgress({ siteId, onDone }: { siteId: string; onDone: () => void }) {
  const [prog, setProg] = useState<ProgressState>({ phase: 'discover', done: 0, total: 0, errors: 0, status: 'running' });

  useEffect(() => {
    const es = new EventSource(`/api/admin/crawl/${siteId}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'progress') {
          setProg({ phase: data.phase, done: data.done, total: data.total, errors: data.errors, status: 'running' });
        } else if (data.type === 'done') {
          setProg(p => ({ ...p, status: 'done' }));
          es.close();
          onDone();
        } else if (data.type === 'error') {
          setProg(p => ({ ...p, status: 'error' }));
          es.close();
        }
      } catch { /* skip */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
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
