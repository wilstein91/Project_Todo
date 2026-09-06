/** 권한 등급. 세션 쿠키에도 들어가므로 DB 를 import 하지 않는 가벼운 모듈로 둔다. */

export const ROLES = ["admin", "member"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}

export function roleLabel(role: Role): string {
  return role === "admin" ? "관리자" : "일반";
}
