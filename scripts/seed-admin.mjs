/**
 * 최초 관리자 계정 만들기.
 *
 *   npm run db:seed-admin
 *
 * .env 의 ADMIN_USERNAME / ADMIN_PASSWORD 를 읽어 계정을 만든다.
 * DB 에는 평문이 아니라 bcrypt 해시만 저장하며, 평문은 화면에도 찍지 않는다.
 * 이미 같은 아이디가 있으면 비밀번호만 다시 맞춘다.
 */

import bcrypt from "bcryptjs";
import { getDb } from "../db/client.ts";

const COST = 10;
const PASSWORD_MIN = 6;

function fail(message) {
  console.error(`\n[실패] ${message}\n`);
  process.exit(1);
}

const username = (process.env.ADMIN_USERNAME ?? "").trim();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!username || !password) {
  fail(
    ".env 에 ADMIN_USERNAME 과 ADMIN_PASSWORD 를 넣어 주세요.\n" +
      "       .env.example 을 참고하세요.",
  );
}
if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
  fail("ADMIN_USERNAME 은 영문·숫자·밑줄 3~30자여야 합니다.");
}
if (password.length < PASSWORD_MIN) {
  fail(`ADMIN_PASSWORD 는 ${PASSWORD_MIN}자 이상이어야 합니다.`);
}

// getDb() 를 부르면 마이그레이션이 먼저 적용된다
const db = getDb();
const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync(password, COST);

const existing = db
  .prepare("SELECT id, role FROM users WHERE username = ?")
  .get(username);

let userId;
if (existing) {
  db.prepare(
    "UPDATE users SET password_hash = ?, role = 'admin', updated_at = ? WHERE id = ?",
  ).run(passwordHash, now, existing.id);
  userId = existing.id;
  console.log(`기존 계정 '${username}' 의 비밀번호를 .env 값으로 맞췄습니다.`);
} else {
  const result = db
    .prepare(
      `INSERT INTO users (username, password_hash, role, created_at, updated_at)
       VALUES (?, ?, 'admin', ?, ?)`,
    )
    .run(username, passwordHash, now, now);
  userId = Number(result.lastInsertRowid);
  console.log(`관리자 계정 '${username}' 을 만들었습니다.`);
}

// 계정이 생기기 전에 만들어 둔 할 일은 주인이 없다. 관리자에게 넘긴다.
const claimed = db
  .prepare("UPDATE todos SET user_id = ? WHERE user_id IS NULL")
  .run(userId).changes;

if (claimed > 0) {
  console.log(`주인 없던 할 일 ${claimed}건을 '${username}' 에게 넘겼습니다.`);
}

const counts = db
  .prepare("SELECT COUNT(*) AS users FROM users")
  .get();
console.log(`현재 계정 수: ${counts.users}명`);
console.log("비밀번호는 해시로만 저장되었습니다.");
