import { getDb, resolveDbPath } from "@/db/client";
import { CATEGORIES } from "@/lib/categories";

// DB를 읽으므로 매 요청마다 실행한다 (빌드 시점에 고정되지 않게)
export const dynamic = "force-dynamic";

export default function Home() {
  const db = getDb();

  const migrations = db
    .prepare("SELECT name, applied_at FROM _migrations ORDER BY name")
    .all() as { name: string; applied_at: string }[];

  const { count } = db.prepare("SELECT COUNT(*) AS count FROM todos").get() as {
    count: number;
  };

  const columns = db.prepare("PRAGMA table_info(todos)").all() as {
    name: string;
    type: string;
    notnull: number;
  }[];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 font-sans">
      <h1 className="text-2xl font-bold">Project_Todo</h1>
      <p className="mt-1 text-sm text-gray-500">
        0단계 — 프로젝트 생성 및 DB 연결 확인
      </p>

      <section className="mt-8 rounded-lg border border-green-300 bg-green-50 p-4">
        <p className="font-semibold text-green-900">✓ SQLite 연결 정상</p>
        <p className="mt-1 break-all font-mono text-xs text-green-800">
          {resolveDbPath()}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">적용된 마이그레이션</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {migrations.map((m) => (
            <li key={m.name} className="font-mono text-gray-700">
              {m.name}
              <span className="ml-2 text-xs text-gray-400">{m.applied_at}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">
          todos 테이블 <span className="text-sm font-normal text-gray-500">({columns.length}개 컬럼)</span>
        </h2>
        <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          {columns.map((c) => (
            <li key={c.name} className="font-mono text-gray-700">
              {c.name}
              <span className="ml-1 text-xs text-gray-400">{c.type}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-600">저장된 할 일: {count}건</p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">카테고리</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span
              key={c.code}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700"
            >
              {c.label}
              <span className="ml-1 font-mono text-xs text-gray-400">{c.code}</span>
            </span>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm text-gray-400">
        다음 단계: 1단계 — 할 일 추가 / 목록 / 완료 / 삭제 (CRUD)
      </p>
    </main>
  );
}
