import "server-only";
import bcrypt from "bcryptjs";

/**
 * 비밀번호 해싱.
 *
 * 해시 알고리즘을 직접 만들지 않고 검증된 라이브러리(bcryptjs)에 맡긴다.
 * DB 에는 해시만 저장하며 평문은 어디에도 남기지 않는다.
 */

/** 비용 인자. 값이 클수록 안전하지만 느려진다. 10 은 통상 권장값이다. */
const COST = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
