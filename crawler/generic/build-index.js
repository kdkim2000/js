'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { getSiteDataDir } = require('./utils/registry');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    if (col === -1) return;
    const key = line.slice(0, col).trim();
    let val = line.slice(col + 1).trim();
    try { val = JSON.parse(val); } catch { /* keep as string */ }
    meta[key] = val;
  });
  return { meta, body: content.slice(match[0].length).trim() };
}

function buildIndex(siteId) {
  const dataDir = getSiteDataDir(siteId);
  const articlesDir = path.join(dataDir, 'articles');
  const dbPath = path.join(dataDir, 'db.sqlite');
  const metaPath = path.join(dataDir, 'metadata.json');

  if (!fs.existsSync(articlesDir)) {
    throw new Error(`articles 디렉토리 없음: ${articlesDir}`);
  }

  const db = new Database(dbPath);

  db.exec(`
    DROP TABLE IF EXISTS search;
    DROP TABLE IF EXISTS articles;
    CREATE TABLE articles (
      slug TEXT PRIMARY KEY,
      title TEXT,
      url TEXT,
      part INTEGER,
      part_title TEXT,
      chapter TEXT,
      global_order INTEGER,
      prev TEXT,
      next TEXT,
      word_count INTEGER,
      body TEXT DEFAULT ""
    );
    CREATE VIRTUAL TABLE search USING fts5(
      slug UNINDEXED,
      title,
      chapter,
      body,
      content=articles,
      tokenize='unicode61'
    );
  `);

  const insert = db.prepare(`
    INSERT INTO articles (slug, title, url, part, part_title, chapter, global_order, prev, next, word_count, body)
    VALUES (@slug, @title, @url, @part, @partTitle, @chapter, @globalOrder, @prev, @next, @wordCount, @body)
  `);

  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
  const metadata = [];

  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });

  const rows = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(articlesDir, file), 'utf8');
    const { meta, body } = parseFrontmatter(content);
    const slug = file.replace(/\.md$/, '');
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    rows.push({
      slug: meta.slug || slug,
      title: meta.title || slug,
      url: meta.url || '',
      part: meta.part ?? 1,
      partTitle: meta.partTitle || '',
      chapter: meta.chapter || '',
      globalOrder: meta.globalOrder ?? 0,
      prev: meta.prev || null,
      next: meta.next || null,
      wordCount,
      body: body.slice(0, 50000),
    });
    metadata.push({
      slug: meta.slug || slug,
      title: meta.title || slug,
      url: meta.url || '',
      part: meta.part ?? 1,
      partTitle: meta.partTitle || '',
      chapter: meta.chapter || '',
      globalOrder: meta.globalOrder ?? 0,
      prev: meta.prev || null,
      next: meta.next || null,
      wordCount,
    });
  }

  insertMany(rows);

  // FTS5 rebuild
  db.exec(`INSERT INTO search(search) VALUES('rebuild')`);
  db.close();

  // metadata.json
  metadata.sort((a, b) => a.globalOrder - b.globalOrder);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`[${siteId}] 인덱스 빌드 완료: ${rows.length}개 아티클`);
  return rows.length;
}

module.exports = { buildIndex };
