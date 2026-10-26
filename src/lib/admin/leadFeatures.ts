// Exclusão definitiva de leads: SUSPENSA por padrão (fail-closed). Só o texto exato
// `LEADS_DELETE_ENABLED=true` a libera na aplicação, e isso NÃO basta: a migration 016 retira o
// privilégio DELETE e a policy de `authenticated` em `public.leads`. Reabilitar exige uma migration
// nova e autorizada (ver docs/runbooks/migrations/016-leads-disable-delete/README.md).
export function isLeadDeletionEnabled(): boolean {
  return process.env.LEADS_DELETE_ENABLED === "true";
}
