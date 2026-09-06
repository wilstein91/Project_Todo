import { getDb } from "./client";
import { addDays, nowIso, nowTimeLocal, todayLocal } from "@/lib/date";
import { DEFAULT_FILTER, type FilterKey } from "@/lib/filters";
import { DEFAULT_CATEGORY, type CategoryCode } from "@/lib/categories";

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

/** 필터별 WHERE 절과 바인딩 값. 기준 날짜/시각은 항상 로컬(KST)이다. */
function buildWhere(filter: FilterKey): {
  where: string;
  params: Record<string, string>;
} {
  const today = todayLocal();

  switch (filter) {
    case "week":
      // 오늘부터 7일 이내에 마감인 미완료 항목 (시간은 따지지 않는다)
      return {
        where: `WHERE is_done = 0
                  AND due_date IS NOT NULL
                  AND due_date >= @today
                  AND due_date <= @weekEnd`,
        params: { today, weekEnd: addDays(today, 7) },
      };

    case "overdue":
      // 날짜가 지났거나, 오늘이면서 마감 시각이 이미 지난 미완료 항목
      return {
        where: `WHERE is_done = 0
                  AND (due_date < @today
                       OR (due_date = @today
                           AND due_time IS NOT NULL
                           AND due_time < @nowTime))`,
        params: { today, nowTime: nowTimeLocal() },
      };

    case "done":
      return { where: "WHERE is_done = 1", params: {} };

    default:
      return { where: "", params: {} };
  }
}

export function listTodos(filter: FilterKey = DEFAULT_FILTER): Todo[] {
  const { where, params } = buildWhere(filter);
  const stmt = getDb().prepare(`SELECT * FROM todos ${where} ${ORDER_BY}`);
  // better-sqlite3 는 바인딩할 값이 없을 때 빈 객체를 넘기면 오류가 난다
  return (
    Object.keys(params).length > 0 ? stmt.all(params) : stmt.all()
  ) as Todo[];
}

export type Counts = Record<FilterKey, number>;

/** 탭에 표시할 건수를 한 번의 쿼리로 모두 센다. */
export function countTodos(): Counts {
  const today = todayLocal();
  const row = getDb()
    .prepare(
      `SELECT
         COUNT(*) AS all_count,
         SUM(CASE WHEN is_done = 1 THEN 1 ELSE 0 END) AS done,
         SUM(CASE WHEN is_done = 0
                   AND due_date IS NOT NULL
                   AND due_date >= @today
                   AND due_date <= @weekEnd
                  THEN 1 ELSE 0 END) AS week,
         SUM(CASE WHEN is_done = 0
                   AND (due_date < @today
                        OR (due_date = @today
                            AND due_time IS NOT NULL
                            AND due_time < @nowTime))
                  THEN 1 ELSE 0 END) AS overdue
       FROM todos`,
    )
    .get({
      today,
      weekEnd: addDays(today, 7),
      nowTime: nowTimeLocal(),
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

export function createTodo(input: {
  title: string;
  memo?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  category?: CategoryCode;
}): number {
  const now = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO todos (title, memo, due_date, due_time, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.memo ?? null,
      input.dueDate ?? null,
      input.dueTime ?? null,
      input.category ?? DEFAULT_CATEGORY,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
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
