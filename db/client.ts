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
  // DB 경로는 .env 에서 오므로 Turbopack 이 정적으로 범위를 알 수 없다.
  // 내 PC 에서만 도는 앱이고 경로를 내가 직접 정하는 것이 설계 의도이므로,
  // 프로젝트 전체를 번들에 추적해 넣지 않도록 예외 처리한다.
  return path.isAbsolute(raw)
    ? raw
    : path.join(/*turbopackIgnore: true*/ process.cwd(), raw);
}

/**
 * 적용할 마이그레이션을 순서대로 명시한다.
 *
 * 폴더를 readdirSync 로 훑지 않는 이유:
 *  1. Turbopack 이 런타임 디렉터리 조회를 발견하면 프로젝트 전체를
 *     번들 추적 대상에 넣어 빌드 경고가 난다.
 *  2. 목록이 코드에 있으면 폴더에 흘러든 임시 .sql 이 실수로 실행되지 않는다.
 *
 * 새 마이그레이션을 만들면 이 배열 끝에 파일명을 추가한다.
 */
const MIGRATIONS = ["001_init.sql", "002_users.sql"] as const;

/** 아직 적용되지 않은 마이그레이션만 순서대로 실행한다. */
function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name        TEXT PRIMARY KEY,
      applied_at  TEXT NOT NULL
    );
  `);

  const applied = new Set(
    db.prepare("SELECT name FROM _migrations").all().map((r) => (r as { name: string }).name),
  );

  const record = db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)");

  for (const file of MIGRATIONS) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(
      path.join(/*turbopackIgnore: true*/ process.cwd(), "db", "migrations", file),
      "utf8",
    );

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
