export const dynamic = 'force-static';

import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/db";
import { DEFAULT_SITE_ID } from "@/lib/registry";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams?.get("q") ?? "";
  const siteId = req.nextUrl.searchParams?.get("siteId") ?? DEFAULT_SITE_ID;
  if (!q) return NextResponse.json([]);
  const results = searchArticles(q, siteId);
  return NextResponse.json(results);
}
