"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTodoAction } from "@/app/actions";
import { initialCreateState } from "@/lib/form-state";

export default function TodoForm() {
  const [state, formAction, pending] = useActionState(
    createTodoAction,
    initialCreateState,
  );
  const formRef = useRef<HTMLFormElement>(null);

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
      <label htmlFor="title" className="sr-only">
        할 일
      </label>
      <div className="flex gap-2">
        <input
          id="title"
          name="title"
          type="text"
          autoComplete="off"
          maxLength={200}
          placeholder="무엇을 해야 하나요?"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "title-error" : undefined}
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

      <label htmlFor="memo" className="sr-only">
        메모
      </label>
      <textarea
        id="memo"
        name="memo"
        rows={2}
        maxLength={2000}
        placeholder="메모 (선택)"
        className="mt-2 w-full resize-y rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-blue-500"
      />

      {state.error && (
        <p id="title-error" role="alert" className="mt-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
