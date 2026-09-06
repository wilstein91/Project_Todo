/**
 * 날짜·시간 유틸.
 *
 * 모든 값은 로컬(KST) 기준으로 다룬다. 마감일은 'YYYY-MM-DD',
 * 마감 시간은 'HH:MM' 문자열이며 UTC 변환을 하지 않는다.
 * toISOString() 은 UTC 로 바꿔버리므로 날짜 계산에 쓰지 않는다.
 */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 레코드의 created_at / updated_at 에 넣을 현재 시각 (ISO 8601) */
export function nowIso(): string {
  return new Date().toISOString();
}

/** 로컬 기준 오늘 날짜 'YYYY-MM-DD' */
export function todayLocal(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** 로컬 기준 현재 시각 'HH:MM' */
export function nowTimeLocal(now: Date = new Date()): string {
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** 'YYYY-MM-DD' 를 로컬 자정 Date 로 파싱한다 (new Date(문자열) 은 UTC 로 해석되므로 쓰지 않는다) */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 'YYYY-MM-DD' 에 일수를 더한 날짜 문자열 */
export function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return todayLocal(d);
}

/** to - from (일 단위). 둘 다 'YYYY-MM-DD' */
export function diffDays(to: string, from: string): number {
  const ms = parseLocalDate(to).getTime() - parseLocalDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** 실제로 존재하는 날짜인지 검사한다 (2026-02-30 같은 값을 걸러낸다) */
export function isValidDateStr(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

/** 'HH:MM' 형식이며 실제로 존재하는 시각인지 */
export function isValidTimeStr(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/** 분이 10의 배수인지 (PRD: 마감 시간은 10분 단위) */
export function isTenMinuteStep(value: string): boolean {
  const [, m] = value.split(":").map(Number);
  return m % 10 === 0;
}

/** '9/10 (목)' 형태로 표시한다 */
export function formatDueDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS[d.getDay()]})`;
}

/** '9/10 (목) 14:30' — 시간이 없으면 날짜만 */
export function formatDue(dateStr: string, timeStr: string | null): string {
  const date = formatDueDate(dateStr);
  return timeStr ? `${date} ${timeStr}` : date;
}

export type DueKind =
  | "none" // 마감 없음
  | "done" // 완료됨 (강조하지 않는다)
  | "overdue" // 기한 지남
  | "today" // 오늘
  | "soon" // D-1 ~ D-3
  | "week" // D-4 ~ D-7
  | "far"; // 8일 이상

export type DueStatus = {
  kind: DueKind;
  /** 뱃지에 쓸 상대 표현. far/none/done 은 null */
  label: string | null;
  /** '9/10 (목) 14:30' */
  text: string | null;
};

/**
 * 마감 상태를 판정한다.
 *
 * 시간 미지정: 날짜 단위로만 비교한다 (오늘이면 아직 지나지 않은 것으로 본다).
 * 시간 지정:   현재 시각과 비교해 '3시간 지남' 처럼 시간 단위로 표시한다.
 */
export function getDueStatus(
  dueDate: string | null,
  dueTime: string | null,
  isDone: boolean,
  now: Date = new Date(),
): DueStatus {
  if (!dueDate) return { kind: "none", label: null, text: null };

  const text = formatDue(dueDate, dueTime);
  if (isDone) return { kind: "done", label: null, text };

  const diff = diffDays(dueDate, todayLocal(now));

  if (dueTime) {
    const [h, m] = dueTime.split(":").map(Number);
    const dueAt = parseLocalDate(dueDate);
    dueAt.setHours(h, m, 0, 0);
    const elapsedMs = now.getTime() - dueAt.getTime();

    if (elapsedMs > 0) {
      const minutes = Math.floor(elapsedMs / 60_000);
      const label =
        minutes < 60
          ? `${minutes}분 지남`
          : minutes < 1440
            ? `${Math.floor(minutes / 60)}시간 지남`
            : `${Math.floor(minutes / 1440)}일 지남`;
      return { kind: "overdue", label, text };
    }
  } else if (diff < 0) {
    return { kind: "overdue", label: `${-diff}일 지남`, text };
  }

  if (diff === 0) {
    return {
      kind: "today",
      label: dueTime ? `오늘 ${dueTime}` : "오늘",
      text,
    };
  }
  if (diff <= 3) return { kind: "soon", label: `D-${diff}`, text };
  if (diff <= 7) return { kind: "week", label: `D-${diff}`, text };
  return { kind: "far", label: null, text };
}

/* ── 달력(월간 뷰)용 ────────────────────────────────────────── */

export const WEEKDAY_LABELS = WEEKDAYS;

/** Date 를 'YYYY-MM' 로 (로컬 기준) */
export function monthKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

/** 'YYYY-MM' 형식이며 실제로 존재하는 달인지 */
export function isValidMonthStr(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [, m] = value.split("-").map(Number);
  return m >= 1 && m <= 12;
}

/** 'YYYY-MM' 에 개월을 더한다 (연도 넘김 처리 포함) */
export function addMonths(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

/** '2026년 9월' */
export function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split("-").map(Number);
  return `${y}년 ${m}월`;
}

/** 그 달의 첫날과 마지막날 ('YYYY-MM-DD') */
export function monthRange(monthStr: string): { start: string; end: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const last = new Date(y, m, 0); // 다음 달 0일 = 이번 달 마지막 날
  return { start: todayLocal(first), end: todayLocal(last) };
}

export type CalendarCell = {
  date: string; // 'YYYY-MM-DD'
  day: number; // 1~31
  inMonth: boolean; // 이번 달인지 (앞뒤로 채운 날은 false)
  isToday: boolean;
  weekday: number; // 0=일 ~ 6=토
};

/**
 * 달력 그리드를 만든다. 항상 일요일에서 시작해 토요일에 끝나도록
 * 앞뒤를 이웃 달 날짜로 채운다. 반환값은 주 단위 배열이다.
 */
export function monthGrid(
  monthStr: string,
  now: Date = new Date(),
): CalendarCell[][] {
  const [y, m] = monthStr.split("-").map(Number);
  const today = todayLocal(now);

  const first = new Date(y, m - 1, 1);
  // 첫 주의 일요일까지 거슬러 올라간다
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - cursor.getDay());

  const weeks: CalendarCell[][] = [];
  // 6주면 어떤 달이든 다 담긴다. 마지막 주가 통째로 다음 달이면 뒤에서 잘라낸다.
  for (let w = 0; w < 6; w++) {
    const week: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = todayLocal(cursor);
      week.push({
        date,
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === m - 1 && cursor.getFullYear() === y,
        isToday: date === today,
        weekday: cursor.getDay(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  while (weeks.length > 4 && weeks[weeks.length - 1].every((c) => !c.inMonth)) {
    weeks.pop();
  }
  return weeks;
}
