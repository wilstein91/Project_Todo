# Project_Todo

내 컴퓨터에서 도는 개인용 할 일(Todo) 관리 앱.

계획서: [Project_Todo.md](Project_Todo.md) · 클라우드 DB 이전 가이드: [docs/supabase-setup.md](docs/supabase-setup.md)

---

## 무엇을 할 수 있나

- **할 일 관리** — 추가 / 목록 / 수정 / 완료 표시 / 삭제 (되돌리기 5초)
- **마감일과 시간** — 시간은 선택이며 **10분 단위**로만 입력
- **마감 하이라이트** — 지남(빨강) · 오늘(주황) · D-1~3(노랑) · D-4~7(옅게)
- **필터** — 전체 / 이번 주 / 지남 / 완료, 건수와 함께 표시
- **카테고리** — 미분류 · 개인 · 업무 · 경조사 · 기타
- **검색** — 제목과 메모에서 부분 일치
- **달력 뷰** — 월간 격자, 날짜를 누르면 그날 목록
- **계정** — 로그인, 사람마다 자기 할 일만 보임. 계정 생성은 관리자만

필터·검색·보기 방식은 모두 주소(URL)에 남아, 새로고침하거나 즐겨찾기해도 그대로 유지됩니다.

---

## 시작하기

### 준비물

- [Node.js](https://nodejs.org) 20 이상 (개발에 쓴 버전: 24)
- 그 외에는 없습니다. 데이터베이스도 따로 설치하지 않습니다.

### 설치

```bash
npm install
```

### 환경변수 만들기

`.env.example` 을 `.env` 로 복사한 뒤 값을 채웁니다.
**`.env` 는 커밋되지 않습니다** (`.gitignore` 에 있음).

```bash
cp .env.example .env
```

세션 서명 키를 만들어 `.env` 의 `SESSION_SECRET=` 뒤에 붙여넣습니다.

```bash
npm run gen:secret
```

`.env` 는 이렇게 됩니다.

```bash
DATABASE_PATH=./data/todo.db
SESSION_SECRET=여기에_방금_만든_긴_문자열
ADMIN_USERNAME=admin
ADMIN_PASSWORD=원하는_비밀번호
```

### 관리자 계정 만들기

```bash
npm run db:seed-admin
```

`.env` 의 아이디·비밀번호로 관리자 계정을 만듭니다.
**비밀번호는 bcrypt 해시로만 저장되며, DB 에도 화면에도 평문은 남지 않습니다.**

### 실행

```bash
npm run dev
```

<http://localhost:3100> 을 열고 관리자 계정으로 로그인합니다.

### 샘플 데이터 (선택)

화면을 채워 보고 싶으면:

```bash
npm run db:seed-sample
```

---

## ⚠️ 인터넷에 올리기 전에 꼭

이 앱은 **내 PC 에서 혼자 쓰는 것**을 전제로 만들었습니다.
남들이 접근할 수 있는 곳에 올린다면 아래를 먼저 처리하세요.

1. **관리자 비밀번호를 바꾸세요.**
   처음 `.env` 에 넣은 값은 학습용으로 짧게 정한 것이라 매우 약합니다.
   비밀번호 최소 길이도 6자로 낮춰 두었습니다(`lib/user-input.ts` 의 `PASSWORD_MIN`).
   공개 서비스라면 12자 이상을 권합니다.
   `.env` 의 `ADMIN_PASSWORD` 를 바꾼 뒤 `npm run db:seed-admin` 을 다시 실행하면
   기존 계정의 비밀번호가 새 값으로 맞춰집니다.
2. **`SESSION_SECRET` 을 새로 만드세요.** 이 값이 새어나가면 로그인 상태를 위조당합니다.
3. **`.env` 가 깃에 올라가지 않았는지 확인하세요.**
   ```bash
   git check-ignore .env    # 무언가 출력되면 정상(무시되고 있음)
   ```
4. **HTTPS 로 서비스하세요.** 세션 쿠키의 `secure` 옵션은 운영 환경에서만 켜집니다.
5. **DB 를 옮기세요.** SQLite 파일은 서버 한 대에 묶여 있습니다.
   → [docs/supabase-setup.md](docs/supabase-setup.md)

---

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (포트 3100) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | 코드 검사 |
| `npm run gen:secret` | `SESSION_SECRET` 용 임의 문자열 생성 |
| `npm run db:seed-admin` | `.env` 값으로 관리자 계정 만들기 |
| `npm run db:seed-sample` | 샘플 할 일 넣기 (`-- 아이디` 로 대상 지정) |

---

## 폴더 구조

```
app/            화면과 서버 동작(Server Actions)
  page.tsx        할 일 목록 / 달력
  login/          로그인
  admin/users/    계정 관리 (관리자 전용)
components/     화면 조각
db/
  client.ts       SQLite 연결과 마이그레이션 실행
  migrations/     번호 붙인 스키마 변경 파일
  postgres/       나중에 옮길 때 쓸 PostgreSQL 스키마
  todos.ts        할 일 조회·저장
  users.ts        계정 조회·저장
lib/
  dal.ts          로그인 확인 (모든 데이터 접근이 여기를 거침)
  session.ts      세션 쿠키 (jose 로 서명)
  password.ts     비밀번호 해싱 (bcryptjs)
  date.ts         날짜 계산, D-day 판정, 달력 격자
  todo-input.ts   할 일 입력 검증 (추가·수정 공용)
  query.ts        URL 쿼리 파라미터 <-> 화면 상태
proxy.ts        로그인 안 한 요청을 로그인 화면으로 (Next 16 의 middleware)
scripts/        관리용 스크립트
docs/           문서
```

---

## 만들면서 지킨 것

- **비밀값은 코드에 넣지 않는다.** DB 경로·세션 키·관리자 계정 모두 `.env` 에 있고,
  `.env.example` 에는 이름만 남깁니다.
- **비밀번호는 해시로만 저장한다.** bcrypt(cost 10). 평문은 어디에도 남기지 않습니다.
- **쿼리는 항상 파라미터로 넘긴다.** 값을 문자열로 이어 붙이지 않아 SQL 인젝션을 막습니다.
  검색어의 `%`, `_` 도 이스케이프합니다.
- **인증은 직접 만들지 않는다.** 서명은 `jose`, 해싱은 `bcryptjs` 에 맡기고
  구조는 Next.js 공식 인증 가이드의 DAL 패턴을 따릅니다.
- **남의 데이터에 손댈 수 없게 한다.** 모든 조회·수정·삭제 쿼리에 `user_id` 조건이 들어갑니다.
  항목 번호를 바꿔 요청해도 남의 것은 건드려지지 않습니다.
- **권한은 화면이 아니라 서버에서 확인한다.** 관리자 동작은 `requireAdmin()` 을 먼저 거칩니다.

---

## 기술 스택

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · SQLite(better-sqlite3) · jose · bcryptjs

모두 무료이고, 계정 없이 내 PC 에서 바로 돌아갑니다.
