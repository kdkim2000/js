'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import KpiCard from '@/components/KpiCard';
import SiteGlyph from '@/components/SiteGlyph';

const STORAGE_KEY = 'js-tutorial-progress';
const TINTS_FILL = ['#7F56D9', '#2E90FA', '#12B76A', '#F79009', '#F04438', '#15B79E'];

interface SiteData {
  id: string;
  name: string;
  url: string;
  slugs: string[];
}

export default function ProgressView({ sites }: { sites: SiteData[] }) {
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setProgress(JSON.parse(saved));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const totalArticles = sites.reduce((a, s) => a + s.slugs.length, 0);
  const totalDone = sites.reduce((a, s) => a + s.slugs.filter(sl => progress[sl]).length, 0);
  const inProgress = sites.filter(s => {
    const done = s.slugs.filter(sl => progress[sl]).length;
    return done > 0 && done < s.slugs.length;
  }).length;

  const overallPct = totalArticles > 0 ? Math.round((totalDone / totalArticles) * 100) : 0;

  if (!hydrated) {
    return <div className="py-10 text-center text-gray-400 text-sm animate-pulse">진도 데이터 불러오는 중...</div>;
  }

  if (sites.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
        <p className="text-2xl mb-3">📊</p>
        <p className="text-[15px] font-semibold text-gray-800 mb-2">학습 데이터가 없습니다</p>
        <p className="text-gray-500 text-sm mb-5">크롤 완료된 사이트가 없습니다.</p>
        <Link href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
          크롤 관리로 이동
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI strip */}
      <div className="flex border border-gray-200 rounded-xl bg-white divide-x divide-gray-200 overflow-hidden"
        style={{ boxShadow: 'var(--shadow-xs)' }}>
        <div className="flex-1">
          <KpiCard label="완료한 글" value={totalDone} sub={`전체 ${totalArticles}개 중`} accent />
        </div>
        <div className="flex-1">
          <KpiCard label="완료율" value={`${overallPct}%`} />
        </div>
        <div className="flex-1">
          <KpiCard label="진행 중인 사이트" value={inProgress} />
        </div>
        <div className="flex-1">
          <KpiCard label="등록 사이트" value={sites.length} />
        </div>
      </div>

      {/* Donut chart + site list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        style={{ boxShadow: 'var(--shadow-xs)' }}>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Donut */}
          <div className="p-6 border-r border-gray-100">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">전체 완료율</h2>
            <p className="text-[12px] text-gray-500 mb-5">사이트별 진도 비율</p>
            <DonutChart sites={sites} progress={progress} />
          </div>

          {/* Legend */}
          <div className="p-6">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">사이트별 진도</h2>
            <div className="space-y-3">
              {sites.map((site, i) => {
                const done = site.slugs.filter(sl => progress[sl]).length;
                const pct = site.slugs.length > 0 ? Math.round((done / site.slugs.length) * 100) : 0;
                return (
                  <div key={site.id} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: TINTS_FILL[i % TINTS_FILL.length] }} />
                    <span className="text-[13px] text-gray-700 truncate flex-1">{site.name}</span>
                    <span className="text-[13px] font-mono font-semibold text-gray-900 shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Site progress list */}
      <div>
        <h2 className="text-[15px] font-semibold text-gray-900 mb-3">사이트별 상세 진도</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100"
          style={{ boxShadow: 'var(--shadow-xs)' }}>
          {sites.map(site => {
            const done = site.slugs.filter(sl => progress[sl]).length;
            const pct = site.slugs.length > 0 ? Math.round((done / site.slugs.length) * 100) : 0;
            return (
              <div key={site.id} className="grid items-center gap-4 px-5 py-4 hover:bg-gray-25 transition-colors"
                style={{ gridTemplateColumns: '36px 1fr 100px 1.5fr 80px' }}>

                <SiteGlyph name={site.name} id={site.id} size={36} radius={8} fontSize={12} />

                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">{site.name}</div>
                  <div className="text-[11px] font-mono text-gray-400 truncate">
                    {site.url.replace(/^https?:\/\//, '')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[15px] font-semibold text-gray-900">{done}</span>
                  <span className="text-[12px] text-gray-400"> / {site.slugs.length}</span>
                </div>

                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${pct}%` }} />
                </div>

                <div className="text-right text-[13px] font-mono font-semibold text-gray-700">{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DonutChart({ sites, progress }: { sites: SiteData[]; progress: Record<string, boolean> }) {
  const R = 56;
  const STROKE = 16;
  const circumference = 2 * Math.PI * R;

  const data = sites.map((site, i) => {
    const done = site.slugs.filter(sl => progress[sl]).length;
    const total = site.slugs.length;
    return { site, done, total, color: TINTS_FILL[i % TINTS_FILL.length] };
  });

  const totalDone = data.reduce((a, d) => a + d.done, 0);
  const totalAll = data.reduce((a, d) => a + d.total, 0);
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  let offset = 0;
  const segments = data.map(d => {
    const frac = totalAll > 0 ? d.done / totalAll : 0;
    const dash = frac * circumference;
    const gap = circumference - dash;
    const rotation = (offset / totalAll) * 360 - 90;
    offset += d.done;
    return { ...d, dash, gap, rotation };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="144" height="144" viewBox="0 0 144 144" className="shrink-0">
        {/* Background ring */}
        <circle
          cx="72" cy="72" r={R}
          fill="none"
          stroke="#F2F4F7"
          strokeWidth={STROKE}
        />
        {/* Segments */}
        {totalDone > 0 && segments.map((seg, i) => seg.dash > 0 && (
          <circle
            key={i}
            cx="72" cy="72" r={R}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            transform={`rotate(${seg.rotation} 72 72)`}
            style={{ transition: 'stroke-dasharray 320ms ease' }}
          />
        ))}
        {/* Center text */}
        <text x="72" y="68" textAnchor="middle" fill="#101828"
          fontSize="22" fontWeight="700" fontFamily="var(--font-display)">
          {overallPct}%
        </text>
        <text x="72" y="84" textAnchor="middle" fill="#667085" fontSize="11">
          완료
        </text>
      </svg>
    </div>
  );
}
