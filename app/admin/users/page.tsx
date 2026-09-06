import Link from "next/link";
import UserCreateForm from "@/components/UserCreateForm";
import UserRow from "@/components/UserRow";
import { listUsers } from "@/db/users";
import { requireAdmin } from "@/lib/dal";

export const dynamic = "force-dynamic";

export const metadata = { title: "계정 관리 · Project_Todo" };

export default async function AdminUsersPage() {
  // 관리자가 아니면 여기서 목록 화면으로 돌려보낸다
  const me = await requireAdmin();
  const users = listUsers();

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-6">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← 할 일로 돌아가기
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">계정 관리</h1>
        <p className="mt-1 text-sm text-muted">
          전체 {users.length}명 · 관리자만 들어올 수 있는 화면입니다
        </p>
      </header>

      <UserCreateForm />

      <h2 className="mt-8 mb-3 font-semibold">계정 목록</h2>
      <ul className="space-y-2">
        {users.map((user) => (
          <UserRow key={user.id} user={user} isMe={user.id === me.id} />
        ))}
      </ul>
    </main>
  );
}
