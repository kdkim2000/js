import { notFound } from "next/navigation";
import { getArticle, getAllSlugs } from "@/lib/articles";
import ArticleNav from "@/components/ArticleNav";
import ProgressTracker from "@/components/ProgressTracker";
import { codeToHtml } from "shiki";
import ArticleContent from "@/components/ArticleContent";

// Pre-generate all article pages at build time
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
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

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticle(slug);
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
          <ProgressTracker slug={slug} />
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
      <ArticleNav prev={meta.prev} next={meta.next} />
    </article>
  );
}
