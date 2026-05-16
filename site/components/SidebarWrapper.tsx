"use client";

import { useProgress } from "@/components/ProgressTracker";
import Sidebar from "@/components/Sidebar";
import type { TOC } from "@/lib/toc";

interface Props {
  toc: TOC;
  siteId: string;
  siteName: string;
  siteUrl?: string;
}

export default function SidebarWrapper({ toc, siteId, siteName, siteUrl }: Props) {
  const [progress] = useProgress();
  return <Sidebar toc={toc} progress={progress} siteId={siteId} siteName={siteName} siteUrl={siteUrl} />;
}
