# 멀티사이트 크롤러 & 로컬 학습 플랫폼

URL을 등록하면 임의의 문서/튜토리얼 사이트를 크롤링하고, 사이트별 데이터를 관리하며, 통합 학습 사이트에서 탐색할 수 있는 로컬 학습 플랫폼입니다.

## 주요 기능

- **제너릭 크롤러**: URL 한 줄로 임의의 문서 사이트 크롤링 (sitemap.xml 우선 → BFS 탐색)
- **멀티사이트 뷰어**: 여러 사이트를 하나의 UI에서 탐색 (`/sites/{siteId}/`)
- **전문 검색**: SQLite FTS5 (개발 서버) / Pagefind (정적 배포)
- **관리 UI**: `/admin`에서 사이트 등록·크롤 실행·진행 상태 실시간 확인
- **MCP 서버**: Claude Code와 연동해 아티클 내용을 AI에게 직접 질의
- **정적 배포**: `npm run build` 한 번으로 Vercel/GitHub Pages 배포 가능

---

## 빠른 시작

### 1. 의존성 설치

```powershell
# 루트 (크롤러)
npm install

# 사이트
cd site && npm install
```

### 2. 최초 마이그레이션 (기존 데이터가 있는 경우)

```powershell
node crawler/migrate.js
```

`data/` → `data/sites/ko-javascript-info/`로 이동하고 `data/registry.json`을 생성합니다.

### 3. 개발 서버 실행

```powershell
cd site && npm run dev
```

`http://localhost:3000`에서 사이트 목록, 아티클 탐색, 검색, 관리 UI 모두 사용 가능합니다.

---

## 크롤링 가이드

### 방법 1: 관리 UI (추천)

1. 개발 서버 실행: `cd site && npm run dev`
2. 브라우저에서 `http://localhost:3000/admin` 접속
3. **새 사이트 추가** 폼에서 입력:
   - **URL**: 크롤할 사이트 루트 주소 (예: `https://docs.example.com`)
   - **사이트 ID**: 영문 소문자+하이픈 (예: `example-docs`)
   - **사이트 이름**: 표시될 이름 (예: `Example Docs`)
   - **콘텐츠 셀렉터** (선택): 본문 영역 CSS 셀렉터 (예: `article.content`, 생략 시 자동 감지)
4. **추가** 버튼 클릭 → 사이트 등록
5. 등록된 사이트 카드에서 **크롤 시작** 클릭
6. 진행 상태가 실시간으로 표시되며, 완료 시 `/sites/{siteId}/`에서 탐색 가능

### 방법 2: CLI 직접 실행

```powershell
node crawler/generic/crawl.js --url=<URL> [옵션]
```

#### 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--url=<URL>` | 크롤할 사이트 루트 URL **(필수)** | — |
| `--id=<id>` | 사이트 ID (영문 소문자, 하이픈) | URL hostname 자동 변환 |
| `--name=<name>` | 사이트 표시 이름 | ID와 동일 |
| `--selector=<css>` | 본문 콘텐츠 CSS 셀렉터 | 자동 감지 |
| `--strategy=<s>` | 탐색 전략: `sitemap` 또는 `bfs` | `sitemap` |
| `--maxDepth=<n>` | BFS 최대 탐색 깊이 | `3` |
| `--delay=<ms>` | 요청 간 딜레이 (ms) | `1200` |

#### 예시

```powershell
# 기본 크롤 (sitemap.xml 자동 탐지)
node crawler/generic/crawl.js --url=https://docs.example.com --id=example-docs

# BFS 전략으로 최대 2단계 깊이 크롤
node crawler/generic/crawl.js --url=https://docs.example.com --id=example-docs --strategy=bfs --maxDepth=2

# 콘텐츠 셀렉터 지정 (본문 영역이 명확한 경우)
node crawler/generic/crawl.js --url=https://docs.example.com --id=example-docs --selector="article.main-content"

# 딜레이 증가 (서버 부하 방지)
node crawler/generic/crawl.js --url=https://docs.example.com --id=example-docs --delay=2000
```

### ko.javascript.info 전용 크롤러 (기존)

```powershell
node crawler/1-crawl-toc.js                    # 목차 수집
node crawler/2-crawl-articles.js --batch=0     # 아티클 수집 (배치 0)
node crawler/2-crawl-articles.js --batch=1     # 아티클 수집 (배치 1)
node crawler/2-crawl-articles.js --batch=2     # 아티클 수집 (배치 2)
node crawler/3-build-index.js                  # SQLite 검색 인덱스 빌드
```

---

## 데이터 구조

크롤 완료 후 생성되는 데이터:

```
data/
├── registry.json              # 등록 사이트 목록 + 상태
└── sites/
    ├── ko-javascript-info/    # 사이트별 독립 데이터
    │   ├── toc.json           # 파트/챕터/아티클 계층 구조
    │   ├── metadata.json      # 전체 아티클 메타 배열
    │   ├── db.sqlite          # FTS5 검색 인덱스
    │   ├── articles/{slug}.md # Markdown 아티클
    │   └── images/{slug}/     # 다운로드된 이미지
    └── {siteId}/              # 추가한 사이트
        └── ...동일 구조
```

> `data/` 폴더는 `.gitignore`에 포함되어 있습니다. 직접 편집하지 마세요.

---

## 사이트 탐색

크롤 완료 후 개발 서버(`npm run dev`)에서:

| URL | 설명 |
|-----|------|
| `http://localhost:3000/` | 등록된 사이트 목록 |
| `http://localhost:3000/sites/{siteId}/` | 사이트 목차 홈 |
| `http://localhost:3000/sites/{siteId}/{slug}` | 개별 아티클 |
| `http://localhost:3000/admin` | 크롤 관리 UI |
| `http://localhost:3000/{slug}` | ko.javascript.info 기존 URL 호환 |

---

## 배포

### 정적 빌드 (Vercel / GitHub Pages)

```powershell
cd site
npm run build        # next build + pagefind 인덱싱 → out/ 생성
vercel --prod        # Vercel 배포
```

- `out/` 디렉토리가 정적 파일로 생성됩니다.
- 검색은 Pagefind 클라이언트 사이드로 동작합니다.
- **Admin UI와 크롤러는 로컬 개발 서버에서만 동작합니다.**

### 개발 서버와 정적 배포 차이

| 기능 | `npm run dev` | `npm run build` + 배포 |
|------|:---:|:---:|
| 아티클 탐색 | ✅ | ✅ |
| 전문 검색 | ✅ SQLite | ✅ Pagefind |
| 관리 UI / 크롤 | ✅ | ❌ (로컬 전용 안내) |
| 이전/다음 탐색 | ✅ | ✅ |
| 코드 실행 | ✅ | ✅ |

---

## MCP 서버 (Claude Code 연동)

Claude Code에서 크롤된 아티클을 직접 조회할 수 있습니다.

### 설치

```powershell
cd mcp-server && npm install
```

### Claude Code 등록 (`.claude/settings.json`)

```json
{
  "mcpServers": {
    "js-tutorial": {
      "command": "node",
      "args": ["E:/apps/js/mcp-server/index.js"],
      "description": "크롤된 사이트 아티클 검색 및 조회"
    }
  }
}
```

### 제공 도구

| 도구 | 설명 |
|------|------|
| `list_sites` | 등록된 사이트 목록 반환 |
| `search_articles` | 키워드로 아티클 전문 검색 |
| `get_article` | 슬러그로 아티클 본문 조회 |
| `get_toc` | 전체 목차 구조 반환 |
| `list_articles` | 파트/챕터별 아티클 목록 |

---

## 프로젝트 구조

```
crawler/         — Node.js 크롤러 (CommonJS)
  generic/       — 제너릭 멀티사이트 크롤러
    crawl.js     — CLI 진입점
    discover.js  — URL 수집 (sitemap → BFS)
    extract.js   — 콘텐츠 추출 + Markdown 변환
    build-index.js — SQLite FTS5 인덱스 빌드
  1-crawl-toc.js       — ko.javascript.info 전용
  2-crawl-articles.js  — ko.javascript.info 전용
  3-build-index.js     — ko.javascript.info 전용
  migrate.js     — 기존 data/ 마이그레이션

data/            — 크롤링 데이터 (git 제외)

site/            — Next.js 16 (TypeScript, Tailwind v4)
  app/
    page.tsx         — 사이트 목록 홈
    [slug]/          — ko.javascript.info 호환 URL
    sites/[siteId]/  — 멀티사이트 뷰어
    admin/           — 크롤 관리 UI
  components/    — 공유 컴포넌트
  lib/           — 서버 유틸 (registry, articles, db, toc)

mcp-server/      — MCP 서버 (Claude Code 연동)
docs/            — 상세 문서
```

---

## 문서

- [`docs/PRD.md`](docs/PRD.md) — 기능 요구사항 및 마일스톤
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — 전체 구조 및 데이터 흐름
- [`docs/AGENT.md`](docs/AGENT.md) — 개발 명령어 및 디버깅 가이드
- [`docs/MCP.md`](docs/MCP.md) — MCP 서버 연동 상세
- [`docs/RULES.md`](docs/RULES.md) — 개발 규칙 및 컨벤션

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 크롤러 | Node.js, axios, cheerio, turndown |
| 검색 인덱스 | SQLite FTS5 (unicode61 tokenizer) |
| 사이트 | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| 코드 하이라이팅 | Shiki |
| 정적 검색 | Pagefind |
| MCP 서버 | @modelcontextprotocol/sdk (stdio) |
