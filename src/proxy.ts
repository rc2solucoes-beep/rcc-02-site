import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;

  // Unauthenticated → redirect to login (except login page itself)
  if (!session && pathname !== "/admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Authenticated on login page → redirect to dashboard
  if (session && pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path+"],
};
