"use client";

import { Plus, Trash2, Zap, Mail, ListChecks, X } from "lucide-react";
import type { CtaBlock, CtaType } from "@/lib/types/post";

interface CtaTabProps {
  ctaBlock: CtaBlock | null;
  onChange: (block: CtaBlock | null) => void;
}

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-placeholder outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors rounded";

const CTA_TYPES: {
  value: CtaType;
  label: string;
  description: string;
  Icon: React.ElementType;
}[] = [
  {
    value: "service",
    label: "Página de Serviço",
    description: "Direciona o leitor a uma página de serviço",
    Icon: Zap,
  },
  {
    value: "contact",
    label: "Formulário de Contato",
    description: "Convida o leitor a entrar em contato",
    Icon: Mail,
  },
  {
    value: "next_steps",
    label: "Próximos Passos",
    description: "Lista de ações recomendadas ao leitor",
    Icon: ListChecks,
  },
];

// Valores iniciais por tipo para agilizar o preenchimento
const PRESETS: Record<CtaType, Partial<CtaBlock>> = {
  service: {
    title: "Quer melhorar os processos da sua empresa?",
    description:
      "A RC2 Soluções ajuda PMEs a automatizar operações e escalar resultados com IA e integrações.",
    primaryButton: { text: "Conhecer soluções", url: "/solucoes" },
    secondaryButton: { text: "Falar com especialista", url: "/contato" },
  },
  contact: {
    title: "Quer identificar gargalos nos processos da sua empresa?",
    description:
      "Fale com a RC2 Soluções e descubra como tornar sua operação mais eficiente.",
    primaryButton: { text: "Falar sobre minha operação →", url: "/contato" },
  },
  next_steps: {
    title: "O que fazer agora?",
    description: "Siga estes passos para começar a implementar o que aprendeu:",
    items: ["", ""],
  },
};

export function CtaTab({ ctaBlock, onChange }: CtaTabProps) {
  const selectType = (type: CtaType) => {
    onChange({ type, ...PRESETS[type] } as CtaBlock);
  };

  const update = (patch: Partial<CtaBlock>) => {
    if (!ctaBlock) return;
    onChange({ ...ctaBlock, ...patch });
  };

  const updateButton = (
    key: "primaryButton" | "secondaryButton",
    field: "text" | "url",
    value: string
  ) => {
    if (!ctaBlock) return;
    const existing = ctaBlock[key] ?? { text: "", url: "" };
    onChange({ ...ctaBlock, [key]: { ...existing, [field]: value } });
  };

  const updateItem = (index: number, value: string) => {
    if (!ctaBlock) return;
    const items = [...(ctaBlock.items ?? [])];
    items[index] = value;
    onChange({ ...ctaBlock, items });
  };

  const addItem = () => {
    if (!ctaBlock) return;
    onChange({ ...ctaBlock, items: [...(ctaBlock.items ?? []), ""] });
  };

  const removeItem = (index: number) => {
    if (!ctaBlock) return;
    onChange({
      ...ctaBlock,
      items: (ctaBlock.items ?? []).filter((_, i) => i !== index),
    });
  };

  // ─── Sem CTA selecionado: escolha de tipo ───────────────────────────────────
  if (!ctaBlock) {
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-medium text-rc2-ebony mb-1">CTA Interno</h3>
          <p className="text-xs text-rc2-ebony/55 leading-relaxed">
            Bloco de call-to-action que aparece no final do artigo, antes da seção de compartilhamento.
            Escolha o tipo de CTA:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CTA_TYPES.map(({ value, label, description, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => selectType(value)}
              className="flex flex-col items-start gap-3 p-4 border-2 border-border rounded-lg text-left hover:border-rc2-orange hover:bg-rc2-orange/[0.03] transition-all group"
            >
              <div className="p-2 bg-rc2-orange/10 rounded-md group-hover:bg-rc2-orange/15 transition-colors">
                <Icon size={18} className="text-rc2-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rc2-ebony mb-0.5">{label}</p>
                <p className="text-xs text-rc2-ebony/55 leading-relaxed">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── CTA configurado: formulário de edição ──────────────────────────────────
  const currentType = CTA_TYPES.find((t) => t.value === ctaBlock.type);

  return (
    <div className="space-y-5">
      {/* Header com tipo + trocar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {currentType && (
            <div className="p-1.5 bg-rc2-orange/10 rounded">
              <currentType.Icon size={15} className="text-rc2-orange" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-rc2-ebony">{currentType?.label}</h3>
            <p className="text-xs text-muted-foreground">{currentType?.description}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
          title="Remover CTA"
        >
          <X size={14} /> Remover
        </button>
      </div>

      {/* Campos comuns */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-white">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
            Título *
          </label>
          <input
            type="text"
            value={ctaBlock.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Título do CTA"
            className={inputBase}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
            Descrição
          </label>
          <textarea
            value={ctaBlock.description ?? ""}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Texto de apoio ao CTA..."
            rows={2}
            className={`${inputBase} resize-none`}
          />
        </div>

        {/* Botão primário (todos os tipos) */}
        {ctaBlock.type !== "next_steps" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Botão Principal
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Texto</label>
                <input
                  type="text"
                  value={ctaBlock.primaryButton?.text ?? ""}
                  onChange={(e) => updateButton("primaryButton", "text", e.target.value)}
                  placeholder="Falar sobre minha operação →"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">URL</label>
                <input
                  type="text"
                  value={ctaBlock.primaryButton?.url ?? ""}
                  onChange={(e) => updateButton("primaryButton", "url", e.target.value)}
                  placeholder="/contato"
                  className={inputBase}
                />
              </div>
            </div>
          </div>
        )}

        {/* Botão secundário (só para service) */}
        {ctaBlock.type === "service" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Botão Secundário{" "}
              <span className="font-normal normal-case tracking-normal text-rc2-ebony/40">
                (opcional)
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Texto</label>
                <input
                  type="text"
                  value={ctaBlock.secondaryButton?.text ?? ""}
                  onChange={(e) => updateButton("secondaryButton", "text", e.target.value)}
                  placeholder="Falar com especialista"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">URL</label>
                <input
                  type="text"
                  value={ctaBlock.secondaryButton?.url ?? ""}
                  onChange={(e) => updateButton("secondaryButton", "url", e.target.value)}
                  placeholder="/contato"
                  className={inputBase}
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de passos (next_steps) */}
        {ctaBlock.type === "next_steps" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Passos
              </p>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-rc2-orange hover:underline"
              >
                <Plus size={12} /> Adicionar passo
              </button>
            </div>
            <div className="space-y-2">
              {(ctaBlock.items ?? []).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rc2-ebony/35 w-5 text-center tabular-nums flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder={`Passo ${index + 1}...`}
                    className={`${inputBase} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-rc2-ebony/30 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(ctaBlock.items ?? []).length === 0 && (
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-rc2-orange hover:underline"
                >
                  + Adicionar primeiro passo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
