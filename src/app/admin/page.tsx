"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { createClient } from "@/lib/supabase/client";

type PageMode = "checking" | "login";

const PERMISSION_ERROR = "Você não tem permissão de admin. Solicite acesso a um administrador.";
const PERMISSION_CHECK_ERROR = "Erro ao verificar permissões.";
const INVALID_CREDENTIALS_ERROR = "Credenciais inválidas. Verifique e-mail e senha.";
const SESSION_ERROR = "Erro ao estabelecer sessão. Tente novamente.";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<PageMode>("checking");

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setError(null);

        const response = await fetch("/api/admin/init", { method: "POST" });

        if (response.status === 200) {
          router.push("/admin/dashboard");
          return;
        }

        if (response.status === 403) {
          setError(PERMISSION_ERROR);
        } else if (response.status !== 401) {
          setError(PERMISSION_CHECK_ERROR);
        }

        setMode("login");
      } catch {
        setError(PERMISSION_CHECK_ERROR);
        setMode("login");
      }
    };

    void checkAccess();
  }, [router]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(INVALID_CREDENTIALS_ERROR);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError(SESSION_ERROR);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/init", { method: "POST" });

      if (response.status === 200) {
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      if (response.status === 403) {
        setError(PERMISSION_ERROR);
      } else {
        setError(PERMISSION_CHECK_ERROR);
      }
    } catch {
      setError(PERMISSION_CHECK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (mode === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo variant="dark" />
          </div>

          <div className="bg-white border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-rc2-orange" />
              <span className="text-sm text-text-secondary">Verificando acesso...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="dark" />
        </div>

        <div className="bg-white border border-border rounded-lg shadow-lg p-8">
          <h1 className="text-xl font-semibold text-rc2-ebony mb-2">Acesso administrativo</h1>
          <p className="text-sm text-text-secondary mb-6">Digite suas credenciais para acessar o painel.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-rc2-ebony mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none transition-colors shadow-sm focus:border-rc2-orange focus:ring-2 focus:ring-rc2-orange/20"
                placeholder="admin@rc2solucoes.com.br"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-rc2-ebony mb-1.5">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none transition-colors shadow-sm focus:border-rc2-orange focus:ring-2 focus:ring-rc2-orange/20"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3 rounded flex items-start gap-2" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="ui-focus-ring w-full h-12 bg-rc2-orange text-rc2-heading font-semibold text-sm uppercase tracking-wide transition-colors hover:bg-rc2-orange/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
