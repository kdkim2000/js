import fs from "fs";
import path from "path";
import { getSiteDataDir, DEFAULT_SITE_ID } from "./registry";

export interface Article {
  slug: string;
  title: string;
  url: string;
  part: number;
  partTitle: string;
  chapter: string;
  chapterIndex: number;
  order: number;
  globalOrder: number;
  prev: string | null;
  next: string | null;
}

export interface Chapter {
  title: string;
  articles: Article[];
}

export interface Part {
  title: string;
  partIndex: number;
  chapters: Chapter[];
}

export interface TOC {
  parts: Part[];
  totalArticles: number;
}

const _tocs = new Map<string, TOC>();

export function getTOC(siteId: string = DEFAULT_SITE_ID): TOC {
  if (_tocs.has(siteId)) return _tocs.get(siteId)!;
  const tocPath = path.join(getSiteDataDir(siteId), "toc.json");
  const toc = JSON.parse(fs.readFileSync(tocPath, "utf8")) as TOC;
  _tocs.set(siteId, toc);
  return toc;
}

export function getAllArticles(siteId: string = DEFAULT_SITE_ID): Article[] {
  const toc = getTOC(siteId);
  return toc.parts.flatMap((p) => p.chapters.flatMap((c) => c.articles));
}

export function getArticleMeta(slug: string, siteId: string = DEFAULT_SITE_ID): Article | null {
  return getAllArticles(siteId).find((a) => a.slug === slug) ?? null;
}
