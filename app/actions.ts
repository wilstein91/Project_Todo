"use server";

import { refresh } from "next/cache";
import * as todos from "@/db/todos";
import type { Todo } from "@/db/todos";
import type { CreateState } from "@/lib/form-state";
import { parseId, parseTodoForm } from "@/lib/todo-input";
import { getCurrentUser } from "@/lib/dal";

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

  const user = await getCurrentUser();
  todos.createTodo(user.id, parsed.value);
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

  const user = await getCurrentUser();
  if (!todos.updateTodo(id, user.id, parsed.value)) {
    return { error: "항목을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다." };
  }

  refresh();
  return { error: null };
}

/**
 * 아래 두 동작은 id 만 받으므로, 로그인한 사람의 것이 맞는지
 * DB 조건(user_id)으로 함께 확인한다. 남의 항목 id 를 넣어도 아무 일도 일어나지 않는다.
 */
export async function toggleTodoAction(id: number): Promise<void> {
  if (!Number.isInteger(id)) throw new Error("잘못된 id");
  const user = await getCurrentUser();
  todos.toggleTodo(id, user.id);
  refresh();
}

/**
 * 삭제. 되돌리기를 위해 지워진 내용을 그대로 돌려준다.
 * 화면은 이 값을 잠시 들고 있다가 '되돌리기' 를 누르면 restore 로 넘긴다.
 */
export async function deleteTodoAction(
  id: number,
): Promise<{ deleted: Todo | null }> {
  if (!Number.isInteger(id)) throw new Error("잘못된 id");
  const user = await getCurrentUser();

  const target = todos.getTodo(id, user.id);
  if (!target) return { deleted: null };

  todos.deleteTodo(id, user.id);
  refresh();
  return { deleted: target };
}

export async function restoreTodoAction(todo: Todo): Promise<void> {
  const user = await getCurrentUser();
  // 넘어온 값을 그대로 믿지 않고, 저장은 항상 이 사용자 소유로 한다
  todos.restoreTodo(user.id, todo);
  refresh();
}
