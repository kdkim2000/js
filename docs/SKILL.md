# SKILL.md — 프로젝트 기능 및 구현 스킬

이 문서는 프로젝트에서 활용되는 핵심 기술 패턴과 구현 스킬을 정리한다.

## 1. 크롤러 스킬

### HTML 파싱 (cheerio)
```js
const { data: html } = await axios.get(url, { headers: { 'User-Agent': '...' } });
const $ = cheerio.load(html);
$('.selector').each((i, el) => { /* ... */ });
```
- 셀렉터 기반 DOM 탐색
- `.text()`, `.attr()`, `.html()`, `.find()`, `.each()` 사용

### HTML → Markdown 변환 (Turndown)
```js
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
td.addRule('ruleName', { filter, replacement });
const markdown = td.turndown(html);
```
- 커스텀 규칙으로 코드블록, 노트박스, 정답 블록 처리
- `filter`: DOM 노드 매칭 조건
- `replacement(content, node)`: 변환된 Markdown 반환

### 이미지 다운로드
```js
const res = await axios.get(url, { responseType: 'arraybuffer' });
fs.writeFileSync(dest, res.data);
```
- 이진 데이터 다운로드 후 로컬 저장
- 상대경로 이미지는 `${BASE_URL}${src}`로 절대경로 변환

### 배치 처리
```js
const BATCH = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] ?? 0);
const batch = allArticles.slice(BATCH * BATCH_SIZE, (BATCH + 1) * BATCH_SIZE);
```
- `--batch=N` CLI 인수로 분할 실행
- 각 배치를 독립 프로세스로 병렬 실행 가능

### 재시도 로직 (지수 백오프)
```js
async function withRetry(fn, retries = 3, baseDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries - 1) throw err;
      await delay(baseDelay * Math.pow(2, i)); // 2s, 4s, 8s
    }
  }
}
```

### Frontmatter 작성
```js
const frontmatter = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `slug: ${JSON.stringify(slug)}`,
  // ...
  '---',
].join('\n');
fs.writeFileSync(outFile, frontmatter + '\n\n' + markdown, 'utf8');
```

## 2. SQLite / FTS5 스킬

### 테이블 생성
```sql
CREATE TABLE articles (slug TEXT PRIMARY KEY, title TEXT, ...);
CREATE VIRTUAL TABLE search USING fts5(
  slug UNINDEXED, title, chapter, body,
  content=articles, content_rowid=rowid,
  tokenize="unicode61"
);
```
- `unicode61` tokenizer: 한국어/유니코드 지원
- `content=` 옵션: 외부 테이블 참조 FTS (용량 최적화)

### 전문 검색 쿼리
```sql
SELECT slug, title, snippet(search, 3, '<mark>', '</mark>', '...', 32)
FROM search WHERE search MATCH ? ORDER BY rank LIMIT 20
```
- `snippet()`: 검색어 주변 컨텍스트 추출 (`<mark>` 태그 삽입)
- 접두어 검색: `query + "*"` (예: `"클로저*"`)

### 트랜잭션 배치 삽입
```js
const insertAll = db.transaction(() => {
  for (const row of rows) { stmt.run(row); }
});
insertAll(); // 단일 트랜잭션으로 성능 향상
```

## 3. Next.js / React 스킬

### 정적 생성 (SSG)
```ts
export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }));
}
```
- 빌드 시 모든 아티클 페이지를 정적 HTML로 생성
- 런타임 DB 쿼리 없음 → 빠른 응답

### 서버 사이드 파일 읽기
```ts
// lib/articles.ts (서버 컴포넌트에서만 호출)
import fs from "fs";
import path from "path";
const ARTICLES_DIR = path.join(process.cwd(), "../data/articles");
```
- `process.cwd()`는 `site/` 디렉토리 기준
- `../data/`로 상위 폴더의 data 접근

### 검색 API Route (런타임)
```ts
// app/api/search/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  return Response.json(searchArticles(q));
}
```

### Shiki 서버 사이드 하이라이팅
```ts
import { codeToHtml } from "shiki";
const highlighted = await codeToHtml(code, { lang: 'javascript', theme: 'github-dark' });
```
- 빌드 시 실행 → 클라이언트 번들에 포함 안 됨
- `highlightedBlocks: Record<number, string>` 형태로 컴포넌트에 전달

### debounce 검색
```ts
const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
function handleChange(e) {
  if (timer.current) clearTimeout(timer.current);
  timer.current = setTimeout(async () => { /* fetch */ }, 250);
}
```

### localStorage 진도 추적
```ts
// ProgressTracker.tsx
const key = `progress:${slug}`;
const read = localStorage.getItem(key) === 'read';
```

## 4. Frontmatter 파싱 스킬

```ts
function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  const meta: Record<string, unknown> = {};
  match[1].split('\n').forEach(line => {
    const col = line.indexOf(':');
    const key = line.slice(0, col).trim();
    let val: unknown = line.slice(col + 1).trim();
    try { val = JSON.parse(val as string); } catch {}
    meta[key] = val;
  });
  return { meta, body: content.slice(match[0].length).trim() };
}
```
- `JSON.parse`로 문자열/숫자/null 자동 변환
- gray-matter 사용도 가능 (site에서 의존성으로 포함됨)

## 5. 향후 추가 가능한 스킬

| 스킬 | 설명 | 난이도 |
|------|------|--------|
| 증분 크롤링 | 마지막 크롤링 이후 변경된 아티클만 갱신 | 중 |
| PDF 내보내기 | `puppeteer`로 아티클 PDF 변환 | 중 |
| 북마크 기능 | localStorage에 북마크 저장/표시 | 하 |
| 노트 작성 | 아티클별 사용자 메모 추가 | 중 |
| 오프라인 PWA | Service Worker로 완전 오프라인 지원 | 상 |
| Claude AI 연동 | MCP로 아티클 내용 질의응답 | 상 |
