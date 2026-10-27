import { FakeBackend } from "../../lc01/fakeBackend";
import { defineLc01Scenarios } from "../../lc01/scenarios";

// ENSAIO do LC-01 (SDD Newsletter §8.9): os sete cenários contra um backend em memória com relógio
// simulado, usando o ResendProvider REAL (SDK) contra o simulador HTTP em loopback. Não toca em
// Supabase nem envia e-mail. NÃO substitui o LC-01 (que exige o isolado, a N2 e o pg_net): só
// prova que o harness e os critérios de aceite estão corretos antes da execução real.
defineLc01Scenarios("ensaio em memória", async () => new FakeBackend());
