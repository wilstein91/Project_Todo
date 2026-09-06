"use client";

import { useRef, useState } from "react";

/**
 * 마감일(선택) + 마감 시간(선택, 10분 단위) 입력.
 *
 * 시간만 있고 날짜가 없는 상태는 의미가 없으므로,
 * 날짜를 고르기 전에는 시간 입력을 잠근다.
 *
 * step={600} 은 초 단위라 10분을 뜻한다. 다만 직접 타이핑하면
 * 10분 단위를 벗어난 값도 들어올 수 있어 서버에서 다시 검사한다.
 *
 * 추가에 성공하면 부모가 key 를 바꿔 이 컴포넌트를 다시 마운트한다.
 * 그러면 잠금 상태가 자연스럽게 초기화되므로 effect 로 되돌릴 필요가 없다.
 */
export default function DueDateInput() {
  const [hasDate, setHasDate] = useState(false);
  const timeRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <label htmlFor="due_date" className="text-sm text-muted">
        마감
      </label>

      <input
        id="due_date"
        name="due_date"
        type="date"
        onChange={(e) => {
          const filled = Boolean(e.target.value);
          setHasDate(filled);
          // 날짜를 지우면 남아 있던 시간도 함께 지운다
          if (!filled && timeRef.current) timeRef.current.value = "";
        }}
        className="rounded-lg border border-line bg-background px-2.5 py-1.5 text-sm outline-none focus:border-blue-500"
      />

      <label htmlFor="due_time" className="sr-only">
        마감 시간
      </label>
      <input
        ref={timeRef}
        id="due_time"
        name="due_time"
        type="time"
        step={600}
        disabled={!hasDate}
        title="10분 단위로 입력할 수 있습니다"
        className="rounded-lg border border-line bg-background px-2.5 py-1.5 text-sm outline-none focus:border-blue-500 disabled:opacity-40"
      />

      <span className="text-xs text-muted">
        {hasDate ? "시간은 10분 단위 (선택)" : "날짜를 고르면 시간도 넣을 수 있습니다"}
      </span>
    </div>
  );
}
