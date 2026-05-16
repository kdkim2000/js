'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * sitemap.xml에서 URL 목록을 가져온다.
 */
async function sitemapDiscover(baseUrl, userAgent) {
  const candidates = ['/sitemap.xml', '/sitemap_index.xml', '/sitemap/'];
  for (const p of candidates) {
    try {
      const url = new URL(p, baseUrl).href;
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': userAgent },
        timeout: 10000,
      });
      const $ = cheerio.load(data, { xmlMode: true });
      // sitemap_index → <sitemap><loc>
      // sitemap → <url><loc>
      const locs = [];
      $('loc').each((_, el) => locs.push($(el).text().trim()));
      if (locs.length > 0) {
        console.log(`sitemap 발견: ${url} (${locs.length}개 URL)`);
        // sitemap_index인 경우 각 sitemap을 재귀 탐색
        const sitemapLocs = locs.filter(u => u.endsWith('.xml'));
        if (sitemapLocs.length > 0) {
          const allUrls = [];
          for (const sitemapUrl of sitemapLocs) {
            try {
              const { data: subData } = await axios.get(sitemapUrl, { headers: { 'User-Agent': userAgent }, timeout: 10000 });
              const $sub = cheerio.load(subData, { xmlMode: true });
              $sub('loc').each((_, el) => allUrls.push($sub(el).text().trim()));
            } catch { /* skip */ }
          }
          return allUrls.filter(u => !u.endsWith('.xml'));
        }
        return locs;
      }
    } catch { /* next candidate */ }
  }
  return null;
}

/**
 * BFS로 내부 링크를 수집한다.
 */
async function bfsDiscover(baseUrl, maxDepth, delayMs, userAgent) {
  const base = new URL(baseUrl);
  const visited = new Set();
  const queue = [{ url: baseUrl, depth: 0 }];
  const results = [];
  const { delay } = require('../utils/rate-limiter');

  while (queue.length > 0) {
    const { url, depth } = queue.shift();
    const normalized = url.split('#')[0].split('?')[0];
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    try {
      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': userAgent },
        timeout: 15000,
      });
      results.push(url);
      if (depth < maxDepth) {
        const $ = cheerio.load(html);
        $('a[href]').each((_, el) => {
          try {
            const href = $(el).attr('href');
            if (!href) return;
            const resolved = new URL(href, url);
            // 동일 origin + 동일 path prefix만 수집
            if (resolved.origin !== base.origin) return;
            if (!resolved.pathname.startsWith(base.pathname)) return;
            // 이미지/CSS/JS 파일 제외
            if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|pdf|zip|woff2?)$/i.test(resolved.pathname)) return;
            const norm = resolved.href.split('#')[0].split('?')[0];
            if (!visited.has(norm)) {
              queue.push({ url: norm, depth: depth + 1 });
            }
          } catch { /* skip */ }
        });
      }
      await delay(delayMs);
    } catch (err) {
      console.error(`BFS 실패: ${url} — ${err.message}`);
    }
  }
  return results;
}

/**
 * 사이트 URL 목록을 수집한다. sitemap 우선, 실패 시 BFS.
 */
async function discoverUrls(baseUrl, config = {}) {
  const {
    strategy = 'sitemap',
    maxDepth = 3,
    delayMs = 1200,
    userAgent = 'MultiSite-Crawler/1.0',
  } = config;

  const base = new URL(baseUrl);

  if (strategy === 'sitemap' || strategy === undefined) {
    const urls = await sitemapDiscover(baseUrl, userAgent);
    if (urls && urls.length > 0) {
      // baseUrl과 동일 origin만 필터
      return urls.filter(u => {
        try { return new URL(u).origin === base.origin; } catch { return false; }
      });
    }
    console.log('sitemap 없음, BFS로 fallback');
  }

  return bfsDiscover(baseUrl, maxDepth, delayMs, userAgent);
}

module.exports = { discoverUrls };
