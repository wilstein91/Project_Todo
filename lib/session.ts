import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/lib/roles";

/**
 * 세션 관리 (Next.js 공식 인증 가이드 방식).
 *
 * 서명된 JWT 를 httpOnly 쿠키에 담는다. 서명·검증은 직접 만들지 않고
 * jose 라이브러리에 맡긴다. 세션 테이블이 없어 DB 조회 없이 확인할 수 있다.
 */

const SESSION_COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7일

/** 서명 키는 코드가 아니라 .env 에서 온다. 없으면 즉시 멈춘다. */
function getKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET 이 .env 에 없거나 너무 짧습니다(32자 이상). " +
        "`npm run gen:secret` 으로 만들어 넣어 주세요.",
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: number;
  username: string;
  role: Role;
};

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getKey());
}

/** 서명이 어긋나거나 만료됐으면 null 을 돌려준다 (예외를 밖으로 던지지 않는다) */
export async function decrypt(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
    });
    const { userId, username, role } = payload as Partial<SessionPayload>;
    if (typeof userId !== "number" || !username || !role) return null;
    return { userId, username, role };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // 자바스크립트로 읽을 수 없게 (XSS 로 탈취 방지)
    secure: process.env.NODE_ENV === "production", // https 에서만 전송
    sameSite: "lax", // 다른 사이트에서 넘어온 요청에는 붙이지 않음 (CSRF 완화)
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export { SESSION_COOKIE };
