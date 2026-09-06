# 무료 SQL 데이터베이스로 옮기기 (Supabase)

지금 이 앱은 **내 PC 안의 SQLite 파일**(`data/todo.db`)에 저장합니다.
나중에 인터넷에서 쓰려면 서버가 접근할 수 있는 DB 가 필요합니다.
이 문서는 **무료 Postgres** 로 옮기는 절차입니다.

- 작성일: 2026-09-06
- 대상: Supabase (Neon 도 절차만 조금 다르고 스키마는 동일)
- 스키마 파일: [`db/postgres/schema.sql`](../db/postgres/schema.sql)

---

## 0. 먼저 알아둘 것

**지금 당장 옮길 필요는 없습니다.** SQLite 도 정식 SQL 데이터베이스이고,
혼자 쓰는 동안은 오히려 더 빠르고 관리할 것이 없습니다.
아래 상황이 되면 그때 옮기면 됩니다.

| 옮겨야 할 때 | 이유 |
|---|---|
| 인터넷에 올려서 다른 기기에서도 쓰고 싶다 | 내 PC 파일에는 밖에서 접근할 수 없다 |
| 여러 사람이 각자 계정으로 쓴다 | 여러 서버가 동시에 같은 DB 를 읽고 써야 한다 |
| 자동 백업이 필요하다 | Supabase 는 백업을 대신 해 준다 |

**무료 요금제의 한계** (2026년 9월 기준, 바뀔 수 있음)

- 저장 용량 500MB — 할 일 앱에는 넘칠 일이 거의 없습니다
- **7일 동안 아무도 접속하지 않으면 프로젝트가 일시정지**됩니다.
  대시보드에서 버튼 한 번으로 다시 켜지지만, 오랜만에 열면 첫 접속이 느립니다.
- 프로젝트 2개까지

---

## 1. Supabase 프로젝트 만들기

1. <https://supabase.com> 접속 → **Start your project** → GitHub 계정으로 로그인
2. **New project** 클릭
3. 입력할 것
   - **Name**: `project-todo`
   - **Database Password**: 새로 만들어 주는 비밀번호를 **꼭 따로 저장**하세요.
     이 값은 나중에 다시 볼 수 없고, 연결 문자열에 들어갑니다.
   - **Region**: `Northeast Asia (Seoul)` — 가까울수록 빠릅니다
4. **Create new project** → 준비되는 데 1~2분 걸립니다

---

## 2. 스키마 만들기

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query**
3. [`db/postgres/schema.sql`](../db/postgres/schema.sql) 파일을 **전체 복사해서 붙여넣기**
4. **Run** (또는 Ctrl+Enter)
5. 왼쪽 **Table Editor** 에 `users` 와 `todos` 두 테이블이 보이면 성공입니다

> 스키마 파일 안에 비밀번호나 계정 정보는 없습니다.
> 계정은 앱을 띄운 뒤 관리자 페이지에서 만듭니다.

---

## 3. 연결 정보를 .env 로 빼기

**연결 문자열을 코드에 직접 쓰면 안 됩니다.** GitHub 이 공개 저장소라면
누구나 DB 에 접속할 수 있게 됩니다.

1. Supabase 대시보드 → **Project Settings** → **Database**
2. **Connection string** 에서 **URI** 를 복사
   (서버에서 접속할 때는 **Connection pooling** 쪽 문자열을 쓰는 것이 좋습니다)
3. `[YOUR-PASSWORD]` 부분을 1단계에서 저장해 둔 비밀번호로 바꿉니다
4. `.env` 파일에 추가합니다 — **`.env` 는 이미 `.gitignore` 에 있어 커밋되지 않습니다**

```bash
# .env
DATABASE_URL=postgresql://postgres.xxxxx:비밀번호@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

5. `.env.example` 에는 **값 없이 이름만** 남깁니다 (이 파일은 커밋됩니다)

```bash
# .env.example
DATABASE_URL=
```

> 비밀번호가 실수로 커밋됐다면, 지우는 것만으로는 부족합니다.
> **Supabase 에서 DB 비밀번호를 새로 발급**하세요. 깃 기록에는 그대로 남습니다.

---

## 4. 코드에서 바꿔야 할 것

지금 코드는 `better-sqlite3` 를 씁니다. Postgres 로 바꾸려면:

### 4-1. 드라이버 교체

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
npm install postgres
```

### 4-2. `db/client.ts` 를 Postgres 연결로

SQLite 는 동기(synchronous)로 동작하지만 Postgres 는 **비동기**입니다.
그래서 `db/todos.ts`, `db/users.ts` 의 함수들이 전부 `async` 가 되고,
부르는 쪽에 `await` 를 붙여야 합니다. **이 부분이 가장 손이 많이 갑니다.**

### 4-3. 파라미터화 쿼리는 그대로 유지

지금도 값을 문자열로 이어 붙이지 않고 파라미터로 넘기고 있습니다.
Postgres 에서도 같은 원칙을 지킵니다. 표기법만 다릅니다.

```ts
// 지금 (better-sqlite3) — 이름 붙은 파라미터
db.prepare("SELECT * FROM todos WHERE user_id = @userId").all({ userId });

// Postgres (postgres.js) — 태그드 템플릿이 자동으로 파라미터화한다
await sql`SELECT * FROM todos WHERE user_id = ${userId}`;
```

> `sql\`... ${userId}\`` 는 문자열을 이어 붙이는 것처럼 보이지만 아닙니다.
> 라이브러리가 값을 파라미터로 분리해서 보냅니다. **직접 문자열을 더하는
> `"... WHERE id = " + id` 같은 코드만 위험합니다.**

### 4-4. 타입 차이 흡수

| 컬럼 | SQLite | Postgres | 할 일 |
|---|---|---|---|
| `due_date` | `'2026-09-10'` 문자열 | `Date` 객체 | 조회 후 `YYYY-MM-DD` 문자열로 변환 |
| `due_time` | `'14:30'` 문자열 | `'14:30:00'` 문자열 | 뒤의 `:00` 을 잘라내기 |
| `is_done` | `0` / `1` | `false` / `true` | 비교문을 `=== true` 로 |

`lib/date.ts` 는 문자열만 다루므로 **그대로 쓸 수 있습니다.**
변환은 `db/` 폴더 안에서만 하면 됩니다.

---

## 5. 데이터 옮기기 (선택)

지금 SQLite 에 들어 있는 할 일을 가져가고 싶다면:

1. 기존 데이터를 CSV 로 뽑습니다

```bash
node --env-file=.env -e "const D=require('better-sqlite3');const db=new D(process.env.DATABASE_PATH);const rows=db.prepare('SELECT * FROM todos').all();require('fs').writeFileSync('todos.csv', Object.keys(rows[0]).join(',')+'\n'+rows.map(r=>Object.values(r).map(v=>JSON.stringify(v??'')).join(',')).join('\n'));console.log(rows.length+'건 내보냄')"
```

2. Supabase **Table Editor → todos → Insert → Import data from CSV**

> `user_id` 값이 새 DB 의 `users.id` 와 맞아야 합니다.
> 먼저 관리자 계정을 만들고, 그 `id` 로 CSV 의 `user_id` 를 맞춘 뒤 넣으세요.

---

## 6. 옮긴 뒤 반드시 확인할 것

- [ ] `.env` 가 커밋되지 않았는지 — `git check-ignore .env` 가 무언가 출력하면 정상
- [ ] `SESSION_SECRET` 을 새로 만들었는지 — `npm run gen:secret`
- [ ] **관리자 비밀번호를 처음 값에서 바꿨는지** ← 가장 중요합니다
- [ ] `users` 와 `todos` 에 **RLS 가 켜져 있는지** (Table Editor 에서 자물쇠 표시)
- [ ] 다른 계정으로 로그인했을 때 남의 할 일이 안 보이는지

---

## Neon 을 쓸 경우

스키마 파일(`db/postgres/schema.sql`)은 **그대로 쓸 수 있습니다.**
다른 점은 이 정도입니다.

| | Supabase | Neon |
|---|---|---|
| SQL 실행 | SQL Editor | SQL Editor |
| 연결 문자열 | Project Settings → Database | Dashboard → Connection Details |
| 일시정지 | 7일 미사용 시 | 5분 미사용 시 자동 절전 (다시 깨어남, 첫 요청만 느림) |
| RLS | 켜야 함 (브라우저 API 가 함께 열림) | 브라우저 API 가 없어 덜 급함 |

Neon 에서는 스키마 파일 맨 아래 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
두 줄을 빼도 됩니다. 다만 켜 두어도 서버 접속에는 영향이 없습니다.
