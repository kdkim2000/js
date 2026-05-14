'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SITES_DIR = path.join(DATA_DIR, 'sites');
const TARGET_DIR = path.join(SITES_DIR, 'ko-javascript-info');
const REGISTRY_PATH = path.join(DATA_DIR, 'registry.json');

const FILES_TO_MOVE = ['toc.json', 'metadata.json', 'db.sqlite', 'errors.json'];
const DIRS_TO_MOVE = ['articles', 'images'];

async function migrate() {
  // 이미 마이그레이션된 경우 스킵
  if (fs.existsSync(TARGET_DIR) && fs.existsSync(REGISTRY_PATH)) {
    console.log('이미 마이그레이션 완료. 스킵.');
    return;
  }

  // data/sites/ko-javascript-info/ 디렉토리 생성
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  console.log('data/sites/ko-javascript-info/ 생성');

  // 파일 이동
  for (const file of FILES_TO_MOVE) {
    const src = path.join(DATA_DIR, file);
    const dst = path.join(TARGET_DIR, file);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst);
      console.log(`이동: ${file} → sites/ko-javascript-info/${file}`);
    }
  }

  // 디렉토리 이동
  for (const dir of DIRS_TO_MOVE) {
    const src = path.join(DATA_DIR, dir);
    const dst = path.join(TARGET_DIR, dir);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dst);
      console.log(`이동: ${dir}/ → sites/ko-javascript-info/${dir}/`);
    }
  }

  // registry.json 생성
  const now = new Date().toISOString();
  const registry = {
    sites: [
      {
        id: 'ko-javascript-info',
        name: '모던 자바스크립트 튜토리얼',
        url: 'https://ko.javascript.info',
        description: '한국어 JS 튜토리얼',
        addedAt: now,
        lastCrawledAt: now,
        crawlStatus: 'done',
        totalArticles: 173,
        crawlConfig: {
          contentSelector: 'article.formatted',
          strategy: 'sitemap',
          maxDepth: 3,
          delayMs: 1200,
          userAgent: 'MultiSite-Crawler/1.0',
        },
      },
    ],
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
  console.log('data/registry.json 생성 완료');
  console.log('마이그레이션 완료!');
}

migrate().catch(err => {
  console.error('마이그레이션 실패:', err.message);
  process.exit(1);
});
