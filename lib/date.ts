/** 날짜·시간 유틸. 모든 값은 로컬(KST) 기준으로 다룬다. */

/** 레코드의 created_at / updated_at 에 넣을 현재 시각 (ISO 8601) */
export function nowIso(): string {
  return new Date().toISOString();
}
