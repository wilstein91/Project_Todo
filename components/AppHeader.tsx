import Link from "next/link";
import { logoutAction } from "@/app/auth-actions";
import type { SafeUser } from "@/db/users";

/** 목록 화면 위쪽의 로그인 상태 표시줄 */
export default function AppHeader({ user }: { user: SafeUser }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
      <span className="text-sm text-muted">
        <span className="font-medium text-foreground">
          {user.display_name || user.username}
        </span>
        <span> 님</span>
      </span>

      <span className="flex items-center gap-1">
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            계정 관리
          </Link>
        )}
        {/* 로그아웃은 상태를 바꾸는 동작이므로 링크가 아니라 폼으로 처리한다 */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            로그아웃
          </button>
        </form>
      </span>
    </div>
  );
}
