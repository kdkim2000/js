import Link from "next/link";
import { getArticleMeta } from "@/lib/toc";

interface Props {
  prev: string | null;
  next: string | null;
  siteId: string;
}

export default function ArticleNav({ prev, next, siteId }: Props) {
  const prevMeta = prev ? getArticleMeta(prev, siteId) : null;
  const nextMeta = next ? getArticleMeta(next, siteId) : null;

  if (!prevMeta && !nextMeta) return null;

  return (
    <nav className="grid grid-cols-2 gap-3 mt-10">
      <div>
        {prevMeta ? (
          <Link
            href={`/sites/${siteId}/${prev}`}
            className="flex flex-col gap-1 p-[14px_18px] rounded-[10px] border border-gray-200 bg-white hover:border-purple-300 transition-colors group"
            style={{ boxShadow: 'var(--shadow-xs)' }}
          >
            <span className="text-[11px] font-mono uppercase tracking-wide text-gray-500 flex items-center gap-1">
              ← 이전
            </span>
            <span className="text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
              {prevMeta.title}
            </span>
          </Link>
        ) : <div />}
      </div>
      <div>
        {nextMeta ? (
          <Link
            href={`/sites/${siteId}/${next}`}
            className="flex flex-col gap-1 p-[14px_18px] rounded-[10px] border border-gray-200 bg-white hover:border-purple-300 transition-colors text-right group"
            style={{ boxShadow: 'var(--shadow-xs)' }}
          >
            <span className="text-[11px] font-mono uppercase tracking-wide text-gray-500 flex items-center justify-end gap-1">
              다음 →
            </span>
            <span className="text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-purple-700 transition-colors">
              {nextMeta.title}
            </span>
          </Link>
        ) : <div />}
      </div>
    </nav>
  );
}
