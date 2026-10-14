import { IntegrationGuardError, assertSafeTestTarget, readGuardInputFromEnv } from "./guard";

declare const verifiedBrand: unique symbol;

/**
 * Alvo já validado pela guarda. A marca de tipo impede construí-lo à mão: só
 * `getVerifiedTarget` o produz, e todo cliente do Supabase da suíte nasce dele.
 */
export type VerifiedTarget = {
  readonly [verifiedBrand]: true;
  readonly url: string;
  readonly projectRef: string;
  readonly anonKey: string;
  readonly serviceKey: string;
};

/** Única função da suíte que lê as chaves de teste. Lança IntegrationGuardError. */
export function getVerifiedTarget(env: NodeJS.ProcessEnv = process.env): VerifiedTarget {
  const { projectRef } = assertSafeTestTarget(readGuardInputFromEnv(env));
  const url = env.RC2_TEST_SUPABASE_URL?.trim();
  const anonKey = env.RC2_TEST_SUPABASE_ANON_KEY?.trim();
  const serviceKey = env.RC2_TEST_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceKey) throw new IntegrationGuardError("missing_keys");
  return { url, projectRef, anonKey, serviceKey } as VerifiedTarget;
}
