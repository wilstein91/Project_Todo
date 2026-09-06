import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { getUserById, toSafeUser, type SafeUser } from "@/db/users";

/**
 * 데이터 접근 계층 (Next.js 공식 인증 가이드의 DAL 패턴).
 *
 * 로그인 확인을 한 곳에 모아 두고, 데이터를 읽는 모든 곳에서 이것을 거친다.
 * React 의 cache 로 감싸 한 번의 렌더링 안에서는 DB 를 한 번만 읽는다.
 */

/** 쿠키의 세션만 확인한다. 없으면 로그인 화면으로 보낸다. */
export const requireSession = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
});

/**
 * 실제 사용자를 DB 에서 확인한다.
 *
 * 쿠키만 믿지 않는 이유: 계정이 삭제됐거나 권한이 바뀌었어도
 * 쿠키에는 예전 정보가 그대로 남아 있기 때문이다.
 */
export const getCurrentUser = cache(async (): Promise<SafeUser> => {
  const session = await requireSession();
  const user = getUserById(session.userId);
  if (!user) redirect("/login");
  return toSafeUser(user);
});

/** 관리자 전용 화면·동작에서 쓴다. */
export const requireAdmin = cache(async (): Promise<SafeUser> => {
  const user = await getCurrentUser();
  if (user.role !== "admin") redirect("/");
  return user;
});

/** 로그인하지 않았어도 통과한다 (로그인 화면 등에서 쓴다) */
export const getOptionalUser = cache(async (): Promise<SafeUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = getUserById(session.userId);
  return user ? toSafeUser(user) : null;
});
