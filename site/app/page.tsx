import Link from "next/link";
import { getRegistry } from "@/lib/registry";
import SiteGlyph from "@/components/SiteGlyph";
import StatusBadge from "@/components/StatusBadge";
import KpiCard from "@/components/KpiCard";

export default function HubPage() {
  const registry = getRegistry();
  const sites = registry.sites;
  const doneSites = sites.filter((s) => s.crawlStatus === "done");
  const totalArticles = doneSites.reduce((a, s) => a + (s.totalArticles ?? 0), 0);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-canvas">
      <div className="max-w-[900px] mx-auto px-6 py-10">

        {/* Page header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] text-gray-900 mb-1">학습 허브</h1>
            <p className="text-[15px] text-gray-500">
              현재 등록된 사이트를 탐색하고 학습을 시작하세요
            </p>
          </div>
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-4 h-10 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            style={{ boxShadow: 'var(--shadow-xs)' }}
          >
            + 사이트 추가
          </Link>
        </div>

        {/* KPI strip */}
        {sites.length > 0 && (
          <div className="flex border border-gray-200 rounded-xl bg-white mb-8 divide-x divide-gray-200 overflow-hidden"
            style={{ boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex-1"><KpiCard label="등록된 사이트" value={sites.length} /></div>
            <div className="flex-1"><KpiCard label="총 아티클" value={totalArticles.toLocaleString()} /></div>
            <div className="flex-1">
              <KpiCard
                label="완료한 글"
                value="—"
                sub="진도 관리에서 확인"
                accent
              />
            </div>
          </div>
        )}

        {/* Sites list */}
        {sites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-xl font-semibold mb-2 text-gray-800">등록된 학습 사이트가 없습니다</p>
            <p className="text-gray-500 mb-6 text-sm">크롤 관리 페이지에서 학습할 사이트를 추가하세요.</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              크롤 관리로 이동 →
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[15px] font-semibold text-gray-900">학습 사이트</h2>
              <span className="text-[13px] text-gray-400">
                {doneSites.length}개 사이트 · {totalArticles.toLocaleString()}개 아티클
              </span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100"
              style={{ boxShadow: 'var(--shadow-xs)' }}>
              {sites.map((site) => (
                <div key={site.id} className="grid items-center gap-4 px-5 py-4 hover:bg-gray-25 transition-colors"
                  style={{ gridTemplateColumns: '40px 1fr 200px auto' }}>

                  {/* Glyph */}
                  <SiteGlyph name={site.name} id={site.id} size={40} radius={10} />

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[15px] font-semibold text-gray-900 truncate">{site.name}</span>
                      <StatusBadge status={site.crawlStatus} />
                    </div>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-mono text-gray-400 hover:text-purple-700 truncate block transition-colors"
                    >
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
                      {site.crawlStatus === 'running' ? '크롤 중' : site.crawlStatus === 'done' ? '진도' : ''}
                    </span>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      {site.crawlStatus === 'done' && (
                        <div className="h-full rounded-full bg-purple-600" style={{ width: '0%' }} />
                      )}
                      {site.crawlStatus === 'running' && (
                        <div
                          className="h-full rounded-full w-1/2"
                          style={{
                            background: 'linear-gradient(90deg,#7F56D9,#BDB4FE,#7F56D9)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 1.4s linear infinite',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 h-9 flex items-center rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      style={{ boxShadow: 'var(--shadow-xs)' }}
                    >
                      원본 ↗
                    </a>
                    {site.crawlStatus === 'done' ? (
                      <Link
                        href={`/sites/${site.id}`}
                        className="px-3 h-9 flex items-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                        style={{ boxShadow: 'var(--shadow-xs)' }}
                      >
                        학습하기
                      </Link>
                    ) : (
                      <Link
                        href="/admin"
                        className="px-3 h-9 flex items-center rounded-lg border border-gray-300 bg-white text-sm text-gray-500 transition-colors opacity-50 cursor-not-allowed"
                      >
                        학습하기
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
