import { categoryLabel, type CategoryCode } from "@/lib/categories";
import { CATEGORY_BADGE } from "./category-colors";

export default function CategoryBadge({ code }: { code: CategoryCode }) {
  // 미분류는 뱃지를 달지 않는다 (모든 항목에 붙으면 소음이 된다)
  if (code === "none") return null;

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${CATEGORY_BADGE[code]}`}
    >
      {categoryLabel(code)}
    </span>
  );
}
