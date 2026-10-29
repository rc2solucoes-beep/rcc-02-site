import { createHash, randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

// Simulador do Resend para a homologação LC-01 (SDD Newsletter §8.9). NÃO envia e-mail, NÃO fala com
// a API real e só escuta em loopback. Imita o contrato mínimo de `POST /emails` do SDK 6.12.2:
//   * 200 {"id": "..."} em sucesso;
//   * erro HTTP com corpo JSON {name, message, statusCode} (o SDK repassa o corpo como `error`);
//   * falha de conexão (socket destruído) → o SDK devolve application_error (ambíguo).
// Idempotência: a MESMA `Idempotency-Key` com o mesmo conteúdo devolve a resposta original e NÃO
// conta nova entrega; conteúdo diferente com a mesma chave → 409 invalid_idempotent_request; chave
// em voo → 409 concurrent_idempotent_requests.
//
// Registra só o necessário à verificação: chave, instante, se havia cabeçalhos de descadastro, hash do
// corpo e se o destinatário é sintético. Nenhum corpo, endereço ou token é guardado.

export type SimulatorMode =
  | "ok" //               aceita e responde 200
  | "rate_limit" //       429 rate_limit_exceeded
  | "quota" //            429 daily_quota_exceeded
  | "server_error" //     500 internal_server_error (nada é entregue)
  | "accept_then_drop" // ENTREGA e derruba a conexão sem responder (resultado ambíguo real)
  | "drop" //             derruba a conexão sem entregar
  | "hang" //             segura a resposta até `hangMs`/fechamento (timeout do cliente)
  | "permanent"; //       403 invalid_api_key

export type RecordedRequest = {
  at: number;
  idempotencyKey: string | null;
  bodyHash: string;
  hasListUnsubscribe: boolean;
  syntheticRecipient: boolean;
  mode: SimulatorMode;
  replay: boolean;
};

export const SIMULATOR_KEY_PREFIX = "re_sim_";
const SYNTHETIC_RECIPIENT = /@example\.(com|org|net)$|\.test$/i;

export type Simulator = {
  /** Base URL de loopback (use em RESEND_BASE_URL ANTES de carregar o módulo `resend`). */
  readonly url: string;
  readonly requests: RecordedRequest[];
  /** Chaves de idempotência com entrega aceita (cada uma conta UMA vez, mesmo com replays). */
  readonly deliveries: Map<string, string>;
  /** Violações do contrato de segurança: destinatário não sintético ou chave de API fora do padrão. */
  readonly violations: string[];
  /** Define o comportamento das próximas requisições; a última repete. */
  script(...modes: SimulatorMode[]): void;
  /** Encerra as requisições seguradas em `hang` (o provedor "termina" o processamento em voo). */
  releaseHangs(): void;
  reset(): void;
  close(): Promise<void>;
};

export async function startResendSimulator(options: { hangMs?: number } = {}): Promise<Simulator> {
  const hangMs = options.hangMs ?? 5000;
  let modes: SimulatorMode[] = ["ok"];
  let served = 0;
  const requests: RecordedRequest[] = [];
  const deliveries = new Map<string, string>();
  const bodyOfKey = new Map<string, string>();
  const inFlight = new Set<string>();
  const violations: string[] = [];
  const sockets = new Set<import("node:net").Socket>();
  const hanging = new Set<import("node:net").Socket>();

  const json = (res: ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  const apiError = (res: ServerResponse, status: number, name: string, message: string) => json(res, status, { name, message, statusCode: status });

  const handle = (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      if (req.method !== "POST" || req.url !== "/emails") return apiError(res, 404, "not_found", "rota inexistente no simulador");

      const auth = req.headers.authorization ?? "";
      if (!auth.startsWith(`Bearer ${SIMULATOR_KEY_PREFIX}`)) {
        violations.push("chave de API fora do padrão do simulador (re_sim_*)");
        return apiError(res, 401, "invalid_api_key", "API key is invalid");
      }

      const raw = Buffer.concat(chunks).toString("utf8");
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return apiError(res, 422, "validation_error", "corpo inválido");
      }
      const to = Array.isArray(payload.to) ? String(payload.to[0]) : String(payload.to ?? "");
      const headers = (payload.headers ?? {}) as Record<string, unknown>;
      const synthetic = SYNTHETIC_RECIPIENT.test(to);
      if (!synthetic) violations.push("destinatário não sintético recebido pelo simulador");
      if (!payload.from || !payload.subject || (!payload.html && !payload.text) || !to) {
        return apiError(res, 422, "missing_required_field", "campo obrigatório ausente");
      }
      // Remove o destinatário do hash? Não: o corpo inteiro identifica o conteúdo (idempotência).
      const bodyHash = createHash("sha256").update(raw).digest("hex");
      const idempotencyKey = (req.headers["idempotency-key"] as string | undefined) ?? null;
      const mode = modes[Math.min(served, modes.length - 1)];
      served += 1;

      const record = (replay: boolean) =>
        requests.push({ at: Date.now(), idempotencyKey, bodyHash, hasListUnsubscribe: "List-Unsubscribe" in headers, syntheticRecipient: synthetic, mode, replay });

      // Conteúdo diferente com a mesma chave: bug do cliente (o SDD classifica como invalid_state).
      if (idempotencyKey && bodyOfKey.has(idempotencyKey) && bodyOfKey.get(idempotencyKey) !== bodyHash) {
        record(false);
        return apiError(res, 409, "invalid_idempotent_request", "mesma chave com conteúdo diferente");
      }
      // Outra requisição com a mesma chave ainda em voo.
      if (idempotencyKey && inFlight.has(idempotencyKey)) {
        record(false);
        return apiError(res, 409, "concurrent_idempotent_requests", "requisição concorrente com a mesma chave");
      }

      const deliver = (): string => {
        if (idempotencyKey && deliveries.has(idempotencyKey)) return deliveries.get(idempotencyKey)!;
        const id = `sim_${randomUUID()}`;
        if (idempotencyKey) {
          deliveries.set(idempotencyKey, id);
          bodyOfKey.set(idempotencyKey, bodyHash);
        } else {
          deliveries.set(`sem-chave-${deliveries.size}`, id);
        }
        return id;
      };
      const replay = Boolean(idempotencyKey && deliveries.has(idempotencyKey));

      switch (mode) {
        case "ok": {
          const id = deliver();
          record(replay);
          return json(res, 200, { id });
        }
        case "rate_limit":
          record(false);
          return apiError(res, 429, "rate_limit_exceeded", "too many requests");
        case "quota":
          record(false);
          return apiError(res, 429, "daily_quota_exceeded", "daily quota exceeded");
        case "server_error":
          record(false);
          return apiError(res, 500, "internal_server_error", "internal error");
        case "permanent":
          record(false);
          return apiError(res, 403, "invalid_api_key", "API key is invalid");
        case "accept_then_drop":
          deliver();
          record(replay);
          return void req.socket.destroy();
        case "drop":
          record(false);
          return void req.socket.destroy();
        case "hang": {
          record(false);
          hanging.add(req.socket);
          if (idempotencyKey) inFlight.add(idempotencyKey);
          const timer = setTimeout(() => {
            if (idempotencyKey) inFlight.delete(idempotencyKey);
            if (!res.destroyed) req.socket.destroy();
          }, hangMs);
          res.on("close", () => {
            clearTimeout(timer);
            if (idempotencyKey) inFlight.delete(idempotencyKey);
          });
          return;
        }
      }
    });
  };

  const server: Server = createServer(handle);
  server.on("connection", (s) => {
    sockets.add(s);
    s.on("close", () => sockets.delete(s));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    deliveries,
    violations,
    script(...next) {
      modes = next.length > 0 ? next : ["ok"];
      served = 0;
    },
    releaseHangs() {
      for (const socket of hanging) socket.destroy();
      hanging.clear();
    },
    reset() {
      for (const socket of hanging) socket.destroy();
      hanging.clear();
      requests.length = 0;
      deliveries.clear();
      bodyOfKey.clear();
      inFlight.clear();
      violations.length = 0;
      modes = ["ok"];
      served = 0;
    },
    close() {
      for (const s of sockets) s.destroy();
      return new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

/** Garante que o simulador/harness NUNCA seja apontado para o Resend real ou para host remoto. */
export function assertSimulatorUrl(url: string): void {
  const parsed = new URL(url);
  if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(parsed.hostname)) {
    throw new Error("RECUSADO: o simulador só pode ser usado em loopback (nunca api.resend.com nem host remoto).");
  }
  if (/resend\.com/i.test(url)) throw new Error("RECUSADO: URL do Resend real.");
}
