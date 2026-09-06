/** 목록 상단 필터 탭 정의. URL 쿼리 파라미터 ?filter= 로 상태를 유지한다. */

export const FILTERS = [
  { key: "all", label: "전체" },
  { key: "week", label: "이번 주" },
  { key: "overdue", label: "지남" },
  { key: "done", label: "완료" },
] as const;

export type FilterKey = (typeof FILTERS)[number]["key"];

export const DEFAULT_FILTER: FilterKey = "all";

export function isFilterKey(value: unknown): value is FilterKey {
  return FILTERS.some((f) => f.key === value);
}

/** 필터별 빈 목록 안내 문구 */
export const EMPTY_MESSAGE: Record<FilterKey, string> = {
  all: "아직 할 일이 없습니다. 위에서 첫 할 일을 추가해 보세요.",
  week: "일주일 안에 끝내야 할 일이 없습니다.",
  overdue: "기한이 지난 일이 없습니다.",
  done: "완료한 일이 없습니다.",
};
