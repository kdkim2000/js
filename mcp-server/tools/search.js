'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const { DEFAULT_SITE_ID, getSiteDataDir } = require('./registry');

const _dbs = new Map();

function getDb(siteId) {
  if (!_dbs.has(siteId)) {
    const dbPath = path.join(getSiteDataDir(siteId), 'db.sqlite');
    _dbs.set(siteId, new Database(dbPath, { readonly: true }));
  }
  return _dbs.get(siteId);
}

// Run once at module load for the default site: ensure the articles table has
// a body column so FTS5 snippet() works. The articles table was created without
// a body column but the FTS5 virtual table references it via content=articles.
// Adding a blank body column allows FTS5 snippet() to function (body snippets
// will be empty, title snippets will work correctly).
(function initDb() {
  const dbPath = path.join(getSiteDataDir(DEFAULT_SITE_ID), 'db.sqlite');
  if (!require('fs').existsSync(dbPath)) return;
  const db = new Database(dbPath);
  try {
    db.exec('ALTER TABLE articles ADD COLUMN body TEXT DEFAULT ""');
  } catch (_e) { /* 이미 존재 */ }
  db.close();
})();

/**
 * search_articles: Full-text search using FTS5.
 * @param {string} query
 * @param {number} limit
 * @param {string} siteId
 * @returns {{ slug: string, title: string, chapter: string, snippet: string }[]}
 */
function searchArticles(query, limit = 5, siteId = DEFAULT_SITE_ID) {
  const roDb = getDb(siteId);

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
