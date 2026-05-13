import path from "path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "../data/db.sqlite");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
  }
  return _db;
}

export interface SearchResult {
  slug: string;
  title: string;
  chapter: string;
  snippet: string;
}

export function searchArticles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const db = getDb();
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
