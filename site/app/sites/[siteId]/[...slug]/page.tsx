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
      } catch { /* unsupported lang */ }
    }
    idx++;
  }
  return blocks;
}

function estimateReadMins(text: string): number {
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));
}

export async function generateStaticParams() {
  const registry = getRegistry();
  const params: { siteId: string; slug: string[] }[] = [];
  for (const site of registry.sites) {
    const slugs = getAllSlugs(site.id);
    for (const slug of slugs) params.push({ siteId: site.id, slug: [slug] });
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
  const readMins = estimateReadMins(body);

  return (
    <div>
      {/* Sticky sub-bar */}
      <div className="sticky top-0 z-10 bg-white/94 backdrop-blur-sm border-b border-gray-100 px-10 h-10 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <span>🗄</span>
          로컬 캐시
          {meta.chapter && (
            <span className="text-gray-300 mx-1">·</span>
          )}
          {meta.chapter && <span className="text-gray-400">{meta.chapter}</span>}
        </span>
        {meta.url && (
          <a
            href={meta.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-gray-400 hover:text-purple-700 transition-colors flex items-center gap-1"
          >
            원본 보기 ↗
          </a>
        )}
      </div>

      {/* Article body */}
      <article className="max-w-[720px] mx-auto px-10 pt-14 pb-20">
        {/* Eyebrow */}
        {(meta.partTitle || meta.chapter) && (
          <p className="text-[12px] font-mono font-semibold uppercase tracking-[.08em] text-purple-700 mb-3">
            {[meta.partTitle, meta.chapter].filter(Boolean).join(' › ')}
          </p>
        )}

        {/* H1 */}
        <h1 className="text-[36px] font-bold leading-[44px] text-gray-900 mb-4" style={{ textWrap: 'balance' } as React.CSSProperties}>
          {meta.title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap py-3 border-y border-gray-100 mb-8 text-[12px] text-gray-500">
          <span className="flex items-center gap-1">
            <span>⏱</span>{readMins}분 읽기
          </span>
          {meta.chapter && (
            <span className="flex items-center gap-1">
              <span>📂</span>{meta.chapter}
            </span>
          )}
          <div className="ml-auto">
            <ProgressTracker slug={slugStr} />
          </div>
        </div>

        {/* Content */}
        <div className="text-[17px] leading-[30px] text-gray-800">
          <ArticleContent content={body} highlightedBlocks={highlightedBlocks} />
        </div>

        {/* Complete CTA */}
        <CompleteCTA slug={slugStr} />

        {/* Prev/Next nav */}
        <ArticleNav prev={meta.prev} next={meta.next} siteId={siteId} />
      </article>
    </div>
  );
}

function CompleteCTA({ slug }: { slug: string }) {
  return (
    <div className="mt-16 p-5 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-4"
      style={{ boxShadow: 'var(--shadow-xs)' }}>
      <div>
        <p className="text-[15px] font-semibold text-gray-900 mb-0.5">이 글을 완료로 표시할까요?</p>
        <p className="text-[13px] text-gray-500">완료 표시는 사이드바 진도에 반영됩니다</p>
      </div>
      <ProgressTracker slug={slug} compact />
    </div>
  );
}
