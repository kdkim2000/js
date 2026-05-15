# ARCHITECTURE — 멀티사이트 크롤러 & 학습 플랫폼

## 1. 전체 구조

```
E:\apps\js\
├── crawler/                      # 크롤러 (Node.js, CommonJS)
│   ├── 1-crawl-toc.js            # ko.javascript.info 전용 TOC 수집
│   ├── 2-crawl-articles.js       # ko.javascript.info 전용 아티클 수집
│   ├── 3-build-index.js          # SQLite 인덱스 빌드 (단일 사이트)
│   ├── migrate.js                # data/ → data/sites/ko-javascript-info/ 마이그레이션
│   ├── generic/                  # 제너릭 멀티사이트 크롤러
│   │   ├── crawl.js              # CLI 진입점 (--url, --id, --name, --selector)
│   │   ├── discover.js           # URL 수집 (sitemap.xml 우선 → BFS fallback)
│   │   ├── extract.js            # 콘텐츠 추출 + Markdown 변환
│   │   ├── build-index.js        # siteId별 SQLite 인덱스 빌드
│   │   └── utils/
│   │       ├── slugify.js        # URL → slug 변환
│   │       └── registry.js      # registry.json CRUD 헬퍼
│   └── utils/
│       ├── html-to-md.js         # HTML → Markdown (Turndown + 커스텀 규칙)
│       └── rate-limiter.js       # delay, withRetry
│
├── data/                         # 생성 데이터 (git 제외)
│   ├── registry.json             # 등록 사이트 목록 + 크롤 상태
│   └── sites/
│       ├── ko-javascript-info/   # 기존 ko.javascript.info 데이터
│       │   ├── toc.json
│       │   ├── metadata.json
│       │   ├── db.sqlite
│       │   ├── articles/{slug}.md
│       │   └── images/{slug}/{file}
│       └── {siteId}/             # 제너릭 크롤러로 추가된 사이트
│           └── ...동일 구조
│
├── site/                         # Next.js 16 사이트 (TypeScript, Tailwind v4)
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃 (헤더, 사이드바)
│   │   ├── page.tsx              # 홈: 사이트 목록 허브
│   │   ├── [slug]/page.tsx       # ko-javascript-info 기존 URL 호환
│   │   ├── sites/
│   │   │   └── [siteId]/
│   │   │       ├── layout.tsx    # 사이트별 레이아웃
│   │   │       ├── page.tsx      # 사이트 TOC 홈
│   │   │       └── [...slug]/page.tsx  # 사이트별 아티클 (catch-all)
│   │   ├── admin/
│   │   │   ├── layout.tsx        # admin 전용 레이아웃 (사이드바 없음)
│   │   │   ├── page.tsx          # 크롤 관리 대시보드
│   │   │   └── components/
│   │   │       ├── AddSiteForm.tsx
│   │   │       ├── SiteCard.tsx
│   │   │       └── CrawlProgress.tsx
│   │   └── api/
│   │       ├── search/route.ts   # FTS 검색 (siteId 파라미터)
│   │       └── admin/
│   │           ├── sites/route.ts           # GET/POST
│   │           ├── sites/[siteId]/route.ts  # GET/DELETE
│   │           └── crawl/[siteId]/route.ts  # POST(시작)/GET(SSE)
│   ├── components/
│   │   ├── Sidebar.tsx           # 사이드바 (siteId 기반 경로)
│   │   ├── SidebarWrapper.tsx
│   │   ├── SearchBar.tsx         # 검색 (siteId props)
│   │   ├── ArticleContent.tsx    # Markdown 렌더링
│   │   ├── ArticleNav.tsx        # 이전/다음 (siteId props)
│   │   ├── CodeRunner.tsx        # 브라우저 코드 실행
│   │   └── ProgressTracker.tsx   # 읽음 진도 추적
│   └── lib/
│       ├── registry.ts           # SiteEntry 타입 + getSiteDataDir()
│       ├── articles.ts           # 아티클 읽기 (siteId 파라미터)
│       ├── db.ts                 # SQLite FTS 검색 (siteId별 DB 캐시)
│       └── toc.ts                # TOC JSON 읽기 (siteId별 캐시)
│
├── mcp-server/                   # MCP 서버 (Claude Code 연동)
│   ├── index.js                  # 진입점 + 모든 핸들러
│   └── tools/
│       ├── registry.js           # registry.json 헬퍼
│       ├── search.js             # search_articles (siteId 파라미터)
│       ├── article.js            # get_article (siteId 파라미터)
│       └── toc.js                # get_toc, list_articles (siteId 파라미터)
│
└── docs/                         # 프로젝트 문서
```

---

## 2. 데이터 구조

### `data/registry.json`

```json
{
  "sites": [
    {
      "id": "ko-javascript-info",
      "name": "모던 자바스크립트 튜토리얼",
      "url": "https://ko.javascript.info",
      "description": "한국어 JS 튜토리얼",
      "addedAt": "2026-05-15T00:00:00Z",
      "lastCrawledAt": "2026-05-15T00:00:00Z",
      "crawlStatus": "done",
      "totalArticles": 173,
      "crawlConfig": {
        "contentSelector": "article.formatted",
        "strategy": "sitemap",
        "maxDepth": 3,
        "delayMs": 1200,
        "userAgent": "MultiSite-Crawler/1.0"
      }
    }
  ]
}
```

`crawlStatus`: `"pending"` | `"running"` | `"done"` | `"error"`

### `data/sites/{siteId}/` 구조

| 파일 | 내용 |
|------|------|
| `toc.json` | 파트/챕터/아티클 계층 구조 |
| `metadata.json` | globalOrder 정렬된 아티클 메타 배열 |
| `db.sqlite` | `articles` 테이블 + `search` FTS5 가상 테이블 |
| `articles/{slug}.md` | YAML frontmatter + Markdown 본문 |
| `images/{slug}/{file}` | 다운로드된 이미지 |
| `errors.json` | 크롤 실패 아티클 목록 |

---

## 3. 데이터 흐름

### 제너릭 크롤러 (신규 사이트)

```
사용자 → /admin → URL 등록
         ↓
POST /api/admin/crawl/{siteId}
         ↓
child_process.spawn(crawler/generic/crawl.js)
         ↓
discover.js → sitemap.xml 또는 BFS → URL 목록
         ↓
extract.js × N → {slug}.md 저장
         ↓
build-index.js → db.sqlite + metadata.json
         ↓
registry.json 업데이트 (crawlStatus: done)
         ↓
GET /api/admin/crawl/{siteId} (SSE) → 실시간 진행 표시
```

### ko.javascript.info 전용 크롤러 (기존)

```
node crawler/1-crawl-toc.js      → data/sites/ko-javascript-info/toc.json
node crawler/2-crawl-articles.js → data/sites/ko-javascript-info/articles/
node crawler/3-build-index.js    → data/sites/ko-javascript-info/db.sqlite
```

### Next.js 사이트 렌더링

```
브라우저 요청
    ↓
┌─ / → site/app/page.tsx
│      → registry.json 읽기 → 사이트 목록 표시
│
├─ /[slug] → site/app/[slug]/page.tsx
│      → lib/articles.ts(slug, 'ko-javascript-info')
│      → lib/toc.ts('ko-javascript-info')
│      → 기존 URL 호환
│
├─ /sites/{siteId} → site/app/sites/[siteId]/page.tsx
│      → lib/toc.ts(siteId)
│
├─ /sites/{siteId}/{...slug} → site/app/sites/[siteId]/[...slug]/page.tsx
│      → lib/articles.ts(slug, siteId)
│
├─ /admin → site/app/admin/page.tsx
│      → /api/admin/sites (GET)
│
└─ /api/search?q=&siteId= → lib/db.ts(query, siteId)
```

---

## 4. 라우팅 테이블

| 경로 | 파일 | 렌더링 | 설명 |
|------|------|--------|------|
| `/` | `app/page.tsx` | SSG | 사이트 목록 허브 |
| `/[slug]` | `app/[slug]/page.tsx` | SSG | ko-javascript-info 호환 |
| `/sites/[siteId]` | `app/sites/[siteId]/page.tsx` | SSG | 사이트 TOC 홈 |
| `/sites/[siteId]/[...slug]` | `app/sites/[siteId]/[...slug]/page.tsx` | SSG | 사이트별 아티클 |
| `/admin` | `app/admin/page.tsx` | CSR | 크롤 관리 대시보드 |
| `/api/search` | `app/api/search/route.ts` | SSR | FTS 검색 (siteId 파라미터) |
| `/api/admin/sites` | `app/api/admin/sites/route.ts` | SSR | 사이트 CRUD |
| `/api/admin/crawl/[id]` | `app/api/admin/crawl/[siteId]/route.ts` | SSR | 크롤 트리거 + SSE |

---

## 5. 배포 전략 (Option A — 완전 정적 내보내기)

### 로컬 개발 vs 정적 빌드

```
[로컬 개발: npm run dev]
  next dev
  ├── /api/search     → SQLite FTS5 (better-sqlite3)
  ├── /api/admin/**   → registry.json 읽기/쓰기, child_process.spawn
  └── /admin          → 크롤 관리 UI 완전 동작

[정적 빌드: npm run build]
  next build (output: 'export') → out/
  npx pagefind --site out        → out/pagefind/
  ├── 모든 아티클 페이지 → HTML 정적 파일
  ├── /pagefind/pagefind.js      → 클라이언트 사이드 검색
  └── /admin → "개발 서버에서만 사용 가능" 안내 페이지 (정적)

[배포: Vercel / GitHub Pages]
  out/ 디렉토리를 그대로 서빙
  API Routes 없음, 서버 없음
```

### 검색 전략 변경

| 환경 | 검색 방식 |
|------|---------|
| 로컬 개발 | `fetch('/api/search?q=...')` → SQLite FTS5 |
| 정적 빌드/배포 | `import('/pagefind/pagefind.js')` → Pagefind 클라이언트 검색 |

SearchBar 컴포넌트는 `typeof window !== 'undefined' && window.__pagefind__` 여부로 분기하거나, 단순히 빌드 환경을 감지해 Pagefind를 사용한다.

### `next.config.ts` 변경 사항

```ts
const nextConfig: NextConfig = {
  output: 'export',                    // 정적 내보내기
  images: { unoptimized: true },       // Image Optimization API 불필요
  // serverExternalPackages 제거      // 런타임 서버 없음
};
```

### `package.json` 빌드 스크립트

```json
"scripts": {
  "dev": "next dev",
  "build": "next build && npx pagefind --site out",
  "start": "next start"
}
```

---

## 6. 주요 설계 결정

| 결정 | 이유 |
|------|------|
| `data/sites/{siteId}/` 구조 | 사이트별 독립성, 기존 gitignore 유지 (`data/` 전체 제외) |
| `DEFAULT_SITE_ID = 'ko-javascript-info'` | 기존 `/[slug]` URL 호환 유지 |
| `siteId` 기본값을 함수 시그니처에 포함 | 기존 호출부 수정 불필요 |
| sitemap 우선 + BFS fallback | 대부분의 문서 사이트에 sitemap 존재; 없으면 링크 탐색 |
| SSE로 크롤 진행 상태 전달 | 크롤은 장시간 작업 → 폴링 대신 서버 푸시 |
| `/admin` 독립 레이아웃 | `getTOC()` 불필요, 크롤 완료 전 빌드 방지 |
| `Map<siteId, Database>` DB 캐시 | 멀티사이트 DB 동시 유지, 재연결 오버헤드 제거 |
| CommonJS (크롤러) | Node.js CLI 스크립트, ESM 변환 불필요 |
| Markdown + SQLite FTS5 | 재크롤링 없이 사이트 재빌드, 한국어 unicode61 tokenizer |
| SSG + API Route | 아티클 정적(빠름), 검색만 런타임(DB 필요) |

---

## 6. MCP 서버 구조

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `search_articles` | query, limit, siteId? | FTS5 전문 검색 |
| `get_article` | slug, siteId? | 아티클 본문 반환 |
| `get_toc` | siteId? | 전체 목차 구조 반환 |
| `list_articles` | part?, chapter?, siteId? | 아티클 목록 필터 |
| `list_sites` | (없음) | 등록 사이트 목록 반환 |

Resource URI: `article://{siteId}/{slug}` (예: `article://ko-javascript-info/closure`)
