import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = searchArticles(q);
  return NextResponse.json(results);
}
