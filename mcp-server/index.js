'use strict';

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const fs = require('fs');
const path = require('path');

const { readRegistry, getSiteDataDir } = require('./tools/registry');
const { searchArticles } = require('./tools/search');
const { getArticle } = require('./tools/article');
const { getToc, listArticles } = require('./tools/toc');

// ---------------------------------------------------------------------------
// Server definition
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'multi-site-crawler', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

// ---------------------------------------------------------------------------
// Helper: resolve siteId — use provided value or fall back to first registered site
// ---------------------------------------------------------------------------

function resolveSiteId(args) {
  if (args && args.siteId) return String(args.siteId);
  const sites = readRegistry().sites;
  return sites[0]?.id || '';
}

// ---------------------------------------------------------------------------
// Tool list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_sites',
      description: '등록된 모든 사이트 목록을 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_articles',
      description: '아티클에서 키워드로 전문 검색합니다. FTS5 기반으로 다국어를 지원합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색어',
          },
          limit: {
            type: 'number',
            description: '반환할 최대 결과 수 (기본값: 5, 최대: 50)',
            default: 5,
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (list_sites 도구로 확인 가능. 생략 시 첫 번째 사이트 사용)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_article',
      description: '슬러그로 아티클의 제목, 메타데이터, 본문 Markdown을 가져옵니다.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: '아티클 슬러그',
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (list_sites 도구로 확인 가능. 생략 시 첫 번째 사이트 사용)',
          },
        },
        required: ['slug'],
      },
    },
    {
      name: 'get_toc',
      description: '파트/챕터/아티클 전체 목차 구조를 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          siteId: {
            type: 'string',
            description: '사이트 ID (list_sites 도구로 확인 가능. 생략 시 첫 번째 사이트 사용)',
          },
        },
      },
    },
    {
      name: 'list_articles',
      description: '특정 파트 또는 챕터의 아티클 목록을 반환합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          part: {
            type: 'number',
            description: '파트 번호. 생략 시 전체.',
          },
          chapter: {
            type: 'string',
            description: '챕터 제목 부분 일치 문자열. 생략 시 전체.',
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (list_sites 도구로 확인 가능. 생략 시 첫 번째 사이트 사용)',
          },
        },
      },
    },
  ],
}));

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_sites': {
      const registry = readRegistry();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(registry.sites.map(s => ({
            id: s.id,
            name: s.name,
            url: s.url,
            crawlStatus: s.crawlStatus,
            totalArticles: s.totalArticles,
            lastCrawledAt: s.lastCrawledAt,
          })), null, 2),
        }],
      };
    }

    case 'search_articles': {
      const query = String(args.query || '').trim();
      if (!query) {
        return {
          content: [{ type: 'text', text: '검색어를 입력해주세요.' }],
          isError: true,
        };
      }
      const limit = Number(args.limit) || 5;
      const siteId = resolveSiteId(args);
      if (!siteId) {
        return {
          content: [{ type: 'text', text: '등록된 사이트가 없습니다. 먼저 사이트를 크롤링해주세요.' }],
          isError: true,
        };
      }
      const results = searchArticles(query, limit, siteId);
      return {
        content: [
          {
            type: 'text',
            text: results.length
              ? JSON.stringify(results, null, 2)
              : `"${query}"에 대한 검색 결과가 없습니다.`,
          },
        ],
      };
    }

    case 'get_article': {
      const slug = String(args.slug || '').trim();
      if (!slug) {
        return {
          content: [{ type: 'text', text: 'slug를 입력해주세요.' }],
          isError: true,
        };
      }
      const siteId = resolveSiteId(args);
      if (!siteId) {
        return {
          content: [{ type: 'text', text: '등록된 사이트가 없습니다. 먼저 사이트를 크롤링해주세요.' }],
          isError: true,
        };
      }
      const article = getArticle(slug, siteId);
      if (!article) {
        return {
          content: [{ type: 'text', text: `슬러그 "${slug}"에 해당하는 아티클을 찾을 수 없습니다.` }],
          isError: true,
        };
      }
      const meta = {
        title: article.title,
        chapter: article.chapter,
        part: article.part,
        partTitle: article.partTitle,
        globalOrder: article.globalOrder,
        prev: article.prev,
        next: article.next,
      };
      const text = `${JSON.stringify(meta, null, 2)}\n\n---\n\n${article.body}`;
      return {
        content: [{ type: 'text', text }],
      };
    }

    case 'get_toc': {
      const siteId = resolveSiteId(args);
      if (!siteId) {
        return {
          content: [{ type: 'text', text: '등록된 사이트가 없습니다. 먼저 사이트를 크롤링해주세요.' }],
          isError: true,
        };
      }
      const toc = getToc(siteId);
      return {
        content: [{ type: 'text', text: JSON.stringify(toc, null, 2) }],
      };
    }

    case 'list_articles': {
      const part = args.part !== undefined && args.part !== null ? Number(args.part) : undefined;
      const chapter = args.chapter !== undefined ? String(args.chapter) : undefined;
      const siteId = resolveSiteId(args);
      if (!siteId) {
        return {
          content: [{ type: 'text', text: '등록된 사이트가 없습니다. 먼저 사이트를 크롤링해주세요.' }],
          isError: true,
        };
      }
      const results = listArticles(part, chapter, siteId);
      return {
        content: [
          {
            type: 'text',
            text: results.length
              ? JSON.stringify(results, null, 2)
              : '조건에 맞는 아티클이 없습니다.',
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: 'text', text: `알 수 없는 도구: ${name}` }],
        isError: true,
      };
  }
});

// ---------------------------------------------------------------------------
// Resource list: article://{siteId}/{slug}
// ---------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const registry = readRegistry();
  const resources = [];
  for (const site of registry.sites) {
    try {
      const articlesDir = path.join(getSiteDataDir(site.id), 'articles');
      if (!fs.existsSync(articlesDir)) continue;
      const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
      for (const f of files) {
        const slug = f.replace(/\.md$/, '');
        resources.push({
          uri: `article://${site.id}/${slug}`,
          name: `${site.name}/${slug}`,
          mimeType: 'text/markdown',
        });
      }
    } catch { /* skip */ }
  }
  return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^article:\/\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
  if (!match) throw new Error(`지원하지 않는 URI 형식: ${uri} (올바른 형식: article://{siteId}/{slug})`);
  const siteId = match[1];
  const slug = match[2];
  const article = getArticle(slug, siteId);
  if (!article) throw new Error(`아티클을 찾을 수 없습니다: ${siteId}/${slug}`);
  return { contents: [{ uri, mimeType: 'text/markdown', text: `# ${article.title}\n\n${article.body}` }] };
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('multi-site-crawler MCP server started\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
