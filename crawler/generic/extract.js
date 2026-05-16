'use strict';

const cheerio = require('cheerio');
const { htmlToMarkdown } = require('../utils/html-to-md');
const { urlToSlug } = require('./utils/slugify');

const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.content',
  '.post-content',
  '.article-body',
  '.markdown-body',
  '#content',
  '.documentation',
  '.doc-content',
];

/**
 * HTML에서 타이틀과 본문 Markdown을 추출한다.
 */
function extractContent(html, url, baseUrl, config = {}) {
  const $ = cheerio.load(html);

  // 불필요한 요소 제거
  $('script, style, nav, header, footer, .sidebar, .toc, .navigation, .breadcrumb, .ads, [role="navigation"]').remove();

  // 타이틀 추출
  let title = $('h1').first().text().trim() || $('title').text().trim() || url;
  title = title.replace(/\s+/g, ' ').trim();

  // 본문 추출
  let $body = null;
  if (config.contentSelector) {
    $body = $(config.contentSelector).first();
  }
  if (!$body || $body.length === 0) {
    for (const sel of CONTENT_SELECTORS) {
      $body = $(sel).first();
      if ($body.length > 0) break;
    }
  }
  if (!$body || $body.length === 0) {
    $body = $('body');
  }

  // 이미지 src를 절대 URL로 변환
  $body.find('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      try {
        $(el).attr('src', new URL(src, url).href);
      } catch { /* skip */ }
    }
  });

  const bodyHtml = $body.html() || '';
  const bodyMd = htmlToMarkdown(bodyHtml);
  const slug = urlToSlug(url, baseUrl);

  return { title, bodyMd, slug };
}

module.exports = { extractContent };
