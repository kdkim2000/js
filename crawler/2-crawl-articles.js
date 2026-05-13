const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { htmlToMarkdown } = require('./utils/html-to-md');
const { delay, withRetry } = require('./utils/rate-limiter');

const BASE_URL = 'https://ko.javascript.info';
const DATA_DIR = path.join(__dirname, '../data');
const ARTICLES_DIR = path.join(DATA_DIR, 'articles');
const IMAGES_DIR = path.join(DATA_DIR, 'images');
const ERRORS_FILE = path.join(DATA_DIR, 'errors.json');

// Parse --batch=N from args
const batchArg = process.argv.find(a => a.startsWith('--batch='));
const BATCH = batchArg ? parseInt(batchArg.split('=')[1]) : 0;
const BATCH_SIZE = 58; // ~173/3

const DELAY_MS = 1200; // ~1 req/sec per agent

async function downloadImage(url, slug) {
  try {
    const filename = path.basename(url.split('?')[0]);
    const dest = path.join(IMAGES_DIR, slug, filename);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) return `/images/${slug}/${filename}`;

    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
    fs.writeFileSync(dest, res.data);
    return `/images/${slug}/${filename}`;
  } catch {
    return url; // keep original URL on failure
  }
}

async function crawlArticle(article) {
  const { slug, title, url, part, partTitle, chapter, globalOrder, prev, next } = article;
  const outFile = path.join(ARTICLES_DIR, `${slug}.md`);

  // Skip already-crawled
  if (fs.existsSync(outFile)) {
    console.log(`  [스킵] ${slug}`);
    return true;
  }

  const html = await withRetry(async () => {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'JS-Learning-Bot/1.0' },
      timeout: 15000,
    });
    return res.data;
  });

  const $ = cheerio.load(html);

  // Extract main article body
  // Selector updated: site changed from .article__body to article.formatted
  const bodyEl = $('article.formatted').first();
  if (!bodyEl.length) {
    console.warn(`  [경고] 본문 없음: ${slug}`);
    return false;
  }

  // Download images and rewrite src paths
  const imgPromises = [];
  bodyEl.find('img[src]').each((_, imgEl) => {
    const src = $(imgEl).attr('src') || '';
    const fullSrc = src.startsWith('http') ? src : `${BASE_URL}${src}`;
    imgPromises.push(
      downloadImage(fullSrc, slug).then(newSrc => {
        $(imgEl).attr('src', newSrc);
      })
    );
  });
  await Promise.all(imgPromises);

  // Convert to Markdown
  const bodyHtml = bodyEl.html() || '';
  const markdown = htmlToMarkdown(bodyHtml);

  // Build frontmatter
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `slug: ${JSON.stringify(slug)}`,
    `url: ${JSON.stringify(url)}`,
    `part: ${part}`,
    `partTitle: ${JSON.stringify(partTitle)}`,
    `chapter: ${JSON.stringify(chapter)}`,
    `globalOrder: ${globalOrder}`,
    `prev: ${prev ? JSON.stringify(prev) : 'null'}`,
    `next: ${next ? JSON.stringify(next) : 'null'}`,
    '---',
    '',
    `# ${title}`,
    '',
  ].join('\n');

  fs.writeFileSync(outFile, frontmatter + markdown, 'utf8');
  return true;
}

async function main() {
  const tocFile = path.join(DATA_DIR, 'toc.json');
  if (!fs.existsSync(tocFile)) {
    console.error('data/toc.json 없음. 먼저 1-crawl-toc.js를 실행하세요.');
    process.exit(1);
  }

  const toc = JSON.parse(fs.readFileSync(tocFile, 'utf8'));
  const allArticles = toc.parts.flatMap(p => p.chapters.flatMap(c => c.articles));

  const start = BATCH * BATCH_SIZE;
  const end = Math.min(start + BATCH_SIZE, allArticles.length);
  const batch = allArticles.slice(start, end);

  fs.mkdirSync(ARTICLES_DIR, { recursive: true });
  fs.mkdirSync(IMAGES_DIR, { recursive: true });

  console.log(`배치 ${BATCH}: ${start+1}~${end}번 아티클 (${batch.length}개) 크롤링 시작`);

  const errors = [];
  for (let i = 0; i < batch.length; i++) {
    const article = batch[i];
    process.stdout.write(`  [${i+1}/${batch.length}] ${article.slug}... `);
    try {
      await crawlArticle(article);
      console.log('완료');
    } catch (err) {
      console.log(`실패: ${err.message}`);
      errors.push({ slug: article.slug, error: err.message });
    }
    if (i < batch.length - 1) await delay(DELAY_MS);
  }

  // Append errors
  if (errors.length > 0) {
    let existing = [];
    if (fs.existsSync(ERRORS_FILE)) {
      existing = JSON.parse(fs.readFileSync(ERRORS_FILE, 'utf8'));
    }
    fs.writeFileSync(ERRORS_FILE, JSON.stringify([...existing, ...errors], null, 2), 'utf8');
    console.log(`\n실패: ${errors.length}개 → ${ERRORS_FILE}`);
  }

  console.log(`\n배치 ${BATCH} 완료: 성공 ${batch.length - errors.length}개, 실패 ${errors.length}개`);
}

main().catch(err => {
  console.error('크롤링 오류:', err);
  process.exit(1);
});
