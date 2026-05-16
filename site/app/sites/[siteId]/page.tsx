import { redirect } from "next/navigation";
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

  const firstSlug = toc.parts[0]?.chapters[0]?.articles[0]?.slug;
  if (firstSlug) redirect(`/sites/${siteId}/${firstSlug}`);

  const registry = getRegistry();
  const site = registry.sites.find((s) => s.id === siteId);

  return (
    <div className="max-w-[720px] mx-auto px-10 py-14 text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-3">{site?.name ?? siteId}</h1>
      <p className="text-gray-500 mb-6">아직 크롤된 아티클이 없습니다.</p>
      <Link href="/admin"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors">
        크롤 관리에서 시작하기
      </Link>
    </div>
  );
}
