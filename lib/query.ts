/**
 * 목록 화면의 상태(필터·카테고리·검색어)를 URL 쿼리 파라미터로 다룬다.
 * 새로고침·북마크·뒤로가기에도 상태가 유지되게 하는 것이 목적이다.
 */

import { DEFAULT_FILTER, isFilterKey, type FilterKey } from "./filters";
import { isCategoryCode, type CategoryCode } from "./categories";

export type ListParams = {
  filter: FilterKey;
  /** null 이면 카테고리 제한 없음 */
  category: CategoryCode | null;
  /** 빈 문자열이면 검색 없음 */
  q: string;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

/** searchParams 를 읽어 유효한 값만 남긴다 (잘못된 값은 기본값으로) */
export function parseListParams(raw: RawParams): ListParams {
  const filterRaw = first(raw.filter);
  const categoryRaw = first(raw.category);

  return {
    filter: isFilterKey(filterRaw) ? filterRaw : DEFAULT_FILTER,
    category: isCategoryCode(categoryRaw) ? categoryRaw : null,
    q: first(raw.q).trim(),
  };
}

/** 현재 상태에서 일부만 바꾼 링크를 만든다 */
export function toHref(
  params: ListParams,
  patch: Partial<ListParams> = {},
): string {
  const next = { ...params, ...patch };
  const search = new URLSearchParams();

  if (next.filter !== DEFAULT_FILTER) search.set("filter", next.filter);
  if (next.category) search.set("category", next.category);
  if (next.q) search.set("q", next.q);

  const qs = search.toString();
  return qs ? `/?${qs}` : "/";
}
