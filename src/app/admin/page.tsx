"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Credenciais inválidas. Verifique e-mail e senha.");
      setLoading(false);
      return;
    }

    router.push("/admin/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-rc2-sand flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="dark" />
        </div>

        <div className="bg-white border border-border p-8">
          <h1 className="text-xl font-semibold text-rc2-ebony mb-6">Acesso administrativo</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full border border-border bg-rc2-sand px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors"
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
                className="w-full border border-border bg-rc2-sand px-4 py-3 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 px-4 py-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-rc2-orange text-rc2-sand font-semibold text-sm uppercase tracking-wide hover:bg-rc2-orange/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
