'use strict';

const fs = require('fs');
const path = require('path');

const TOC_PATH = path.join(__dirname, '../../data/toc.json');

let _toc = null;

function getTocData() {
  if (!_toc) {
    _toc = JSON.parse(fs.readFileSync(TOC_PATH, 'utf8'));
  }
  return _toc;
}

/**
 * get_toc: Return the full table of contents structure.
 * @returns {{ parts: Array, totalArticles: number }}
 */
function getToc() {
  const toc = getTocData();
  let totalArticles = 0;
  for (const part of toc.parts || []) {
    for (const chapter of part.chapters || []) {
      totalArticles += (chapter.articles || []).length;
    }
  }
  return { parts: toc.parts, totalArticles };
}

/**
 * list_articles: Filter articles from toc.json by part number and/or chapter string (partial match).
 * @param {number|undefined} part  - Part number (1-3, optional)
 * @param {string|undefined} chapter - Chapter title partial match (optional)
 * @returns {Array<{ slug, title, chapter, part, partTitle, globalOrder, prev, next }>}
 */
function listArticles(part, chapter) {
  const toc = getTocData();
  const results = [];

  for (const p of toc.parts || []) {
    // Filter by part number if specified
    if (part !== undefined && part !== null && p.partIndex !== Number(part)) {
      continue;
    }

    for (const ch of p.chapters || []) {
      // Filter by chapter string (partial, case-insensitive) if specified
      if (chapter !== undefined && chapter !== null && chapter !== '') {
        const chapterLower = String(chapter).toLowerCase();
        if (!ch.title.toLowerCase().includes(chapterLower)) {
          continue;
        }
      }

      for (const article of ch.articles || []) {
        results.push({
          slug: article.slug,
          title: article.title,
          chapter: article.chapter,
          part: article.part,
          partTitle: article.partTitle,
          globalOrder: article.globalOrder,
          prev: article.prev,
          next: article.next,
        });
      }
    }
  }

  return results;
}

module.exports = { getToc, listArticles };
