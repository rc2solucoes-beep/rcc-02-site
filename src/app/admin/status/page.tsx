"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/layout/Logo";

interface StatusInfo {
  clientAuth: {
    isLoggedIn: boolean;
    userId?: string;
    email?: string;
  };
  serverSession: {
    status: string;
    userId?: string;
    email?: string;
    error?: string;
  };
  adminStatus: {
    isAdmin?: boolean;
    error?: string;
  };
}

export default function AdminStatusPage() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 1. Check client-side auth
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const clientAuth = {
          isLoggedIn: !!user,
          userId: user?.id,
          email: user?.email,
        };

        // 2. Check server-side session
        let serverSession: any = { status: "checking" };
        let adminStatus: any = {};

        if (clientAuth.isLoggedIn) {
          const debugResponse = await fetch("/api/admin/debug");
          const debugData = await debugResponse.json();

          serverSession = {
            status: debugData.status,
            userId: debugData.session?.userId,
            email: debugData.session?.email,
            error: debugData.error || debugData.message,
          };

          adminStatus = {
            isAdmin: debugData.adminStatus?.isAdmin,
            error: debugData.errors?.adminError,
          };
        } else {
          serverSession = {
            status: "not-logged-in",
            error: "Você não está logado no cliente",
          };
        }

        setStatus({
          clientAuth,
          serverSession,
          adminStatus,
        });
      } catch (error) {
        setStatus({
          clientAuth: { isLoggedIn: false },
          serverSession: {
            status: "error",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          },
          adminStatus: { error: "Não foi possível verificar" },
        });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="mb-8 flex justify-center">
            <Logo variant="dark" />
          </div>
          <div className="bg-white border border-border rounded-lg shadow-lg p-8 text-center">
            <p className="text-sm text-text-secondary">Verificando status...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (
    ok: boolean | undefined
  ) => {
    if (ok === undefined) return "bg-yellow-100 text-yellow-800";
    if (ok) return "bg-green-100 text-green-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rc2-sand via-rc2-sand to-surface-2 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-center">
          <Logo variant="dark" />
        </div>

        <div className="bg-white border border-border rounded-lg shadow-lg p-8 space-y-6">
          <h1 className="text-2xl font-semibold text-rc2-ebony">Status da Autenticação</h1>

          {/* Client Auth */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-rc2-ebony mb-3">Cliente (Browser)</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Logado:</span>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                    status?.clientAuth.isLoggedIn
                  )}`}
                >
                  {status?.clientAuth.isLoggedIn ? "✓ SIM" : "✗ NÃO"}
                </span>
              </div>
              {status?.clientAuth.userId && (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>User ID:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {status.clientAuth.userId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>E-mail:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {status.clientAuth.email}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Server Session */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-rc2-ebony mb-3">Servidor (Session)</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Status:</span>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    status?.serverSession.status === "ok"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {status?.serverSession.status}
                </span>
              </div>
              {status?.serverSession.userId && (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>User ID:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {status.serverSession.userId}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>E-mail:</span>
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {status.serverSession.email}
                    </code>
                  </div>
                </>
              )}
              {status?.serverSession.error && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-xs">
                  <strong>Erro:</strong> {status.serverSession.error}
                </div>
              )}
            </div>
          </div>

          {/* Admin Status */}
          <div className="border-t pt-6">
            <h2 className="font-semibold text-rc2-ebony mb-3">Status de Admin</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>É Admin:</span>
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                    status?.adminStatus.isAdmin
                  )}`}
                >
                  {status?.adminStatus.isAdmin === true
                    ? "✓ SIM"
                    : status?.adminStatus.isAdmin === false
                      ? "✗ NÃO"
                      : "?"}{" "}
                </span>
              </div>
              {status?.adminStatus.error && (
                <div className="p-3 bg-yellow-50 text-yellow-700 rounded text-xs">
                  <strong>Aviso:</strong> {status.adminStatus.error}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t pt-6 bg-blue-50 p-4 rounded">
            {status?.clientAuth.isLoggedIn && status?.serverSession.status === "ok" ? (
              <p className="text-sm text-green-700">
                ✓ <strong>Tudo OK!</strong> Você está autenticado. Tente acessar{" "}
                <a href="/admin/dashboard" className="font-semibold underline">
                  /admin/dashboard
                </a>
              </p>
            ) : status?.clientAuth.isLoggedIn && status?.serverSession.status === "no-session" ? (
              <div className="text-sm text-orange-700 space-y-2">
                <p>
                  ⚠ <strong>Problema:</strong> Você está logado no cliente, mas o servidor não vê a
                  sessão.
                </p>
                <p className="text-xs">Isto significa que os cookies não estão sendo enviados corretamente.</p>
                <p className="text-xs">Tente:</p>
                <ol className="text-xs list-decimal list-inside space-y-1 ml-2">
                  <li>Sair (F12 → Application → Cookies → Delete all for this domain)</li>
                  <li>Fazer login novamente</li>
                  <li>Voltar para esta página</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-red-700">
                ✗ <strong>Erro:</strong> Você não está autenticado. Faça login em{" "}
                <a href="/admin" className="font-semibold underline">
                  /admin
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
