"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { createTodoAction } from "@/app/actions";
import { initialCreateState } from "@/lib/form-state";
import { MEMO_MAX, TITLE_MAX } from "@/lib/todo-input";
import CategorySelect from "./CategorySelect";
import DueDateInput from "./DueDateInput";

export default function TodoForm() {
  const [state, formAction, pending] = useActionState(
    createTodoAction,
    initialCreateState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const memoId = `${uid}-memo`;
  const categoryId = `${uid}-category`;

  // 추가에 성공했을 때만 입력란을 비운다 (검증 실패 시에는 입력 내용을 남긴다)
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok, state.submitCount]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      <label htmlFor={titleId} className="sr-only">
        할 일
      </label>
      <div className="flex gap-2">
        <input
          id={titleId}
          name="title"
          type="text"
          autoComplete="off"
          maxLength={TITLE_MAX}
          placeholder="무엇을 해야 하나요?"
          aria-invalid={state.error ? true : undefined}
          className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-muted focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-[15px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {pending ? "추가 중…" : "추가"}
        </button>
      </div>

      <label htmlFor={memoId} className="sr-only">
        메모
      </label>
      <textarea
        id={memoId}
        name="memo"
        rows={2}
        maxLength={MEMO_MAX}
        placeholder="메모 (선택)"
        className="mt-2 w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-blue-500"
      />

      {/* 추가 성공 시 key 가 바뀌어 다시 마운트되고, 마감일 입력이 초기화된다 */}
      <div className="mt-2">
        <DueDateInput key={state.submitCount} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label htmlFor={categoryId} className="text-sm text-muted">
          카테고리
        </label>
        <CategorySelect key={state.submitCount} id={categoryId} />
      </div>

      {state.error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
