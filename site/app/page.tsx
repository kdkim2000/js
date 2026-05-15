import Link from "next/link";
import { getRegistry } from "@/lib/registry";

const STATUS_COLORS = {
  done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  running: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  pending: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  error: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};
const STATUS_LABELS = { done: "완료", running: "크롤 중", pending: "대기", error: "오류" };

export default function HubPage() {
  const registry = getRegistry();
  const sites = registry.sites;
  const doneSites = sites.filter((s) => s.crawlStatus === "done");

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-lg">학습 허브</span>
        </div>
        <Link
          href="/admin"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
        >
          크롤 관리 →
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">

        {/* Sites list */}
        {sites.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">
              등록된 학습 사이트가 없습니다
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              크롤 관리 페이지에서 학습할 사이트를 추가하세요.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              크롤 관리로 이동 →
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">학습 사이트</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {doneSites.length}개 사이트 · {doneSites.reduce((acc, s) => acc + (s.totalArticles ?? 0), 0)}개 아티클
              </p>
            </div>

            <ul className="space-y-3 mb-10">
              {sites.map((site) => (
                <li key={site.id}>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-yellow-300 dark:hover:border-yellow-700 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{site.name}</h3>
                          <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[site.crawlStatus]}`}>
                            {STATUS_LABELS[site.crawlStatus]}
                          </span>
                        </div>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate block"
                        >
                          {site.url}
                        </a>
                        {site.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{site.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {site.totalArticles != null && (
                            <span>{site.totalArticles}개 아티클</span>
                          )}
                          {site.lastCrawledAt && (
                            <span>마지막 크롤: {new Date(site.lastCrawledAt).toLocaleDateString("ko-KR")}</span>
                          )}
                        </div>
                      </div>

                      {site.crawlStatus === "done" && (
                        <Link
                          href={`/sites/${site.id}`}
                          className="shrink-0 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          읽기
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-6 text-center">
              <p className="text-sm text-gray-400 mb-3">새 사이트를 추가하거나 크롤 상태를 확인하려면</p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                크롤 관리 →
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
