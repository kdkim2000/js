export const dynamic = 'force-static';

import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/db";

// GET is force-static (build-time static export) — returns empty results
export async function GET() {
  return NextResponse.json([]);
}

// POST is dynamic (ƒ) — used by dev server for actual SQLite search
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const q: string = body.q ?? "";
    const siteId: string = body.siteId ?? "";
    if (!q.trim() || !siteId) return NextResponse.json([]);
    const results = searchArticles(q, siteId);
    return NextResponse.json(results);
  } catch {
    return NextResponse.json([]);
  }
}
