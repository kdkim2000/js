'use client';
import { useState, useEffect } from 'react';
import type { SiteEntry } from '@/lib/registry';
import CrawlProgress from './CrawlProgress';
import Link from 'next/link';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  running: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

const STATUS_LABELS = { pending: '대기', running: '크롤 중', done: '완료', error: '오류' };

export default function SiteCard({ site, onRefresh }: { site: SiteEntry; onRefresh: () => void }) {
  const [crawling, setCrawling] = useState(false);

  // 마운트 시: registry가 running이면 status 파일이 실제로 활성인지 확인
  // stale(60초 이상 업데이트 없음)이면 crawling=false로 두어 버튼을 활성화
  useEffect(() => {
    if (site.crawlStatus !== 'running') return;
    fetch('/api/admin/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: site.id, statusOnly: true }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.type === 'progress') setCrawling(true);
        // stale / done / error → crawling=false(이미 초기값), 버튼 활성화
      })
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
    if (!confirm(`"${site.name}" 사이트를 삭제하시겠습니까?`)) return;
    await fetch(`/api/admin/sites?siteId=${site.id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{site.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[site.crawlStatus]}`}>
              {STATUS_LABELS[site.crawlStatus]}
            </span>
          </div>
          <a href={site.url} target="_blank" rel="noreferrer" className="text-sm text-blue-500 hover:underline">{site.url}</a>
          <div className="text-sm text-gray-500 mt-1 space-x-4">
            {site.totalArticles !== undefined && <span>아티클 {site.totalArticles}개</span>}
            {site.lastCrawledAt && <span>마지막 크롤: {new Date(site.lastCrawledAt).toLocaleDateString('ko-KR')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/sites/${site.id}`} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
            보기
          </Link>
          <button
            onClick={startCrawl}
            disabled={crawling}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {crawling ? '크롤 중...' : '크롤 시작'}
          </button>
          <button
            onClick={deleteSite}
            className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          >
            삭제
          </button>
        </div>
      </div>
      {crawling && (
        <div className="mt-4">
          <CrawlProgress siteId={site.id} onDone={() => { setCrawling(false); onRefresh(); }} />
        </div>
      )}
    </div>
  );
}
