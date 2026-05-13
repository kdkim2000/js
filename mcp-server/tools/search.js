'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../../data/db.sqlite');

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
  }
  return _db;
}

/**
 * Ensure the articles table has a body column so FTS5 snippet() works.
 * The articles table was created without a body column but the FTS5 virtual
 * table references it via content=articles. Adding a blank body column
 * allows FTS5 snippet() to function (body snippets will be empty, title
 * snippets will work correctly).
 */
function ensureBodyColumn(db) {
  try {
    db.exec('ALTER TABLE articles ADD COLUMN body TEXT DEFAULT ""');
  } catch (_e) {
    // Column already exists — ignore
  }
}

/**
 * search_articles: Full-text search using FTS5.
 * @param {string} query
 * @param {number} limit
 * @returns {{ slug: string, title: string, chapter: string, snippet: string }[]}
 */
function searchArticles(query, limit = 5) {
  const db = new Database(DB_PATH);
  ensureBodyColumn(db);
  db.close();

  const roDb = getDb();

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));

  // Escape FTS5 special characters to avoid query syntax errors
  const escapedQuery = query.replace(/['"*^]/g, ' ').trim();
  if (!escapedQuery) return [];

  try {
    const rows = roDb.prepare(`
      SELECT slug, title, chapter,
             snippet(search, 1, '**', '**', '...', 32) AS snippet
      FROM search
      WHERE search MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(escapedQuery, safeLimit);
    return rows;
  } catch (err) {
    // If FTS5 query syntax error, fall back to LIKE search on articles table
    const likePattern = `%${escapedQuery}%`;
    return roDb.prepare(`
      SELECT slug, title, chapter,
             title AS snippet
      FROM articles
      WHERE title LIKE ? OR chapter LIKE ?
      ORDER BY global_order
      LIMIT ?
    `).all(likePattern, likePattern, safeLimit);
  }
}

module.exports = { searchArticles };
