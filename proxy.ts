import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

/**
 * Next 16 에서는 middleware.ts 가 proxy.ts 로 바뀌었다.
 *
 * 여기서는 쿠키만 보고 빠르게 걸러낸다(낙관적 확인).
 * 모든 요청마다 실행되므로 DB 를 조회하지 않는다.
 * 실제 권한 확인은 각 화면·액션에서 lib/dal.ts 를 통해 다시 한다.
 */

const PUBLIC_PATHS = ["/login"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.includes(path);

  const session = await decrypt(req.cookies.get("session")?.value);

  if (!isPublic && !session) {
    const url = new URL("/login", req.nextUrl);
    return NextResponse.redirect(url);
  }

  if (isPublic && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일과 이미지 최적화 요청에는 실행하지 않는다
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
