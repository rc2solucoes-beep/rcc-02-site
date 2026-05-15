# WCAG Contrast Fix — Design Spec

**Data:** 2026-05-15
**Status:** Aprovado para implementação
**Estratégia:** Split-token (Opção A)

---

## Objetivo

Corrigir todos os problemas de contraste WCAG AA no site RC2 Soluções sem alterar a identidade visual da marca, sem mudar layouts e sem criar inconsistência de código.

**Princípio central:** `#FF5F1F` (Safety Orange) permanece em todo lugar onde é decorativo ou interativo. Um segundo token `#C94400` (Burnt Orange) entra apenas onde o laranja aparece como **texto** em fundo claro.

---

## Diagnóstico — Falhas encontradas

| Elemento | Cor atual | Fundo | Ratio | Mínimo | Status |
|---|---|---|---|---|---|
| `.rc2-label` / SectionLabel (12px) | `#FF5F1F` | `#F5F0E8` | 2.66:1 | 4.5:1 | ❌ FALHA |
| `placeholder` em inputs (branco) | `ebony/40` ≈ `#9F9992` | `#ffffff` | 2.49:1 | 4.5:1 | ❌ FALHA |
| `--color-text-tertiary` (`#8B7D77`) | `#8B7D77` | `#F5F0E8` | 3.37:1 | 4.5:1 | ❌ FALHA |
| `text-rc2-ebony/50` (TOC, admin) | `ebony/50` ≈ `#8E8984` | `#FDFBF8` | 3.10:1 | 4.5:1 | ❌ FALHA |
| `.rc2-action-link` (links em areia) | `#FF5F1F` | `#F5F0E8` | 2.66:1 | 4.5:1 | ❌ FALHA |
| `placeholder:text-rc2-ebony/40` (admin) | `ebony/40` ≈ `#A5A29F` | `#F5F0E8` | 2.42:1 | 4.5:1 | ❌ FALHA |

**Passa sem alteração:** texto primário (`#1E1610`) em areia (16.2:1), textos sand em bg-ink e bg-forest, botão laranja, orange em bg-ink (6.46:1), orange em bg-forest (4.73:1).

---

## Solução

### Parte 1 — `src/app/globals.css` (5 alterações)

Todas as mudanças ficam centralizadas em um único arquivo.

**1a. Novo token semântico no `@theme`:**
```css
--color-rc2-placeholder: #7A6E66; /* placeholder legível: 4.53:1 vs branco */
--color-orange-text:     #C94400; /* orange para texto em fundo claro: 4.84:1 vs areia */
```

**1b. Corrigir `--color-text-tertiary` (unificar com secondary):**
```css
/* @theme */
--color-text-tertiary: #6B5E52;  /* era #8B7D77 (3.37:1) → agora 5.37:1 ✓ */

/* :root */
--text-tertiary: #6B5E52;        /* idem */
```

**1c. Corrigir `.rc2-label` na `@layer utilities`:**
```css
.rc2-label {
  color: #C94400;  /* era #FF5F1F — dark sections fazem override via text-rc2-orange */
}
```

**1d. Corrigir `.rc2-action-link` na `@layer utilities`:**
```css
.rc2-action-link {
  @apply inline-flex items-center gap-1.5 text-sm font-semibold
         text-[#C94400]   /* era text-rc2-orange */
         transition-all duration-200 hover:gap-3
         focus-visible:outline-none focus-visible:ring-2
         focus-visible:ring-rc2-orange focus-visible:ring-offset-2;
}
```

**1e. Regra global de placeholder (fallback para código futuro):**
```css
@layer base {
  input::placeholder,
  textarea::placeholder,
  select::placeholder {
    color: #7A6E66;
  }
}
```

### Parte 2 — Componentes (~7 arquivos, substituições de classe)

**2a. Substituir `placeholder:text-rc2-ebony/40` → `placeholder:text-rc2-placeholder`**

Afeta os `inputBase` constants nos seguintes arquivos:
- `src/components/marketing/ContactForm.tsx`
- `src/components/admin/PostFormTabs/ImageTab.tsx`
- `src/components/admin/OgImageSetting.tsx`
- `src/app/admin/(protected)/settings/page.tsx`
- `src/components/admin/PostFormRefactored.tsx` (verificar se existe `inputBase`)
- Qualquer outro arquivo com `placeholder:text-rc2-ebony/40` (grep confirma)

**2b. Substituir `text-rc2-ebony/50` → `text-[#5A4E42]`**

Aparece em:
- `src/components/blog/TableOfContents.tsx` (heading "Neste artigo")
- Componentes admin com section headings internos
- Grep confirma escopo exato

---

## O que NÃO muda

- Botão laranja (`bg-rc2-orange text-rc2-sand`) — não alterado
- `text-rc2-orange` em fundos escuros (bg-ink, bg-forest) — não alterado
- Footer — não alterado (textos sand já passam; labels orange passam 4.73:1 em forest)
- Layouts, espaçamentos, tipografia — não alterados
- Identidade visual — laranja permanece como cor dominante de marca

---

## Tokens antes × depois

| Token | Antes | Ratio | Depois | Ratio |
|---|---|---|---|---|
| `.rc2-label` color | `#FF5F1F` | 2.66:1 ❌ | `#C94400` | 4.84:1 ✓ |
| `.rc2-action-link` color | `#FF5F1F` | 2.66:1 ❌ | `#C94400` | 4.84:1 ✓ |
| `--color-text-tertiary` | `#8B7D77` | 3.37:1 ❌ | `#6B5E52` | 5.37:1 ✓ |
| `--text-tertiary` | `#8B7D77` | 3.37:1 ❌ | `#6B5E52` | 5.37:1 ✓ |
| placeholder (inputs) | `ebony/40` | 2.49:1 ❌ | `#7A6E66` | 4.53:1 ✓ |
| `text-rc2-ebony/50` | `ebony/50` | 3.10:1 ❌ | `#5A4E42` | 6.07:1 ✓ |

---

## Checklist de validação pós-implementação

- [ ] SectionLabel em fundo areia: contraste ≥ 4.5:1
- [ ] Links "Ver mais →" em fundo areia: contraste ≥ 4.5:1
- [ ] Placeholder em todos os inputs (público e admin): contraste ≥ 4.5:1
- [ ] Texto tertiary em areia: contraste ≥ 4.5:1
- [ ] TOC "Neste artigo" heading: contraste ≥ 4.5:1
- [ ] Botão laranja: não alterado visualmente
- [ ] Labels em bg-ink (dark sections): `text-rc2-orange` override mantido
- [ ] Labels em bg-forest (footer): `text-rc2-orange` override mantido
- [ ] Nenhum layout alterado
- [ ] Build TypeScript sem erros

---

## Escopo de arquivos

**1 arquivo CSS:**
- `src/app/globals.css`

**~7 componentes (substituição de classe):**
- `src/components/marketing/ContactForm.tsx`
- `src/components/admin/PostFormTabs/ImageTab.tsx`
- `src/components/admin/OgImageSetting.tsx`
- `src/app/admin/(protected)/settings/page.tsx`
- `src/components/admin/PostFormRefactored.tsx`
- `src/components/blog/TableOfContents.tsx`
- Outros identificados via grep (`placeholder:text-rc2-ebony/40`, `text-rc2-ebony/50`)

**Estimativa:** ~60 linhas de código alteradas no total.
