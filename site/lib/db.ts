import path from "path";
import Database from "better-sqlite3";
import { getSiteDataDir } from "./registry";

const _dbs = new Map<string, ReturnType<typeof Database>>();

function getDb(siteId: string): Database.Database {
  if (!_dbs.has(siteId)) {
    const dbPath = path.join(getSiteDataDir(siteId), "db.sqlite");
    _dbs.set(siteId, new Database(dbPath, { readonly: true }));
  }
  return _dbs.get(siteId)!;
}

export interface SearchResult {
  slug: string;
  title: string;
  chapter: string;
  snippet: string;
}

export function searchArticles(query: string, siteId: string): SearchResult[] {
  if (!query.trim()) return [];
  const db = getDb(siteId);
  try {
    const rows = db
      .prepare(
        `SELECT slug, title, chapter,
          snippet(search, 3, '<mark>', '</mark>', '...', 32) AS snippet
         FROM search
         WHERE search MATCH ?
         ORDER BY rank
         LIMIT 20`
      )
      .all(query.trim() + "*") as SearchResult[];
    return rows;
  } catch {
    return [];
  }
}
