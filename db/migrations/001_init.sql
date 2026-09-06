-- 001_init.sql — todos 테이블 최초 생성

CREATE TABLE IF NOT EXISTS todos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  memo        TEXT,
  due_date    TEXT,                            -- 'YYYY-MM-DD', NULL = 마감 없음
  due_time    TEXT,                            -- 'HH:MM' 10분 단위, NULL = 시간 미지정
  category    TEXT    NOT NULL DEFAULT 'none',
  is_done     INTEGER NOT NULL DEFAULT 0,
  done_at     TEXT,
  created_at  TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL,

  CHECK (category IN ('none','personal','work','family','etc')),
  CHECK (is_done IN (0,1)),
  -- 날짜 형식: YYYY-MM-DD
  CHECK (due_date IS NULL OR due_date GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  -- 시간 형식: HH:MM 이면서 분이 10의 배수 (마지막 방어선)
  CHECK (due_time IS NULL OR due_time GLOB '[0-2][0-9]:[0-5]0'),
  -- 시간만 있고 날짜가 없는 상태는 금지
  CHECK (due_time IS NULL OR due_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_todos_due  ON todos(due_date, due_time);
CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(is_done);
