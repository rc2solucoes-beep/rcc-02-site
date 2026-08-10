import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import type { Post } from "@/lib/types/post";

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

function formatSaoPaulo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Barra de aviso exibida no topo da rota de preview do admin. Deixa explícito
 * que o post NÃO está publicado e mostra o status + data de agendamento (BRT).
 */
export function PreviewBanner({ post }: { post: Post }) {
  const statusLabel = STATUS_LABEL[post.status] ?? post.status;
  const scheduledAt = post.status === "scheduled" ? formatSaoPaulo(post.scheduled_publish_at) : "";

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 border-b border-amber-600/50">
      <div className="container mx-auto max-w-6xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye size={16} className="shrink-0" />
          <span>
            Pré-visualização — este post <strong>não está publicado</strong>.
            {" "}Status: <strong>{statusLabel}</strong>
            {scheduledAt && <> • Publica em <strong>{scheduledAt}</strong></>}
          </span>
        </div>
        <Link
          href={`/admin/posts/${post.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-950 text-amber-50 rounded hover:bg-amber-900 transition-colors shrink-0"
        >
          <Pencil size={12} />
          Editar
        </Link>
      </div>
    </div>
  );
}
