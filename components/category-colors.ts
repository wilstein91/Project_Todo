import type { CategoryCode } from "@/lib/categories";

/**
 * 카테고리별 색.
 *
 * 뱃지(CategoryBadge)와 달력의 작은 점(CalendarView)이 같은 색을 쓰도록
 * 한 곳에 모아 둔다.
 */

/** 뱃지용 — 배경·글자·테두리 */
export const CATEGORY_BADGE: Record<CategoryCode, string> = {
  none: "",
  personal:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
  work: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
  family:
    "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:ring-pink-900",
  etc: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900",
};

/** 달력의 작은 점용 — 배경색만 */
export const CATEGORY_DOT: Record<CategoryCode, string> = {
  none: "bg-stone-400 dark:bg-stone-500",
  personal: "bg-blue-500",
  work: "bg-violet-500",
  family: "bg-pink-500",
  etc: "bg-teal-500",
};
