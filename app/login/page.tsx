import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getOptionalUser } from "@/lib/dal";

export const dynamic = "force-dynamic";

export const metadata = { title: "로그인 · Project_Todo" };

export default async function LoginPage() {
  // 이미 로그인했으면 목록으로 보낸다
  if (await getOptionalUser()) redirect("/");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">할 일</h1>
      <p className="mt-1 mb-6 text-sm text-muted">
        계정으로 로그인해 주세요.
      </p>

      <LoginForm />

      <p className="mt-4 text-xs text-muted">
        계정은 관리자만 만들 수 있습니다. 필요하면 관리자에게 요청하세요.
      </p>
    </main>
  );
}
