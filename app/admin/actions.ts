"use server";

import { refresh } from "next/cache";
import * as users from "@/db/users";
import { getCurrentUser, requireAdmin } from "@/lib/dal";
import { hashPassword } from "@/lib/password";
import type { FormState } from "@/lib/form-state";
import { parseNewUserForm, validatePassword } from "@/lib/user-input";

/**
 * 계정 생성. 관리자만 할 수 있다.
 *
 * requireAdmin() 이 먼저 실행되므로, 화면을 우회해 이 액션을 직접 호출해도
 * 관리자가 아니면 통과하지 못한다. (Server Action 은 POST 로 직접 부를 수 있다)
 */
export async function createUserAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const fail = (error: string): FormState => ({
    ok: false,
    error,
    message: null,
    submitCount: prev.submitCount,
  });

  const parsed = parseNewUserForm(formData);
  if (!parsed.ok) return fail(parsed.error);

  if (users.findUserByUsername(parsed.value.username)) {
    return fail("이미 있는 아이디입니다.");
  }

  // 평문은 여기서 해시로 바꾸고 버린다. DB 에는 해시만 들어간다.
  const passwordHash = await hashPassword(parsed.value.password);
  users.createUser({
    username: parsed.value.username,
    passwordHash,
    role: parsed.value.role,
    displayName: parsed.value.displayName,
  });

  refresh();
  return {
    ok: true,
    error: null,
    message: `'${parsed.value.username}' 계정을 만들었습니다.`,
    submitCount: prev.submitCount + 1,
  };
}

export async function deleteUserAction(
  targetId: number,
): Promise<{ error: string | null }> {
  const admin = await requireAdmin();
  if (!Number.isInteger(targetId)) return { error: "잘못된 계정입니다." };

  if (targetId === admin.id) {
    return { error: "자기 계정은 지울 수 없습니다." };
  }

  const target = users.getUserById(targetId);
  if (!target) return { error: "계정을 찾을 수 없습니다." };

  // 관리자가 하나도 없으면 아무도 계정을 만들 수 없게 된다
  if (target.role === "admin" && users.countUsers().admins <= 1) {
    return { error: "마지막 관리자 계정은 지울 수 없습니다." };
  }

  users.deleteUser(targetId);
  refresh();
  return { error: null };
}

/**
 * 비밀번호 재설정.
 *
 * 성공하면 입력란이 스스로 닫혀야 해서 useTransition 으로 직접 호출한다.
 * 그래서 useActionState 와 달리 이전 상태를 받지 않는다.
 */
export async function resetPasswordAction(
  formData: FormData,
): Promise<{ error: string | null; message: string | null }> {
  await requireAdmin();

  const targetId = Number(formData.get("user_id"));
  const password = String(formData.get("password") ?? "");

  const fail = (error: string) => ({ error, message: null });

  if (!Number.isInteger(targetId)) return fail("잘못된 계정입니다.");

  const passwordError = validatePassword(password);
  if (passwordError) return fail(passwordError);

  const target = users.getUserById(targetId);
  if (!target) return fail("계정을 찾을 수 없습니다.");

  users.setPassword(targetId, await hashPassword(password));
  refresh();

  return {
    error: null,
    message: `'${target.username}' 의 비밀번호를 바꿨습니다.`,
  };
}

/** 로그인한 사람이 자기 비밀번호를 바꾼다 (관리자 권한 불필요) */
export async function changeMyPasswordAction(
  prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await getCurrentUser();
  const password = String(formData.get("password") ?? "");

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError, message: null, submitCount: prev.submitCount };
  }

  users.setPassword(me.id, await hashPassword(password));
  return {
    ok: true,
    error: null,
    message: "비밀번호를 바꿨습니다.",
    submitCount: prev.submitCount + 1,
  };
}
