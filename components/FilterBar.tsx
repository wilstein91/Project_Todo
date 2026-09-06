import Link from "next/link";
import { FILTERS } from "@/lib/filters";
import { toHref, type ListParams } from "@/lib/query";
import type { Counts } from "@/db/todos";

export default function FilterBar({
  params,
  counts,
}: {
  params: ListParams;
  counts: Counts;
}) {
  return (
    <nav aria-label="목록 필터" className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const active = f.key === params.filter;
        return (
          <Link
            key={f.key}
            // 카테고리·검색어는 유지한 채 상태만 바꾼다
            href={toHref(params, { filter: f.key })}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-foreground font-medium text-background"
                : "text-muted hover:bg-surface"
            }`}
          >
            {f.label}
            <span
              className={`ml-1.5 tabular-nums ${active ? "" : "text-muted"}`}
            >
              {counts[f.key]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
