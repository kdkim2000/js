# ARCHITECTURE — 멀티사이트 크롤러 & 학습 플랫폼

## 1. 전체 구조

```
E:\apps\js\
├── crawler/                      # 크롤러 (Node.js, CommonJS)
│   ├── generic/                  # 제너릭 멀티사이트 크롤러 (메인)
│   │   ├── crawl.js              # CLI 진입점 (--url, --id, --name, --selector, --strategy)
│   │   ├── discover.js           # URL 수집 (sitemap.xml 우선 → BFS fallback)
│   │   ├── extract.js            # 콘텐츠 추출 + Markdown 변환
│   │   ├── build-index.js        # siteId별 SQLite FTS5 인덱스 빌드
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
│       └── {siteId}/             # 사이트별 독립 데이터
│           ├── toc.json          # 파트/챕터/아티클 계층 구조
│           ├── metadata.json     # globalOrder 정렬 아티클 메타 배열
│           ├── db.sqlite         # articles 테이블 + search FTS5 가상 테이블
│           ├── articles/{slug}.md
│           └── images/{slug}/{file}
│
├── site/                         # Next.js 16 사이트 (TypeScript, Tailwind v4)
│   ├── app/
│   │   ├── layout.tsx            # 루트 레이아웃 (최소 — html/body만)
│   │   ├── page.tsx              # 홈: 등록 사이트 목록 허브
│   │   ├── [slug]/
│   │   │   └── page.tsx          # /[slug] → 홈으로 리디렉트 (레거시 URL 스텁)
│   │   ├── sites/
│   │   │   └── [siteId]/
│   │   │       ├── layout.tsx    # 사이트별 레이아웃 (사이드바 포함)
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
│   │       ├── search/route.ts          # GET(force-static, 빌드용) / POST(동적, 실제 검색)
│   │       └── admin/
│   │           ├── sites/route.ts       # GET(사이트 목록) / POST(등록) / DELETE(삭제)
│   │           └── crawl/route.ts       # POST(크롤 시작 or 상태 조회)
│   ├── components/
│   │   ├── Sidebar.tsx           # 사이드바 (siteId 기반 경로)
│   │   ├── SidebarWrapper.tsx
│   │   ├── SearchBar.tsx         # 검색 (Pagefind → /api/search POST fallback)
│   │   ├── ArticleContent.tsx    # Markdown 렌더링
│   │   ├── ArticleNav.tsx        # 이전/다음 (siteId props)
│   │   ├── CodeRunner.tsx        # 브라우저 코드 실행
│   │   └── ProgressTracker.tsx   # 읽음 진도 추적
│   └── lib/
│       ├── registry.ts           # SiteEntry 타입 + getSiteDataDir()
│       ├── articles.ts           # 아티클 읽기 (siteId 파라미터)
│       ├── db.ts                 # SQLite FTS 검색 (siteId별 DB 캐시)
│       └── toc.ts                # TOC JSON 읽기 (siteId별 캐시, 미존재 시 빈 TOC)
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
      "id": "my-docs",
      "name": "My Documentation",
      "url": "https://docs.example.com",
      "description": "예시 문서 사이트",
      "addedAt": "2026-05-15T00:00:00Z",
      "lastCrawledAt": "2026-05-15T00:00:00Z",
      "crawlStatus": "done",
      "totalArticles": 120,
      "crawlConfig": {
        "contentSelector": "article.content",
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

### 크롤 흐름 (Admin UI → 크롤러)

```
사용자 → /admin → URL 등록 → 크롤 시작 버튼
         ↓
POST /api/admin/crawl  { siteId }
         ↓
child_process.spawn(crawler/generic/crawl.js --url=... --id=...)
         ↓
discover.js → sitemap.xml 또는 BFS → URL 목록
         ↓
extract.js × N → {slug}.md 저장
         ↓
build-index.js → db.sqlite + toc.json + metadata.json
         ↓
registry.json 업데이트 (crawlStatus: done)

CrawlProgress 컴포넌트:
  POST /api/admin/crawl { siteId, statusOnly: true } (1.5초 폴링)
  → .crawl-status/{siteId}.json 읽기
  → progress / done / error / stale 반환
```

### Next.js 렌더링 흐름

```
브라우저 요청
    ↓
┌─ / → app/page.tsx
│      → registry.json 읽기 → 사이트 목록 카드 표시
│
├─ /sites/{siteId} → app/sites/[siteId]/page.tsx
│      → lib/toc.ts(siteId) → 목차 표시
│
├─ /sites/{siteId}/{...slug} → app/sites/[siteId]/[...slug]/page.tsx
│      → lib/articles.ts(slug, siteId)
│
├─ /[slug] → app/[slug]/page.tsx  (레거시 URL 호환)
│      → lib/articles.ts(slug, DEFAULT_SITE_ID)
│
├─ /admin → app/admin/page.tsx
│      → GET /api/admin/sites → 사이트 목록
│
├─ POST /api/search { q, siteId } → lib/db.ts(query, siteId)
└─ GET  /api/search               → [] (force-static, 빌드용 정적 응답)
```

---

## 4. 라우팅 테이블

| 경로 | 파일 | 렌더링 | 설명 |
|------|------|--------|------|
| `/` | `app/page.tsx` | SSG | 사이트 목록 허브 |
| `/sites/[siteId]` | `app/sites/[siteId]/page.tsx` | SSG | 사이트 TOC 홈 |
| `/sites/[siteId]/[...slug]` | `app/sites/[siteId]/[...slug]/page.tsx` | SSG | 사이트별 아티클 |
| `/[slug]` | `app/[slug]/page.tsx` | SSG | 레거시 URL (ko-javascript-info) |
| `/admin` | `app/admin/page.tsx` | CSR | 크롤 관리 대시보드 |
| `POST /api/search` | `app/api/search/route.ts` | Dynamic | FTS 검색 (siteId 파라미터) |
| `GET /api/search` | `app/api/search/route.ts` | Static | 빈 응답 (빌드 호환용) |
| `/api/admin/sites` | `app/api/admin/sites/route.ts` | Dynamic | 사이트 CRUD |
| `/api/admin/crawl` | `app/api/admin/crawl/route.ts` | Dynamic | 크롤 시작 + 상태 조회 |

---

## 5. 배포 전략 (Option A — 완전 정적 내보내기)

### 로컬 개발 vs 정적 빌드

```
[로컬 개발: npm run dev]
  next dev
  ├── POST /api/search  → SQLite FTS5 (better-sqlite3)
  ├── /api/admin/**     → registry.json 읽기/쓰기, child_process.spawn
  └── /admin            → 크롤 관리 UI 완전 동작

[정적 빌드: npm run build]
  NEXT_EXPORT=1 next build → out/
  npx pagefind --site out  → out/pagefind/
  ├── 모든 아티클 페이지 → HTML 정적 파일
  ├── /pagefind/pagefind.js → 클라이언트 사이드 검색
  └── /admin → "개발 서버에서만 사용 가능" 안내 페이지 (정적)

[배포: Vercel / GitHub Pages]
  out/ 디렉토리를 그대로 서빙
  API Routes 없음, 서버 없음
```

### 검색 전략

| 환경 | 검색 방식 |
|------|---------|
| 로컬 개발 | `POST /api/search { q, siteId }` → SQLite FTS5 |
| 정적 배포 | `import('/pagefind/pagefind.js')` → Pagefind 클라이언트 검색 |

SearchBar: Pagefind 먼저 시도 → 실패 시 `/api/search` POST fallback.

### `next.config.ts`

```ts
const isExport = process.env.NEXT_EXPORT === "1";
const nextConfig: NextConfig = {
  ...(isExport ? { output: "export" } : {}),
  images: { unoptimized: true },
};
```

### API Route `dynamic` 설정

| 라우트 | `dynamic` | 이유 |
|--------|-----------|------|
| `/api/search` | `force-static` | GET: 빌드용 정적 응답; POST: ƒ Dynamic |
| `/api/admin/*` | `force-static` | POST/DELETE 포함 → ƒ Dynamic으로 처리됨 |

---

## 6. 주요 설계 결정

| 결정 | 이유 |
|------|------|
| `data/sites/{siteId}/` 구조 | 사이트별 독립성, gitignore(`data/` 전체 제외) |
| `DEFAULT_SITE_ID = 'ko-javascript-info'` | 레거시 `/[slug]` URL 호환 유지용 |
| sitemap 우선 + BFS fallback | 대부분 문서 사이트에 sitemap 존재; 없으면 링크 탐색 |
| 폴링 방식 크롤 상태 조회 | SSE 대신 POST `{ statusOnly: true }` 1.5초 폴링 (force-static 환경 대응) |
| `/admin` 독립 레이아웃 | `getTOC()` 불필요, 크롤 완료 전 빌드 방지 |
| `Map<siteId, Database>` DB 캐시 | 멀티사이트 DB 동시 유지, 재연결 오버헤드 제거 |
| toc.json 미존재 → 빈 TOC 반환 | 크롤 전 사이트도 빌드 실패 없이 처리 |
| CommonJS (크롤러) | Node.js CLI 스크립트, ESM 변환 불필요 |
| Markdown + SQLite FTS5 | 재크롤링 없이 사이트 재빌드, unicode61 tokenizer |

---

## 7. MCP 서버 구조

| 도구 | 파라미터 | 설명 |
|------|----------|------|
| `search_articles` | query, limit, siteId? | FTS5 전문 검색 |
| `get_article` | slug, siteId? | 아티클 본문 반환 |
| `get_toc` | siteId? | 전체 목차 구조 반환 |
| `list_articles` | part?, chapter?, siteId? | 아티클 목록 필터 |
| `list_sites` | (없음) | 등록 사이트 목록 반환 |

Resource URI: `article://{siteId}/{slug}` (예: `article://ko-javascript-info/closure`)
