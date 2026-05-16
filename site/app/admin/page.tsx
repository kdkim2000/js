'use client';
import { useEffect, useState } from 'react';
import type { SiteEntry } from '@/lib/registry';
import CrawlRow from './components/CrawlRow';
import AddSiteForm from './components/AddSiteForm';
import KpiCard from '@/components/KpiCard';

export default function AdminPage() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [staticBuild, setStaticBuild] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/admin/sites');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setSites(data.sites ?? []);
    } catch {
      setStaticBuild(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSites(); }, []);

  useEffect(() => {
    const hasRunning = sites.some(s => s.crawlStatus === 'running');
    if (!hasRunning) return;
    const id = setInterval(fetchSites, 5000);
    return () => clearInterval(id);
  }, [sites]);

  if (staticBuild) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="text-4xl">🖥️</div>
        <h2 className="text-xl font-semibold text-gray-800">관리 UI는 로컬 개발 서버 전용입니다</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          크롤 관리 기능은 로컬 파일 시스템과 Node.js 프로세스가 필요합니다.<br />
          정적 배포 환경에서는 동작하지 않습니다.
        </p>
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 text-left text-sm font-mono max-w-sm mx-auto">
          <p className="text-gray-400 mb-1"># 로컬에서 실행</p>
          <p className="text-gray-800">cd site &amp;&amp; npm run dev</p>
          <p className="text-gray-400 mt-2">→ http://localhost:3000/admin</p>
        </div>
      </div>
    );
  }

  const running = sites.filter(s => s.crawlStatus === 'running').length;
  const pending = sites.filter(s => s.crawlStatus === 'pending').length;
  const errored = sites.filter(s => s.crawlStatus === 'error').length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-[40px] text-gray-900 mb-1">크롤 관리</h1>
          <p className="text-[15px] text-gray-500">사이트를 등록하고 크롤링을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-4 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
          style={{ boxShadow: 'var(--shadow-xs)' }}
        >
          + 사이트 추가
        </button>
      </div>

      {/* KPI strip */}
      {sites.length > 0 && (
        <div className="flex border border-gray-200 rounded-xl bg-white divide-x divide-gray-200 overflow-hidden"
          style={{ boxShadow: 'var(--shadow-xs)' }}>
          <div className="flex-1"><KpiCard label="등록 사이트" value={sites.length} /></div>
          <div className="flex-1"><KpiCard label="진행 중" value={running} accent={running > 0} /></div>
          <div className="flex-1"><KpiCard label="대기" value={pending} /></div>
          <div className="flex-1"><KpiCard label="최근 실패" value={errored} /></div>
        </div>
      )}

      {/* Site list */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-[15px] font-semibold text-gray-900">사이트 목록</h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">로딩 중...</div>
        ) : sites.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
            등록된 사이트가 없습니다. 아래에서 첫 사이트를 추가하세요.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100"
            style={{ boxShadow: 'var(--shadow-xs)' }}>
            {sites.map(site => (
              <CrawlRow key={site.id} site={site} onRefresh={fetchSites} />
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {(showForm || sites.length === 0) && (
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-3">새 사이트 추가</h2>
          <AddSiteForm onAdded={() => { fetchSites(); setShowForm(false); }} />
        </div>
      )}
    </div>
  );
}
