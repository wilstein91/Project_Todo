"use server";

import { redirect } from "next/navigation";
import * as users from "@/db/users";
import { verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";
import type { FormState } from "@/lib/form-state";

/**
 * 아이디가 없을 때도 비교 연산을 한 번 수행하기 위한 더미 해시.
 *
 * 없는 아이디면 즉시 실패를 돌려주면, 응답이 빨리 오는 것만 보고
 * "이 아이디는 존재하지 않는구나" 를 알아낼 수 있다(사용자 열거 공격).
 * 그래서 실패하는 경우에도 같은 비용을 치른다.
 */
const DUMMY_HASH =
  "$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456789";

export async function loginAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const fail = (error: string): FormState => ({
    ok: false,
    error,
    message: null,
    submitCount: prev.submitCount + 1,
  });

  if (!username || !password) {
    return fail("아이디와 비밀번호를 입력해 주세요.");
  }

  const user = users.findUserByUsername(username);
  const matched = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH);

  // 어느 쪽이 틀렸는지 알려주지 않는다
  if (!user || !matched) {
    return fail("아이디 또는 비밀번호가 올바르지 않습니다.");
  }

  users.touchLastLogin(user.id);
  await createSession({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  // redirect 는 제어 흐름 예외를 던지므로 이 아래는 실행되지 않는다
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
