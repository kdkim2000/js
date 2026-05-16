# CLAUDE.md

이 프로젝트는 **멀티사이트 크롤러 + 로컬 학습 플랫폼**이다.
URL을 등록하면 임의의 문서/튜토리얼 사이트를 크롤링하고, 사이트별로 데이터를 관리하며, 통합 학습 사이트에서 탐색할 수 있다.
자세한 내용은 `/docs` 폴더의 문서를 참조한다.

## 문서

- `docs/PRD.md` — 기능 요구사항 및 마일스톤 (M1~M7)
- `docs/ARCHITECTURE.md` — 전체 구조 및 데이터 흐름
- `docs/AGENT.md` — 에이전트 작업 가이드 (명령어, 규칙, 디버깅)
- `docs/SKILL.md` — 구현 스킬 패턴 참조
- `docs/MCP.md` — MCP 서버 연동
- `docs/RULES.md` — 개발 규칙 및 컨벤션

## 명령어 요약

```powershell
# 제너릭 크롤러 (신규 사이트 추가)
node crawler/generic/crawl.js --url=https://example.com --id=my-site

# 또는 Admin UI에서 URL 등록 후 크롤 시작
cd site && npm run dev      # http://localhost:3000/admin

# 정적 빌드 (output: export + Pagefind 인덱싱)
cd site && npm run build    # out/ + out/pagefind/ 생성

# Vercel 배포
vercel --prod               # out/ 을 Vercel에 배포
```

## 구조 요약

```
crawler/
  generic/       — 제너릭 멀티사이트 크롤러 (메인)
  utils/         — 공통 유틸 (html-to-md, rate-limiter)
data/            — 생성 데이터 (git 제외)
  registry.json  — 등록 사이트 목록
  sites/         — 사이트별 데이터 (toc.json, articles/, db.sqlite)
site/            — Next.js 16 사이트 (TypeScript, Tailwind v4)
  app/
    page.tsx     — 홈: 등록 사이트 목록 허브
    sites/       — 멀티사이트 뷰어 (/sites/[siteId]/[...slug])
    admin/       — 크롤 관리 UI (/admin)
  lib/
    registry.ts  — 사이트 레지스트리 + 경로 헬퍼
mcp-server/      — MCP 서버 (Claude Code 연동)
docs/            — 프로젝트 문서
```

## 배포 전략 (Option A — 완전 정적 내보내기)

```
[로컬 개발]  npm run dev   → SQLite FTS5 검색 + Admin 크롤 UI 포함
[정적 빌드]  npm run build → NEXT_EXPORT=1 next build + pagefind 인덱싱
[배포]       vercel --prod → out/ 정적 파일만 서빙
```

- 검색: 개발 서버 = `POST /api/search`(SQLite), 정적 배포 = Pagefind JS API
- Admin UI: 정적 배포에서는 "개발 서버 전용" 안내 표시
- `next.config.ts`: `NEXT_EXPORT=1`일 때만 `output: 'export'` 적용

## 중요 제약사항

- `.dev.vars` (API 키 포함) 절대 git 커밋 금지
- `data/` 디렉토리 전체 `.gitignore` 유지
- API Routes는 개발 서버(`npm run dev`)에서만 동작; 정적 배포에서는 Pagefind로 대체

## Token Logging

대화가 끝날 때마다 **mcp-server-cloud** 서버의 `log_usage` tool을 호출하세요.

- model: 현재 대화 모델명 (예: claude-sonnet-4-6)
- input_tokens / output_tokens: 이번 대화 추정 토큰 수
- note: 작업 내용 한 줄 요약 (선택)