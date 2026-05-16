'use client';
import { useState } from 'react';

function urlToId(url: string): string {
  try {
    return new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  } catch { return ''; }
}

const inputCls = 'w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors';

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
    <form onSubmit={submit}
      className="bg-white rounded-xl border border-gray-200 p-6"
      style={{ boxShadow: 'var(--shadow-xs)' }}>
      <div className="grid grid-cols-2 gap-4">

        {/* URL - full width */}
        <div className="col-span-2">
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            URL <span className="text-red-600">*</span>
          </label>
          <input
            type="url" value={url} onChange={e => setUrl(e.target.value)} required
            placeholder="https://docs.example.com"
            className={inputCls}
          />
          {autoId && (
            <p className="text-xs text-gray-400 mt-1 font-mono">ID: {autoId}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">절대 URL을 입력하세요 (https://...)</p>
        </div>

        {/* Site name */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">사이트 이름</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={autoId || '이름 입력'}
            className={inputCls}
          />
        </div>

        {/* Content selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">콘텐츠 셀렉터 (선택)</label>
          <input type="text" value={selector} onChange={e => setSelector(e.target.value)}
            placeholder="article, .content, main"
            className={inputCls}
          />
        </div>

        {/* Strategy */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">크롤 전략</label>
          <select value={strategy} onChange={e => setStrategy(e.target.value as 'sitemap' | 'bfs')}
            className={inputCls}>
            <option value="sitemap">sitemap.xml (권장)</option>
            <option value="bfs">BFS 링크 탐색</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      <div className="flex items-center justify-end gap-3 mt-5 pt-5 border-t border-gray-100">
        <button type="button" onClick={() => { setUrl(''); setName(''); setSelector(''); }}
          className="px-4 h-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          style={{ boxShadow: 'var(--shadow-xs)' }}>
          초기화
        </button>
        <button type="submit" disabled={loading || !url.trim()}
          className="px-4 h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          style={{ boxShadow: 'var(--shadow-xs)' }}>
          {loading ? '등록 중...' : '+ 사이트 추가'}
        </button>
      </div>
    </form>
  );
}
