'use client';
import { useState, useEffect } from 'react';
import type { SiteEntry } from '@/lib/registry';
import CrawlProgress from './CrawlProgress';
import Link from 'next/link';
import SiteGlyph from '@/components/SiteGlyph';
import StatusBadge from '@/components/StatusBadge';

export default function CrawlRow({ site, onRefresh }: { site: SiteEntry; onRefresh: () => void }) {
  const [crawling, setCrawling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (site.crawlStatus !== 'running') return;
    fetch('/api/admin/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id, statusOnly: true }),
    })
      .then(r => r.json())
      .then(data => { if (data.type === 'progress') setCrawling(true); })
      .catch(() => {});
  }, [site.id, site.crawlStatus]);

  const startCrawl = async () => {
    setCrawling(true);
    const res = await fetch('/api/admin/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id }),
    });
    if (!res.ok) setCrawling(false);
  };

  const deleteSite = async () => {
    if (!confirm(`"${site.name}" 사이트를 삭제하시겠습니까?\n\n크롤 데이터(아티클, DB)도 함께 삭제됩니다.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sites?siteId=${site.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(`삭제 실패 (${res.status}): ${body.error ?? '알 수 없는 오류'}`);
        return;
      }
      onRefresh();
    } catch {
      alert('삭제 중 네트워크 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="grid items-center gap-4 px-5 py-4 hover:bg-gray-25 transition-colors"
        style={{ gridTemplateColumns: '40px 1fr 200px auto' }}>

        {/* Glyph */}
        <SiteGlyph name={site.name} id={site.id} size={40} radius={10} />

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[15px] font-semibold text-gray-900 truncate">{site.name}</span>
            <StatusBadge status={site.crawlStatus} />
          </div>
          <a href={site.url} target="_blank" rel="noreferrer"
            className="text-[12px] font-mono text-gray-400 hover:text-purple-700 truncate block transition-colors">
            {site.url}
          </a>
          <div className="text-[12px] font-mono text-gray-400 mt-0.5">
            {site.totalArticles != null && `${site.totalArticles}개 아티클`}
            {site.totalArticles != null && site.lastCrawledAt && ' · '}
            {site.lastCrawledAt && `마지막 크롤 ${new Date(site.lastCrawledAt).toLocaleDateString('ko-KR')}`}
          </div>
        </div>

        {/* Progress */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-mono uppercase tracking-wide text-gray-400">
            {crawling ? '크롤 중' : site.crawlStatus === 'done' ? '완료' : ''}
          </span>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            {site.crawlStatus === 'done' && !crawling && (
              <div className="h-full rounded-full bg-purple-600 w-full" />
            )}
            {(site.crawlStatus === 'running' || crawling) && (
              <div className="h-full rounded-full w-1/2"
                style={{
                  background: 'linear-gradient(90deg,#7F56D9,#BDB4FE,#7F56D9)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.4s linear infinite',
                }}
              />
            )}
            {site.crawlStatus === 'error' && (
              <div className="h-full rounded-full bg-red-300 w-full" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {site.crawlStatus === 'done' && (
            <Link href={`/sites/${site.id}`}
              className="px-3 h-8 flex items-center rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              style={{ boxShadow: 'var(--shadow-xs)' }}>
              보기
            </Link>
          )}
          <button
            onClick={startCrawl}
            disabled={crawling}
            className="px-3 h-8 flex items-center rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            style={{ boxShadow: 'var(--shadow-xs)' }}
          >
            {crawling ? '크롤 중...' : '크롤 시작'}
          </button>
          <button
            onClick={deleteSite}
            disabled={deleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 disabled:opacity-50 transition-colors text-base"
            title="삭제"
          >
            ✕
          </button>
        </div>
      </div>

      {crawling && (
        <div className="px-5 pb-4 pt-0">
          <CrawlProgress siteId={site.id} onDone={() => { setCrawling(false); onRefresh(); }} />
        </div>
      )}
    </div>
  );
}
