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

const { readRegistry, DEFAULT_SITE_ID, getSiteDataDir } = require('./tools/registry');
const { searchArticles } = require('./tools/search');
const { getArticle } = require('./tools/article');
const { getToc, listArticles } = require('./tools/toc');

// ---------------------------------------------------------------------------
// Server definition
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'js-tutorial', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } }
);

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
      description: '아티클에서 키워드로 전문 검색합니다. FTS5 기반으로 한국어/영어 모두 지원합니다.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색어 (한국어 또는 영어)',
          },
          limit: {
            type: 'number',
            description: '반환할 최대 결과 수 (기본값: 5, 최대: 50)',
            default: 5,
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (기본값: ko-javascript-info)',
            default: DEFAULT_SITE_ID,
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
            description: '아티클 슬러그 (예: "closure", "promise-basics")',
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (기본값: ko-javascript-info)',
            default: DEFAULT_SITE_ID,
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
            description: '사이트 ID (기본값: ko-javascript-info)',
            default: DEFAULT_SITE_ID,
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
            description: '파트 번호 (1: 코어 자바스크립트, 2: 브라우저, 3: 추가 주제). 생략 시 전체.',
          },
          chapter: {
            type: 'string',
            description: '챕터 제목 부분 일치 문자열 (예: "프라미스", "클래스"). 생략 시 전체.',
          },
          siteId: {
            type: 'string',
            description: '사이트 ID (기본값: ko-javascript-info)',
            default: DEFAULT_SITE_ID,
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
      const siteId = String(args.siteId || DEFAULT_SITE_ID);
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
      const siteId = String(args.siteId || DEFAULT_SITE_ID);
      const article = getArticle(slug, siteId);
      if (!article) {
        return {
          content: [{ type: 'text', text: `슬러그 "${slug}"에 해당하는 아티클을 찾을 수 없습니다.` }],
          isError: true,
        };
      }
      // Return metadata as JSON header + body as markdown
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
      const siteId = String(args.siteId || DEFAULT_SITE_ID);
      const toc = getToc(siteId);
      return {
        content: [{ type: 'text', text: JSON.stringify(toc, null, 2) }],
      };
    }

    case 'list_articles': {
      const part = args.part !== undefined && args.part !== null ? Number(args.part) : undefined;
      const chapter = args.chapter !== undefined ? String(args.chapter) : undefined;
      const siteId = String(args.siteId || DEFAULT_SITE_ID);
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
  // article://{siteId}/{slug} 형식 파싱
  const match = uri.match(/^article:\/\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)$/);
  if (!match) {
    // 기존 호환: article://{slug} → DEFAULT_SITE_ID
    const legacyMatch = uri.match(/^article:\/\/([a-zA-Z0-9_-]+)$/);
    if (!legacyMatch) throw new Error(`지원하지 않는 URI 형식: ${uri}`);
    const slug = legacyMatch[1];
    const article = getArticle(slug, DEFAULT_SITE_ID);
    if (!article) throw new Error(`아티클을 찾을 수 없습니다: ${slug}`);
    return { contents: [{ uri, mimeType: 'text/markdown', text: `# ${article.title}\n\n${article.body}` }] };
  }
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
  // MCP stdio server does not log to stdout (that's reserved for protocol)
  process.stderr.write('js-tutorial MCP server started\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
