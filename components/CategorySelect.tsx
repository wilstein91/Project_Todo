import {
  CATEGORIES,
  DEFAULT_CATEGORY,
  type CategoryCode,
} from "@/lib/categories";

/** 추가·수정 폼에서 쓰는 카테고리 선택 */
export default function CategorySelect({
  id,
  defaultValue = DEFAULT_CATEGORY,
}: {
  id: string;
  defaultValue?: CategoryCode;
}) {
  return (
    <select
      id={id}
      name="category"
      defaultValue={defaultValue}
      className="rounded-lg border border-line bg-background px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
    >
      {CATEGORIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.label}
        </option>
      ))}
    </select>
  );
}
