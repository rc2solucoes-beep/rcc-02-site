import { loadTestEnvFile } from "./env";
import { getVerifiedTarget } from "./target";

// Roda uma vez, antes da coleta de qualquer teste. Se a guarda recusar, o
// Vitest encerra com erro e nenhuma conexão é aberta. A mesma validação é
// repetida em cada criação de cliente e a cada acesso ao service_role
// (clients.ts): este é apenas o primeiro portão.
export default function setup(): void {
  loadTestEnvFile();
  const { projectRef } = getVerifiedTarget();
  console.info(`[integração] alvo de teste validado (ref ${projectRef.slice(0, 4)}…).`);
}
