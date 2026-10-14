// Lint COMPLEMENTAR para SQL de preflight e verify (RF-OPS-01).
//
// IMPORTANTE: é análise estática por expressões regulares. NÃO substitui:
//  1. a transação `BEGIN READ ONLY`, que é a garantia real de somente leitura;
//  2. a revisão humana do SQL.
// É contornável por funções do usuário chamadas sem qualificação (via
// search_path), por SQL dinâmico dentro de funções, por extensões e por efeitos
// externos que ela não conhece. Por isso falha fechado em construções suspeitas.

export type ReadOnlySqlResult = { ok: true } | { ok: false; reason: string };

const BLOCKED_WORDS =
  /\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|merge|call|copy|analyze|into|lock|vacuum|reindex|refresh|commit|savepoint|prepare|execute|do)\b/i;

const BLOCKED_LOCKING = /\bfor\s+(update|share|no\s+key)\b/i;

const BLOCKED_FUNCTIONS =
  /\b(cron\.schedule|cron\.unschedule|cron\.alter_job|net\.http_\w+|http_\w+|set_config|nextval|setval|pg_notify|pg_terminate_backend|pg_cancel_backend|pg_advisory_\w+|lo_\w+|dblink\w*|vault\.create_secret|vault\.update_secret|pg_reload_conf|pg_sleep\w*|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|pg_logical_emit_message|pg_create_restore_point)\s*\(/i;

// Chamada qualificada `schema.funcao(` fora do catálogo pode ser função do
// usuário ou de extensão com efeito colateral: exige revisão humana.
const QUALIFIED_CALL = /\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*\(/gi;
const SAFE_SCHEMAS = new Set(["pg_catalog", "information_schema"]);

function stripNoise(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""');
}

function reject(reason: string): ReadOnlySqlResult {
  return { ok: false, reason };
}

export function checkReadOnlySql(sql: string): ReadOnlySqlResult {
  const statements = stripNoise(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (statements.length < 3) return reject("arquivo sem consultas");
  if (!/^begin\s+read\s+only$/i.test(statements[0])) return reject("deve começar com BEGIN READ ONLY");
  if (!/^rollback$/i.test(statements[statements.length - 1])) return reject("deve terminar com ROLLBACK");

  for (const statement of statements.slice(1, -1)) {
    const preview = statement.slice(0, 40);
    if (!/^(select|with|show|explain)\b/i.test(statement)) return reject(`instrução não permitida: ${preview}`);
    if (BLOCKED_WORDS.test(statement)) return reject(`palavra proibida em: ${preview}`);
    if (BLOCKED_LOCKING.test(statement)) return reject(`bloqueio de linhas em: ${preview}`);
    if (BLOCKED_FUNCTIONS.test(statement)) return reject(`função com efeito colateral em: ${preview}`);
    for (const match of statement.matchAll(QUALIFIED_CALL)) {
      if (!SAFE_SCHEMAS.has(match[1].toLowerCase())) {
        return reject(`chamada qualificada fora do catálogo (revisão humana): ${match[0]}`);
      }
    }
  }
  return { ok: true };
}
