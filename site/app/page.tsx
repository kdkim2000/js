import Link from "next/link";
import { getTOC } from "@/lib/toc";
import { getRegistry, DEFAULT_SITE_ID } from "@/lib/registry";

export default function HomePage() {
  const registry = getRegistry();
  const toc = getTOC(DEFAULT_SITE_ID);

  const otherSites = registry.sites.filter((s) => s.id !== DEFAULT_SITE_ID);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">모던 자바스크립트 튜토리얼</h1>
        <p className="text-gray-500 dark:text-gray-400">
          ko.javascript.info 기반 · {toc.totalArticles}개 아티클
        </p>
      </div>

      {otherSites.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
            다른 학습 사이트
          </h2>
          <ul className="grid gap-2">
            {otherSites.map((site) => (
              <li key={site.id}>
                <Link
                  href={`/sites/${site.id}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors group"
                >
                  <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                    {site.name}
                  </span>
                  {site.totalArticles && (
                    <span className="text-xs text-gray-400">{site.totalArticles}개 아티클</span>
                  )}
                  <span className="text-gray-300 dark:text-gray-600 group-hover:text-yellow-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toc.parts.map((part) => (
        <section key={part.partIndex} className="mb-12">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-yellow-500 mr-2">파트 {part.partIndex}</span>
            {part.title}
          </h2>

          <div className="grid gap-4">
            {part.chapters.map((chapter, ci) => (
              <div key={ci} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {chapter.title}
                  <span className="ml-2 text-xs font-normal text-gray-400">{chapter.articles.length}개</span>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {chapter.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/${article.slug}`}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors group"
                      >
                        <span className="flex-1 text-gray-700 dark:text-gray-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                          {article.title}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 group-hover:text-yellow-400">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
