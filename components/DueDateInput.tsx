"use client";

import { useId, useRef, useState } from "react";

/**
 * 마감일(선택) + 마감 시간(선택, 10분 단위) 입력.
 *
 * 시간만 있고 날짜가 없는 상태는 의미가 없으므로,
 * 날짜를 고르기 전에는 시간 입력을 잠근다.
 *
 * step={600} 은 초 단위라 10분을 뜻한다. 다만 직접 타이핑하면
 * 10분 단위를 벗어난 값도 들어올 수 있어 서버에서 다시 검사한다.
 *
 * 추가 폼과 수정 폼에서 함께 쓰이므로 id 는 useId 로 만든다.
 * (한 화면에 여러 개가 떠도 label 연결이 어긋나지 않게)
 */
export default function DueDateInput({
  defaultDate = "",
  defaultTime = "",
}: {
  defaultDate?: string | null;
  defaultTime?: string | null;
}) {
  const uid = useId();
  const dateId = `${uid}-due-date`;
  const timeId = `${uid}-due-time`;

  const [hasDate, setHasDate] = useState(Boolean(defaultDate));
  const timeRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={dateId} className="text-sm text-muted">
        마감
      </label>

      <input
        id={dateId}
        name="due_date"
        type="date"
        defaultValue={defaultDate ?? ""}
        onChange={(e) => {
          const filled = Boolean(e.target.value);
          setHasDate(filled);
          // 날짜를 지우면 남아 있던 시간도 함께 지운다
          if (!filled && timeRef.current) timeRef.current.value = "";
        }}
        className="rounded-lg border border-line bg-background px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      />

      <label htmlFor={timeId} className="sr-only">
        마감 시간
      </label>
      <input
        ref={timeRef}
        id={timeId}
        name="due_time"
        type="time"
        step={600}
        defaultValue={defaultTime ?? ""}
        disabled={!hasDate}
        title="10분 단위로 입력할 수 있습니다"
        className="rounded-lg border border-line bg-background px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 disabled:opacity-40"
      />

      <span className="text-xs text-muted">
        {hasDate
          ? "시간은 10분 단위 (선택)"
          : "날짜를 고르면 시간도 넣을 수 있습니다"}
      </span>
    </div>
  );
}
