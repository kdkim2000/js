'use client';
import { useEffect, useState } from 'react';
import type { SiteEntry } from '@/lib/registry';
import SiteCard from './components/SiteCard';
import AddSiteForm from './components/AddSiteForm';

export default function AdminPage() {
  const [sites, setSites] = useState<SiteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    const res = await fetch('/api/admin/sites');
    if (res.ok) {
      const data = await res.json();
      setSites(data.sites ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSites(); }, []);

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
