import { describe, expect, it } from "vitest";
import { classifyWrite } from "../../integration/support/probes";

describe("classifyWrite: decisão sobre o efeito real", () => {
  it("INSERT que passou a existir, sem erro: allow", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: null, changed: true })).toBe("allow");
  });

  it("INSERT recusado com 42501 e linha ausente: deny", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: "42501", changed: false })).toBe("deny");
  });

  it("INSERT sem erro e sem linha: inconclusivo, nunca deny", () => {
    expect(classifyWrite({ operation: "INSERT", fixtureConfirmed: true, errorCode: null, changed: false })).toBe("error");
  });

  it("UPDATE com mudança efetiva confirmada e sem erro: allow", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: null, changed: true })).toBe("allow");
  });

  it("UPDATE com 42501 e estado inalterado: deny", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: "42501", changed: false })).toBe("deny");
  });

  it("UPDATE sem erro, fixture confirmada e estado inalterado (linha oculta pela RLS): deny", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: true, errorCode: null, changed: false })).toBe("deny");
  });

  it("zero efeito SEM fixture confirmada não é negação: error", () => {
    expect(classifyWrite({ operation: "UPDATE", fixtureConfirmed: false, errorCode: null, changed: false })).toBe("error");
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: false, errorCode: null, changed: false })).toBe("error");
  });

  it("erro diferente de 42501 (restrição, rede) é inconclusivo", () => {
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: true, errorCode: "23503", changed: false })).toBe("error");
  });

  it("mudança efetiva acompanhada de erro é inconsistente: error", () => {
    expect(classifyWrite({ operation: "DELETE", fixtureConfirmed: true, errorCode: "42501", changed: true })).toBe("error");
  });
});
