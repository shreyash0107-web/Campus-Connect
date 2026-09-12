import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const protectedRoute = /^\/(dashboard|students|opportunities|create-opportunity|my-opportunities|profile)(\/|$)/.test(path);
  let response = NextResponse.next({ request });
  const config = supabaseConfig();
  function toLogin() {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path + request.nextUrl.search);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  if (!config) return protectedRoute ? toLogin() : response;
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values, headers) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  try {
    const { data, error } = await supabase.auth.getUser();
    if (protectedRoute && (error || !data.user)) return toLogin();
  } catch {
    if (protectedRoute) return toLogin();
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/dashboard/:path*", "/students/:path*", "/opportunities/:path*", "/create-opportunity", "/my-opportunities", "/profile", "/login", "/signup", "/auth/:path*"],
};
