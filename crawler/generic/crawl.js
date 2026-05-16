'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { discoverUrls } = require('./discover');
const { extractContent } = require('./extract');
const { buildIndex } = require('./build-index');
const { upsertSite, updateCrawlStatus, getSiteDataDir } = require('./utils/registry');
const { urlToSiteId } = require('./utils/slugify');
const { delay, withRetry } = require('../utils/rate-limiter');

// CLI 인수 파싱
const args = {};
process.argv.slice(2).forEach(arg => {
  const m = arg.match(/^--([^=]+)=(.*)$/);
  if (m) args[m[1]] = m[2];
  else if (arg === '--help') args.help = true;
});

if (args.help || !args.url) {
  console.log(`
Usage: node crawler/generic/crawl.js --url=<URL> [options]

Options:
  --url=<URL>         크롤할 사이트 루트 URL (필수)
  --id=<id>           사이트 ID (기본값: URL hostname 기반 자동 생성)
  --name=<name>       사이트 이름 (기본값: ID와 동일)
  --selector=<css>    콘텐츠 CSS 셀렉터 (기본값: 자동 탐지)
  --strategy=<s>      탐색 전략: sitemap (기본) 또는 bfs
  --maxDepth=<n>      BFS 최대 깊이 (기본값: 3)
  --delay=<ms>        요청 딜레이 ms (기본값: 1200)
  `);
  process.exit(0);
}

function progress(data) {
  process.stdout.write(JSON.stringify(data) + '\n');
}

async function run() {
  const baseUrl = args.url;
  const siteId = args.id || urlToSiteId(baseUrl);
  const name = args.name || siteId;
  const delayMs = parseInt(args.delay || '1200', 10);
  const maxDepth = parseInt(args.maxDepth || '3', 10);
  const strategy = args.strategy || 'sitemap';
  const contentSelector = args.selector || null;
  const userAgent = 'MultiSite-Crawler/1.0';

  const config = { contentSelector, strategy, maxDepth, delayMs, userAgent };

  const dataDir = getSiteDataDir(siteId);
  const articlesDir = path.join(dataDir, 'articles');
  const statusDir = path.join(path.dirname(dataDir), '.crawl-status');
  const statusPath = path.join(statusDir, `${siteId}.json`);

  fs.mkdirSync(articlesDir, { recursive: true });
  fs.mkdirSync(statusDir, { recursive: true });

  function writeStatus(status, extra = {}) {
    fs.writeFileSync(statusPath, JSON.stringify({
      siteId, status, updatedAt: new Date().toISOString(), ...extra,
    }, null, 2));
  }

  // registry에 사이트 등록
  upsertSite({
    id: siteId, name, url: baseUrl,
    addedAt: new Date().toISOString(),
    crawlStatus: 'running',
    crawlConfig: config,
  });
  writeStatus('running', { phase: 'discover', progress: { done: 0, total: 0, errors: 0 } });
  progress({ type: 'status', phase: 'discover' });

  // URL 수집
  console.log(`[${siteId}] URL 수집 시작 (strategy: ${strategy})`);
  let urls;
  try {
    urls = await discoverUrls(baseUrl, config);
  } catch (err) {
    updateCrawlStatus(siteId, 'error');
    writeStatus('error', { errorMessage: err.message });
    progress({ type: 'error', message: err.message });
    process.exit(1);
  }

  // 루트 URL 포함 보장
  if (!urls.includes(baseUrl)) urls.unshift(baseUrl);
  console.log(`[${siteId}] 수집된 URL: ${urls.length}개`);
  progress({ type: 'progress', phase: 'articles', done: 0, total: urls.length, errors: 0 });
  writeStatus('running', { phase: 'articles', progress: { done: 0, total: urls.length, errors: 0 } });

  // 각 URL 크롤
  let done = 0;
  let errors = 0;
  const slugSet = new Set();

  // toc.json 기본 구조 (flat)
  const tocArticles = [];

  for (const url of urls) {
    try {
      const { data: html } = await withRetry(() => axios.get(url, {
        headers: { 'User-Agent': userAgent },
        timeout: 15000,
      }));
      const { title, bodyMd, slug } = extractContent(html, url, baseUrl, config);

      // 중복 slug 방지
      let finalSlug = slug;
      let i = 2;
      while (slugSet.has(finalSlug)) finalSlug = `${slug}-${i++}`;
      slugSet.add(finalSlug);

      const frontmatter = [
        '---',
        `title: ${JSON.stringify(title)}`,
        `slug: ${JSON.stringify(finalSlug)}`,
        `url: ${JSON.stringify(url)}`,
        `part: 1`,
        `partTitle: ${JSON.stringify(name)}`,
        `chapter: ${JSON.stringify(name)}`,
        `globalOrder: ${done}`,
        `prev: null`,
        `next: null`,
        '---',
      ].join('\n');

      fs.writeFileSync(path.join(articlesDir, `${finalSlug}.md`), `${frontmatter}\n\n${bodyMd}`, 'utf8');

      tocArticles.push({
        slug: finalSlug, title, url,
        part: 1, partTitle: name, chapter: name,
        chapterIndex: 0, order: done, globalOrder: done,
        prev: null, next: null,
      });

      done++;
    } catch (err) {
      console.error(`[${siteId}] 크롤 실패: ${url} — ${err.message}`);
      errors++;
    }

    progress({ type: 'progress', phase: 'articles', done, total: urls.length, errors });
    writeStatus('running', { phase: 'articles', progress: { done, total: urls.length, errors } });

    if (done < urls.length) await delay(delayMs);
  }

  // prev/next 링크 설정
  for (let i = 0; i < tocArticles.length; i++) {
    tocArticles[i].prev = i > 0 ? tocArticles[i - 1].slug : null;
    tocArticles[i].next = i < tocArticles.length - 1 ? tocArticles[i + 1].slug : null;
  }

  // toc.json 저장
  const toc = {
    parts: [{
      title: name, partIndex: 1,
      chapters: [{ title: name, articles: tocArticles }],
    }],
    totalArticles: tocArticles.length,
  };
  fs.writeFileSync(path.join(dataDir, 'toc.json'), JSON.stringify(toc, null, 2), 'utf8');

  // 인덱스 빌드
  progress({ type: 'status', phase: 'index' });
  writeStatus('running', { phase: 'index', progress: { done, total: urls.length, errors } });
  let totalArticles = 0;
  try {
    totalArticles = buildIndex(siteId);
  } catch (err) {
    console.error(`[${siteId}] 인덱스 빌드 실패: ${err.message}`);
  }

  // 완료
  updateCrawlStatus(siteId, 'done', { totalArticles });
  writeStatus('done', { progress: { done, total: urls.length, errors } });
  progress({ type: 'done', totalArticles, errors });
  console.log(`[${siteId}] 크롤 완료: ${totalArticles}개 아티클, ${errors}개 오류`);
}

run().catch(err => {
  console.error('치명적 오류:', err.message);
  process.exit(1);
});
