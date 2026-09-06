-- 002_users.sql — 사용자 계정과 할 일 소유자 연결
--
-- 지금은 내 PC 에서 혼자 쓰지만, 나중에 인터넷에 올리면
-- "이 할 일이 누구 것인지" 가 없으면 모두가 남의 할 일을 보게 된다.
-- 그래서 todos 에 user_id 를 붙인다.

CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  -- 로그인 아이디. COLLATE NOCASE 라 Admin 과 admin 을 같은 것으로 본다
  username       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  -- 평문 비밀번호는 절대 저장하지 않는다. bcrypt 해시만 넣는다
  password_hash  TEXT    NOT NULL,
  role           TEXT    NOT NULL DEFAULT 'member',
  display_name   TEXT,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  last_login_at  TEXT,

  CHECK (role IN ('admin', 'member')),
  CHECK (length(username) BETWEEN 3 AND 30),
  -- 영문·숫자·밑줄만 허용 (허용되지 않은 문자가 하나라도 있으면 거부)
  CHECK (username NOT GLOB '*[^a-zA-Z0-9_]*'),
  -- bcrypt 해시는 항상 $2 로 시작한다. 평문이 잘못 들어가는 것을 막는 최후 방어선
  CHECK (password_hash GLOB '$2[aby]$*' AND length(password_hash) >= 55)
);

-- 소유자. 계정을 지우면 그 사람의 할 일도 함께 사라진다.
-- 기존 데이터가 이미 있으므로 NULL 을 허용하고, 관리자 시드 스크립트가 채운다.
-- (SQLite 는 ALTER TABLE 로 컬럼을 추가할 때 기본값이 NULL 이어야 외래키를 걸 수 있다)
ALTER TABLE todos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
