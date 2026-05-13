'use strict';

const fs = require('fs');
const path = require('path');

const ARTICLES_DIR = path.join(__dirname, '../../data/articles');

/**
 * Parse YAML-like frontmatter from markdown content.
 * @param {string} content
 * @returns {{ meta: Object, body: string }}
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    if (col === -1) return;
    const key = line.slice(0, col).trim();
    let val = line.slice(col + 1).trim();
    try { val = JSON.parse(val); } catch (_e) { /* keep as string */ }
    meta[key] = val;
  });

  const body = content.slice(match[0].length).trim();
  return { meta, body };
}

/**
 * get_article: Read and parse a markdown article by slug.
 * @param {string} slug
 * @returns {{ title, chapter, part, partTitle, globalOrder, prev, next, body } | null}
 */
function getArticle(slug) {
  // Sanitize slug: no path traversal
  const sanitized = slug.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!sanitized) return null;

  const filePath = path.join(ARTICLES_DIR, `${sanitized}.md`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf8');
  const { meta, body } = parseFrontmatter(content);

  return {
    title: meta.title || '',
    chapter: meta.chapter || '',
    part: meta.part ?? null,
    partTitle: meta.partTitle || '',
    globalOrder: meta.globalOrder ?? null,
    prev: meta.prev || null,
    next: meta.next || null,
    body,
  };
}

module.exports = { getArticle };
