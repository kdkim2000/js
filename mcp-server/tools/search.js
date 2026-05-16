'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const { getSiteDataDir } = require('./registry');

const _dbs = new Map();

function getDb(siteId) {
  if (!_dbs.has(siteId)) {
    const dbPath = path.join(getSiteDataDir(siteId), 'db.sqlite');
    _dbs.set(siteId, new Database(dbPath, { readonly: true }));
  }
  return _dbs.get(siteId);
}

function searchArticles(query, limit = 5, siteId) {
  if (!siteId) return [];
  const roDb = getDb(siteId);

  const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 50));

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
