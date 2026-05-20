# Fase 2 — SEO: Expansão das Páginas de Serviço (Design)

## 1. Objetivo
Executar a Fase 2 de SEO nas páginas `/servicos/[slug]`, ampliando profundidade semântica, cobertura de intenção de busca, FAQ e dados estruturados, sem redesign do site e sem mudanças em CMS/admin/blog.

## 2. Decisão de arquitetura
Abordagem aprovada: **expansão direta em `services.ts` + render incremental na página de serviço**.

Princípio central:
- conteúdo longo de SEO permanece **100% hardcoded** em `src/lib/content/services.ts` como fonte única.

## 3. Escopo técnico

### 3.1 Expandir tipo `Service`
Arquivo: `src/lib/content/services.ts`

Adicionar tipos:
```ts
export type ServiceFaq = {
  question: string;
  answer: string;
};

export type ServiceRelatedLink = {
  label: string;
  href: string;
};
```

Atualizar `Service` com novos campos:
- `seoTitle`
- `painPoints`
- `useCases`
- `implementationSteps`
- `integrations`
- `metrics`
- `faq`
- `relatedLinks`

Regras:
- manter campos antigos;
- preencher todos os 5 serviços;
- não alterar slugs;
- não criar novos serviços.

### 3.2 Atualizar conteúdo dos 5 serviços
Arquivo: `src/lib/content/services.ts`

Aplicar integralmente os blocos fornecidos para:
- `automacoes-com-ia`
- `agentes-de-ia`
- `automacao-de-processos`
- `e-commerce`
- `sites-e-landing-pages`

Incluindo `seoTitle`, dores, casos de uso, etapas, integrações, métricas, FAQ e links relacionados.

### 3.3 Atualizar `/servicos/[slug]`
Arquivo: `src/app/(public)/servicos/[slug]/page.tsx`

Renderizar seções na ordem aprovada:
1. breadcrumb (existente)
2. hero (existente)
3. problemas (`painPoints`)
4. casos de uso (`useCases`)
5. o que pode ser implantado (`items`)
6. implantação (`implementationSteps`)
7. integrações (`integrations`)
8. indicadores (`metrics`)
9. benefícios (`benefits`)
10. FAQ (`faq`)
11. links relacionados (`relatedLinks`)
12. navegação entre serviços (existente)
13. CTA final (existente)

Regras visuais:
- sem redesign;
- reutilizar classes e componentes atuais;
- FAQ com `<details>/<summary>` nativo;
- manter CTA e navegação atuais.

### 3.4 Atualizar `PageAnchorNav`
No mesmo arquivo, atualizar anchors para:
- `problemas`
- `casos-de-uso`
- `implantacao`
- `integracoes`
- `indicadores`
- `faq`

### 3.5 Metadata de serviço
Arquivo: `src/app/(public)/servicos/[slug]/page.tsx`

Em `generateMetadata`:
- `title: service.seoTitle || service.title`
- Open Graph com `title` equivalente
- manter `description`, canonical e `buildOg`.

### 3.6 Schema estruturado
Arquivo: `src/app/(public)/servicos/[slug]/page.tsx`

#### Service (enriquecido)
Manter schema atual e adicionar:
- `alternateName: service.shortTitle`
- `serviceType: service.shortTitle`
- `audience: BusinessAudience`
- `keywords: service.keywords`

#### FAQPage (novo)
Se `service.faq.length > 0`, renderizar JSON-LD `FAQPage` com `Question`/`Answer`.

### 3.7 Compatibilidade com `/servicos`
Arquivo: `src/app/(public)/servicos/page.tsx`
- manter funcionamento com campos antigos;
- sem redesign da listagem.

### 3.8 Atualizar `/llms-full.txt` (Fase 1 existente)
Arquivo: `src/app/llms-full.txt/route.ts`

Expandir seção de serviços para incluir também:
- problemas que resolvemos;
- casos de uso;
- etapas de implantação;
- integrações;
- indicadores;
- perguntas frequentes.

Regra: não mudar critérios de filtro de posts já aprovados na Fase 1.

### 3.9 Atualizar `sitemap.ts`
Arquivo: `src/app/sitemap.ts`

Atualizar `lastModified` das rotas de serviço para data fixa:
- `2026-05-20`

Sem usar `new Date()` para esse ajuste.

### 3.10 Atualizar checklist
Arquivo: `docs/SEO_CHECKLIST.md`

Adicionar seção **Páginas de Serviço**:
- [x] Serviços expandidos com problemas, casos de uso, implantação, integrações, indicadores e FAQ.
- [x] Metadata dos serviços usando `seoTitle`.
- [x] Schema `Service` enriquecido.
- [x] Schema `FAQPage` adicionado às páginas de serviço.
- [x] Links internos relacionados adicionados às páginas de serviço.

Sem remover itens da Fase 1.

## 4. Restrições
Não fazer:
- redesign visual amplo;
- troca de paleta/tipografia;
- mudança de header/footer/nav global;
- mudanças no blog/CMS/admin;
- migrations Supabase;
- novas dependências;
- novas variáveis de ambiente;
- novos serviços;
- páginas extras por dor/problema;
- Fase 3;
- alteração de slugs;
- remoção de schemas existentes.

## 5. Critérios de aceite
- 5 serviços com novos campos completos;
- `/servicos/[slug]` renderiza novas seções;
- FAQ visível;
- `FAQPage` JSON-LD presente quando FAQ existir;
- `Service` JSON-LD enriquecido e existente;
- metadata usa `seoTitle`;
- `/servicos` continua funcional;
- `/llms-full.txt` (existente) inclui novos blocos de serviço;
- sitemap válido com atualização de data das rotas de serviço;
- nenhum slug alterado;
- sem mudança visual ampla;
- TypeScript sem erro.

## 6. Validação obrigatória
Executar ao final:
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 7. Entrega esperada
- arquivos criados/alterados;
- resumo técnico;
- resumo por serviço;
- resultados de validação;
- pontos de atenção.
