"use client";

import { useProgress } from "@/components/ProgressTracker";
import Sidebar from "@/components/Sidebar";
import type { TOC } from "@/lib/toc";

interface Props {
  toc: TOC;
}

export default function SidebarWrapper({ toc }: Props) {
  const [progress] = useProgress();
  return <Sidebar toc={toc} progress={progress} />;
}
