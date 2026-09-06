import { getDb } from "./client";
import { nowIso } from "@/lib/date";
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

export function listTodos(): Todo[] {
  return getDb().prepare(`SELECT * FROM todos ${ORDER_BY}`).all() as Todo[];
}

export function countTodos(): { total: number; done: number } {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(is_done), 0) AS done
       FROM todos`,
    )
    .get() as { total: number; done: number };
}

export function createTodo(input: {
  title: string;
  memo?: string | null;
  category?: CategoryCode;
}): number {
  const now = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO todos (title, memo, category, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      input.title,
      input.memo ?? null,
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
