"use server";

import { refresh } from "next/cache";
import * as todos from "@/db/todos";
import type { CreateState } from "@/lib/form-state";
import { isTenMinuteStep, isValidDateStr, isValidTimeStr } from "@/lib/date";

const TITLE_MAX = 200;
const MEMO_MAX = 2000;

/** 할 일 추가. useActionState 와 함께 쓰므로 첫 인자가 이전 상태다. */
export async function createTodoAction(
  prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const title = String(formData.get("title") ?? "").trim();
  const memoRaw = String(formData.get("memo") ?? "").trim();

  const fail = (error: string): CreateState => ({
    ok: false,
    error,
    submitCount: prev.submitCount,
  });

  if (!title) return fail("할 일 내용을 입력해 주세요.");
  if (title.length > TITLE_MAX) {
    return fail(`할 일은 ${TITLE_MAX}자 이내로 입력해 주세요.`);
  }
  if (memoRaw.length > MEMO_MAX) {
    return fail(`메모는 ${MEMO_MAX}자 이내로 입력해 주세요.`);
  }

  // 마감일 (선택)
  const dueDateRaw = String(formData.get("due_date") ?? "").trim();
  let dueDate: string | null = null;
  if (dueDateRaw) {
    if (!isValidDateStr(dueDateRaw)) {
      return fail("마감일이 올바른 날짜가 아닙니다.");
    }
    dueDate = dueDateRaw;
  }

  // 마감 시간 (선택) — 브라우저 step 만 믿지 않고 서버에서 다시 검사한다
  const dueTimeRaw = String(formData.get("due_time") ?? "").trim();
  let dueTime: string | null = null;
  if (dueTimeRaw) {
    if (!dueDate) {
      return fail("마감 시간을 넣으려면 마감일을 먼저 선택해 주세요.");
    }
    if (!isValidTimeStr(dueTimeRaw)) {
      return fail("마감 시간이 올바른 시각이 아닙니다.");
    }
    if (!isTenMinuteStep(dueTimeRaw)) {
      return fail("마감 시간은 10분 단위로 입력해 주세요. (예: 14:30)");
    }
    dueTime = dueTimeRaw;
  }

  todos.createTodo({ title, memo: memoRaw || null, dueDate, dueTime });
  refresh();

  return { ok: true, error: null, submitCount: prev.submitCount + 1 };
}

export async function toggleTodoAction(id: number): Promise<void> {
  if (!Number.isInteger(id)) throw new Error("잘못된 id");
  todos.toggleTodo(id);
  refresh();
}

export async function deleteTodoAction(id: number): Promise<void> {
  if (!Number.isInteger(id)) throw new Error("잘못된 id");
  todos.deleteTodo(id);
  refresh();
}
