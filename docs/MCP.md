# MCP.md — Model Context Protocol 연동 계획

이 문서는 ko.javascript.info 크롤러/사이트를 MCP 서버로 노출해
Claude Code 등 AI 에이전트가 직접 사용할 수 있도록 하는 계획을 정의한다.

## 1. 목적

크롤링된 아티클 데이터를 MCP 툴로 제공하면:
- AI가 "클로저란 무엇인가?"라는 질문에 실제 아티클 내용을 기반으로 답변 가능
- Claude Code에서 코드 작성 중 관련 JS 개념을 즉시 조회
- 아티클 간 연관성 탐색 및 학습 경로 추천

## 2. MCP 서버 설계

### 서버 유형
- **Transport**: `stdio` (로컬 Claude Code 연동)
- **런타임**: Node.js (별도 `mcp-server/` 디렉토리)
- **SDK**: `@anthropic-ai/sdk` MCP 서버 라이브러리

### 제공할 Tools

#### `search_articles`
전문 검색으로 아티클 목록을 반환한다.
```json
{
  "name": "search_articles",
  "description": "ko.javascript.info 아티클에서 키워드로 전문 검색합니다.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "검색어 (한국어/영어)" },
      "limit": { "type": "number", "default": 5 }
    },
    "required": ["query"]
  }
}
```
**반환**: `[{ slug, title, chapter, snippet }]`

#### `get_article`
슬러그로 아티클 전체 내용을 반환한다.
```json
{
  "name": "get_article",
  "description": "슬러그로 아티클의 제목과 본문 Markdown을 가져옵니다.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "slug": { "type": "string", "description": "아티클 슬러그 (예: closure)" }
    },
    "required": ["slug"]
  }
}
```
**반환**: `{ title, chapter, part, body, prev, next }`

#### `get_toc`
전체 목차 구조를 반환한다.
```json
{
  "name": "get_toc",
  "description": "파트/챕터/아티클 전체 목차를 반환합니다.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```
**반환**: `{ parts: [...], totalArticles: N }`

#### `list_articles`
챕터 또는 파트 내 아티클 목록을 반환한다.
```json
{
  "name": "list_articles",
  "description": "특정 파트 또는 챕터의 아티클 목록을 반환합니다.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "part": { "type": "number", "description": "파트 번호 (1-3)" },
      "chapter": { "type": "string", "description": "챕터 제목 (부분 일치)" }
    }
  }
}
```

### 제공할 Resources

#### `article://{slug}`
개별 아티클을 리소스로 노출.
- **URI**: `article://closure`, `article://promise-basics`
- **mimeType**: `text/markdown`
- **설명**: 아티클 frontmatter + Markdown 본문 전체

## 3. 구현 계획

### 디렉토리 구조
```
E:\apps\js\
└── mcp-server/
    ├── package.json        # @anthropic-ai/sdk, better-sqlite3
    ├── index.js            # MCP 서버 진입점
    └── tools/
        ├── search.js       # search_articles 구현
        ├── get-article.js  # get_article 구현
        └── toc.js          # get_toc, list_articles 구현
```

### Claude Code 등록 (`.claude/settings.json`)
```json
{
  "mcpServers": {
    "js-tutorial": {
      "command": "node",
      "args": ["E:/apps/js/mcp-server/index.js"],
      "description": "ko.javascript.info 아티클 검색 및 조회"
    }
  }
}
```

## 4. 구현 예시

```js
// mcp-server/index.js
const { McpServer } = require('@anthropic-ai/sdk/mcp');
const { searchArticles } = require('./tools/search');
const { getArticle } = require('./tools/get-article');

const server = new McpServer({ name: 'js-tutorial', version: '1.0.0' });

server.tool('search_articles', async ({ query, limit = 5 }) => {
  const results = searchArticles(query, limit);
  return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
});

server.tool('get_article', async ({ slug }) => {
  const article = getArticle(slug);
  if (!article) return { content: [{ type: 'text', text: '아티클을 찾을 수 없습니다.' }] };
  return { content: [{ type: 'text', text: article.body }] };
});

server.run('stdio');
```

## 5. 우선순위 및 상태

| Tool / Resource | 우선순위 | 상태 |
|----------------|---------|------|
| `search_articles` | P0 | ✅ 완료 |
| `get_article` | P0 | ✅ 완료 |
| `get_toc` | P1 | ✅ 완료 |
| `list_articles` | P1 | ✅ 완료 |
| Resource: `article://` | P2 | ✅ 완료 |
| `siteId` 파라미터 추가 (전 도구) | P0 | 🔲 예정 (M8) |
| `list_sites` 도구 | P1 | 🔲 예정 (M8) |
| Resource URI: `article://{siteId}/{slug}` | P1 | 🔲 예정 (M8) |

## 6. 멀티사이트 확장 계획 (M8)

모든 기존 도구에 `siteId` 선택적 파라미터 추가 (기본값: `ko-javascript-info`).

```json
{
  "name": "search_articles",
  "inputSchema": {
    "properties": {
      "query": { "type": "string" },
      "limit": { "type": "number", "default": 5 },
      "siteId": { "type": "string", "default": "ko-javascript-info", "description": "크롤된 사이트 ID" }
    }
  }
}
```

신규 `list_sites` 도구:
```json
{
  "name": "list_sites",
  "description": "registry.json에 등록된 모든 사이트 목록 반환",
  "inputSchema": { "type": "object", "properties": {} }
}
```

Resource URI 변경:
- 기존: `article://{slug}`
- 신규: `article://{siteId}/{slug}` (예: `article://ko-javascript-info/closure`)
- 기존 URI 형식 호환: siteId 없으면 `ko-javascript-info`로 간주

## 7. 활용 시나리오

```
사용자: "JavaScript 클로저에 대해 설명해줘"
Claude: [search_articles("클로저", siteId="ko-javascript-info") 호출]
        → slug: "closure", title: "변수의 유효범위와 클로저"
        [get_article("closure", siteId="ko-javascript-info") 호출]
        → 아티클 본문 기반으로 설명
```

```
사용자: "어떤 사이트가 크롤되어 있어?"
Claude: [list_sites() 호출]
        → [{ id: "ko-javascript-info", name: "모던 자바스크립트 튜토리얼", totalArticles: 173 }, ...]
```
