"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";

/**
 * 제목·메모 검색.
 *
 * 검색어를 URL(?q=) 에 넣어 서버에서 조회한다. 입력할 때마다 이동하면
 * 요청이 과하므로 300ms 기다린 뒤 한 번만 이동한다.
 */
export default function SearchBox({ initialQuery }: { initialQuery: string }) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = useId();
  const id = `${uid}-q`;

  const currentQuery = searchParams.get("q") ?? "";

  useEffect(() => {
    const trimmed = value.trim();
    // 이미 URL 과 같으면 이동하지 않는다 (뒤로가기 후 무한 이동 방지)
    if (trimmed === currentQuery) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    }, 300);

    return () => clearTimeout(timer);
  }, [value, currentQuery, searchParams, router]);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        검색
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="제목·메모 검색"
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 pr-9 text-sm outline-none placeholder:text-muted focus:border-blue-500"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="검색어 지우기"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          ✕
        </button>
      )}
    </div>
  );
}
