"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { restoreTodoAction } from "@/app/actions";
import type { Todo } from "@/db/todos";

/**
 * 삭제 되돌리기 토스트.
 *
 * 삭제는 곧바로 반영하되, 지워진 내용을 5초 동안 들고 있다가
 * '되돌리기' 를 누르면 같은 내용으로 되살린다.
 * (원래의 생성 시각까지 복원하므로 목록에서 있던 자리로 돌아간다)
 */

const UNDO_SECONDS = 5;

type ToastContextValue = {
  showUndo: (todo: Todo) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useUndoToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useUndoToast 는 UndoToastProvider 안에서만 쓸 수 있습니다.");
  }
  return ctx;
}

export default function UndoToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [deleted, setDeleted] = useState<Todo | null>(null);
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showUndo = useCallback(
    (todo: Todo) => {
      clearTimer();
      setDeleted(todo);
      timerRef.current = setTimeout(
        () => setDeleted(null),
        UNDO_SECONDS * 1000,
      );
    },
    [clearTimer],
  );

  // 화면을 벗어날 때 타이머를 정리한다
  useEffect(() => clearTimer, [clearTimer]);

  function handleUndo() {
    if (!deleted) return;
    clearTimer();
    const todo = deleted;
    startTransition(async () => {
      await restoreTodoAction(todo);
      setDeleted(null);
    });
  }

  return (
    <ToastContext.Provider value={{ showUndo }}>
      {children}

      {deleted && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-lg"
        >
          <span className="min-w-0 truncate text-sm">
            <span className="text-muted">삭제함 · </span>
            {deleted.title}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            disabled={pending}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "되돌리는 중…" : "되돌리기"}
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
