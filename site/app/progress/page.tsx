import { getRegistry } from "@/lib/registry";
import { getTOC } from "@/lib/toc";
import ProgressView from "./ProgressView";

export default function ProgressPage() {
  const registry = getRegistry();
  const sitesData = registry.sites
    .filter(s => s.crawlStatus === 'done')
    .map(site => {
      const toc = getTOC(site.id);
      const articles = toc.parts.flatMap(p => p.chapters.flatMap(c => c.articles.map(a => a.slug)));
      return {
        id: site.id,
        name: site.name,
        url: site.url,
        slugs: articles,
      };
    });

  return (
    <div className="min-h-[calc(100vh-56px)] bg-canvas">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[32px] font-bold leading-[40px] text-gray-900 mb-1">진도 관리</h1>
          <p className="text-[15px] text-gray-500">학습 진행 현황을 한눈에 확인하세요</p>
        </div>
        <ProgressView sites={sitesData} />
      </div>
    </div>
  );
}
