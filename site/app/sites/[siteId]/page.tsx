import { getTOC } from "@/lib/toc";
import { getRegistry } from "@/lib/registry";
import Link from "next/link";

export async function generateStaticParams() {
  const registry = getRegistry();
  return registry.sites.map((s) => ({ siteId: s.id }));
}

interface PageProps {
  params: Promise<{ siteId: string }>;
}

export default async function SitePage({ params }: PageProps) {
  const { siteId } = await params;
  const toc = getTOC(siteId);
  const registry = getRegistry();
  const site = registry.sites.find((s) => s.id === siteId);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">{site?.name ?? siteId}</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {site?.url && (
            <>
              <a
                href={site.url}
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                {site.url}
              </a>
              {" · "}
            </>
          )}
          {toc.totalArticles}개 아티클
        </p>
        {site?.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{site.description}</p>
        )}
      </div>

      {toc.parts.map((part) => (
        <section key={part.partIndex} className="mb-12">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-yellow-500 mr-2">파트 {part.partIndex}</span>
            {part.title}
          </h2>

          <div className="grid gap-4">
            {part.chapters.map((chapter, ci) => (
              <div
                key={ci}
                className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 font-semibold text-sm text-gray-700 dark:text-gray-300">
                  {chapter.title}
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    {chapter.articles.length}개
                  </span>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {chapter.articles.map((article) => (
                    <li key={article.slug}>
                      <Link
                        href={`/sites/${siteId}/${article.slug}`}
                        className="flex items-center px-4 py-2.5 text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors group"
                      >
                        <span className="flex-1 text-gray-700 dark:text-gray-300 group-hover:text-yellow-700 dark:group-hover:text-yellow-400">
                          {article.title}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 group-hover:text-yellow-400">
                          →
                        </span>
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
