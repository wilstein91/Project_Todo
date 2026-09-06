import type { DueStatus } from "@/lib/date";

/** 마감 상태별 뱃지 색. 라이트/다크 양쪽에서 읽히도록 각각 지정한다. */
const BADGE_STYLE: Record<string, string> = {
  overdue:
    "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900",
  today:
    "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-900",
  soon: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  week: "bg-transparent text-muted ring-line",
};

export default function DueBadge({ status }: { status: DueStatus }) {
  if (!status.text) return null;

  const style = BADGE_STYLE[status.kind];

  return (
    <span className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
      {status.label && style && (
        <span
          className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${style}`}
        >
          {status.label}
        </span>
      )}
      <span className={status.kind === "done" ? "text-muted line-through" : "text-muted"}>
        {status.text}
      </span>
    </span>
  );
}
