"use client";

import { useTransition } from "react";
import { deleteTodoAction, toggleTodoAction } from "@/app/actions";
import type { Todo } from "@/db/todos";

export default function TodoItem({ todo }: { todo: Todo }) {
  const [pending, startTransition] = useTransition();
  const done = todo.is_done === 1;

  return (
    <li
      className={`flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 transition-opacity ${
        pending ? "opacity-40" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        aria-label={done ? "완료 취소" : "완료로 표시"}
        onChange={() => startTransition(() => toggleTodoAction(todo.id))}
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-blue-600"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`break-words text-[15px] ${
            done ? "text-muted line-through" : ""
          }`}
        >
          {todo.title}
        </p>
        {todo.memo && (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
            {todo.memo}
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={pending}
        aria-label={`"${todo.title}" 삭제`}
        onClick={() => startTransition(() => deleteTodoAction(todo.id))}
        className="shrink-0 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
      >
        삭제
      </button>
    </li>
  );
}
