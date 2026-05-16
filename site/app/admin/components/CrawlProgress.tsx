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
  const staleCountRef = useRef(0);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = false;
    staleCountRef.current = 0;

    const poll = async () => {
      try {
        const res = await fetch('/api/admin/crawl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ siteId, statusOnly: true }),
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.type === 'progress') {
          staleCountRef.current = 0;
          setProg({ phase: data.phase, done: data.done, total: data.total, errors: data.errors, status: 'running' });
        } else if (data.type === 'done') {
          doneRef.current = true;
          setProg(p => ({ ...p, status: 'done' }));
          onDone();
        } else if (data.type === 'error') {
          doneRef.current = true;
          setProg(p => ({ ...p, status: 'error', phase: data.message ?? '오류' }));
          onDone();
        } else if (data.type === 'stale') {
          // 크롤러가 응답 없음 — 최대 5번(7.5초) 기다린 후 종료
          staleCountRef.current++;
          if (staleCountRef.current >= 5) {
            doneRef.current = true;
            setProg(p => ({ ...p, status: 'error', phase: '크롤러 응답 없음' }));
            onDone();
          }
        }
      } catch { /* ignore */ }
    };

    poll();
    const id = setInterval(() => {
      if (doneRef.current) { clearInterval(id); return; }
      poll();
    }, 1500);
    return () => { clearInterval(id); };
  }, [siteId]); // onDone 제외 — inline 함수 재생성으로 인한 반복 실행 방지

  const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;
  const phaseLabel: Record<string, string> = {
    discover: 'URL 수집 중...',
    articles: '아티클 크롤 중',
    index: '인덱스 빌드 중',
    done: '완료',
  };

  if (prog.status === 'error') {
    return <p className="text-xs text-red-500 mt-2">⚠ {prog.phase}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-500">
        <span>{phaseLabel[prog.phase] ?? prog.phase}</span>
        <span>
          {prog.total > 0 ? `${prog.done}/${prog.total} (${pct}%)` : '준비 중...'}
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: prog.total > 0 ? `${pct}%` : '5%' }}
        />
      </div>
      {prog.errors > 0 && <p className="text-xs text-red-400">오류 {prog.errors}건</p>}
    </div>
  );
}
