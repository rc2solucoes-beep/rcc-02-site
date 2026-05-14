"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import type { FaqItem } from "@/lib/types/post";

interface FaqTabProps {
  faqItems: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}

const inputBase =
  "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors rounded";

export function FaqTab({ faqItems, onChange }: FaqTabProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    faqItems.length > 0 ? 0 : null
  );

  const addItem = () => {
    const newItems = [...faqItems, { question: "", answer: "" }];
    onChange(newItems);
    setExpandedIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    const updated = faqItems.filter((_, i) => i !== index);
    onChange(updated);
    if (expandedIndex === index) {
      setExpandedIndex(updated.length > 0 ? Math.max(0, index - 1) : null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const updateItem = (index: number, field: keyof FaqItem, value: string) => {
    const updated = faqItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const toggle = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-rc2-ebony mb-1">
            Perguntas Frequentes (FAQ)
          </h3>
          <p className="text-xs text-rc2-ebony/55 leading-relaxed">
            Aparecem no final do artigo e geram Schema JSON-LD{" "}
            <code className="bg-rc2-ebony/8 px-1 py-0.5 rounded text-[11px]">FAQPage</code>{" "}
            automaticamente, melhorando o SEO.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-rc2-orange rounded hover:bg-rc2-orange/90 transition-colors"
        >
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {/* Empty state */}
      {faqItems.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
          <HelpCircle size={28} className="mx-auto mb-3 text-rc2-ebony/20" />
          <p className="text-sm font-medium text-rc2-ebony/50 mb-1">
            Nenhuma pergunta adicionada
          </p>
          <p className="text-xs text-rc2-ebony/40 mb-4">
            FAQs ajudam os leitores e melhoram o rankeamento no Google
          </p>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-rc2-orange hover:underline font-medium"
          >
            + Adicionar primeira pergunta
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {faqItems.map((item, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Item header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-rc2-sand/40 hover:bg-rc2-sand/60 transition-colors">
                <span className="text-xs font-semibold text-rc2-ebony/35 w-5 text-center tabular-nums">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex-1 text-left text-sm font-medium text-rc2-ebony min-w-0"
                >
                  {item.question ? (
                    <span className="truncate block">{item.question}</span>
                  ) : (
                    <span className="text-rc2-ebony/35 italic">Pergunta sem título</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="p-1 text-rc2-ebony/40 hover:text-rc2-ebony transition-colors"
                  title={expandedIndex === index ? "Recolher" : "Expandir"}
                >
                  {expandedIndex === index ? (
                    <ChevronUp size={15} />
                  ) : (
                    <ChevronDown size={15} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1 text-rc2-ebony/30 hover:text-red-500 transition-colors"
                  title="Remover pergunta"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Item editor */}
              {expandedIndex === index && (
                <div className="p-4 space-y-4 bg-white border-t border-border">
                  <div>
                    <label className="block text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest mb-1.5">
                      Pergunta
                    </label>
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => updateItem(index, "question", e.target.value)}
                      placeholder="Como funciona o processo de automação?"
                      className={inputBase}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-rc2-ebony/50 uppercase tracking-widest mb-1.5">
                      Resposta
                    </label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => updateItem(index, "answer", e.target.value)}
                      placeholder="A resposta completa e clara para esta pergunta..."
                      rows={4}
                      className={`${inputBase} resize-none`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer hint */}
      {faqItems.length > 0 && (
        <p className="text-xs text-rc2-ebony/40">
          {faqItems.length} {faqItems.length === 1 ? "pergunta" : "perguntas"} adicionada
          {faqItems.length !== 1 ? "s" : ""}
          {" · "}
          Perguntas sem texto serão ignoradas ao salvar
        </p>
      )}
    </div>
  );
}
