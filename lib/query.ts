/**
 * 목록 화면의 상태(보기 방식·달·필터·카테고리·검색어)를 URL 쿼리 파라미터로 다룬다.
 * 새로고침·북마크·뒤로가기에도 상태가 유지되게 하는 것이 목적이다.
 */

import { DEFAULT_FILTER, isFilterKey, type FilterKey } from "./filters";
import { isCategoryCode, type CategoryCode } from "./categories";
import { isValidDateStr, isValidMonthStr, monthKey } from "./date";

export const VIEWS = ["list", "calendar"] as const;
export type ViewMode = (typeof VIEWS)[number];

export const DEFAULT_VIEW: ViewMode = "list";

function isViewMode(value: unknown): value is ViewMode {
  return VIEWS.includes(value as ViewMode);
}

export type ListParams = {
  view: ViewMode;
  /** 'YYYY-MM' — 달력 보기에서만 쓴다 */
  month: string;
  /** 'YYYY-MM-DD' — 달력에서 고른 날짜. 없으면 null */
  day: string | null;
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
  const viewRaw = first(raw.view);
  const monthRaw = first(raw.month);
  const dayRaw = first(raw.day);
  const filterRaw = first(raw.filter);
  const categoryRaw = first(raw.category);

  return {
    view: isViewMode(viewRaw) ? viewRaw : DEFAULT_VIEW,
    month: isValidMonthStr(monthRaw) ? monthRaw : monthKey(),
    day: isValidDateStr(dayRaw) ? dayRaw : null,
    filter: isFilterKey(filterRaw) ? filterRaw : DEFAULT_FILTER,
    category: isCategoryCode(categoryRaw) ? categoryRaw : null,
    q: first(raw.q).trim(),
  };
}

/**
 * 현재 상태에서 일부만 바꾼 링크를 만든다.
 * 기본값과 같은 항목은 URL 에 넣지 않아 주소를 짧게 유지한다.
 */
export function toHref(
  params: ListParams,
  patch: Partial<ListParams> = {},
): string {
  const next = { ...params, ...patch };
  const search = new URLSearchParams();

  if (next.view !== DEFAULT_VIEW) search.set("view", next.view);
  // 달과 선택 날짜는 달력 보기에서만 의미가 있다
  if (next.view === "calendar") {
    if (next.month !== monthKey()) search.set("month", next.month);
    if (next.day) search.set("day", next.day);
  }
  if (next.filter !== DEFAULT_FILTER) search.set("filter", next.filter);
  if (next.category) search.set("category", next.category);
  if (next.q) search.set("q", next.q);

  const qs = search.toString();
  return qs ? `/?${qs}` : "/";
}
