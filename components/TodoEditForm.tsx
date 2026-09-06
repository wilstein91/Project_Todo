"use client";

import { useId, useState, useTransition } from "react";
import { updateTodoAction } from "@/app/actions";
import type { Todo } from "@/db/todos";
import { MEMO_MAX, TITLE_MAX } from "@/lib/todo-input";
import CategorySelect from "./CategorySelect";
import DueDateInput from "./DueDateInput";

/**
 * 인라인 수정 폼.
 *
 * 저장에 성공하면 스스로 닫혀야 하므로 useActionState 대신
 * useTransition 으로 액션을 직접 호출한다. effect 로 부모 상태를
 * 건드리지 않아도 되고, 실패하면 열린 채 오류만 보여줄 수 있다.
 */
export default function TodoEditForm({
  todo,
  onClose,
}: {
  todo: Todo;
  onClose: () => void;
}) {
  const uid = useId();
  const titleId = `${uid}-title`;
  const memoId = `${uid}-memo`;
  const categoryId = `${uid}-category`;

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTodoAction(formData);
      if (result.error) setError(result.error);
      else onClose();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-xl border border-blue-400 bg-surface p-4 dark:border-blue-800"
    >
      <input type="hidden" name="id" value={todo.id} />

      <label htmlFor={titleId} className="text-sm text-muted">
        할 일
      </label>
      <input
        id={titleId}
        name="title"
        type="text"
        autoComplete="off"
        maxLength={TITLE_MAX}
        defaultValue={todo.title}
        autoFocus
        className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-blue-500"
      />

      <label htmlFor={memoId} className="mt-3 block text-sm text-muted">
        메모
      </label>
      <textarea
        id={memoId}
        name="memo"
        rows={2}
        maxLength={MEMO_MAX}
        defaultValue={todo.memo ?? ""}
        placeholder="메모 (선택)"
        className="mt-1 w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-blue-500"
      />

      <div className="mt-3">
        <DueDateInput
          defaultDate={todo.due_date}
          defaultTime={todo.due_time}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={categoryId} className="text-sm text-muted">
          카테고리
        </label>
        <CategorySelect id={categoryId} defaultValue={todo.category} />
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-lg border border-line px-4 py-1.5 text-sm transition-colors hover:bg-background disabled:opacity-50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
