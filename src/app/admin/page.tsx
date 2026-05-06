"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type PageMode = "login" | "setup" | "setup-success" | "checking";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<PageMode>("login");
  const [setupEmail, setSetupEmail] = useState("");
  const [showSetupCheck, setShowSetupCheck] = useState(false);

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setMode("checking");

        // Try to get current admin status
        const initResponse = await fetch("/api/admin/init", { method: "POST" });
        const initData = await initResponse.json();

        if (initResponse.status === 201) {
          // Successfully initialized as first admin!
          setSetupEmail(initData.email);
          setMode("setup-success");
          return;
        } else if (initResponse.status === 200) {
          // User is already an admin - redirect to dashboard
          router.push("/admin/dashboard");
          return;
        } else if (initResponse.status === 401 || initResponse.status === 403) {
          // Not authenticated or not admin - show login
          setMode("login");
          return;
        } else {
          // Unknown status, show login
          setMode("login");
        }
      } catch {
        // On error, show login
        setMode("login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Credenciais inválidas. Verifique e-mail e senha.");
      setLoading(false);
      return;
    }

    // Ensure session is established on the client
    if (!authData.session) {
      setError("Erro ao estabelecer sessão. Tente novamente.");
      setLoading(false);
      return;
    }

    // Wait a brief moment for cookies to be set, then check admin status
    await new Promise(resolve => setTimeout(resolve, 200));

    // After successful login, try to initialize as admin if needed
    try {
      const initResponse = await fetch("/api/admin/init", { method: "POST" });
      const initData = await initResponse.json();

      if (initResponse.status === 201) {
        // Successfully initialized as first admin
        setSetupEmail(initData.email);
        setMode("setup-success");
        return;
      }

      if (initResponse.status === 200) {
        // User is already an admin
        router.push("/admin/dashboard");
        router.refresh();
        return;
      }

      if (initResponse.status === 403) {
        // Admin users exist but current user is not one
        setError("Você não tem permissão de admin. Solicite acesso a um administrador.");
        setLoading(false);
        return;
      }

      // For other statuses, show error
      setError(initData.error || "Erro ao verificar permissões");
      setLoading(false);
    } catch (err) {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // First sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message || "Erro ao criar conta");
      setLoading(false);
      return;
    }

    // Then sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Conta criada, mas erro ao fazer login. Tente novamente.");
      setLoading(false);
      return;
    }

    // Now initialize as admin
    try {
      const response = await fetch("/api/admin/init", { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setSetupEmail(data.email);
        setMode("setup-success");
      } else {
        setError(data.error || "Erro ao criar admin");
        setLoading(false);
      }
    } catch (err) {
      setError("Erro ao configurar admin");
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
              <div className="w-2 h-2 bg-rc2-orange rounded-full animate-pulse"></div>
              <span className="text-sm text-text-secondary">Verificando acesso...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "setup-success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo variant="dark" />
          </div>

          <div className="bg-white border border-border rounded-lg shadow-lg p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-rc2-ebony mb-2">Configuração concluída!</h1>
            <p className="text-sm text-text-secondary mb-6">Admin criado com sucesso para {setupEmail}</p>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="ui-focus-ring w-full h-12 bg-rc2-orange text-rc2-sand font-semibold text-sm uppercase tracking-wide hover:bg-rc2-orange/90 transition-colors"
            >
              Acessar Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSetupCheck && mode === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <Logo variant="dark" />
          </div>

          <div className="bg-white border border-border rounded-lg shadow-lg p-8 text-center">
            <p className="text-sm text-text-secondary mb-4">Verificando acesso administrativo...</p>
            <div className="inline-flex items-center gap-2">
              <div className="w-2 h-2 bg-rc2-orange rounded-full animate-pulse"></div>
              <span className="text-sm text-text-secondary">Processando</span>
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
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-2 focus:ring-rc2-orange/20 transition-colors shadow-sm"
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-white px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-2 focus:ring-rc2-orange/20 transition-colors shadow-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3 rounded flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="ui-focus-ring w-full h-12 bg-rc2-orange text-rc2-sand font-semibold text-sm uppercase tracking-wide hover:bg-rc2-orange/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
