import { getDb } from "./client";
import { nowIso } from "@/lib/date";
import type { Role } from "@/lib/roles";

export type User = {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

/** 화면으로 내보낼 때 쓰는 형태. 해시는 절대 포함하지 않는다. */
export type SafeUser = Omit<User, "password_hash">;

export function toSafeUser(user: User): SafeUser {
  // password_hash 를 구조분해로 떼어내고 나머지만 넘긴다
  const { password_hash: _hash, ...safe } = user;
  void _hash;
  return safe;
}

export function findUserByUsername(username: string): User | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function listUsers(): SafeUser[] {
  return getDb()
    .prepare(
      `SELECT id, username, role, display_name, created_at, updated_at, last_login_at
       FROM users
       ORDER BY (role = 'admin') DESC, username ASC`,
    )
    .all() as SafeUser[];
}

export function countUsers(): { total: number; admins: number } {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END), 0) AS admins
       FROM users`,
    )
    .get() as { total: number; admins: number };
}

export function createUser(input: {
  username: string;
  passwordHash: string;
  role: Role;
  displayName?: string | null;
}): number {
  const now = nowIso();
  const result = getDb()
    .prepare(
      `INSERT INTO users (username, password_hash, role, display_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.username,
      input.passwordHash,
      input.role,
      input.displayName ?? null,
      now,
      now,
    );
  return Number(result.lastInsertRowid);
}

export function setPassword(id: number, passwordHash: string): boolean {
  return (
    getDb()
      .prepare(
        "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
      )
      .run(passwordHash, nowIso(), id).changes > 0
  );
}

export function deleteUser(id: number): boolean {
  // todos 는 ON DELETE CASCADE 로 함께 지워진다
  return getDb().prepare("DELETE FROM users WHERE id = ?").run(id).changes > 0;
}

export function touchLastLogin(id: number): void {
  getDb()
    .prepare("UPDATE users SET last_login_at = ? WHERE id = ?")
    .run(nowIso(), id);
}

/** 관리자 시드 스크립트가 쓴다: 주인 없는 할 일을 이 사용자 것으로 넘긴다 */
export function claimOrphanTodos(userId: number): number {
  return getDb()
    .prepare("UPDATE todos SET user_id = ? WHERE user_id IS NULL")
    .run(userId).changes;
}
