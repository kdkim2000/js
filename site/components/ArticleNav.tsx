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

  return (
    <nav className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        {prevMeta && (
          <Link
            href={`/sites/${siteId}/${prev}`}
            className="group flex flex-col gap-0.5 text-sm hover:text-yellow-600 dark:hover:text-yellow-400"
          >
            <span className="text-xs text-gray-400 dark:text-gray-500">← 이전</span>
            <span className="font-medium group-hover:underline">{prevMeta.title}</span>
          </Link>
        )}
      </div>
      <div className="flex-1 text-right">
        {nextMeta && (
          <Link
            href={`/sites/${siteId}/${next}`}
            className="group flex flex-col gap-0.5 items-end text-sm hover:text-yellow-600 dark:hover:text-yellow-400"
          >
            <span className="text-xs text-gray-400 dark:text-gray-500">다음 →</span>
            <span className="font-medium group-hover:underline">{nextMeta.title}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
