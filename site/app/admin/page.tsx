'use client';
import { useEffect, useState } from 'react';
import type { SiteEntry } from '@/lib/registry';
import SiteCard from './components/SiteCard';
import AddSiteForm from './components/AddSiteForm';

export default function AdminPage() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [staticBuild, setStaticBuild] = useState(false);

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

  if (staticBuild) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">🖥️</div>
        <h2 className="text-xl font-semibold">관리 UI는 로컬 개발 서버 전용입니다</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          크롤 관리 기능은 로컬 파일 시스템과 Node.js 프로세스가 필요합니다.<br />
          정적 배포 환경에서는 동작하지 않습니다.
        </p>
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left text-sm font-mono">
          <p className="text-gray-500 dark:text-gray-400 mb-1"># 로컬에서 실행</p>
          <p className="text-gray-900 dark:text-gray-100">cd site &amp;&amp; npm run dev</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">→ http://localhost:3000/admin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-4">등록된 사이트</h2>
        {loading ? (
          <p className="text-gray-400">로딩 중...</p>
        ) : sites.length === 0 ? (
          <p className="text-gray-400">등록된 사이트가 없습니다.</p>
        ) : (
          <div className="grid gap-4">
            {sites.map(site => (
              <SiteCard key={site.id} site={site} onRefresh={fetchSites} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">새 사이트 추가</h2>
        <AddSiteForm onAdded={fetchSites} />
      </section>
    </div>
  );
}
