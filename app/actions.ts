"use server";

import { refresh } from "next/cache";
import * as todos from "@/db/todos";
import type { CreateState } from "@/lib/form-state";

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

  todos.createTodo({ title, memo: memoRaw || null });
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
