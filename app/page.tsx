import CategoryFilter from "@/components/CategoryFilter";
import FilterBar from "@/components/FilterBar";
import SearchBox from "@/components/SearchBox";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { countTodos, listTodos } from "@/db/todos";
import { parseListParams } from "@/lib/query";

// SQLite 를 매 요청마다 읽는다 (빌드 시점에 고정되지 않게)
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Next 16 에서 searchParams 는 Promise 다
  const params = parseListParams(await searchParams);

  const todos = listTodos(params);
  // 탭 건수는 카테고리·검색 범위 안에서 센다
  const counts = countTodos({ category: params.category, q: params.q });

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">할 일</h1>
        <p className="mt-1 text-sm text-muted">
          {counts.all === 0
            ? params.q || params.category
              ? "조건에 맞는 할 일이 없습니다"
              : "등록된 할 일이 없습니다"
            : `전체 ${counts.all}건 · 남음 ${counts.all - counts.done}건` +
              (counts.overdue > 0 ? ` · 기한 지남 ${counts.overdue}건` : "")}
        </p>
      </header>

      <TodoForm />

      <div className="mt-6">
        <SearchBox initialQuery={params.q} />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <FilterBar params={params} counts={counts} />
        <CategoryFilter current={params.category} />
      </div>

      <div className="mt-3">
        <TodoList todos={todos} params={params} />
      </div>
    </main>
  );
}
