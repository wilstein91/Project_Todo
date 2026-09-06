import Link from "next/link";
import { toHref, VIEWS, type ListParams } from "@/lib/query";

const LABEL: Record<(typeof VIEWS)[number], string> = {
  list: "목록",
  calendar: "달력",
};

/** 목록 보기 / 달력 보기 전환. 필터·검색어는 그대로 유지된다. */
export default function ViewToggle({ params }: { params: ListParams }) {
  return (
    <nav aria-label="보기 방식" className="flex rounded-lg border border-line p-0.5">
      {VIEWS.map((view) => {
        const active = params.view === view;
        return (
          <Link
            key={view}
            href={toHref(params, { view, day: null })}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-1 text-sm transition-colors ${
              active
                ? "bg-foreground font-medium text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {LABEL[view]}
          </Link>
        );
      })}
    </nav>
  );
}
