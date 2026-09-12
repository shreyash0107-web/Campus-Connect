import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next"), "/profile?welcome=1"), request.url));
    } catch { /* Return a friendly, non-sensitive error at login. */ }
  }
  return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
}
