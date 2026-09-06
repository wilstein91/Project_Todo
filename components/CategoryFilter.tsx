"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, type CategoryCode } from "@/lib/categories";

/** 카테고리로 목록을 좁힌다. 선택은 URL(?category=) 에 남는다. */
export default function CategoryFilter({
  current,
}: {
  current: CategoryCode | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <>
      <label htmlFor="category-filter" className="sr-only">
        카테고리 필터
      </label>
      <select
        id="category-filter"
        value={current ?? "any"}
        onChange={(e) => {
          const next = new URLSearchParams(searchParams.toString());
          if (e.target.value === "any") next.delete("category");
          else next.set("category", e.target.value);
          const qs = next.toString();
          router.push(qs ? `/?${qs}` : "/");
        }}
        className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      >
        <option value="any">모든 카테고리</option>
        {CATEGORIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </>
  );
}
