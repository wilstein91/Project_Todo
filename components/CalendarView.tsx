import Link from "next/link";
import type { Todo } from "@/db/todos";
import {
  addMonths,
  formatDueDate,
  monthGrid,
  monthKey,
  monthLabel,
  WEEKDAY_LABELS,
} from "@/lib/date";
import { toHref, type ListParams } from "@/lib/query";
import { CATEGORY_DOT } from "./category-colors";

/** 한 칸에 몇 건까지 보여줄지. 넘으면 "＋N건" 으로 접는다. */
const MAX_PER_CELL = 3;

function groupByDate(todos: Todo[]): Map<string, Todo[]> {
  const map = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.due_date) continue;
    const list = map.get(todo.due_date);
    if (list) list.push(todo);
    else map.set(todo.due_date, [todo]);
  }
  return map;
}

export default function CalendarView({
  todos,
  params,
}: {
  todos: Todo[];
  params: ListParams;
}) {
  const weeks = monthGrid(params.month);
  const byDate = groupByDate(todos);
  const isThisMonth = params.month === monthKey();

  return (
    <section>
      {/* 달 이동 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Link
          href={toHref(params, {
            month: addMonths(params.month, -1),
            day: null,
          })}
          aria-label="이전 달"
          className="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:bg-surface"
        >
          ←
        </Link>

        <span className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{monthLabel(params.month)}</h2>
          {!isThisMonth && (
            <Link
              href={toHref(params, { month: monthKey(), day: null })}
              className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              이번 달
            </Link>
          )}
        </span>

        <Link
          href={toHref(params, {
            month: addMonths(params.month, 1),
            day: null,
          })}
          aria-label="다음 달"
          className="rounded-lg border border-line px-3 py-1.5 text-sm transition-colors hover:bg-surface"
        >
          →
        </Link>
      </div>

      {/* 요일 머리글 */}
      <div className="grid grid-cols-7 gap-px text-center text-xs text-muted">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`py-1.5 ${i === 0 ? "text-red-500" : ""} ${
              i === 6 ? "text-blue-500" : ""
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 격자 — 좁은 화면에서 가로로 눌리지 않게 최소 너비를 준다 */}
      <div className="overflow-x-auto">
        <div className="min-w-[520px] overflow-hidden rounded-xl border border-line bg-line">
          <div className="grid grid-cols-7 gap-px">
            {weeks.flat().map((cell) => {
              const items = byDate.get(cell.date) ?? [];
              const selected = params.day === cell.date;

              return (
                <Link
                  key={cell.date}
                  href={toHref(params, {
                    day: selected ? null : cell.date,
                  })}
                  scroll={false}
                  aria-current={selected ? "date" : undefined}
                  className={`min-h-[92px] p-1.5 text-left transition-colors ${
                    cell.inMonth ? "bg-surface" : "bg-background"
                  } ${selected ? "ring-2 ring-inset ring-blue-500" : "hover:bg-background"}`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${
                      cell.isToday
                        ? "bg-blue-600 font-semibold text-white"
                        : cell.inMonth
                          ? cell.weekday === 0
                            ? "text-red-500"
                            : cell.weekday === 6
                              ? "text-blue-500"
                              : ""
                          : "text-muted opacity-50"
                    }`}
                  >
                    {cell.day}
                  </span>

                  <span className="mt-1 block space-y-0.5">
                    {items.slice(0, MAX_PER_CELL).map((todo) => (
                      <span
                        key={todo.id}
                        title={todo.title}
                        className={`flex items-center gap-1 truncate text-[11px] leading-tight ${
                          todo.is_done === 1
                            ? "text-muted line-through"
                            : "text-foreground"
                        }`}
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${CATEGORY_DOT[todo.category]}`}
                        />
                        <span className="truncate">
                          {todo.due_time ? `${todo.due_time} ` : ""}
                          {todo.title}
                        </span>
                      </span>
                    ))}
                    {items.length > MAX_PER_CELL && (
                      <span className="block text-[11px] text-muted">
                        ＋{items.length - MAX_PER_CELL}건
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* 고른 날짜의 목록 */}
      {params.day && (
        <div className="mt-4 rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">{formatDueDate(params.day)}</h3>
            <Link
              href={toHref(params, { day: null })}
              scroll={false}
              className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
            >
              닫기
            </Link>
          </div>

          {(byDate.get(params.day) ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted">이 날에는 할 일이 없습니다.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(byDate.get(params.day) ?? []).map((todo) => (
                <li key={todo.id} className="flex items-start gap-2 text-sm">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${CATEGORY_DOT[todo.category]}`}
                  />
                  <span
                    className={todo.is_done === 1 ? "text-muted line-through" : ""}
                  >
                    {todo.due_time && (
                      <span className="mr-1.5 tabular-nums text-muted">
                        {todo.due_time}
                      </span>
                    )}
                    {todo.title}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href={toHref(params, { view: "list" })}
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            목록에서 편집하기 →
          </Link>
        </div>
      )}
    </section>
  );
}
