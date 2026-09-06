import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite 커넥션 싱글턴.
 *
 * Next.js 개발 서버는 모듈을 핫리로드하면서 이 파일을 여러 번 평가한다.
 * 그때마다 새 커넥션을 열면 파일 락이 충돌하므로 globalThis에 캐시한다.
 */
const globalForDb = globalThis as unknown as {
  __todoDb?: Database.Database;
};

function resolveDbPath(): string {
  const raw = process.env.DATABASE_PATH ?? "./data/todo.db";
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

/** db/migrations/*.sql 을 파일명 순서대로, 아직 적용되지 않은 것만 실행한다. */
function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TEXT NOT NULL
    );
  `);

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r) => (r as { name: string }).name),
  );

  const record = db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)");

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    // 마이그레이션 실행과 기록을 한 트랜잭션으로 묶는다 (중간 실패 시 통째로 롤백)
    db.transaction(() => {
      db.exec(sql);
      record.run(file, new Date().toISOString());
    })();
    console.log(`[db] migration applied: ${file}`);
  }
}

function createDb(): Database.Database {
  const file = resolveDbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new Database(file);
  db.pragma("journal_mode = WAL"); // 읽기/쓰기 동시성
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

export function getDb(): Database.Database {
  if (!globalForDb.__todoDb) {
    globalForDb.__todoDb = createDb();
  }
  return globalForDb.__todoDb;
}

export { resolveDbPath };
