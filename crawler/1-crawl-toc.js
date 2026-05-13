const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://ko.javascript.info';
const OUT_FILE = path.join(__dirname, '../data/toc.json');

async function crawlTOC() {
  console.log('TOC 크롤링 시작...');
  const { data: html } = await axios.get(BASE_URL, {
    headers: { 'User-Agent': 'JS-Learning-Bot/1.0' },
    timeout: 15000,
  });

  const $ = cheerio.load(html);
  const parts = [];

  // Parse part titles from the tab menu
  const partTitles = [];
  $('.tabs__menu-button').each((_, el) => {
    const title = $(el).find('span').last().text().trim();
    partTitles.push(title);
  });

  // Parse each part's content (tab-1, tab-2, tab-3)
  ['#tab-1', '#tab-2', '#tab-3'].forEach((tabId, partIdx) => {
    const tabEl = $(tabId);
    if (!tabEl.length) return;

    const partTitle = partTitles[partIdx] || `파트 ${partIdx + 1}`;
    const chapters = [];

    tabEl.find('.list > .list__item').each((chIdx, chEl) => {
      const chapterTitle = $(chEl).find('> .list__title > .list__link').text().trim();
      if (!chapterTitle) return;

      const articles = [];
      $(chEl).find('> .list-sub > .list-sub__item').each((artIdx, artEl) => {
        const link = $(artEl).find('> .list-sub__title > .list-sub__link');
        const href = link.attr('href') || '';
        const title = link.text().trim();
        if (!href || !title) return;

        const slug = href.replace(/^\//, '').split('#')[0];
        if (!slug) return;

        articles.push({
          slug,
          title,
          url: `${BASE_URL}/${slug}`,
          part: partIdx + 1,
          partTitle,
          chapter: chapterTitle,
          chapterIndex: chIdx,
          order: artIdx,
        });
      });

      if (articles.length > 0) {
        chapters.push({ title: chapterTitle, articles });
      }
    });

    if (chapters.length > 0) {
      parts.push({ title: partTitle, partIndex: partIdx + 1, chapters });
    }
  });

  // Assign global order and build prev/next
  const allArticles = parts.flatMap(p => p.chapters.flatMap(c => c.articles));
  allArticles.forEach((art, i) => {
    art.globalOrder = i;
    art.prev = allArticles[i - 1]?.slug || null;
    art.next = allArticles[i + 1]?.slug || null;
  });

  const toc = { parts, totalArticles: allArticles.length };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(toc, null, 2), 'utf8');

  console.log(`완료: ${allArticles.length}개 아티클, ${parts.length}개 파트`);
  parts.forEach(p => {
    const count = p.chapters.reduce((s, c) => s + c.articles.length, 0);
    console.log(`  파트 ${p.partIndex} "${p.title}": ${p.chapters.length}개 챕터, ${count}개 아티클`);
  });
  console.log(`저장: ${OUT_FILE}`);
  return toc;
}

crawlTOC().catch(err => {
  console.error('TOC 크롤링 실패:', err.message);
  process.exit(1);
});
