const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '../data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');
const DB_FILE = path.join(DATA_DIR, 'db.sqlite');
const META_FILE = path.join(DATA_DIR, 'metadata.json');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    if (col === -1) return;
    const key = line.slice(0, col).trim();
    let val = line.slice(col + 1).trim();
    // Parse JSON strings/numbers/null
    try { val = JSON.parse(val); } catch { /* keep as string */ }
    meta[key] = val;
  });

  const body = content.slice(match[0].length).trim();
  return { meta, body };
}

function buildIndex() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error('data/articles/ 없음. 먼저 2-crawl-articles.js를 실행하세요.');
    process.exit(1);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.md'));
  console.log(`${files.length}개 아티클 인덱싱 중...`);

  // Setup SQLite
  if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
  const db = new Database(DB_FILE);

  db.exec(`
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
      word_count INTEGER
    );
    CREATE VIRTUAL TABLE search USING fts5(
      slug UNINDEXED,
      title,
      chapter,
      body,
      content=articles,
      content_rowid=rowid,
      tokenize="unicode61"
    );
  `);

  const insertArticle = db.prepare(`
    INSERT OR REPLACE INTO articles
    (slug, title, url, part, part_title, chapter, global_order, prev, next, word_count)
    VALUES (@slug, @title, @url, @part, @partTitle, @chapter, @globalOrder, @prev, @next, @wordCount)
  `);

  const insertSearch = db.prepare(`
    INSERT INTO search(rowid, slug, title, chapter, body)
    SELECT rowid, slug, title, chapter, @body FROM articles WHERE slug = @slug
  `);

  const metadata = [];

  const insertAll = db.transaction(() => {
    for (const file of files) {
      const content = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8');
      const { meta, body } = parseFrontmatter(content);
      if (!meta.slug) continue;

      const wordCount = body.split(/\s+/).filter(Boolean).length;
      const row = {
        slug: meta.slug,
        title: meta.title || '',
        url: meta.url || '',
        part: meta.part || 0,
        partTitle: meta.partTitle || '',
        chapter: meta.chapter || '',
        globalOrder: meta.globalOrder ?? 0,
        prev: meta.prev || null,
        next: meta.next || null,
        wordCount,
      };

      insertArticle.run(row);
      insertSearch.run({ slug: meta.slug, body: body.slice(0, 50000) }); // FTS5 body limit

      metadata.push({ ...row });
    }
  });

  insertAll();
  db.close();

  // Sort metadata by globalOrder
  metadata.sort((a, b) => a.globalOrder - b.globalOrder);
  fs.writeFileSync(META_FILE, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`완료:`);
  console.log(`  SQLite: ${DB_FILE}`);
  console.log(`  메타데이터: ${META_FILE} (${metadata.length}개)`);
}

buildIndex();
