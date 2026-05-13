# ARCHITECTURE — ko.javascript.info 크롤러 & 학습 사이트

## 1. 전체 구조

```
E:\apps\js\
├── crawler/                  # 크롤러 (Node.js, CommonJS)
│   ├── 1-crawl-toc.js        # 1단계: TOC 수집
│   ├── 2-crawl-articles.js   # 2단계: 아티클 수집
│   ├── 3-build-index.js      # 3단계: SQLite 인덱스 빌드
│   └── utils/
│       ├── html-to-md.js     # HTML → Markdown 변환 (Turndown)
│       └── rate-limiter.js   # delay, withRetry
├── data/                     # 생성 데이터 (git 제외)
│   ├── toc.json              # 목차 구조 (87KB)
│   ├── metadata.json         # 아티클 메타데이터 배열 (59KB)
│   ├── db.sqlite             # SQLite DB + FTS5 (1.3MB+)
│   ├── articles/             # 아티클 Markdown 파일
│   │   └── {slug}.md
│   └── images/               # 다운로드된 이미지
│       └── {slug}/{filename}
├── site/                     # Next.js 16 사이트 (TypeScript)
│   ├── app/
│   │   ├── layout.tsx        # 루트 레이아웃 (헤더, 사이드바)
│   │   ├── page.tsx          # 홈 (TOC 목록)
│   │   ├── [slug]/page.tsx   # 아티클 페이지
│   │   └── api/search/       # 검색 API Route
│   ├── components/
│   │   ├── Sidebar.tsx        # 좌측 목차 사이드바
│   │   ├── SidebarWrapper.tsx # 사이드바 클라이언트 래퍼
│   │   ├── SearchBar.tsx      # 검색 UI (debounce)
│   │   ├── ArticleContent.tsx # Markdown 렌더링
│   │   ├── ArticleNav.tsx     # 이전/다음 내비게이션
│   │   ├── CodeBlock.tsx      # 코드 블록 표시
│   │   ├── CodeRunner.tsx     # 브라우저 코드 실행
│   │   └── ProgressTracker.tsx# 읽음 진도 추적
│   └── lib/
│       ├── articles.ts        # 아티클 파일 읽기
│       ├── db.ts              # SQLite 연결 + 검색
│       └── toc.ts             # TOC JSON 읽기
└── docs/                     # 프로젝트 문서
```

## 2. 데이터 흐름

```
ko.javascript.info
        │
        ▼ 1-crawl-toc.js (axios + cheerio)
  data/toc.json
  ┌─ parts[]
  │   ├─ chapters[]
  │   │   └─ articles[] ← { slug, title, url, part, chapter, globalOrder, prev, next }
  │   └─ totalArticles: N
        │
        ▼ 2-crawl-articles.js (axios + cheerio + turndown)
  data/articles/{slug}.md   ← frontmatter + Markdown body
  data/images/{slug}/*.png  ← 로컬 이미지
        │
        ▼ 3-build-index.js (better-sqlite3)
  data/db.sqlite
  ┌─ TABLE articles (slug PK, title, url, part, ...)
  └─ VIRTUAL TABLE search USING fts5 (title, chapter, body)
  data/metadata.json         ← globalOrder 정렬된 메타 배열
        │
        ▼ Next.js 빌드 (next build)
  정적 페이지 + API Routes
        │
        ▼ next dev / next start
  브라우저 ← HTTP
```

## 3. 크롤러 상세

### 1단계: TOC 크롤링 (`1-crawl-toc.js`)
- `https://ko.javascript.info` 메인 페이지 파싱
- `.tabs__menu-button` → 파트 제목 추출
- `#tab-1`, `#tab-2`, `#tab-3` → 파트별 챕터/아티클 추출
- `globalOrder`, `prev`, `next` 링크 계산 후 `data/toc.json` 저장

### 2단계: 아티클 크롤링 (`2-crawl-articles.js`)
- `--batch=N` 인수로 배치 분할 (BATCH_SIZE=58, 약 3개 배치)
- `article.formatted` 셀렉터로 본문 추출
- 이미지 다운로드 후 경로 rewrite
- Turndown으로 HTML→Markdown 변환 (코드블록/노트박스/정답 커스텀 규칙)
- YAML frontmatter + Markdown 본문을 `{slug}.md`로 저장
- 기존 파일은 스킵, 실패는 `errors.json`에 추가

### 3단계: 인덱스 빌드 (`3-build-index.js`)
- `db.sqlite` 재생성 (DROP + CREATE)
- `articles` 테이블에 메타데이터 INSERT
- `search` FTS5 가상 테이블에 `title + chapter + body` 인덱싱
- `metadata.json`으로 globalOrder 정렬된 메타 배열 저장

## 4. Site 상세

### 라우팅
| 경로 | 파일 | 렌더링 방식 |
|------|------|------------|
| `/` | `app/page.tsx` | SSG (빌드 시 정적) |
| `/[slug]` | `app/[slug]/page.tsx` | SSG (generateStaticParams) |
| `/api/search?q=` | `app/api/search/route.ts` | SSR (런타임 DB 쿼리) |

### 의존성
| 라이브러리 | 용도 |
|-----------|------|
| next 16.2.6 | App Router 프레임워크 |
| react 19 | UI |
| tailwindcss v4 | 스타일링 |
| better-sqlite3 | SQLite 읽기 (서버 사이드) |
| react-markdown + remark-gfm | Markdown 렌더링 |
| shiki | 서버 사이드 코드 문법 강조 |
| gray-matter | frontmatter 파싱 |

### 코드 하이라이팅 전략
- 빌드 시 `codeToHtml` (Shiki, github-dark 테마)로 pre-render
- `highlightedBlocks: Record<number, string>` 맵을 `ArticleContent`에 전달
- 지원되지 않는 언어는 plain text fallback

## 5. 주요 설계 결정

| 결정 | 이유 |
|------|------|
| CommonJS (크롤러) | Node.js CLI 스크립트, ESM 변환 오버헤드 불필요 |
| Markdown 저장 | 재크롤링 없이 사이트 재빌드 가능, 사람이 읽기 쉬움 |
| SQLite FTS5 | 단일 파일 DB, 서버 불필요, 한국어 unicode61 tokenizer |
| SSG + API Route | 아티클은 정적(빠름), 검색만 런타임(DB 필요) |
| Shiki 서버 사이드 | 클라이언트 번들 크기 제로, 빌드 시 HTML 생성 |
