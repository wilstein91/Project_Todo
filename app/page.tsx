import FilterBar from "@/components/FilterBar";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { countTodos, listTodos } from "@/db/todos";
import { DEFAULT_FILTER, isFilterKey } from "@/lib/filters";

// SQLite 를 매 요청마다 읽는다 (빌드 시점에 고정되지 않게)
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Next 16 에서 searchParams 는 Promise 다
  const { filter: filterParam } = await searchParams;
  const filter = isFilterKey(filterParam) ? filterParam : DEFAULT_FILTER;

  const todos = listTodos(filter);
  const counts = countTodos();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">할 일</h1>
        <p className="mt-1 text-sm text-muted">
          {counts.all === 0
            ? "등록된 할 일이 없습니다"
            : `전체 ${counts.all}건 · 남음 ${counts.all - counts.done}건` +
              (counts.overdue > 0 ? ` · 기한 지남 ${counts.overdue}건` : "")}
        </p>
      </header>

      <TodoForm />

      <div className="mt-6">
        <FilterBar current={filter} counts={counts} />
      </div>

      <div className="mt-3">
        <TodoList todos={todos} filter={filter} />
      </div>
    </main>
  );
}
