import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  publicSupabaseConfig,
  sessionCookieOptions,
  sessionCookieFlags,
} from "@/lib/supabase/config";
import type { Database } from "@/types/database";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const isLogin = request.nextUrl.pathname === "/login";
  const deny = () => {
    const result = request.nextUrl.pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Acceso no autorizado." }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  };
  if (!isSupabaseConfigured()) return isLogin ? response : deny();
  const { url, key } = publicSupabaseConfig();
  const client = createServerClient<Database>(url, key, {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        response.headers.set("Cache-Control", "private, no-store");
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            ...sessionCookieFlags(),
          }),
        );
      },
    },
  });
  const { data, error } = await client.auth.getClaims();
  if (!isLogin && (error || !data?.claims?.sub)) return deny();
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|images/).*)"],
};
