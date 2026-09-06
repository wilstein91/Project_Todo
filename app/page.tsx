import AppHeader from "@/components/AppHeader";
import CalendarView from "@/components/CalendarView";
import CategoryFilter from "@/components/CategoryFilter";
import FilterBar from "@/components/FilterBar";
import SearchBox from "@/components/SearchBox";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import UndoToastProvider from "@/components/UndoToast";
import ViewToggle from "@/components/ViewToggle";
import { countTodos, listTodos, listTodosByMonth } from "@/db/todos";
import { getCurrentUser } from "@/lib/dal";
import { parseListParams } from "@/lib/query";

// SQLite 를 매 요청마다 읽는다 (빌드 시점에 고정되지 않게)
export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: PageProps<"/">) {
  // Next 16 에서 searchParams 는 Promise 다
  const params = parseListParams(await searchParams);
  // 로그인하지 않았으면 여기서 로그인 화면으로 보내진다
  const user = await getCurrentUser();

  const scope = { userId: user.id, category: params.category, q: params.q };

  // 보고 있는 화면에 필요한 것만 조회한다
  const todos = params.view === "list" ? listTodos({ ...params, ...scope }) : [];
  const monthTodos =
    params.view === "calendar"
      ? listTodosByMonth({ ...scope, month: params.month })
      : [];

  // 탭 건수는 카테고리·검색 범위 안에서 센다
  const counts = countTodos(scope);

  return (
    // min-w-0 이 없으면 body 의 flex 때문에 main 이 내용 너비만큼 늘어나
    // 달력의 가로 스크롤이 페이지 전체로 번진다
    <main className="mx-auto w-full min-w-0 max-w-2xl px-5 py-10 sm:py-14">
      <AppHeader user={user} />

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
        <ViewToggle params={params} />
        <CategoryFilter current={params.category} />
      </div>

      {params.view === "list" ? (
        <>
          <div className="mt-3">
            <FilterBar params={params} counts={counts} />
          </div>
          <div className="mt-3">
            <UndoToastProvider>
              <TodoList todos={todos} params={params} />
            </UndoToastProvider>
          </div>
        </>
      ) : (
        <div className="mt-4">
          <CalendarView todos={monthTodos} params={params} />
        </div>
      )}
    </main>
  );
}
