import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import { countTodos, listTodos } from "@/db/todos";

// SQLite 를 매 요청마다 읽는다 (빌드 시점에 고정되지 않게)
export const dynamic = "force-dynamic";

export default function Home() {
  const todos = listTodos();
  const { total, done } = countTodos();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">할 일</h1>
          <p className="mt-1 text-sm text-muted">
            {total === 0
              ? "등록된 할 일이 없습니다"
              : `전체 ${total}건 · 완료 ${done}건 · 남음 ${total - done}건`}
          </p>
        </div>
      </header>

      <TodoForm />

      <div className="mt-6">
        <TodoList todos={todos} />
      </div>
    </main>
  );
}
