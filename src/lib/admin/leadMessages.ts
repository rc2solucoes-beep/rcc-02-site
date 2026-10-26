import type { LeadMutationResult } from "@/lib/types/lead";

const ERROR_MESSAGE: Record<Extract<LeadMutationResult, { ok: false }>["error"], string> = {
  invalid: "Dados inválidos. Revise os campos e tente novamente.",
  unauthorized: "Sua sessão expirou. Entre novamente.",
  forbidden: "Você não tem permissão para esta ação.",
  not_found: "Lead não encontrado. Ele pode ter sido excluído.",
  conflict: "Este lead foi alterado por outra pessoa. Recarregue a página para ver a versão atual.",
  failed: "Não foi possível concluir a ação. Tente novamente.",
  disabled: "A exclusão definitiva está suspensa. Use o arquivamento para retirar o lead da lista.",
};

/** Mensagem da tela para o resultado de uma Server Action de leads. Sucesso: "Salvo." ou aviso de nada a salvar. */
export function leadMutationMessage(result: LeadMutationResult): { tone: "success" | "error"; text: string } {
  if (result.ok) {
    return { tone: "success", text: result.unchanged ? "Nenhuma alteração a salvar." : "Salvo." };
  }
  return { tone: "error", text: ERROR_MESSAGE[result.error] };
}
