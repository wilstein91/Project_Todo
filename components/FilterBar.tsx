import Link from "next/link";
import { FILTERS, type FilterKey } from "@/lib/filters";
import type { Counts } from "@/db/todos";

export default function FilterBar({
  current,
  counts,
}: {
  current: FilterKey;
  counts: Counts;
}) {
  return (
    <nav aria-label="목록 필터" className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const active = f.key === current;
        const count = counts[f.key];
        return (
          <Link
            key={f.key}
            href={f.key === "all" ? "/" : `/?filter=${f.key}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-foreground font-medium text-background"
                : "text-muted hover:bg-surface"
            }`}
          >
            {f.label}
            <span className={`ml-1.5 tabular-nums ${active ? "" : "text-muted"}`}>
              {count}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
