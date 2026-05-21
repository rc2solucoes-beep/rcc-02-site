# Ajustes no CMS para SEO Editorial (Design)

## Contexto
Esta fase melhora a qualidade editorial de SEO no CMS/admin sem criar conteúdo, sem migrations e sem alterar o banco. O foco é UX de preenchimento, consistência de validação e documentação para operação editorial.

## Objetivo
Aumentar a qualidade dos posts antes da publicação com orientação prática no admin e regras claras de validação, preservando flexibilidade de rascunhos.

## Restrições
- Não criar/editar/publicar posts existentes
- Não criar migration
- Não adicionar dependências
- Não alterar schema do banco
- Não alterar layout público, sitemap, robots ou llms
- Não redesenhar o admin

## Escopo técnico aprovado

### 1) Tipos e validações
Arquivos:
- `src/lib/types/post.ts`
- `src/lib/validations/post.ts`

Diretrizes:
- Manter o tipo `Post` alinhado ao banco atual (sem campos novos)
- Reforçar validação estrutural de slug com regex estrita:
  - minúsculas, números e hífen
  - sem hífen duplo
  - sem hífen no início/fim
- Mensagem de erro de slug mais clara para o editor
- Sem novos bloqueios editoriais por tamanho de meta title/meta description

### 2) Draft vs Published
Decisão aprovada:
- Alertas editoriais serão **não bloqueantes**
- Draft continua flexível
- Publicado não recebe bloqueio adicional por qualidade editorial (apenas erros estruturais já validados por schema)

### 3) UX no formulário admin
Arquivos:
- `src/components/admin/PostFormRefactored.tsx`
- `src/components/admin/PostFormTabs/SeoTab.tsx`
- `src/components/admin/PostFormTabs/ImageTab.tsx`
- (ou equivalentes onde os campos já existirem)

Diretrizes:
- Expandir avisos editoriais não bloqueantes para `status=published`
- Incluir contadores/referências de tamanho para:
  - `title`
  - `summary`
  - `seo_meta_title`
  - `seo_meta_description`
  - `og_title`
  - `og_description`
- Reforçar textos de apoio para:
  - slug
  - keyword primária
  - meta title/description
  - `seo_index_status`
  - FAQ
  - CTA
- Não criar componente complexo; usar padrões visuais atuais

### 4) Actions server-side
Arquivo:
- `src/app/admin/(protected)/posts/actions.ts`

Diretrizes:
- Manter validação server-side via `CreatePostSchema`
- Não alterar autenticação, RLS, nem contrato de persistência
- Não adicionar bloqueios editoriais subjetivos
- Manter publicação possível quando conteúdo estrutural estiver válido

### 5) Documentação editorial
Criar:
- `docs/CMS_SEO_EDITORIAL_GUIDE.md`
- `docs/CMS_SEO_QA_CHECKLIST.md`

Atualizar:
- `docs/SEO_CHECKLIST.md`
- `README.md` (seção documentação)

Conteúdo obrigatório:
- Guia de preenchimento SEO por campo
- Regras de indexação `index/noindex/nofollow`
- Checklist operacional de QA antes de publicar

## Arquitetura da solução

### Camada de validação
- Continua centralizada em `CreatePostSchema`
- Regras estruturais no schema
- Regras editoriais como orientação (warnings), não erro fatal

### Camada de UX editorial
- Sinais de qualidade em tempo de preenchimento
- Feedback contextual por campo
- Bloco de recomendações SEO consolidado no formulário

### Camada operacional
- Docs e checklist orientam consistência da equipe
- Sem dependência de automação de conteúdo

## Critérios de aceite
1. Nenhum post criado/alterado/publicado
2. Nenhuma migration criada
3. Nenhuma dependência adicionada
4. Draft continua salvando com flexibilidade
5. Publicação recebe orientação melhor sem bloqueios adicionais de qualidade
6. Slug inválido tratado com mensagem clara
7. Regras de meta title/meta description documentadas e sinalizadas
8. Orientação para keyword primária, FAQ, CTA e alt text
9. `docs/CMS_SEO_EDITORIAL_GUIDE.md` criado
10. `docs/CMS_SEO_QA_CHECKLIST.md` criado
11. `docs/SEO_CHECKLIST.md` atualizado
12. `README.md` atualizado (docs)
13. `npm run typecheck` passa
14. `npm run lint` passa (0 errors)
15. `npm run build` passa

## Riscos e mitigação

1. Risco: endurecer demais validações e travar edição
- Mitigação: manter bloqueio apenas estrutural; qualidade editorial via warning

2. Risco: feedback duplicado/confuso no formulário
- Mitigação: consolidar mensagens por campo e manter linguagem curta

3. Risco: mudança visual no admin fora do escopo
- Mitigação: reaproveitar classes/componentes existentes

## Validação
Executar ao final:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test` (reportar falhas não relacionadas, se houver)