/** 계정 생성 입력 검증. 관리자 페이지와 시드 스크립트가 같은 규칙을 쓴다. */

import { isRole, type Role } from "./roles";

/**
 * 비밀번호 최소 길이 6자.
 *
 * 일반적으로는 8자 이상을 권장하지만, 관리자 비밀번호를 6~7자로 정해 두고
 * 계정 생성만 8자를 요구하면 규칙이 어긋난다. 한 가지 규칙으로 통일한다.
 * 인터넷에 올리기 전에는 반드시 더 긴 비밀번호로 바꿀 것. (README 참고)
 *
 * 이 파일은 화면(클라이언트)에서도 불러다 쓰므로 서버 전용 코드를 넣지 않는다.
 * bcrypt 해싱은 lib/password.ts 에 따로 두었다.
 */
export const PASSWORD_MIN = 6;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

/** 영문·숫자·밑줄만. DB CHECK 제약과 같은 규칙이다. */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export type NewUserInput = {
  username: string;
  password: string;
  role: Role;
  displayName: string | null;
};

export type ParsedUser =
  | { ok: true; value: NewUserInput }
  | { ok: false; error: string };

export function validateUsername(username: string): string | null {
  if (!username) return "아이디를 입력해 주세요.";
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `아이디는 ${USERNAME_MIN}~${USERNAME_MAX}자로 입력해 주세요.`;
  }
  if (!USERNAME_PATTERN.test(username)) {
    return "아이디는 영문, 숫자, 밑줄(_)만 쓸 수 있습니다.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "비밀번호를 입력해 주세요.";
  if (password.length < PASSWORD_MIN) {
    return `비밀번호는 ${PASSWORD_MIN}자 이상으로 입력해 주세요.`;
  }
  return null;
}

export function parseNewUserForm(formData: FormData): ParsedUser {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "");

  const usernameError = validateUsername(username);
  if (usernameError) return { ok: false, error: usernameError };

  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const role: Role = isRole(roleRaw) ? roleRaw : "member";

  return {
    ok: true,
    value: { username, password, role, displayName: displayName || null },
  };
}
