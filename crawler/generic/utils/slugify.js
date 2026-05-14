'use strict';

/**
 * URL path를 slug로 변환한다.
 * /foo/bar → foo-bar, /docs/getting-started/ → docs-getting-started
 */
function urlToSlug(url, baseUrl) {
  try {
    const base = new URL(baseUrl);
    const full = new URL(url, baseUrl);
    let p = full.pathname;
    // baseUrl path prefix 제거
    if (base.pathname !== '/' && p.startsWith(base.pathname)) {
      p = p.slice(base.pathname.length);
    }
    // trailing/leading slash 제거
    p = p.replace(/^\/+|\/+$/g, '');
    if (!p) return 'index';
    // 슬래시를 하이픈으로, 특수문자 제거
    return p.replace(/\//g, '-').replace(/[^a-zA-Z0-9가-힣\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'page';
  } catch {
    return 'page';
  }
}

/**
 * URL에서 siteId용 식별자를 생성한다.
 * https://ko.javascript.info → ko-javascript-info
 */
function urlToSiteId(url) {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  } catch {
    return 'unknown-site';
  }
}

module.exports = { urlToSlug, urlToSiteId };
