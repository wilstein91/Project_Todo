/**
 * 화면 확인용 샘플 할 일 넣기.
 *
 *   npm run db:seed-sample            (관리자 계정에 넣기)
 *   npm run db:seed-sample -- hana    (특정 계정에 넣기)
 *
 * 마감일은 '오늘' 기준으로 계산하므로 언제 실행해도 하이라이트가 보인다.
 * 이미 같은 제목이 있으면 건너뛴다.
 */

import { getDb } from "../db/client.ts";

const pad2 = (n) => String(n).padStart(2, "0");
const localDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 오늘부터 며칠 뒤의 날짜 문자열 */
function daysFromToday(delta) {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return localDate(d);
}

const db = getDb();

const wanted = process.argv[2];
const user = wanted
  ? db.prepare("SELECT id, username FROM users WHERE username = ?").get(wanted)
  : db
      .prepare("SELECT id, username FROM users WHERE role = 'admin' ORDER BY id LIMIT 1")
      .get();

if (!user) {
  console.error(
    `\n[실패] ${wanted ? `'${wanted}' 계정을 찾을 수 없습니다.` : "관리자 계정이 없습니다."}\n` +
      "       먼저 npm run db:seed-admin 을 실행하세요.\n",
  );
  process.exit(1);
}

// [제목, 메모, 며칠 뒤(null=마감없음), 시간(10분 단위), 카테고리, 완료여부]
const SAMPLES = [
  ["관리비 자동이체 신청", null, -3, null, "personal", 0],
  ["팀 주간회의 자료 업로드", "공유 드라이브에 올리기", 0, "09:00", "work", 0],
  ["저녁 약속 - 대학 동기", "7시 강남", 0, "18:30", "personal", 0],
  ["세탁물 맡기기", null, 0, null, "personal", 0],
  ["치과 진료", "오른쪽 아래 어금니 시림", 1, "14:30", "personal", 0],
  ["전세 계약서 특약사항 검토", null, 3, null, "work", 0],
  ["어머니 생신 선물 고르기", "지난번에 스카프 말씀하셨음", 5, "10:00", "family", 0],
  ["자동차 정기점검 예약", null, 7, null, "etc", 0],
  ["여권 갱신", "만료 3개월 전까지", 14, null, "etc", 0],
  ["읽을 책 목록 정리", null, null, null, "none", 0],
  ["블로그 글 초안 쓰기", null, null, null, "none", 0],
  ["건강검진 예약", "국가검진 대상", -2, null, "personal", 1],
];

const exists = db.prepare(
  "SELECT 1 FROM todos WHERE user_id = ? AND title = ? LIMIT 1",
);
const insert = db.prepare(
  `INSERT INTO todos
     (user_id, title, memo, due_date, due_time, category, is_done, done_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

let added = 0;
let skipped = 0;

// 여러 건을 한 트랜잭션으로 넣는다 (중간에 실패하면 통째로 롤백)
db.transaction(() => {
  for (const [title, memo, offset, time, category, done] of SAMPLES) {
    if (exists.get(user.id, title)) {
      skipped++;
      continue;
    }
    const now = new Date().toISOString();
    insert.run(
      user.id,
      title,
      memo,
      offset === null ? null : daysFromToday(offset),
      time,
      category,
      done,
      done ? now : null,
      now,
      now,
    );
    added++;
  }
})();

console.log(`'${user.username}' 계정에 샘플 ${added}건을 넣었습니다.`);
if (skipped > 0) {
  console.log(`이미 있어서 건너뛴 것: ${skipped}건`);
}
