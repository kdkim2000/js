import { getTOC } from "@/lib/toc";
import { getRegistry } from "@/lib/registry";
import SidebarWrapper from "@/components/SidebarWrapper";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const toc = getTOC(siteId);
  const registry = getRegistry();
  const site = registry.sites.find((s) => s.id === siteId);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <SidebarWrapper toc={toc} siteId={siteId} siteName={site?.name ?? siteId} siteUrl={site?.url} />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
