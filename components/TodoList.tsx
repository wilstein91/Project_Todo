import TodoItem from "./TodoItem";
import type { Todo } from "@/db/todos";
import { getDueStatus } from "@/lib/date";
import { EMPTY_MESSAGE } from "@/lib/filters";
import { categoryLabel } from "@/lib/categories";
import type { ListParams } from "@/lib/query";

/** 왜 비었는지 상황에 맞게 알려준다 (검색·카테고리가 걸려 있으면 그것부터) */
function emptyMessage(params: ListParams): string {
  if (params.q) return `"${params.q}" 에 해당하는 할 일이 없습니다.`;
  if (params.category) {
    return `'${categoryLabel(params.category)}' 카테고리에 해당하는 할 일이 없습니다.`;
  }
  return EMPTY_MESSAGE[params.filter];
}

export default function TodoList({
  todos,
  params,
}: {
  todos: Todo[];
  params: ListParams;
}) {
  if (todos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
        {emptyMessage(params)}
      </p>
    );
  }

  // 마감 판정은 서버에서 한 번만 한다. 클라이언트에서 new Date() 를 쓰면
  // 서버와 시각이 어긋나 하이드레이션 불일치가 날 수 있다.
  const now = new Date();

  return (
    <ul className="space-y-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          dueStatus={getDueStatus(
            todo.due_date,
            todo.due_time,
            todo.is_done === 1,
            now,
          )}
        />
      ))}
    </ul>
  );
}
