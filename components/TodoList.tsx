import TodoItem from "./TodoItem";
import type { Todo } from "@/db/todos";
import { getDueStatus } from "@/lib/date";
import { EMPTY_MESSAGE, type FilterKey } from "@/lib/filters";

export default function TodoList({
  todos,
  filter,
}: {
  todos: Todo[];
  filter: FilterKey;
}) {
  if (todos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
        {EMPTY_MESSAGE[filter]}
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
