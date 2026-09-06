import { categoryLabel, type CategoryCode } from "@/lib/categories";

/** 카테고리별 색. 라이트/다크 양쪽에서 읽히도록 각각 지정한다. */
const STYLE: Record<CategoryCode, string> = {
  none: "",
  personal:
    "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
  work: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:ring-violet-900",
  family:
    "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:ring-pink-900",
  etc: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:ring-teal-900",
};

export default function CategoryBadge({ code }: { code: CategoryCode }) {
  // 미분류는 뱃지를 달지 않는다 (모든 항목에 붙으면 소음이 된다)
  if (code === "none") return null;

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLE[code]}`}
    >
      {categoryLabel(code)}
    </span>
  );
}
