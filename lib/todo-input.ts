/**
 * 할 일 입력값 파싱·검증.
 *
 * 추가(createTodoAction)와 수정(updateTodoAction)이 이 모듈을 공유한다.
 * 두 경로의 규칙이 어긋나면 한쪽으로만 잘못된 값이 들어갈 수 있으므로
 * 검증은 반드시 여기 한 곳에만 둔다.
 */

import { isTenMinuteStep, isValidDateStr, isValidTimeStr } from "./date";
import {
  DEFAULT_CATEGORY,
  isCategoryCode,
  type CategoryCode,
} from "./categories";

export const TITLE_MAX = 200;
export const MEMO_MAX = 2000;

export type TodoInput = {
  title: string;
  memo: string | null;
  dueDate: string | null;
  dueTime: string | null;
  category: CategoryCode;
};

export type ParsedInput =
  | { ok: true; value: TodoInput }
  | { ok: false; error: string };

export function parseTodoForm(formData: FormData): ParsedInput {
  const fail = (error: string): ParsedInput => ({ ok: false, error });
  const field = (name: string) => String(formData.get(name) ?? "").trim();

  // 제목
  const title = field("title");
  if (!title) return fail("할 일 내용을 입력해 주세요.");
  if (title.length > TITLE_MAX) {
    return fail(`할 일은 ${TITLE_MAX}자 이내로 입력해 주세요.`);
  }

  // 메모 (선택)
  const memo = field("memo");
  if (memo.length > MEMO_MAX) {
    return fail(`메모는 ${MEMO_MAX}자 이내로 입력해 주세요.`);
  }

  // 마감일 (선택)
  const dueDateRaw = field("due_date");
  let dueDate: string | null = null;
  if (dueDateRaw) {
    if (!isValidDateStr(dueDateRaw)) {
      return fail("마감일이 올바른 날짜가 아닙니다.");
    }
    dueDate = dueDateRaw;
  }

  // 마감 시간 (선택) — 브라우저 step 만 믿지 않고 서버에서 다시 검사한다
  const dueTimeRaw = field("due_time");
  let dueTime: string | null = null;
  if (dueTimeRaw) {
    if (!dueDate) {
      return fail("마감 시간을 넣으려면 마감일을 먼저 선택해 주세요.");
    }
    if (!isValidTimeStr(dueTimeRaw)) {
      return fail("마감 시간이 올바른 시각이 아닙니다.");
    }
    if (!isTenMinuteStep(dueTimeRaw)) {
      return fail("마감 시간은 10분 단위로 입력해 주세요. (예: 14:30)");
    }
    dueTime = dueTimeRaw;
  }

  // 카테고리 — 알 수 없는 값이면 미분류로 떨어뜨린다
  const categoryRaw = field("category");
  const category: CategoryCode = isCategoryCode(categoryRaw)
    ? categoryRaw
    : DEFAULT_CATEGORY;

  return {
    ok: true,
    value: { title, memo: memo || null, dueDate, dueTime, category },
  };
}

/** 폼에서 온 id 값을 검증한다 */
export function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}
