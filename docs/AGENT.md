# AGENT.md — AI 에이전트 작업 가이드

이 프로젝트에서 Claude Code(또는 다른 AI 에이전트)가 작업할 때 따라야 할 지침이다.

## 1. 프로젝트 이해

- 크롤러(`crawler/`)와 사이트(`site/`)는 **독립된 Node.js 프로젝트**다.
  - 크롤러: `E:\apps\js\` 루트의 `package.json` 사용 (CommonJS)
  - 사이트: `E:\apps\js\site\` 의 별도 `package.json` 사용 (ESM/TypeScript)
- `data/` 폴더는 크롤러가 생성하는 아티팩트다. 직접 편집하지 않는다.
- 사이트는 `data/`를 상대 경로(`../data/`)로 참조한다.

## 2. 명령어

### 크롤러 실행
```powershell
# 1단계: TOC 수집
node crawler/1-crawl-toc.js

# 2단계: 아티클 수집 (배치 0, 1, 2)
node crawler/2-crawl-articles.js --batch=0
node crawler/2-crawl-articles.js --batch=1
node crawler/2-crawl-articles.js --batch=2

# 3단계: 인덱스 빌드
node crawler/3-build-index.js
```

### 사이트 개발/빌드
```powershell
# 개발 서버 (site/ 디렉토리 기준)
cd site && npm run dev     # http://localhost:3000

# 프로덕션 빌드
cd site && npm run build
cd site && npm run start
```

### 의존성 설치
```powershell
# 루트 (크롤러)
npm install

# 사이트
cd site && npm install
```

## 3. 코드 작성 규칙

### 크롤러
- CommonJS (`require`/`module.exports`) 사용. ESM `import` 금지.
- `axios` + `cheerio`로 HTTP 요청 및 HTML 파싱.
- 모든 파일 I/O는 `path.join(__dirname, ...)` 절대 경로 기준.
- 새 유틸리티는 `crawler/utils/`에 추가한다.

### 사이트
- TypeScript 사용. `any` 타입 최소화.
- Next.js App Router 규칙 준수 (`"use client"` 필요 시만 선언).
- 서버 컴포넌트에서만 `better-sqlite3`와 파일시스템 접근.
- 스타일은 Tailwind CSS v4 클래스만 사용. 인라인 style 속성 금지.
- 새 컴포넌트는 `site/components/`, 서버 유틸은 `site/lib/`에 추가.

## 4. 작업 전 확인 사항

1. **크롤러 작업 시**: `data/toc.json`이 존재하는지 확인 후 2단계 진행.
2. **사이트 작업 시**: `data/db.sqlite`와 `data/articles/`가 존재해야 빌드 성공.
3. **검색 기능 변경 시**: `site/app/api/search/`와 `site/lib/db.ts` 함께 확인.
4. **셀렉터 변경 시**: `ko.javascript.info` HTML 구조가 바뀌었을 수 있으므로 실제 페이지 확인.

## 5. 금지 사항

- `data/` 폴더 내 파일 직접 편집 금지 (크롤러가 생성하는 파일).
- `site/node_modules/` 직접 편집 금지.
- `db.sqlite`를 직접 수정하는 SQL 실행 금지 (항상 `3-build-index.js`로 재생성).
- 크롤링 딜레이를 500ms 이하로 줄이는 것 금지 (서버 부하 방지).
- 원본 사이트 URL(`ko.javascript.info`)을 무단 스크래핑하는 스크립트 자동 실행 금지.

## 6. 디버깅 가이드

| 증상 | 확인 포인트 |
|------|------------|
| TOC가 비어 있음 | `.tabs__menu-button`, `#tab-1~3` 셀렉터 확인 |
| 아티클 본문 없음 | `article.formatted` 셀렉터 확인 |
| 검색 결과 없음 | `data/db.sqlite` 존재 여부, `search` FTS5 테이블 확인 |
| 빌드 실패 | `site/` 에서 `npx tsc --noEmit`으로 타입 오류 확인 |
| 이미지 깨짐 | `data/images/{slug}/` 디렉토리 및 파일 존재 여부 확인 |
