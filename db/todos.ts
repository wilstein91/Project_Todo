import { getDb } from "./client";
import { addDays, nowIso, nowTimeLocal, todayLocal } from "@/lib/date";
import { DEFAULT_FILTER, type FilterKey } from "@/lib/filters";
import type { CategoryCode } from "@/lib/categories";
import type { TodoInput } from "@/lib/todo-input";

export type Todo = {
  id: number;
  title: string;
  memo: string | null;
  due_date: string | null; // 'YYYY-MM-DD'
  due_time: string | null; // 'HH:MM' (10분 단위)
  category: CategoryCode;
  is_done: 0 | 1;
  done_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 정렬 규칙 (계획서 3장)
 *  1. 미완료 먼저
 *  2. 마감 있는 것 먼저, 이른 날짜 순
 *  3. 같은 날짜 안에서는 시간 지정된 것 먼저, 이른 시간 순
 *  4. 그 외에는 최근에 만든 것 먼저
 *
 * created_at 은 밀리초 단위여서 한꺼번에 만들면 값이 같아질 수 있다.
 * 동률일 때 순서가 뒤섞이지 않도록 id 를 최종 기준으로 둔다.
 */
const ORDER_BY = `
  ORDER BY
    is_done ASC,
    due_date IS NULL,
    due_date ASC,
    due_time IS NULL,
    due_time ASC,
    created_at DESC,
    id DESC
`;

/** 목록을 좁히는 조건들 */
export type ListQuery = {
  filter?: FilterKey;
  /** null 이면 카테고리 제한 없음 */
  category?: CategoryCode | null;
  /** 빈 문자열이면 검색 없음 */
  q?: string;
};

type Bind = Record<string, string>;

/**
 * LIKE 패턴에서 특수문자를 무력화한다.
 * 이스케이프하지 않으면 검색어에 들어간 % 나 _ 가 와일드카드로 동작해
 * 엉뚱한 결과가 나온다.
 */
function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => "\\" + c);
}

/** 완료 여부·마감 기준 조건 (필터 탭) */
function statusCondition(filter: FilterKey): { sql: string; bind: Bind } {
  const today = todayLocal();

  switch (filter) {
    case "week":
      // 오늘부터 7일 이내에 마감인 미완료 항목 (시간은 따지지 않는다)
      return {
        sql: `is_done = 0
              AND due_date IS NOT NULL
              AND due_date >= @today
              AND due_date <= @weekEnd`,
        bind: { today, weekEnd: addDays(today, 7) },
      };

    case "overdue":
      // 날짜가 지났거나, 오늘이면서 마감 시각이 이미 지난 미완료 항목
      return {
        sql: `is_done = 0
              AND (due_date < @today
                   OR (due_date = @today
                       AND due_time IS NOT NULL
                       AND due_time < @nowTime))`,
        bind: { today, nowTime: nowTimeLocal() },
      };

    case "done":
      return { sql: "is_done = 1", bind: {} };

    default:
      return { sql: "", bind: {} };
  }
}

/** 카테고리·검색어 조건 (필터 탭과 무관하게 함께 적용된다) */
function scopeConditions(query: ListQuery): { sql: string[]; bind: Bind } {
  const sql: string[] = [];
  const bind: Bind = {};

  if (query.category) {
    sql.push("category = @category");
    bind.category = query.category;
  }

  if (query.q) {
    // 제목과 메모를 함께 찾는다. 한글은 부분 일치가 정상 동작한다.
    sql.push(
      `(title LIKE @q ESCAPE '\\' OR IFNULL(memo, '') LIKE @q ESCAPE '\\')`,
    );
    bind.q = `%${escapeLike(query.q)}%`;
  }

  return { sql, bind };
}

function whereClause(parts: string[]): string {
  const kept = parts.filter((p) => p.length > 0);
  return kept.length > 0 ? `WHERE ${kept.join("\n            AND ")}` : "";
}

export function listTodos(query: ListQuery = {}): Todo[] {
  const status = statusCondition(query.filter ?? DEFAULT_FILTER);
  const scope = scopeConditions(query);

  const where = whereClause([status.sql, ...scope.sql]);
  const bind = { ...status.bind, ...scope.bind };

  const stmt = getDb().prepare(`SELECT * FROM todos ${where} ${ORDER_BY}`);
  // better-sqlite3 는 바인딩할 값이 없을 때 빈 객체를 넘기면 오류가 난다
  return (
    Object.keys(bind).length > 0 ? stmt.all(bind) : stmt.all()
  ) as Todo[];
}

export type Counts = Record<FilterKey, number>;

/**
 * 필터 탭에 표시할 건수를 한 번의 쿼리로 모두 센다.
 *
 * 카테고리·검색어는 반영하되 필터 탭 자체는 반영하지 않는다.
 * (검색 중이면 "그 검색 결과 안에서 이번 주가 몇 건인지"를 보여준다)
 */
export function countTodos(query: Omit<ListQuery, "filter"> = {}): Counts {
  const today = todayLocal();
  const scope = scopeConditions(query);
  const where = whereClause(scope.sql);

  const row = getDb()
    .prepare(
      `SELECT
         COUNT(*) AS all_count,
         -- SUM 은 대상 행이 없으면 0 이 아니라 NULL 을 돌려주므로 COALESCE 로 감싼다
         COALESCE(SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END), 0) AS done,
         COALESCE(SUM(CASE WHEN is_done = 0
                            AND due_date IS NOT NULL
                            AND due_date >= @today
                            AND due_date <= @weekEnd
                           THEN 1 ELSE 0 END), 0) AS week,
         COALESCE(SUM(CASE WHEN is_done = 0
                            AND (due_date < @today
                                 OR (due_date = @today
                                     AND due_time IS NOT NULL
                                     AND due_time < @nowTime))
                           THEN 1 ELSE 0 END), 0) AS overdue
       FROM todos
       ${where}`,
    )
    .get({
      today,
      weekEnd: addDays(today, 7),
      nowTime: nowTimeLocal(),
      ...scope.bind,
    }) as {
    all_count: number;
    done: number;
    week: number;
    overdue: number;
  };

  return {
    all: row.all_count,
    week: row.week,
    overdue: row.overdue,
    done: row.done,
  };
}

export function getTodo(id: number): Todo | undefined {
  return getDb().prepare("SELECT * FROM todos WHERE id = ?").get(id) as
    | Todo
    | undefined;
}

export function createTodo(input: TodoInput): number {
  const now = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO todos (title, memo, due_date, due_time, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.memo,
      input.dueDate,
      input.dueTime,
      input.category,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

/** 완료 여부는 체크박스로 따로 다루므로 여기서 건드리지 않는다. */
export function updateTodo(id: number, input: TodoInput): boolean {
  const changes = getDb()
    .prepare(
      `UPDATE todos
       SET title      = ?,
           memo       = ?,
           due_date   = ?,
           due_time   = ?,
           category   = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .run(
      input.title,
      input.memo,
      input.dueDate,
      input.dueTime,
      input.category,
      nowIso(),
      id,
    ).changes;
  return changes > 0;
}

/** 완료/미완료를 뒤집는다. 완료 시각(done_at)도 함께 관리한다. */
export function toggleTodo(id: number): void {
  const now = nowIso();
  getDb()
    .prepare(
      `UPDATE todos
       SET is_done    = CASE is_done WHEN 1 THEN 0 ELSE 1 END,
           done_at    = CASE is_done WHEN 1 THEN NULL ELSE ? END,
           updated_at = ?
       WHERE id = ?`,
    )
    .run(now, now, id);
}

export function deleteTodo(id: number): void {
  getDb().prepare("DELETE FROM todos WHERE id = ?").run(id);
}
