"use server";

import { refresh } from "next/cache";
import * as todos from "@/db/todos";
import type { CreateState } from "@/lib/form-state";
import { parseId, parseTodoForm } from "@/lib/todo-input";

/**
 * 할 일 추가. useActionState 와 함께 쓰므로 첫 인자가 이전 상태다.
 * 검증은 lib/todo-input 에서 수정과 공유한다.
 */
export async function createTodoAction(
  prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const parsed = parseTodoForm(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, submitCount: prev.submitCount };
  }

  todos.createTodo(parsed.value);
  refresh();

  return { ok: true, error: null, submitCount: prev.submitCount + 1 };
}

/**
 * 할 일 수정.
 *
 * 편집 폼은 저장에 성공하면 스스로 닫혀야 해서 useTransition 으로 직접
 * 호출한다. 그래서 useActionState 와 달리 이전 상태를 받지 않는다.
 */
export async function updateTodoAction(
  formData: FormData,
): Promise<{ error: string | null }> {
  const id = parseId(formData);
  if (id === null) return { error: "잘못된 항목입니다." };

  const parsed = parseTodoForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  if (!todos.updateTodo(id, parsed.value)) {
    return { error: "항목을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다." };
  }

  refresh();
  return { error: null };
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
