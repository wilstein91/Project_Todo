"use client";

import { useActionState, useId } from "react";
import { loginAction } from "@/app/auth-actions";
import { initialFormState } from "@/lib/form-state";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialFormState,
  );
  const uid = useId();
  const userId = `${uid}-username`;
  const pwId = `${uid}-password`;

  return (
    <form
      action={formAction}
      className="rounded-xl border border-line bg-surface p-6 shadow-sm"
    >
      <label htmlFor={userId} className="block text-sm text-muted">
        아이디
      </label>
      <input
        id={userId}
        name="username"
        type="text"
        autoComplete="username"
        autoFocus
        className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-blue-500"
      />

      <label htmlFor={pwId} className="mt-4 block text-sm text-muted">
        비밀번호
      </label>
      <input
        id={pwId}
        name="password"
        type="password"
        autoComplete="current-password"
        className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 outline-none focus:border-blue-500"
      />

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
