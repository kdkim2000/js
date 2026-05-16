'use strict';

const fs = require('fs');
const path = require('path');

const { getSiteDataDir } = require('./registry');

const _tocs = new Map();

function getTocData(siteId) {
  if (!_tocs.has(siteId)) {
    const tocPath = path.join(getSiteDataDir(siteId), 'toc.json');
    _tocs.set(siteId, JSON.parse(fs.readFileSync(tocPath, 'utf8')));
  }
  return _tocs.get(siteId);
}

function getToc(siteId) {
  const toc = getTocData(siteId);
  let totalArticles = 0;
  for (const part of toc.parts || []) {
    for (const chapter of part.chapters || []) {
      totalArticles += (chapter.articles || []).length;
    }
  }
  return { parts: toc.parts, totalArticles };
}

function listArticles(part, chapter, siteId) {
  const toc = getTocData(siteId);
  const results = [];

  for (const p of toc.parts || []) {
    if (part !== undefined && part !== null && p.partIndex !== Number(part)) {
      continue;
    }

    for (const ch of p.chapters || []) {
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
