import fs from "fs";
import path from "path";
import { getSiteDataDir } from "./registry";

interface Frontmatter {
  title: string;
  slug: string;
  url: string;
  part: number;
  partTitle: string;
  chapter: string;
  globalOrder: number;
  prev: string | null;
  next: string | null;
}

function parseFrontmatter(content: string): { meta: Frontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { meta: {} as Frontmatter, body: content };

  const meta: Record<string, unknown> = {};
  match[1].split("\n").forEach((line) => {
    const col = line.indexOf(":");
    if (col === -1) return;
    const key = line.slice(0, col).trim();
    let val: unknown = line.slice(col + 1).trim();
    try {
      val = JSON.parse(val as string);
    } catch {
      /* keep as string */
    }
    meta[key] = val;
  });

  const body = content.slice(match[0].length).trim();
  return { meta: meta as unknown as Frontmatter, body };
}

export function getArticle(slug: string, siteId: string): { meta: Frontmatter; body: string } | null {
  const articlesDir = path.join(getSiteDataDir(siteId), "articles");
  const filePath = path.join(articlesDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf8");
  return parseFrontmatter(content);
}

export function getAllSlugs(siteId: string): string[] {
  const articlesDir = path.join(getSiteDataDir(siteId), "articles");
  if (!fs.existsSync(articlesDir)) return [];
  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(".md", ""));
}
