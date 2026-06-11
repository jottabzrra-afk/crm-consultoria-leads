import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

const publicPaths = ["/login", "/cadastro", "/f/"];

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, key } = getSupabaseConfig();
  let response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isPublic = publicPaths.some((path) =>
    path.endsWith("/")
      ? request.nextUrl.pathname.startsWith(path)
      : request.nextUrl.pathname === path,
  );

  if (!data?.claims && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (data?.claims && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
