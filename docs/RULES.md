# RULES.md — 개발 규칙 및 컨벤션

## 1. 일반 원칙

- **단순성 우선**: 불필요한 추상화, 유틸리티 함수, 설계 패턴 도입 금지.
- **파일 추가 전 확인**: 기존 파일을 수정할 수 있는지 먼저 확인한다.
- **주석 최소화**: 코드 자체로 의도가 명확할 경우 주석 생략. WHY가 불명확한 경우에만 작성.
- **로컬 환경 가정**: 서버 배포, 멀티 사용자, 인증은 고려하지 않는다.

## 2. 파일 및 디렉토리 규칙

| 규칙 | 내용 |
|------|------|
| `data/` 직접 편집 금지 | 크롤러 스크립트로만 생성/갱신 |
| `data/sites/{siteId}/` | 사이트별 독립 데이터 디렉토리 |
| `data/registry.json` | 등록 사이트 목록 (자동 생성) |
| `crawler/` | CommonJS (`.js`), 숫자 prefix (기존) 또는 `generic/` 서브디렉토리 (신규) |
| `crawler/generic/` | 제너릭 크롤러, CommonJS |
| `site/components/` | PascalCase `.tsx` 컴포넌트 파일만 |
| `site/lib/` | camelCase `.ts` 서버 유틸만 |
| `site/app/admin/` | admin 라우트, 별도 layout.tsx 필수 |
| `docs/` | 이 폴더에 문서 일괄 보관 |

## 3. 크롤러 규칙

### 요청 규칙
- 요청 간 딜레이 **최소 1,200ms** 유지
- `User-Agent` 헤더 반드시 명시: `JS-Learning-Bot/1.0`
- 타임아웃 **15,000ms** 이상 설정
- 실패 시 지수 백오프 재시도 (최대 3회)

### 파일 저장 규칙
- 아티클 파일명: `{slug}.md` (슬러그는 URL 경로 그대로 사용)
- 이미지 경로: `data/images/{slug}/{filename}`
- 기존 파일 존재 시 스킵 (덮어쓰기 금지)
- 실패 아티클은 `data/errors.json`에 누적 기록

### Frontmatter 규칙
- 모든 값은 `JSON.stringify()` 포맷 사용 (따옴표 이스케이프 자동 처리)
- 필수 필드: `title`, `slug`, `url`, `part`, `partTitle`, `chapter`, `globalOrder`, `prev`, `next`

## 4. 사이트(Next.js) 규칙

### 컴포넌트 규칙
- 서버 컴포넌트가 기본. 클라이언트 전용 기능(useState, useEffect, localStorage)이 필요할 때만 `"use client"` 선언.
- Props 타입은 컴포넌트 파일 내 `interface`로 정의.
- 컴포넌트 export는 `export default function ComponentName`.

### 데이터 접근 규칙
- DB 접근은 `site/lib/db.ts`만 담당. 컴포넌트에서 직접 `better-sqlite3` import 금지.
- 파일 읽기는 `site/lib/articles.ts`, `site/lib/toc.ts`를 통해서만.
- 사이트별 데이터 경로: `site/lib/registry.ts`의 `getSiteDataDir(siteId)` 사용.
- siteId 파라미터 기본값은 반드시 `DEFAULT_SITE_ID` 상수로 지정 (하드코딩 금지).

### API Route 규칙
- API는 `app/api/{route}/route.ts` 구조.
- 반환 형식: `Response.json(data)`.
- 에러는 빈 배열/객체 반환 (500 에러 대신 graceful fallback).

### 스타일 규칙
- Tailwind CSS v4 클래스만 사용.
- 인라인 `style={{}}` 속성 금지.
- 다크모드: `dark:` prefix 클래스로 처리.
- 색상 팔레트: 노란색(`yellow`) 계열 = 강조색, 회색 계열 = 기본 텍스트/배경.

## 5. Git 규칙

### .gitignore 필수 항목
```
data/          # 크롤링 데이터 (용량 큼, 재생성 가능)
node_modules/
site/node_modules/
site/.next/
```

### 커밋 메시지
```
feat: [크롤러/사이트] 기능 설명
fix: [크롤러/사이트] 버그 설명
docs: 문서 업데이트
refactor: 코드 정리
```

## 6. 금지 패턴

```js
// ❌ 크롤러에서 ESM import
import axios from 'axios';

// ✅ CommonJS require
const axios = require('axios');
```

```ts
// ❌ 컴포넌트에서 직접 DB 접근
import Database from 'better-sqlite3';

// ✅ lib를 통해 접근
import { searchArticles } from '@/lib/db';
```

```ts
// ❌ any 타입
const meta: any = {};

// ✅ 구체적인 타입 또는 Record
const meta: Record<string, unknown> = {};
```

```ts
// ❌ 인라인 스타일
<div style={{ color: 'red' }}>

// ✅ Tailwind 클래스
<div className="text-red-500">
```

## 7. 성능 가이드라인

| 항목 | 목표 | 방법 |
|------|------|------|
| 아티클 페이지 로드 | < 200ms | SSG + 정적 파일 |
| 검색 응답 | < 100ms | SQLite FTS5 인덱스 |
| 코드 하이라이팅 | 빌드 시 | Shiki 서버 사이드 |
| 이미지 로드 | 로컬 파일 | 크롤링 시 다운로드 |
