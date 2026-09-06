/** 카테고리 단일 정의. DB의 CHECK 제약과 이 목록이 항상 일치해야 한다. */

export const CATEGORIES = [
  { code: "none", label: "미분류" },
  { code: "personal", label: "개인" },
  { code: "work", label: "업무" },
  { code: "family", label: "경조사" },
  { code: "etc", label: "기타" },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]["code"];

export const DEFAULT_CATEGORY: CategoryCode = "none";

export function isCategoryCode(value: unknown): value is CategoryCode {
  return CATEGORIES.some((c) => c.code === value);
}

export function categoryLabel(code: CategoryCode): string {
  return CATEGORIES.find((c) => c.code === code)?.label ?? "미분류";
}
