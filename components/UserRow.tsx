"use client";

import { useId, useState, useTransition } from "react";
import { deleteUserAction, resetPasswordAction } from "@/app/admin/actions";
import { roleLabel } from "@/lib/roles";
import { PASSWORD_MIN } from "@/lib/user-input";
import type { SafeUser } from "@/db/users";

function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default function UserRow({
  user,
  isMe,
}: {
  user: SafeUser;
  isMe: boolean;
}) {
  const [showReset, setShowReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const uid = useId();

  /**
   * 성공하면 입력란을 스스로 닫아야 해서 useTransition 으로 액션을 직접 부른다.
   * effect 안에서 상태를 바꾸지 않으므로 불필요한 재렌더링이 생기지 않는다.
   */
  function handleReset(formData: FormData) {
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setNotice(result.message);
        setShowReset(false);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      setError(result.error);
    });
  }

  return (
    <li
      className={`rounded-xl border border-line bg-surface px-4 py-3 ${
        pending ? "opacity-40" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{user.username}</span>
        {isMe && <span className="text-xs text-muted">(나)</span>}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
            user.role === "admin"
              ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900"
              : "text-muted ring-line"
          }`}
        >
          {roleLabel(user.role)}
        </span>
        {user.display_name && (
          <span className="text-sm text-muted">{user.display_name}</span>
        )}

        <span className="ml-auto flex gap-0.5">
          <button
            type="button"
            onClick={() => {
              setShowReset((v) => !v);
              setNotice(null);
              setError(null);
            }}
            className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            비밀번호 변경
          </button>
          <button
            type="button"
            disabled={pending || isMe}
            title={isMe ? "자기 계정은 지울 수 없습니다" : undefined}
            onClick={handleDelete}
            className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950"
          >
            삭제
          </button>
        </span>
      </div>

      <p className="mt-1 text-xs text-muted">
        만든 날 {formatWhen(user.created_at)} · 마지막 로그인{" "}
        {formatWhen(user.last_login_at)}
      </p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && !showReset && (
        <p role="status" className="mt-2 text-sm text-green-600">
          {notice}
        </p>
      )}

      {showReset && (
        <form
          action={handleReset}
          className="mt-3 flex flex-wrap items-center gap-2"
        >
          <input type="hidden" name="user_id" value={user.id} />
          <label htmlFor={`${uid}-pw`} className="sr-only">
            새 비밀번호
          </label>
          <input
            id={`${uid}-pw`}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            placeholder={`새 비밀번호 (${PASSWORD_MIN}자 이상)`}
            className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "변경 중…" : "변경"}
          </button>
        </form>
      )}
    </li>
  );
}
