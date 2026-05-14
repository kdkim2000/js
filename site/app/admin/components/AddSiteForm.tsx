'use client';
import { useState } from 'react';

function urlToId(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  } catch { return ''; }
}

export default function AddSiteForm({ onAdded }: { onAdded: () => void }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [selector, setSelector] = useState('');
  const [strategy, setStrategy] = useState<'sitemap' | 'bfs'>('sitemap');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const autoId = urlToId(url);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: url.trim(),
        id: autoId,
        name: name.trim() || autoId,
        crawlConfig: {
          contentSelector: selector.trim() || null,
          strategy,
          maxDepth: 3,
          delayMs: 1200,
        },
      }),
    });
    setLoading(false);
    if (res.ok) {
      setUrl(''); setName(''); setSelector(''); setStrategy('sitemap');
      onAdded();
    } else {
      const d = await res.json().catch(() => ({}));
      setError((d as { error?: string }).error ?? '등록 실패');
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium block mb-1">URL <span className="text-red-500">*</span></label>
          <input
            type="url" value={url} onChange={e => setUrl(e.target.value)} required
            placeholder="https://docs.example.com"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          />
          {autoId && <p className="text-xs text-gray-400 mt-1">ID: {autoId}</p>}
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">사이트 이름</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={autoId || '이름 입력'}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">콘텐츠 셀렉터 (선택)</label>
          <input type="text" value={selector} onChange={e => setSelector(e.target.value)}
            placeholder="article, .content, main"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">크롤 전략</label>
          <select value={strategy} onChange={e => setStrategy(e.target.value as 'sitemap' | 'bfs')}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
          >
            <option value="sitemap">sitemap.xml (권장)</option>
            <option value="bfs">BFS 링크 탐색</option>
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button type="submit" disabled={loading || !url.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '등록 중...' : '사이트 추가'}
      </button>
    </form>
  );
}
