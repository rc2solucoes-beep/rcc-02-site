import { formatSaoPauloDateTime } from "@/lib/datetime";
import type { LeadNote } from "@/lib/types/lead";
import { LeadNoteForm } from "./LeadNoteForm";

/** Quem escreveu, sem consultar dados pessoais: o próprio usuário, outro administrador ou conta removida. */
export function authorLabel(authorId: string | null, currentUserId: string | null): string {
  if (!authorId) return "Usuário removido";
  return authorId === currentUserId ? "Você" : "Outro administrador";
}

/** Notas append-only (mais recentes primeiro). O corpo é texto: o React escapa, nunca HTML. */
export function LeadNotes({
  leadId,
  notes,
  truncated,
  currentUserId,
}: {
  leadId: string;
  notes: readonly LeadNote[];
  truncated: boolean;
  currentUserId: string | null;
}) {
  return (
    <section aria-labelledby="lead-notes-title" className="bg-rc2-surface border border-rc2-border p-5 space-y-4">
      <h2 id="lead-notes-title" className="text-base font-medium text-rc2-heading">
        Notas
      </h2>
      <LeadNoteForm leadId={leadId} />
      {notes.length === 0 ? (
        <p className="text-sm text-rc2-text-secondary">Nenhuma nota ainda.</p>
      ) : (
        <ul className="divide-y divide-rc2-border-soft">
          {notes.map((note) => (
            <li key={note.id} className="py-3">
              <p className="whitespace-pre-wrap break-words text-sm text-rc2-text">{note.body}</p>
              <p className="mt-1 text-xs text-rc2-text-secondary">
                {authorLabel(note.author_id, currentUserId)} · {formatSaoPauloDateTime(note.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {truncated && (
        <p className="text-xs text-rc2-text-secondary">Mostrando as notas mais recentes; há notas mais antigas.</p>
      )}
    </section>
  );
}
