import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { IntegrationGuardError } from "./guard";

// Carrega o env da suíte de integração. Somente o arquivo de teste (ignorado
// pelo git). O arquivo de ambiente principal pode conter credenciais de
// produção e nunca é lido por esta suíte.
//
// `loadEnvFile` não sobrescreve variáveis já definidas no processo. Sem uma
// checagem, uma variável antiga do shell prevaleceria em silêncio sobre o
// arquivo de teste. Por isso: se uma variável definida no processo tiver valor
// DIFERENTE do que o arquivo declara, a execução é recusada (env_conflict).
export function loadTestEnvFile(path: string = ".env.test.local"): void {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }

  for (const [name, fileValue] of Object.entries(parseEnv(content))) {
    const effective = process.env[name];
    if (effective !== undefined && effective.trim() !== (fileValue ?? "").trim()) {
      throw new IntegrationGuardError("env_conflict");
    }
  }

  process.loadEnvFile(path);
}
