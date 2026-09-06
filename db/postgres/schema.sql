-- ============================================================
--  Project_Todo — PostgreSQL 스키마 (Supabase / Neon 공용)
-- ============================================================
--
--  쓰는 법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 실행.
--           자세한 절차는 docs/supabase-setup.md 참고.
--
--  이 파일은 지금 돌아가는 SQLite 스키마(db/migrations/*.sql)와 같은 내용을
--  PostgreSQL 문법으로 옮긴 것이다. 다른 점은 파일 아래쪽 주석에 정리했다.
--
--  주의: 비밀번호는 절대 이 파일에 넣지 않는다. 계정은 앱의 관리자 페이지에서
--        만들고, DB 에는 bcrypt 해시만 저장된다.
-- ============================================================


-- ── 1. 사용자 ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- citext 확장 없이 대소문자를 무시하려면 lower() 유니크 인덱스를 쓴다 (아래)
  username       text        NOT NULL,
  -- 평문 비밀번호는 절대 저장하지 않는다. bcrypt 해시만 넣는다.
  password_hash  text        NOT NULL,
  role           text        NOT NULL DEFAULT 'member',
  display_name   text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at  timestamptz,

  CONSTRAINT users_role_valid
    CHECK (role IN ('admin', 'member')),
  CONSTRAINT users_username_format
    CHECK (username ~ '^[A-Za-z0-9_]{3,30}$'),
  -- bcrypt 해시는 $2a/$2b/$2y 로 시작하는 60자다.
  -- 평문이 실수로 들어오는 것을 막는 최후 방어선.
  CONSTRAINT users_password_is_hash
    CHECK (password_hash ~ '^\$2[aby]\$' AND length(password_hash) >= 55)
);

-- 대소문자를 무시한 아이디 유일성 (Admin 과 admin 을 같은 것으로 본다)
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON users (lower(username));


-- ── 2. 할 일 ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS todos (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- 소유자. 계정을 지우면 그 사람의 할 일도 함께 사라진다.
  user_id     bigint      NOT NULL
                          REFERENCES users(id) ON DELETE CASCADE,

  title       text        NOT NULL,
  memo        text,

  -- 마감일(선택)과 마감 시간(선택). 시간은 10분 단위만 허용한다.
  due_date    date,
  due_time    time,

  category    text        NOT NULL DEFAULT 'none',
  is_done     boolean     NOT NULL DEFAULT false,
  done_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT todos_title_not_blank
    CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  CONSTRAINT todos_memo_length
    CHECK (memo IS NULL OR length(memo) <= 2000),
  CONSTRAINT todos_category_valid
    CHECK (category IN ('none', 'personal', 'work', 'family', 'etc')),

  -- 마감 시간은 10분 단위 (초 단위는 0)
  CONSTRAINT todos_due_time_ten_minutes
    CHECK (
      due_time IS NULL
      OR (EXTRACT(MINUTE FROM due_time)::int % 10 = 0
          AND EXTRACT(SECOND FROM due_time) = 0)
    ),
  -- 시간만 있고 날짜가 없는 상태는 금지
  CONSTRAINT todos_time_requires_date
    CHECK (due_time IS NULL OR due_date IS NOT NULL),
  -- 완료 시각은 완료 상태일 때만 존재한다
  CONSTRAINT todos_done_at_matches_state
    CHECK ((is_done AND done_at IS NOT NULL) OR (NOT is_done AND done_at IS NULL))
);

-- 자주 쓰는 조회 경로에 맞춘 인덱스
CREATE INDEX IF NOT EXISTS todos_user_due_idx
  ON todos (user_id, due_date, due_time);
CREATE INDEX IF NOT EXISTS todos_user_done_idx
  ON todos (user_id, is_done);
CREATE INDEX IF NOT EXISTS todos_user_category_idx
  ON todos (user_id, category);

-- 검색(제목·메모 부분 일치)을 빠르게 하려면 pg_trgm 을 켠다.
-- 데이터가 수천 건을 넘기 전에는 없어도 충분히 빠르다.
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX todos_search_idx
--   ON todos USING gin ((title || ' ' || coalesce(memo, '')) gin_trgm_ops);


-- ── 3. updated_at 자동 갱신 ─────────────────────────────────
-- SQLite 판에서는 앱 코드가 직접 넣어 준다. Postgres 에서는 트리거로
-- 강제해 두면 어느 경로로 수정하든 값이 어긋나지 않는다.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS todos_set_updated_at ON todos;
CREATE TRIGGER todos_set_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 4. Row Level Security ───────────────────────────────────
--
-- 이 앱은 서버(Next.js)에서만 DB 에 연결하고, 모든 쿼리에 user_id 조건을
-- 직접 넣는다. 그래도 RLS 를 켜 두면 실수로 조건을 빠뜨렸을 때의 안전망이 된다.
-- 특히 Supabase 는 브라우저에서 바로 접근할 수 있는 API 를 함께 제공하므로,
-- RLS 를 켜지 않으면 테이블이 인터넷에 그대로 열릴 수 있다.
--
-- 아래는 "브라우저에서 오는 요청은 전부 막는다" 는 가장 단순한 설정이다.
-- 서버는 service_role 키(또는 직접 연결 문자열)로 접속하므로 영향받지 않는다.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
-- 정책을 하나도 만들지 않으면 기본이 '거부' 다. 즉 이대로 두면 막힌다.


-- ============================================================
--  SQLite 판과 달라진 점
-- ============================================================
--
--  1. id          : INTEGER AUTOINCREMENT -> bigint IDENTITY
--  2. 날짜/시간   : TEXT('YYYY-MM-DD') -> date / time / timestamptz
--                   앱 코드는 문자열을 기대하므로, 옮길 때
--                   조회 결과를 문자열로 바꿔 주는 부분이 필요하다.
--                   (docs/supabase-setup.md 의 '코드에서 바꿔야 할 것' 참고)
--  3. is_done     : INTEGER(0/1) -> boolean
--  4. 문자열 검사 : GLOB -> 정규식(~)
--  5. 아이디 대소문자 무시 : COLLATE NOCASE -> lower() 유니크 인덱스
--  6. updated_at  : 앱이 직접 갱신 -> 트리거가 자동 갱신
--  7. RLS         : SQLite 에는 없는 개념 (위 4번 참고)
-- ============================================================
