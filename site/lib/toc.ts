import fs from "fs";
import path from "path";

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

let _toc: TOC | null = null;

export function getTOC(): TOC {
  if (_toc) return _toc;
  const tocPath = path.join(process.cwd(), "../data/toc.json");
  _toc = JSON.parse(fs.readFileSync(tocPath, "utf8")) as TOC;
  return _toc;
}

export function getAllArticles(): Article[] {
  const toc = getTOC();
  return toc.parts.flatMap((p) => p.chapters.flatMap((c) => c.articles));
}

export function getArticleMeta(slug: string): Article | null {
  return getAllArticles().find((a) => a.slug === slug) ?? null;
}
