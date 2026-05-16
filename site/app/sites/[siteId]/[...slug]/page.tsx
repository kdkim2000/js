import { notFound } from "next/navigation";
import { getArticle, getAllSlugs } from "@/lib/articles";
import { getRegistry } from "@/lib/registry";
import ArticleNav from "@/components/ArticleNav";
import ProgressTracker from "@/components/ProgressTracker";
import { codeToHtml } from "shiki";
import ArticleContent from "@/components/ArticleContent";

interface PageProps {
  params: Promise<{ siteId: string; slug: string[] }>;
}

async function preHighlightCodeBlocks(markdown: string): Promise<Record<number, string>> {
  const blocks: Record<number, string> = {};
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let idx = 0;
  while ((match = regex.exec(markdown)) !== null) {
    const lang = match[1] || "text";
    const code = match[2];
    if (lang !== "text" && code.trim()) {
      try {
        blocks[idx] = await codeToHtml(code.trimEnd(), {
          lang: lang === "js" ? "javascript" : lang,
          theme: "github-dark",
        });
      } catch {
        // unsupported lang — leave empty, ArticleContent will fallback
      }
    }
    idx++;
  }
  return blocks;
}

export async function generateStaticParams() {
  const registry = getRegistry();
  const params: { siteId: string; slug: string[] }[] = [];
  for (const site of registry.sites) {
    const slugs = getAllSlugs(site.id);
    for (const slug of slugs) {
      params.push({ siteId: site.id, slug: [slug] });
    }
  }
  return params;
}

export default async function SiteArticlePage({ params }: PageProps) {
  const { siteId, slug } = await params;
  const slugStr = slug.join("/");
  const article = getArticle(slugStr, siteId);
  if (!article) notFound();

  const { meta, body } = article;
  const highlightedBlocks = await preHighlightCodeBlocks(body);

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-400 dark:text-gray-500 mb-6 flex items-center gap-1.5">
        <span>파트 {meta.part}</span>
        <span>›</span>
        <span>{meta.chapter}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">{meta.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <ProgressTracker slug={slugStr} />
          <a
            href={meta.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            원문 보기 ↗
          </a>
        </div>
      </header>

      {/* Content */}
      <div className="prose-sm max-w-none text-gray-800 dark:text-gray-200">
        <ArticleContent content={body} highlightedBlocks={highlightedBlocks} />
      </div>

      {/* Prev/Next */}
      <ArticleNav prev={meta.prev} next={meta.next} siteId={siteId} />
    </article>
  );
}
