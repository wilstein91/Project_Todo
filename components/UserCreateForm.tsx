"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { createUserAction } from "@/app/admin/actions";
import { initialFormState } from "@/lib/form-state";
import { PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from "@/lib/user-input";

export default function UserCreateForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialFormState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok, state.submitCount]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="font-semibold">계정 만들기</h2>
      <p className="mt-1 text-sm text-muted">
        계정은 이 화면에서만 만들 수 있습니다.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${uid}-u`} className="block text-sm text-muted">
            아이디
          </label>
          <input
            id={`${uid}-u`}
            name="username"
            type="text"
            autoComplete="off"
            minLength={USERNAME_MIN}
            maxLength={USERNAME_MAX}
            placeholder="영문·숫자·밑줄"
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-p`} className="block text-sm text-muted">
            비밀번호
          </label>
          <input
            id={`${uid}-p`}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            placeholder={`${PASSWORD_MIN}자 이상`}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-d`} className="block text-sm text-muted">
            표시 이름 (선택)
          </label>
          <input
            id={`${uid}-d`}
            name="display_name"
            type="text"
            autoComplete="off"
            maxLength={50}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor={`${uid}-r`} className="block text-sm text-muted">
            권한
          </label>
          <select
            id={`${uid}-r`}
            name="role"
            defaultValue="member"
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="member">일반</option>
            <option value="admin">관리자</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="mt-3 text-sm text-green-600">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "만드는 중…" : "계정 만들기"}
      </button>
    </form>
  );
}
