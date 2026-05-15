# AGENT.md — AI 에이전트 작업 가이드

이 프로젝트에서 Claude Code(또는 다른 AI 에이전트)가 작업할 때 따라야 할 지침이다.

## 1. 프로젝트 이해

- 크롤러(`crawler/`), 사이트(`site/`), MCP 서버(`mcp-server/`)는 **독립된 Node.js 프로젝트**다.
  - 크롤러: `E:\apps\js\` 루트의 `package.json` 사용 (CommonJS)
  - 사이트: `E:\apps\js\site\` 의 별도 `package.json` 사용 (TypeScript)
  - MCP: `E:\apps\js\mcp-server\` 의 별도 `package.json` 사용 (CommonJS)
- `data/` 폴더는 크롤러가 생성하는 아티팩트다. 직접 편집하지 않는다.
- 사이트는 `data/sites/{siteId}/`를 `site/lib/registry.ts`의 `getSiteDataDir(siteId)`로 접근한다.
- `DEFAULT_SITE_ID = 'ko-javascript-info'`는 레거시 `/[slug]` 라우트 호환용 기본값이다.

## 2. 명령어

### 크롤러 (제너릭 — URL 입력 방식)

```powershell
# URL을 주면 sitemap/BFS로 크롤 → data/sites/{id}/ 생성
node crawler/generic/crawl.js --url=https://docs.example.com --id=my-docs
node crawler/generic/crawl.js --url=https://example.com --id=my-site --name="My Site" --selector=".content" --strategy=bfs --maxDepth=3

# Admin UI에서 실행 (추천)
# http://localhost:3000/admin → URL 입력 → 크롤 시작
```

### 사이트 개발/빌드

```powershell
cd site && npm run dev          # http://localhost:3000 (SQLite + Admin 포함)
cd site && npm run build        # NEXT_EXPORT=1 next build + pagefind 인덱싱 → out/
npx serve out                   # 정적 out/ 로컬 미리보기
vercel --prod                   # Vercel 정적 배포
```

### 의존성 설치

```powershell
npm install                    # 루트 (크롤러)
cd site && npm install         # 사이트
cd mcp-server && npm install   # MCP 서버
```

## 3. 코드 작성 규칙

### 크롤러

- CommonJS (`require`/`module.exports`) 사용. ESM `import` 금지.
- `axios` + `cheerio`로 HTTP 요청 및 HTML 파싱.
- 모든 파일 I/O는 `path.join(__dirname, ...)` 절대 경로 기준.
- 제너릭 유틸리티는 `crawler/generic/utils/`, 공통 유틸은 `crawler/utils/`에 추가.
- 사이트별 출력 경로: `data/sites/{siteId}/`.

### 사이트

- TypeScript 사용. `any` 타입 최소화.
- Next.js App Router 규칙 준수 (`"use client"` 필요 시만 선언).
- 서버 컴포넌트에서만 `better-sqlite3`와 파일시스템 접근.
- 스타일은 Tailwind CSS v4 클래스만 사용. 인라인 style 속성 금지.
- 새 컴포넌트는 `site/components/`, 서버 유틸은 `site/lib/`에 추가.
- siteId 기본값: `DEFAULT_SITE_ID = 'ko-javascript-info'` (`site/lib/registry.ts`에서 import).
- admin 라우트는 별도 `site/app/admin/layout.tsx` 사용 (getTOC 호출 없음).

## 3.5 정적 배포 (Option A) 규칙

- `next.config.ts`에서 `NEXT_EXPORT=1` 환경변수일 때만 `output: 'export'` 적용
- `images: { unoptimized: true }` 설정 (Image Optimization API 없음)
- API Routes: `export const dynamic = 'force-static'` 선언 필수 (`output: 'export'` 요구)
  - GET-only 라우트: force-static이 정적 응답 캐싱 → POST 방식으로 대체
  - POST/DELETE 포함 라우트: force-static이어도 `ƒ Dynamic`으로 처리됨 (빌드에서 제외)
- 검색: 개발 환경은 `POST /api/search`(SQLite), 정적 배포는 Pagefind 사용
- SearchBar: Pagefind 먼저 시도 → 실패 시 `/api/search` POST fallback
- `/admin` 페이지: 정적 배포에서는 "개발 서버(`npm run dev`)에서만 사용 가능" 안내 표시

## 4. 작업 전 확인 사항

1. **신규 사이트 추가**: `/admin`에서 URL 등록 후 크롤 시작 (또는 `node crawler/generic/crawl.js --url=...`).
2. **크롤러 작업 시**: `data/sites/{siteId}/toc.json`이 존재하는지 확인 (크롤 완료 후 생성됨).
3. **사이트 작업 시**: `data/sites/{siteId}/db.sqlite`와 `articles/`가 존재해야 빌드 성공.
4. **검색 기능 변경 시**: `site/app/api/search/route.ts`와 `site/lib/db.ts`, `site/components/SearchBar.tsx` 함께 확인.
5. **lib 함수 변경 시**: `siteId` 파라미터 기본값이 `DEFAULT_SITE_ID`인지 확인.
6. **셀렉터 변경 시**: 실제 사이트 HTML 구조 확인 후 crawlConfig.contentSelector 업데이트.

## 5. 금지 사항

- `data/` 폴더 내 파일 직접 편집 금지 (크롤러가 생성).
- `site/node_modules/` 직접 편집 금지.
- `db.sqlite`를 직접 수정하는 SQL 실행 금지 (build-index.js로 재생성).
- 크롤링 딜레이를 500ms 이하로 줄이는 것 금지 (서버 부하 방지).
- 사이트 URL을 무단 스크래핑하는 스크립트 자동 실행 금지.
- `.dev.vars` 파일을 git에 커밋 금지 (API 키 포함).

## 6. 디버깅 가이드

| 증상 | 확인 포인트 |
|------|------------|
| 아티클 본문 없음 | crawlConfig.contentSelector 확인, 또는 제너릭 fallback 셀렉터 확인 |
| 검색 결과 없음 | `data/sites/{siteId}/db.sqlite` 존재 여부, `search` FTS5 테이블 확인 |
| 빌드 실패 | `site/` 에서 `npx tsc --noEmit`으로 타입 오류 확인, toc.json 존재 여부 확인 |
| 이미지 깨짐 | `data/sites/{siteId}/images/{slug}/` 존재 여부 확인 |
| 크롤 상태 안 보임 | `data/sites/.crawl-status/{siteId}.json` 내용 및 updatedAt 확인 |
| 크롤 버튼 비활성화 | `data/sites/.crawl-status/{siteId}.json`의 updatedAt이 60초 이상 경과인지 확인 (stale) |
| admin UI 렌더링 실패 | `site/app/admin/layout.tsx`가 getTOC 호출 없는지 확인 |
| 검색 API가 빈 배열 반환 | GET 대신 POST로 요청하는지 확인 (`/api/search` GET은 빌드 호환용 빈 응답) |
