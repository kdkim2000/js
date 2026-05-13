# CLAUDE.md

이 프로젝트는 [ko.javascript.info](https://ko.javascript.info) 크롤러 + 로컬 학습 사이트다.
자세한 내용은 `/docs` 폴더의 문서를 참조한다.

## 문서

- `docs/PRD.md` — 기능 요구사항 및 마일스톤
- `docs/ARCHITECTURE.md` — 전체 구조 및 데이터 흐름
- `docs/AGENT.md` — 에이전트 작업 가이드 (명령어, 규칙, 디버깅)
- `docs/SKILL.md` — 구현 스킬 패턴 참조
- `docs/MCP.md` — MCP 서버 연동 계획
- `docs/RULES.md` — 개발 규칙 및 컨벤션

## 명령어 요약

```powershell
# 크롤러
node crawler/1-crawl-toc.js
node crawler/2-crawl-articles.js --batch=0
node crawler/3-build-index.js

# 사이트
cd site && npm run dev      # http://localhost:3000
cd site && npm run build
```

## 구조 요약

```
crawler/   — Node.js 크롤러 (CommonJS)
data/      — 생성 데이터 (toc.json, articles/, db.sqlite)
site/      — Next.js 16 사이트 (TypeScript, Tailwind v4)
docs/      — 프로젝트 문서
```
