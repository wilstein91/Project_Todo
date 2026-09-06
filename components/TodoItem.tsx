"use client";

import { useState, useTransition } from "react";
import { deleteTodoAction, toggleTodoAction } from "@/app/actions";
import type { Todo } from "@/db/todos";
import type { DueStatus } from "@/lib/date";
import CategoryBadge from "./CategoryBadge";
import DueBadge from "./DueBadge";
import TodoEditForm from "./TodoEditForm";

/** 마감이 급한 항목은 테두리로도 드러낸다 */
const BORDER_STYLE: Record<string, string> = {
  overdue: "border-red-300 dark:border-red-900",
  today: "border-orange-300 dark:border-orange-900",
  soon: "border-amber-300 dark:border-amber-900",
};

export default function TodoItem({
  todo,
  dueStatus,
}: {
  todo: Todo;
  dueStatus: DueStatus;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li>
        <TodoEditForm todo={todo} onClose={() => setEditing(false)} />
      </li>
    );
  }

  const done = todo.is_done === 1;
  const border = BORDER_STYLE[dueStatus.kind] ?? "border-line";

  return (
    <li
      className={`flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 transition-opacity ${border} ${
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={`break-words text-[15px] ${
              done ? "text-muted line-through" : ""
            }`}
          >
            {todo.title}
          </p>
          <CategoryBadge code={todo.category} />
        </div>

        <DueBadge status={dueStatus} />

        {todo.memo && (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">
            {todo.memo}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-0.5">
        <button
          type="button"
          disabled={pending}
          aria-label={`"${todo.title}" 수정`}
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          수정
        </button>
        <button
          type="button"
          disabled={pending}
          aria-label={`"${todo.title}" 삭제`}
          onClick={() => startTransition(() => deleteTodoAction(todo.id))}
          className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
