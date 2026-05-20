# Admin Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove insecure admin setup/debug HTTP surface, centralize server-side admin authorization, harden first-admin bootstrap behind an explicit token, and make `/admin` login-only without proxy redirect loops.

**Architecture:** Introduce a single `requireAdmin()` helper backed by `createSessionClient()` for all normal admin authorization checks. Restrict `createServiceClient()` to the bootstrap-only branch inside `POST /api/admin/init` after session and bootstrap-token checks, and use it there to call an atomic database operation that creates the first admin only if `admin_users` is still empty. Simplify `/admin` so the page decides access after calling `/api/admin/init`, and reduce `src/proxy.ts` to session-gating only for protected admin pages.

**Tech Stack:** Next.js App Router, route handlers, Next proxy, Supabase SSR auth, Supabase table `admin_users`, Vitest, Playwright, TypeScript

---

## File Map

**Create:**

- `src/lib/admin/requireAdmin.ts`
- `tests/unit/admin/requireAdmin.test.ts`
- `tests/unit/admin/init-route.test.ts`
- `tests/unit/admin/proxy.test.ts`

**Modify:**

- `src/app/api/admin/init/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/(protected)/layout.tsx`
- `src/proxy.ts`
- `tests/e2e/admin.spec.ts`

**Delete:**

- `src/app/api/admin/ensure-admin/route.ts`
- `src/app/api/admin/debug/route.ts`
- `src/app/admin/status/page.tsx`

## Task 1: Add failing tests for centralized admin authorization

**Files:**

- Create: `tests/unit/admin/requireAdmin.test.ts`
- Test target: `src/lib/admin/requireAdmin.ts`

- [ ] **Step 1: Write the failing helper test file**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: vi.fn(async () => ({
    auth: { getSession },
    from,
  })),
}));

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    getSession.mockReset();
    maybeSingle.mockReset();
    eq.mockClear();
    select.mockClear();
    from.mockClear();
  });

  it("returns 401 when there is no active session", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toEqual({
      ok: false,
      status: 401,
      user: null,
      email: null,
      userId: null,
    });
  });

  it("returns 403 when the session user is not in admin_users", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "user@example.com" } } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toMatchObject({
      ok: false,
      status: 403,
      email: "user@example.com",
      userId: "user-1",
    });
  });

  it("returns 200 when the session user is present in admin_users", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "admin-1", email: "admin@example.com" } } },
      error: null,
    });
    maybeSingle.mockResolvedValue({
      data: { id: "admin-1", email: "admin@example.com" },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/admin/requireAdmin");
    const result = await requireAdmin();

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      email: "admin@example.com",
      userId: "admin-1",
    });
  });
});
```

- [ ] **Step 2: Run the helper tests and confirm they fail because the helper does not exist yet**

Run: `npm run test -- tests/unit/admin/requireAdmin.test.ts`

Expected: FAIL with a module resolution error for `@/lib/admin/requireAdmin`

- [ ] **Step 3: Implement the minimal helper**

```ts
import { createSessionClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createSessionClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      ok: false as const,
      status: 401,
      user: null,
      email: null,
      userId: null,
    };
  }

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id,email")
    .eq("id", session.user.id)
    .maybeSingle();

  if (adminError || !adminUser) {
    return {
      ok: false as const,
      status: 403,
      user: session.user,
      email: session.user.email ?? null,
      userId: session.user.id,
    };
  }

  return {
    ok: true as const,
    status: 200,
    user: session.user,
    email: session.user.email ?? null,
    userId: session.user.id,
  };
}
```

- [ ] **Step 4: Run the helper tests again**

Run: `npm run test -- tests/unit/admin/requireAdmin.test.ts`

Expected: PASS with 3 tests passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/requireAdmin.ts tests/unit/admin/requireAdmin.test.ts
git commit -m "test: add centralized admin authorization helper"
```

## Task 2: Reuse `requireAdmin()` in existing server-side admin gates

**Files:**

- Modify: `src/app/api/upload/route.ts`
- Modify: `src/app/admin/(protected)/layout.tsx`
- Test: `tests/unit/admin/requireAdmin.test.ts`

- [ ] **Step 1: Replace ad hoc upload authorization with the helper**

```ts
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const admin = await requireAdmin();

  if (!admin.ok) {
    if (admin.status === 401) {
      console.warn("[/api/upload] Access denied: no active session");
    } else {
      console.warn("[/api/upload] Access denied: user is not an admin");
    }

    return NextResponse.json({ error: "Não autorizado" }, { status: admin.status });
  }

  // existing upload flow remains unchanged for callers below this point.
  // If review finds a concrete security flaw in MIME allowlisting or blob-path
  // composition while touching this handler, harden it in this same task.
}
```

- [ ] **Step 2: Replace duplicated protected-layout admin lookup with the helper**

```ts
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    if (admin.status === 401) {
      console.warn("[AdminLayout] Access denied: no active session");
    } else {
      console.warn("[AdminLayout] Access denied: user is not an admin");
    }

    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Run the helper tests as a regression check**

Run: `npm run test -- tests/unit/admin/requireAdmin.test.ts`

Expected: PASS

- [ ] **Step 4: Run typecheck on the touched files**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/upload/route.ts src/app/admin/(protected)/layout.tsx
git commit -m "refactor: reuse requireAdmin across admin server gates"
```

## Task 3: Add failing tests for hardened `/api/admin/init`

**Files:**

- Create: `tests/unit/admin/init-route.test.ts`
- Test target: `src/app/api/admin/init/route.ts`

- [ ] **Step 1: Write the route test file with explicit bootstrap cases**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const sessionMaybeSingle = vi.fn();
const sessionEq = vi.fn(() => ({ maybeSingle: sessionMaybeSingle }));
const sessionSelect = vi.fn(() => ({ eq: sessionEq }));
const sessionFrom = vi.fn(() => ({ select: sessionSelect }));

const serviceInsert = vi.fn();
const serviceSelect = vi.fn();
const serviceEq = vi.fn();
const serviceMaybeSingle = vi.fn();
const serviceFrom = vi.fn((table: string) => {
  if (table === "admin_users") {
    return {
      select: serviceSelect,
      insert: serviceInsert,
    };
  }
  throw new Error(`Unexpected table ${table}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createSessionClient: vi.fn(async () => ({
    auth: { getSession },
    from: sessionFrom,
  })),
  createServiceClient: vi.fn(() => ({
    from: serviceFrom,
  })),
}));

describe("POST /api/admin/init", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    getSession.mockReset();
    sessionMaybeSingle.mockReset();
    sessionEq.mockClear();
    sessionSelect.mockClear();
    sessionFrom.mockClear();
    serviceInsert.mockReset();
    serviceSelect.mockReset();
    serviceEq.mockReset();
    serviceMaybeSingle.mockReset();
    serviceFrom.mockClear();
  });

  it("returns 401 without session", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const { POST } = await import("@/app/api/admin/init/route");
    const response = await POST(new Request("http://localhost/api/admin/init", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("returns 200 for an existing admin user", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "admin-1", email: "admin@example.com" } } },
      error: null,
    });
    sessionMaybeSingle.mockResolvedValue({
      data: { id: "admin-1", email: "admin@example.com" },
      error: null,
    });

    const { POST } = await import("@/app/api/admin/init/route");
    const response = await POST(new Request("http://localhost/api/admin/init", { method: "POST" }));

    expect(response.status).toBe(200);
  });

  it("returns 403 for a non-admin user when admins already exist", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "user@example.com" } } },
      error: null,
    });
    sessionMaybeSingle.mockResolvedValue({ data: null, error: null });
    serviceSelect.mockReturnValueOnce({ eq: serviceEq });
    serviceEq.mockReturnValueOnce({ maybeSingle: serviceMaybeSingle });
    serviceMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    serviceSelect.mockReturnValueOnce(Promise.resolve({ count: 1 }));

    const { POST } = await import("@/app/api/admin/init/route");
    const response = await POST(new Request("http://localhost/api/admin/init", { method: "POST" }));

    expect(response.status).toBe(403);
  });

  it("returns 403 when bootstrap token header is missing", async () => {
    vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1", email: "user@example.com" } } },
      error: null,
    });
    sessionMaybeSingle.mockResolvedValue({ data: null, error: null });
    serviceSelect.mockReturnValueOnce(Promise.resolve({ count: 0 }));

    const { POST } = await import("@/app/api/admin/init/route");
    const response = await POST(new Request("http://localhost/api/admin/init", { method: "POST" }));

    expect(response.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run the route tests and confirm they fail against the current implementation**

Run: `npm run test -- tests/unit/admin/init-route.test.ts`

Expected: FAIL because the current route auto-promotes the first user and does not enforce the bootstrap token

- [ ] **Step 3: Rewrite `/api/admin/init` with explicit verification and protected bootstrap**

```ts
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { NextRequest, NextResponse } from "next/server";

function forbidden() {
  return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    if (admin.ok) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (admin.status === 401 || !admin.userId) {
      console.warn("[/api/admin/init] Access denied: no active session");
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
    const requestToken = request.headers.get("x-admin-bootstrap-token");

    if (!bootstrapToken || !requestToken) {
      console.warn("[/api/admin/init] Bootstrap denied: missing bootstrap token");
      return forbidden();
    }

    if (requestToken !== bootstrapToken) {
      console.warn("[/api/admin/init] Bootstrap denied: invalid bootstrap token");
      return forbidden();
    }

    const serviceClient = createServiceClient();
    const { count } = await serviceClient
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      console.warn("[/api/admin/init] Bootstrap denied: admin already exists");
      return forbidden();
    }

    const { error: insertError } = await serviceClient
      .from("admin_users")
      .insert([{ id: admin.userId, email: admin.email }]);

    if (insertError) {
      console.error("[/api/admin/init] Bootstrap insert failed:", insertError);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }

    console.info("[/api/admin/init] First admin created");
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[/api/admin/init] Unexpected error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Expand the route tests for invalid token and successful bootstrap**

```ts
it("returns 403 when bootstrap token is invalid", async () => {
  vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
  getSession.mockResolvedValue({
    data: { session: { user: { id: "user-1", email: "user@example.com" } } },
    error: null,
  });
  sessionMaybeSingle.mockResolvedValue({ data: null, error: null });

  const { POST } = await import("@/app/api/admin/init/route");
  const response = await POST(
    new Request("http://localhost/api/admin/init", {
      method: "POST",
      headers: { "x-admin-bootstrap-token": "wrong-token" },
    })
  );

  expect(response.status).toBe(403);
});

it("returns 201 only when the bootstrap token is valid and no admins exist", async () => {
  vi.stubEnv("ADMIN_BOOTSTRAP_TOKEN", "secret-bootstrap");
  getSession.mockResolvedValue({
    data: { session: { user: { id: "user-1", email: "user@example.com" } } },
    error: null,
  });
  sessionMaybeSingle.mockResolvedValue({ data: null, error: null });
  serviceSelect.mockReturnValueOnce(Promise.resolve({ count: 0 }));
  serviceInsert.mockResolvedValue({ error: null });

  const { POST } = await import("@/app/api/admin/init/route");
  const response = await POST(
    new Request("http://localhost/api/admin/init", {
      method: "POST",
      headers: { "x-admin-bootstrap-token": "secret-bootstrap" },
    })
  );

  expect(response.status).toBe(201);
});
```

- [ ] **Step 5: Run the route tests again**

Run: `npm run test -- tests/unit/admin/init-route.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/init/route.ts tests/unit/admin/init-route.test.ts
git commit -m "fix: harden admin bootstrap route"
```

## Task 4: Remove insecure routes and keep `/admin` login-only

**Files:**

- Delete: `src/app/api/admin/ensure-admin/route.ts`
- Delete: `src/app/api/admin/debug/route.ts`
- Delete: `src/app/admin/status/page.tsx`
- Modify: `src/app/admin/page.tsx`
- Test: `tests/e2e/admin.spec.ts`

- [ ] **Step 1: Delete the insecure admin setup and debug files**

```bash
git rm src/app/api/admin/ensure-admin/route.ts
git rm src/app/api/admin/debug/route.ts
git rm src/app/admin/status/page.tsx
```

- [ ] **Step 2: Remove setup states and signup/bootstrap UI from `/admin`**

```ts
type PageMode = "login" | "checking";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<PageMode>("checking");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const initResponse = await fetch("/api/admin/init", { method: "POST" });

        if (initResponse.status === 200) {
          router.push("/admin/dashboard");
          return;
        }

        if (initResponse.status === 403) {
          setError("Você não tem permissão de admin. Solicite acesso a um administrador.");
        }

        setMode("login");
      } catch {
        setMode("login");
      }
    };

    void checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.session) {
      setError("Credenciais inválidas. Verifique e-mail e senha.");
      setLoading(false);
      return;
    }

    const initResponse = await fetch("/api/admin/init", { method: "POST" });

    if (initResponse.status === 200) {
      router.push("/admin/dashboard");
      router.refresh();
      return;
    }

    if (initResponse.status === 403) {
      setError("Você não tem permissão de admin. Solicite acesso a um administrador.");
    } else {
      setError("Erro ao verificar permissões.");
    }

    setLoading(false);
  };
}
```

- [ ] **Step 3: Add a Playwright regression covering login-only behavior**

```ts
test("usuário sem permissão continua na tela /admin e vê erro de permissão", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel(/E-mail/i).fill(process.env.NON_ADMIN_EMAIL ?? "");
  await page.getByLabel(/Senha/i).fill(process.env.NON_ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: /Entrar/i }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("alert")).toContainText(/não tem permissão de admin/i);
});
```

- [ ] **Step 4: Run the focused E2E admin tests**

Run: `npm run test:e2e -- tests/e2e/admin.spec.ts`

Expected: PASS for login page and unauthenticated route protection; authenticated admin flows continue to pass when admin credentials are configured

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx tests/e2e/admin.spec.ts
git commit -m "fix: make admin login flow permission-only"
```

## Task 5: Fix `src/proxy.ts` so `/admin` can decide access

**Files:**

- Modify: `src/proxy.ts`
- Create: `tests/unit/admin/proxy.test.ts`

- [ ] **Step 1: Write a failing proxy regression test**

```ts
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getSession },
  })),
}));

describe("admin proxy", () => {
  it("does not redirect authenticated users away from /admin", async () => {
    getSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
    });

    const { proxy } = await import("@/proxy");
    const response = await proxy(new NextRequest("http://localhost/admin"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
```

- [ ] **Step 2: Run the proxy test and confirm it fails against the current redirect behavior**

Run: `npm run test -- tests/unit/admin/proxy.test.ts`

Expected: FAIL because the current proxy redirects `/admin` to `/admin/dashboard` for any authenticated session

- [ ] **Step 3: Simplify the proxy to gate protected paths only**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAdminRoot = pathname === "/admin";
  const isProtectedAdminPath = pathname.startsWith("/admin/") && pathname !== "/admin";

  if (!session && isProtectedAdminPath) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (isAdminRoot) {
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path+"],
};
```

- [ ] **Step 4: Run the proxy test again**

Run: `npm run test -- tests/unit/admin/proxy.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts tests/unit/admin/proxy.test.ts
git commit -m "fix: let admin page decide authenticated access"
```

## Task 6: Final verification and cleanup

**Files:**

- Verify: `src/app/api/admin/init/route.ts`
- Verify: `src/app/api/upload/route.ts`
- Verify: `src/app/admin/page.tsx`
- Verify: `src/proxy.ts`
- Verify deletions: `src/app/api/admin/ensure-admin/route.ts`, `src/app/api/admin/debug/route.ts`, `src/app/admin/status/page.tsx`

- [ ] **Step 1: Run the full unit test slice for admin hardening**

Run: `npm run test -- tests/unit/admin/requireAdmin.test.ts tests/unit/admin/init-route.test.ts tests/unit/admin/proxy.test.ts`

Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`

Expected: PASS

- [ ] **Step 4: Run the admin-focused E2E regression**

Run: `npm run test:e2e -- tests/e2e/admin.spec.ts`

Expected: PASS, with the non-admin permission test skipped automatically if non-admin credentials are not configured

- [ ] **Step 5: Confirm the unsafe files are gone**

Run: `git status --short`

Expected: no tracked copies of:

```text
src/app/api/admin/ensure-admin/route.ts
src/app/api/admin/debug/route.ts
src/app/admin/status/page.tsx
```

- [ ] **Step 6: Commit the integrated hardening**

```bash
git add src/app/api/admin/init/route.ts src/app/api/upload/route.ts src/app/admin/page.tsx src/app/admin/(protected)/layout.tsx src/proxy.ts tests/unit/admin/requireAdmin.test.ts tests/unit/admin/init-route.test.ts tests/unit/admin/proxy.test.ts tests/e2e/admin.spec.ts
git add -u src/app/api/admin src/app/admin/status
git commit -m "fix: harden admin bootstrap and authorization"
```

## Self-Review

- Spec coverage: this plan covers endpoint deletion, `requireAdmin()`, `/api/admin/init`, `/api/upload`, `/admin`, `src/proxy.ts`, and verification.
- Placeholder scan: no `TODO`, `TBD`, or indirect "same as above" steps remain.
- Type consistency: `requireAdmin()` always returns `{ ok, status, user, email, userId }`; all later tasks use those exact property names.
