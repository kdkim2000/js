export const dynamic = "force-static";

import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/db";
import { DEFAULT_SITE_ID } from "@/lib/registry";

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q") ?? "";
  const siteId = sp.get("siteId") ?? DEFAULT_SITE_ID;
  const results = searchArticles(q, siteId);
  return NextResponse.json(results);
}
