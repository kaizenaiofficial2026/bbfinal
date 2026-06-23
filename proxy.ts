import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Staff gate for /admin/* (admin is English-only, not under [locale]).
async function requireStaffSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

// Keep a customer's Supabase session alive across visits. The middleware is the
// only place that can WRITE refreshed/rotated auth cookies back to the browser —
// a Server Component can read the session but can't persist a refresh. Without
// this, once the short-lived access token expires a returning customer would be
// silently logged out (when Supabase refresh-token rotation is enabled). We only
// refresh here; gating stays in the pages (requireCustomer / requireVerifiedCustomer).
async function refreshCustomerSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Persist refreshed/rotated auth cookies onto the i18n response so they
        // reach the browser and the customer stays signed in next visit.
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Validates the access token and, when it has expired, refreshes it via the
  // refresh token — persisting the new tokens through setAll above. No-ops for
  // anonymous visitors (no auth cookie → no network call, nothing written).
  await supabase.auth.getUser();
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin/* is not localized. Gate everything except the login page; never
  // hand admin routes to the i18n middleware.
  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }
    return requireStaffSession(request);
  }

  // Public + customer routes: i18n handles locale detection and routing, then we
  // refresh the customer's Supabase session and write any rotated auth cookies
  // onto the i18n response so the session survives across visits. The customer-
  // area auth gate still lives in the pages themselves (requireCustomer /
  // requireVerifiedCustomer), which redirect when there's no verified session.
  const response = await intlMiddleware(request);
  await refreshCustomerSession(request, response);
  return response;
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
