# PRD — Evolução do painel administrativo (CMS, Leads, Newsletter)

**Data:** 2026-10-13
**Status:** Rascunho para revisão final de engenharia. **Sem autorização de implementação.**
**Fase:** documentação. Nenhum código, migration, dado ou infraestrutura foi alterado.

## 0. Vínculos entre documentos

| Documento | Arquivo | Cobre |
|---|---|---|
| PRD (este) | `2026-10-13-admin-evolution-prd.md` | problema, escopo, requisitos, decisões, bloqueios |
| SDD — CMS | `2026-10-13-admin-cms-listing-design.md` | RF-CMS-* |
| SDD — Leads (inclui fundação de segurança E0) | `2026-10-13-admin-leads-management-design.md` | RF-LEAD-*, RF-SEG-*, RF-OPS-* |
| SDD — Newsletter | `2026-10-13-newsletter-design.md` | RF-NL-* |
| Matriz de rastreabilidade | `2026-10-13-admin-evolution-traceability.md` | requisito ↔ decisão ↔ SDD ↔ teste ↔ entrega ↔ aceite |

Convenção de IDs: `RF-` requisito funcional · `RNF-` não funcional · `RN-` regra de negócio · `DEC-` decisão aprovada · `PRP-` decisão proposta (a aprovar) · `EV-` evidência verificada · `PV-` premissa não validada · `DEP-` dependência externa · `BL-` bloqueio de lançamento · `DT-` dívida técnica · `CA-<RF>` critério de aceite do requisito · `T-` teste · `E` entrega.

## 1. Problema e objetivos

O admin da RC2 gerencia posts, leads e configurações, mas:

1. a lista de posts carrega tudo (inclusive o HTML completo) e não permite localizar conteúdo (EV-01);
2. a lista de leads é uma tabela estática sem fluxo de acompanhamento (EV-05);
3. não existe captação de inscritos com consentimento rastreável;
4. a base de segurança do banco tem lacunas conhecidas (EV-08, EV-09, EV-10).

**Objetivos**

- O1. Localizar e navegar posts por busca, status e período, com paginação no servidor.
- O2. Acompanhar leads de forma operacional básica (status, notas, próxima ação, arquivamento), sem virar CRM.
- O3. Captar inscritos de newsletter com double opt-in, consentimento rastreável e descadastro confiável, sem relação com leads.
- O4. Fechar as lacunas de segurança que bloqueiam os objetivos acima, sem quebrar o que está em produção.

## 2. Escopo e exclusões

**Dentro:** os três módulos acima e a fundação de segurança e testes (E0).

**Fora, explicitamente**

- Editor de newsletters, campanhas, disparos em massa, automações de marketing e segmentação (DEC-22).
- Integração de leads com Zapbox ou qualquer CRM (fronteira RC2 × Zapbox preservada).
- Conversão automática de lead em assinante, ou qualquer vínculo entre os módulos (DEC-21).
- Mudança de identidade visual, refatoração do admin existente fora dos arquivos tocados e reescrita do editor de posts.
- Alterar a semântica de `published_at` (DEC-05) e o motor `pg_cron` de publicação.
- Rebasear, integrar ou alterar a branch `fix/tracking-p0-foundation` (DEC-01).

## 3. Personas e jornadas

| Persona | Jornada principal |
|---|---|
| **Editor** (admin) | Abre `/admin/posts`, busca por título, filtra por "Agendado" no mês, abre o post, edita e agenda para data futura. |
| **Responsável comercial** (admin) | Abre `/admin/leads`, filtra "Novo", abre o detalhe, registra nota, define próxima ação e muda o status para "Contatado". Arquiva lead encerrado. Exclui definitivamente quando necessário. |
| **Visitante** | Na Home, antes do CTA final, informa e-mail, marca o consentimento, recebe e-mail, confirma e passa a ser assinante. Depois, pede o descadastro. |
| **Administrador de dados** | Vê assinantes e contadores, atende pedido de eliminação de titular e reenvia confirmação. |

## 4. Decisões aprovadas (revisão de engenharia)

| ID | Decisão |
|---|---|
| DEC-01 | Preservar integralmente a branch de tracking (16 commits exclusivos). Sem rebase, merge ou alteração de branches nesta fase. Base nova e isolada só após verificar divergências. |
| DEC-02 | Migrations manuais, com documentação separada de preflight, aplicação, pós-verificação e rollback. Nunca executar SQL remoto sem autorização. |
| DEC-03 | Restaurar leitura administrativa de `admin_audit_logs`, com permissão restrita e testes. |
| DEC-04 | Coluna gerada `sort_at`, com fallback para datas nulas. |
| DEC-05 | Preservar a semântica atual de `published_at`. Republicação registrada como dívida de SEO (DT-01). |
| DEC-06 | Campos de data sem efeito viram informação somente leitura. |
| DEC-07 | `lead_notes` append-only, com autoria e integridade referencial. |
| DEC-08 | Remover `leads_anon_insert` como prioridade de segurança. O rollback **não** recria permissão insegura. |
| DEC-09 | Exclusão de lead pela sessão administrativa com RLS. Verificar exclusão efetiva antes de auditar sucesso. Confirmação explícita, **sem arquivamento prévio obrigatório**. |
| DEC-10 | Cinco estados de lead: Novo, Em análise, Contatado, Qualificado, Encerrado. Arquivamento independente e reversível. |
| DEC-11 | Tokens seguros com validade, reuso, revogação e rotação especificados. Descadastro público distinto de one-click. |
| DEC-12 | Rate limit atômico no Supabase. O rate limit de contato deixa de depender da tabela `leads`. |
| DEC-13 | Retenção, eliminação e evidência de consentimento são decisão de política de dados, validada juridicamente antes do lançamento. |
| DEC-14 | Revisão do Turnstile da rota de contato antecipada (E0b), com preflight das variáveis de produção. |
| DEC-15 | Newsletter antes do CTA final da Home, sem competir com ele. Remetente `newsletter@rc2solucoes.com.br`, sujeito a validação de domínio e DNS. Temas: automação, integração de sistemas e IA aplicada a operações. **Sem promessa de frequência.** |
| DEC-16 | Testes reais de RLS em ambiente Supabase isolado, além dos unitários. |
| DEC-17 | Envio de e-mail por outbox persistente com retry. Sem processador confiável, E3 permanece bloqueada. Vercel Cron diário e reenvio manual não equivalem a esse mecanismo. |
| DEC-18 | Novos agendamentos exigem data futura. Registros históricos e a infraestrutura de publicação permanecem compatíveis. |
| DEC-19 **(revisada)** | O papel administrativo **não escreve** diretamente nas tabelas da newsletter (nem consentimento, nem mensagens de confirmação, nem estado). Toda mudança administrativa é uma **operação de negócio atômica, restrita e auditada**, implementada como função `SECURITY DEFINER` com autorização explícita no corpo, dono dedicado, `search_path` fixo e grants mínimos (SDD Newsletter §11.3). A versão anterior (`SECURITY INVOKER` com policies de escrita) foi substituída por permitir INSERT direto pela API. |
| DEC-20 | Sem abstrações genéricas prematuras. Compartilhado apenas o que tem consumidores reais (ver §5.1). |
| DEC-21 | Leads e newsletter são módulos independentes: sem FK, JOIN nem caminho de código entre eles. |
| DEC-22 | Sem campanhas nem disparo em massa nesta entrega. Sem "ativar assinante manualmente". |
| DEC-23 | Conceitos distintos: exclusão, descadastro, retenção de evidência e supressão de envio. Hash de e-mail é dado pessoal pseudonimizado, não anônimo. |
| DEC-24 | Nenhum token (confirmação ou descadastro) pode aparecer em eventos analíticos, logs de aplicação ou serviços desnecessários. |
| DEC-25 | **Gate E3/E4:** E3 e E4 podem ser desenvolvidas de forma independente, mas a **ativação pública** da newsletter só ocorre com a administração essencial (E4-essencial) disponível e verificada em produção (BL-11). |
| DEC-26 | **Desativação segura:** bloquear novas inscrições é separado da manutenção obrigatória do descadastro. A desativação, o rollback ou a limpeza de código nunca removem endpoints, validação de tokens, pedido de novo link de descadastro nem os dados que sustentam links já enviados, sem mecanismo equivalente ativo. |
| DEC-27 | **Isolamento de rastreadores como requisito arquitetural:** as páginas e rotas de token não carregam nem executam scripts de terceiros de medição, garantido pela estrutura de layouts, não só por checagem em tempo de execução. BL-05 continua como verificação obrigatória. |

## 5. Decisões propostas e seu estado

Estado conforme a revisão externa de engenharia.

| ID | Proposta | Alternativa | Estado |
|---|---|---|---|
| PRP-01 | Privilégio de coluna em `leads`: `authenticated` só pode `UPDATE` nas colunas operacionais (status, próxima ação, arquivo, timestamps). | Só RLS + whitelist na action | **Aprovada, condicionada à validação dos privilégios** (PV-06, T-LEAD-I03) |
| PRP-02 | Limites iniciais de rate limit (contato: 3/h por e-mail e por IP; inscrição: 5/h por IP, 3/24 h por e-mail, 10 min entre reenvios, 7 dias entre pedidos para endereço descadastrado; tokens: só tentativas **inválidas** contam por IP, e o token válido nunca é limitado por IP). | Calibrar após medir | **Aprovada provisoriamente**, sujeita a calibração e ajustes |
| PRP-03 | Tamanho de página 20 nas três listas. | 10 ou 50 | **Aprovada** |
| PRP-04 | Token de confirmação e de descadastro interativo no fragmento da URL (`#t=`), lido e removido pela página. | Cookie-bridge (SDD Newsletter §6.4) | **Condicionada ao isolamento de rastreadores** (DEC-27, PRP-10) |
| PRP-05 | Janela de retry do outbox limitada a 20 h após a primeira tentativa (margem de 4 h sobre as 24 h de idempotência). | Janela menor | **Aprovada**, com a correção da recuperação de lease (SDD Newsletter §8.1) |
| PRP-06 | Parâmetros de retenção como valores nomeados `P-RET-*`, preenchidos só após BL-01. | — | **Aprovada**, mantendo o bloqueio jurídico |
| PRP-07 | Busca do CMS e de leads via filtro PostgREST com escape rigoroso, coberto por teste hostil. | RPC parametrizada | **Aprovada, condicionada aos testes** (T-CMS-I03, T-CMS-U02) |
| PRP-08 | Aceitar tokens de descadastro de chaves HMAC revogadas indefinidamente. | Tokens opacos persistentes | **REJEITADA** pela revisão externa (credenciais globais revogadas não podem seguir válidas). Substituída por PRP-09. |
| PRP-09 | Tokens de confirmação e descadastro **opacos de 256 bits**, só o hash persistido, validação por consulta, token bruto transitório no outbox (SDD Newsletter §6). | Estados avaliados no §6.1 do SDD | **Aprovada** (terceira revisão externa) |
| PRP-10 | Opção de isolamento de rastreadores das páginas de token: recomendada a O5 (mover rastreadores do layout raiz para o layout do grupo `(public)`); alternativas O1 e O4 (SDD Newsletter §6.5). | O1, O4 | **Aprovada com a opção O5** (terceira revisão externa); a execução depende de coordenação com o responsável pela tracking |
| PRP-11 | Dimensionamento provisório do processador do outbox: `T`=15 s, `B`=5, `D`=120 s, `L`=180 s, `P`=60 s, com invariantes (SDD Newsletter §8.5). | Calibrar em LC-01 | **Aprovada como configuração inicial, sujeita a validação operacional** (LC-01, PV-27) |

### 5.1 O que fica compartilhado (DEC-20)

| Item | Consumidores | Permitido? |
|---|---|---|
| Parsing de parâmetros de lista, escape de termo de busca e componente de paginação | CMS, Leads, Newsletter admin | Sim (3 consumidores reais) |
| Função de rate limit e tabela de contadores | Contato, Inscrição, Pedido de descadastro | Sim (≥2 consumidores) |
| Helper de Turnstile e de IP do cliente | Contato, Newsletter | Sim |
| Framework genérico de listagem, CRUD, filtros declarativos ou repositório | — | **Não** |
| Refatorar `createPost`/`updatePost` (parsing duplicado) | — | **Não**, fora do escopo |

## 6. Requisitos funcionais

Critério de aceite de cada requisito: `CA-<ID do requisito>`. Cada critério é verificável pelos testes listados na matriz.

### 6.1 Fundação (E0)

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-OPS-01 | Runbook de migrations manuais com `preflight`, `apply`, `verify`, `rollback` e README por migration. | Todo script de migration das entregas tem os quatro artefatos e um registro de ordem; nenhum `apply` roda sem `preflight` aprovado. |
| RF-OPS-02 | Ambiente Supabase isolado e suíte de integração de RLS, com guarda contra execução em produção. | A suíte recusa rodar com URL fora da allowlist; relatório cobre tabela × papel × operação. |
| RF-OPS-03 | O Vitest passa a executar testes `.tsx`. | `tests/unit/admin/security-page-sanitization.test.tsx` é executado em `npm test`. |
| RF-SEG-01 | Remover acesso `anon` a `leads` (policy `leads_anon_insert` e grants), sem quebrar o formulário de contato. | Em ambiente isolado, `anon` não insere, lê, atualiza nem exclui `leads`; `POST /api/contact` continua gravando. |
| RF-SEG-02 | Admin lê `admin_audit_logs`; não-admin e `anon` não leem; ninguém no papel `authenticated` escreve. | `/admin/security` mostra eventos existentes; testes de RLS negam os demais papéis. |
| RF-SEG-03 | Turnstile falha fechado quando `VERCEL_ENV=production`; preflight confirma as variáveis em Production e Preview antes do deploy. | Matriz ambiente × segredo × token cumprida; contato continua funcional após o deploy. |
| RF-SEG-04 | IP do cliente obtido de cabeçalho confiável da Vercel; `cf-connecting-ip` só se o proxy Cloudflare for confirmado. | Teste do helper com cabeçalhos forjados; decisão registrada após PV-07. |
| RF-SEG-05 | Rate limit de contato por contadores atômicos próprios, independentes de `leads`. | Excluir leads não reduz a contagem; tentativas rejeitadas também contam. |

### 6.2 CMS

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-CMS-01 | Busca por título, slug e resumo, no servidor. | Termo com `%`, `_`, aspas, vírgula e parênteses retorna só correspondências literais. |
| RF-CMS-02 | Filtro por status (rascunho, agendado, publicado). | URL `?status=` filtra; valor inválido é ignorado. |
| RF-CMS-03 | Filtro por período sobre a data efetiva, em dias de Brasília. | Post às 23:30 de Brasília aparece no dia correto, não no seguinte (UTC). |
| RF-CMS-04 | Data efetiva `sort_at` por status, com fallback, nunca nula. **Datas de fallback não são exibidas com rótulo de publicação ou agendamento**: usam o rótulo da origem real (criação ou atualização) e a anomalia correspondente. | Tabela de verdade do SDD cumprida para todos os status e nulos; post publicado sem `published_at` mostra "Criado em", agendado sem data mostra "Atualizado em", ambos com aviso. |
| RF-CMS-05 | Ordenação cronológica determinística, com desempate por `id`. | Duas execuções consecutivas devolvem a mesma ordem, inclusive com datas iguais. |
| RF-CMS-06 | Agrupamento por mês e ano de `sort_at` (Brasília). | Cabeçalho de mês correto e repetido quando o grupo continua na página seguinte. |
| RF-CMS-07 | Paginação processada no servidor, sem carregar `content`. | A resposta da listagem não contém `content`; página fora do alcance leva à última. |
| RF-CMS-08 | Estados de carregamento, vazio, vazio por filtro e erro, distintos entre si. | Erro de consulta exibe estado de erro, não lista vazia. |
| RF-CMS-09 | Preservar criação, edição, preview, exclusão e publicação agendada. | Testes e2e existentes e novos de regressão passam; o job `pg_cron` não é alterado. |
| RF-CMS-10 | Novos agendamentos exigem data futura; históricos permanecem editáveis. | Matriz de regra de data do SDD cumprida (novo, transição, data alterada, data inalterada vencida). |
| RF-CMS-11 | Exclusão de post só audita sucesso depois de confirmar que a linha foi removida. | Falha simulada de exclusão não gera `admin_post_deleted` e mostra erro. |
| RF-CMS-12 | Campos `published_at` e `updated_at` do formulário são somente leitura. | Não existe input editável para esses campos; valores aparecem quando existem. |
| RF-CMS-13 | Indicadores de anomalia: agendado sem data, agendamento vencido, publicado sem data. | Cada anomalia aparece na lista com o rótulo correspondente. |

### 6.3 Leads

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-LEAD-01 | Listagem com busca (nome, empresa, e-mail, mensagem), filtros (status, solução, arquivados, período) e paginação no servidor. | Combinações de filtro respeitam a URL; arquivados ficam fora da visão padrão. |
| RF-LEAD-02 | Página de detalhe `/admin/leads/[id]`. | Link direto abre o lead; id inexistente mostra "não encontrado". |
| RF-LEAD-03 | Status: Novo, Em análise, Contatado, Qualificado, Encerrado. | Banco rejeita valor fora do conjunto; leads existentes entram como Novo. |
| RF-LEAD-04 | Notas internas append-only, com autoria. | Nota não pode ser editada nem excluída por `authenticated`; autor = usuário da sessão. |
| RF-LEAD-05 | Registro da próxima ação (texto e data opcionais). | Ação vencida é sinalizada na lista e no detalhe. |
| RF-LEAD-06 | Arquivar e restaurar, reversíveis. | Restaurar devolve o lead à lista padrão com o mesmo status. |
| RF-LEAD-07 | Exclusão permanente com confirmação explícita, sem arquivamento prévio; remove notas e histórico relacionados; audita só após verificar a exclusão. | Sem confirmação, nada é excluído; após exclusão não restam linhas filhas; falha não gera evento de sucesso. |
| RF-LEAD-08 | Histórico operacional nas tabelas do lead, **registrando apenas mudanças reais**; auditoria de segurança em `admin_audit_logs` com ID e nomes de campos, sem conteúdo. | Nenhum evento de auditoria contém texto de nota, nome, e-mail ou telefone; atualização sem mudança real (mesmo valor) não gera evento de atividade nem altera `updated_at` nem `status_updated_at`; datas de controle são mantidas por triggers `BEFORE UPDATE` e o histórico por trigger `AFTER UPDATE`. |
| RF-LEAD-09 | Compatibilidade com leads históricos e com `POST /api/contact`. | Migration aditiva; formulário e notificação por e-mail seguem funcionando sem alteração. |
| RF-LEAD-10 | Concorrência otimista nas alterações, com `updated_at` preservado em microssegundos e **sem falso conflito** causado por atualizações sem mudança real. | Edição com `updated_at` desatualizado retorna conflito sem sobrescrever; duas edições paralelas, uma vence; `UPDATE` sem mudança não altera `updated_at`. |
| RF-LEAD-11 | Rótulos do admin: "contatos recebidos", sem "diagnóstico" como CTA. | Tela de leads sem "solicitações de diagnóstico". |

### 6.4 Newsletter

| ID | Requisito | Critério de aceite |
|---|---|---|
| RF-NL-01 | Formulário de inscrição na Home, antes do CTA final, com consentimento explícito (checkbox desmarcado, texto versionado). | Envio sem consentimento é rejeitado; versão do texto fica registrada. |
| RF-NL-02 | Double opt-in: assinante só fica `active` ao confirmar pelo link do e-mail. A confirmação fica **vinculada à versão exata do texto de consentimento e da política apresentadas no pedido original**; o evento `consent_confirmed` nunca aceita versão enviada pelo cliente nem presume a versão vigente. | Sem confirmação o status permanece `pending`; `consent_confirmed` grava as versões do pedido mesmo se o texto vigente mudou depois; a RPC de confirmação não tem parâmetro de versão. |
| RF-NL-03 | Resposta de inscrição idêntica para e-mail novo, pendente, ativo e descadastrado. | Teste compara status, corpo e cabeçalhos entre os quatro casos. |
| RF-NL-04 | Solicitação pública de descadastro envia link por e-mail; nunca descadastra pelo endereço digitado. | Digitar um e-mail alheio não altera nenhum status. |
| RF-NL-05 | Descadastro por link (página interativa) e one-click conforme RFC 8058. | POST one-click com `List-Unsubscribe=One-Click` descadastra sem cookie, sem autenticação e sem redirecionamento, e **não é bloqueado por rate limit de IP** quando o token é encontrado (o IP é o de provedores de e-mail, compartilhado por muitos titulares). Token bem formado e **não encontrado** (inclusive de assinante já excluído) recebe `200` neutro e idempotente, sem estado novo e sem tokens revogados armazenados; `400` fica restrito a corpo inválido e token malformado. |
| RF-NL-06 | Tokens de confirmação e descadastro **opacos, de alta entropia, com validação persistente** (PRP-09): só o hash é guardado, links antigos de descadastro continuam funcionando, a confirmação é de uso único e expira, e a revogação é individual ou por assinante. Não há segredo global de token. | Matriz de tokens do SDD cumprida (formato inválido, expirado, usado, revogado, desconhecido, reinscrição, reenvio); vazamento do banco expõe só hashes; nenhuma credencial global precisa ser mantida, rotacionada ou revogada. |
| RF-NL-07 | Anti-abuso: origem, honeypot, Turnstile (fail-closed em produção) e rate limit atômico. | Excedido o limite, retorna 429 genérico; nenhuma resposta revela existência de endereço. |
| RF-NL-08 | Outbox persistente com estados, lease, **recuperação de lease vencido antes do deadline por qualquer worker**, retry, idempotência, tratamento de resultado ambíguo e de mensagens `dead`, e dimensionamento do processador com invariantes. | Máquina de estados do SDD cumprida; item `sending` com lease vencido volta a ser processado antes do deadline, sem corrida entre workers; nenhum e-mail duplicado em falha simulada dentro da janela; item que derruba o processo termina em `attempts_exhausted`; mensagem `dead` nunca é reenviada automaticamente, gera alerta sem inundação e é visível ao admin; conclusão de tentativa obsoleta é descartada. |
| RF-NL-09 | Consentimentos append-only, ligados ao assinante por FK obrigatória. | Não é possível criar evento órfão nem alterar/excluir evento por `authenticated`. |
| RF-NL-10 | Independência de leads. | Teste estático e de schema: nenhuma importação, FK ou JOIN entre `newsletter_*` e `leads*`. |
| RF-NL-11 | Admin: **essencial (E4-essencial):** listagem de assinantes com busca por e-mail e filtro por status, detalhe com histórico de consentimento e do outbox. **Complemento (E4-complemento):** contadores e filtro por período. | Essencial: localizar um assinante pelo e-mail e ver o histórico. Complemento: contadores batem com a contagem direta por status. |
| RF-NL-12 | Admin: **essencial:** marcar descadastrado (com motivo) e excluir. **Complemento:** reenviar confirmação (pendente) e revogar tokens de descadastro de um assinante. **Todas** são operações de negócio atômicas, restritas e auditadas (DEC-19 revisada). Sem ativação manual e sem escrita direta. | O papel administrativo não consegue `INSERT`, `UPDATE` nem `DELETE` direto nas tabelas da newsletter; cada operação grava estado, evento e auditoria na mesma transação; **a autorização consulta `admin_users` através de grants e policy mínimos do dono da função (apenas a linha do chamador), com RLS ativa e sem `BYPASSRLS`**; não há caminho de UI nem de API para `pending → active` sem token. |
| RF-NL-13 | Retenção, purga e eliminação conforme parâmetros `P-RET-*` aprovados (BL-01). A evidência de consentimento vive **exatamente tanto quanto a linha do assinante** (vínculo `CASCADE`); reter evidência além da linha exige extensão não especificada (SDD Newsletter §10.3). | Purga só é agendada depois que os parâmetros existem; eliminação remove assinante, consentimentos e outbox; nenhum parâmetro de retenção contradiz o vínculo entre evidência e assinante. |
| RF-NL-14 | Seção responsiva na Home, nos tokens `--rc2-*`. | `npm run audit:brand` limpo; foco visível; sem hex literal. |
| RF-NL-15 | Páginas de token seguras: `noindex`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, fora do sitemap, sem mutação em GET, **e isoladas dos rastreadores de terceiros por construção** (DEC-27): sem GTM, GA4, Meta Pixel, Ahrefs, `dataLayer` nem bootstrap de consentimento, garantido pela estrutura de layouts. | GET por scanner não altera estado; nenhuma requisição a domínio de medição nas páginas de token; `window.dataLayer` indefinido; o layout dessas rotas não importa componentes de rastreamento. |
| RF-NL-16 | Observabilidade da fila (parte da E4-essencial): profundidade, idade do item mais antigo, mortos, leases vencidos. | Endpoint de saúde e indicador no admin refletem o estado da fila. |
| RF-NL-17 | Política de privacidade atualizada para a newsletter. | Página publicada com finalidade, base legal, retenção e direitos (BL-08). |
| RF-NL-18 | Analytics sem e-mail nem token. | Inspeção do `dataLayer` e do GTM em ambiente isolado não encontra e-mail nem token. |
| RF-NL-19 | **Desativação segura (DEC-26):** sinalizadores independentes bloqueiam novas inscrições e pausam o envio de confirmações. Descadastro por link, one-click, pedido de novo link de descadastro, confirmação de quem já pediu, validação de tokens e o envio de `unsubscribe_link` **não são desativáveis** nem removíveis por rollback ou limpeza de código sem mecanismo equivalente ativo. | Com a inscrição desligada, `POST /subscribe` responde 503 e a Home não mostra a seção, enquanto descadastro, one-click, pedido de novo link e confirmação continuam funcionando; teste de manifesto falha se uma rota obrigatória for removida; rollback após o primeiro e-mail real só vai para implantação que contenha as rotas obrigatórias. |

## 7. Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | Listas administrativas com consulta paginada no servidor e sem colunas pesadas. Metas de latência serão definidas após medição em ambiente isolado (sem número assumido). |
| RNF-02 | Acessibilidade WCAG AA: rótulos, `aria-live` nas mensagens, foco visível (`#C2410C` em claro) e navegação por teclado. |
| RNF-03 | Componentes novos usam apenas tokens `--rc2-*`; nenhum hex literal; botão primário com texto `--rc2-heading`; Safety Orange abaixo de 10% da área. |
| RNF-04 | Nenhum fornecedor novo: Supabase, Resend, Turnstile e Vercel já em uso. |
| RNF-05 | Cada entrega é reversível de forma independente (rollback de código e de banco documentados). |
| RNF-06 | Idempotência em envios e em operações de estado; operações repetidas não produzem efeito duplicado. |
| RNF-07 | Minimização de dados: newsletter coleta apenas e-mail; sem `user_agent`; IP somente como hash com salt. |
| RNF-08 | Falhas de infraestrutura não revelam existência de endereços nem vazam dados em mensagens de erro. |
| RNF-09 | Tabelas novas: RLS ativado, `REVOKE` explícito dos papéis sem necessidade e policies com `(select auth.uid())`. |
| RNF-10 | Isolamento arquitetural: páginas e rotas que recebem token de usuário não carregam scripts de terceiros de medição; verificável por teste de importação e de rede (DEC-27). |
| RNF-11 | Funções `SECURITY DEFINER`: autorização explícita no corpo, dono dedicado, `search_path` fixo, sem SQL dinâmico e `EXECUTE` mínimo, verificável por consulta ao catálogo. |

## 8. Regras de negócio

| ID | Regra |
|---|---|
| RN-01 | Data efetiva: publicado → `published_at`; agendado → `scheduled_publish_at`; rascunho → `updated_at`; com fallback nulo-seguro (SDD CMS §5.1). |
| RN-02 | Despublicar zera `published_at` (comportamento atual preservado, DT-01). |
| RN-03 | Novo agendamento exige data estritamente futura; agendamento já existente com data inalterada não é revalidado. |
| RN-04 | Arquivar lead não altera o status; restaurar não altera o status. |
| RN-05 | Exclusão de lead é permanente e remove notas e histórico; não exige arquivamento prévio. |
| RN-06 | Lead comercial nunca vira assinante e assinante nunca vira lead. |
| RN-07 | Assinante só é `active` após confirmar o e-mail; não existe ativação manual. |
| RN-08 | Descadastro é sempre possível por link, sem expiração, e tem efeito imediato. |
| RN-09 | A newsletter não promete frequência; o texto de consentimento descreve os temas. |
| RN-10 | CTA principal da Home continua "Falar sobre minha operação"; a newsletter é secundária. |
| RN-11 | Evento de analytics nunca carrega e-mail nem token. |
| RN-12 | Desativar a newsletter nunca desativa o descadastro, o pedido de novo link de descadastro nem a validação de links já enviados (DEC-26). |
| RN-13 | A newsletter só é ativada publicamente com a administração essencial disponível e verificada (DEC-25). |
| RN-14 | Mudança de estado de leads só gera registro de atividade quando o valor realmente muda. |
| RN-15 | Uma data de fallback nunca é apresentada como data de publicação ou de agendamento. |

## 9. Evidências verificadas

Todas lidas no código ou nos metadados do Supabase em 2026-10-13, sem SQL e sem leitura de dados pessoais.

| ID | Evidência | Fonte |
|---|---|---|
| EV-01 | A lista de posts carrega todos os posts, incluindo `content`, ordena por `created_at`, não filtra nem pagina e engole erros. | `src/app/admin/(protected)/posts/page.tsx` |
| EV-02 | `updatePost` zera `published_at` quando o status não é `published`. `createPost`/`updatePost` duplicam o parsing. `deletePost` ignora o erro do Supabase e audita sucesso. | `src/app/admin/(protected)/posts/actions.ts` |
| EV-03 | `published_at` e `updated_at` existem como inputs na `PublicationTab`, mas a action não os lê. | `PublicationTab.tsx`, `actions.ts` |
| EV-04 | Agendamento não exige `scheduled_publish_at`; o job `pg_cron` ignora linhas com data nula. | `src/lib/validations/post.ts`, `011_scheduled_publish_cron.sql` |
| EV-05 | A lista de leads faz `select *` sem filtro nem paginação; o texto fala em "solicitações de diagnóstico". | `src/app/admin/(protected)/leads/page.tsx` |
| EV-06 | O rate limit de contato conta linhas da própria tabela `leads` (só tentativas bem-sucedidas). | `src/app/api/contact/route.ts` |
| EV-07 | A rota de contato grava com `service_role`; nenhum código usa a anon key para inserir em `leads`. | `route.ts`, busca em `src/` |
| EV-08 | A migration 001 cria `leads_anon_insert … WITH CHECK (true)`; o baseline de 30/08 confirma 3 policies em `leads` no remoto. | `001_leads.sql`, `docs/07-supabase-migration-baseline.md` |
| EV-09 | `admin_audit_logs` tem RLS ligado e nenhuma policy (advisor de 13/10); há 195 linhas. | `get_advisors`, `list_tables` |
| EV-10 | Histórico de migrations remoto vazio; schema aplicado à mão; `ensure_rls` existe só no remoto. | `list_migrations`, baseline |
| EV-11 | Contagens remotas: `leads` 9, `posts` 18, `admin_audit_logs` 195, `admin_users` 1. Há tabela `idx02_links_backup_20260928` fora do repositório. | `list_tables` |
| EV-12 | Turnstile é ignorado quando o segredo está ausente ou vale `xxxx`, inclusive em produção. | `route.ts` (`verifyTurnstile`) |
| EV-13 | A prioridade de IP começa por `cf-connecting-ip`. | `route.ts` (`getIp`) |
| EV-14 | O e-mail do lead é enviado sem `await` nem `after()`. | `route.ts` |
| EV-15 | `vitest.config.ts` inclui só `tests/unit/**/*.test.ts`; existe um teste `.tsx` que não roda. | `vitest.config.ts` |
| EV-16 | GTM e `PageViewTracker` estão no layout raiz; `page_location` usa origem + caminho, sem query nem hash. | `src/app/layout.tsx`, `PageViewTracker.tsx` |
| EV-17 | Resend 6.12.2 expõe `idempotencyKey` e `headers` no envio. | `node_modules/resend` (tipos) |
| EV-18 | A branch de tracking tem 16 commits à frente de `main` e 0 atrás; toca `Footer.tsx`, `privacidade/page.tsx`, `next.config.ts`, `api/contact/route.ts`. | `git rev-list`, `git diff` |
| EV-19 | O formulário de contato não registra consentimento (não localizado na leitura dirigida). | `ContactForm.tsx` |
| EV-20 | Next 16: `searchParams` é `Promise`; `proxy.ts` substitui `middleware.ts`; `after()` existe. | `node_modules/next/dist/docs` |
| EV-21 | `writeAdminAuditLog` engole falhas por design; as Server Actions não passam IP. | `src/lib/admin/auditLog.ts` |
| EV-22 | Grants padrão do Supabase dão `arwdDxtm` a `anon`/`authenticated`; a RLS é a única barreira. | baseline de 30/08 |
| EV-23 | O Resend já envia e-mail de lead e alertas de segurança; a cota da conta é compartilhada. | `route.ts`, `securityAlerts.ts` |
| EV-24 | `pg_cron` está em uso (job de publicação); `pg_net` não foi verificado. | `011_scheduled_publish_cron.sql` |
| EV-25 | CSP atual: `connect-src 'self'`, Turnstile (script e frame), `form-action 'self'`. | `next.config.ts` |
| EV-26 | O padrão de widget Turnstile já existe no formulário de contato. | `ContactForm.tsx` |
| EV-27 | `sendSecurityAlert` e `ALERT_EVENT_WHITELIST` existem e podem receber novos eventos. | `src/lib/admin/` |
| EV-28 | `DelayedGtm` carrega o GTM no primeiro `scroll`, `pointerdown`, `keydown` ou `touchstart`, ou 2,5 s após o `load`; o layout `(public)` hospeda `Header`, `Footer`, `FloatingWhatsApp` e `ConsentManager`. | `DelayedGtm.tsx`, `(public)/layout.tsx` |
| EV-29 | Next 16: vários *root layouts* exigem remover o `layout.js` de topo; navegar entre eles causa *full page load*; é preciso `global-not-found`. | `node_modules/next/dist/docs` |

## 10. Premissas técnicas não validadas

| ID | Premissa | Como validar |
|---|---|---|
| PV-01 | `leads_anon_insert` existe hoje no remoto. | Preflight somente leitura (`pg_policies`). |
| PV-02 | `admin_audit_logs` continua sem policies. | Idem. |
| PV-03 | `bootstrap_first_admin` continua ausente; job `publish-scheduled-posts` continua ativo. | Preflight (`pg_proc`, `cron.job`). |
| PV-04 | `pg_net` está disponível no projeto. | Preflight (`pg_extension`). |
| PV-05 | Referential actions (`ON DELETE CASCADE`) ignoram RLS nas tabelas filhas. | Teste de integração em ambiente isolado. |
| PV-06 | Privilégio de coluna `UPDATE` coexiste com os grants padrão do Supabase. | Teste de integração. |
| PV-07 | O domínio é (ou não) proxiado pelo Cloudflare. | Verificação de DNS pelo dono do domínio. |
| PV-08 | Plano da Vercel e limites de cron/firewall. | Painel da Vercel. |
| PV-09 | Depois do isolamento arquitetural (DEC-27), nenhum script de terceiros de medição executa nas páginas de token. | Teste de rede e `dataLayer` em ambiente isolado e GTM Preview (BL-05). |
| PV-10 | Logs da Vercel registram a query string de requisições. | Teste em deploy isolado (BL-05). |
| PV-11 | O DKIM do Resend cobre os cabeçalhos `List-Unsubscribe` e `List-Unsubscribe-Post`. | Inspeção de e-mail real de teste. |
| PV-12 | Chaves de idempotência do Resend valem 24 h (informado pela revisão de engenharia). | Documentação do provedor. |
| PV-13 | Quantidade de posts com `published_at`/`scheduled_publish_at` nulos nos estados que os exigem. | Preflight de contagem. |
| PV-14 | O cron de publicação não revalida o cache do blog (ISR). | Teste em ambiente isolado. |
| PV-15 | Existe ambiente Supabase isolado e a Vercel pode apontar um preview para ele. | Decisão do dono da infraestrutura (DEP-01). |
| PV-16 | Variáveis do Turnstile reais existem em Production e Preview. | Verificação pelo dono (BL-06). |
| PV-17 | Coluna gerada `STORED` com expressão imutável é aceita e exposta pelo PostgREST sem ajuste. | Teste de integração (T-CMS-I01). |
| PV-18 | Nenhum código público faz `select('*')` com efeito colateral da nova coluna `sort_at`. | Busca no código durante o plano. |
| PV-19 | A Vercel sobrescreve `x-real-ip`/`x-forwarded-for` com o IP do cliente. | Documentação da Vercel + deploy isolado. |
| PV-20 | Nenhum outro consumidor (script, automação) insere em `leads` pela anon key. | Confirmação do dono (CHK-SEG-01). |
| PV-21 | `INSERT … ON CONFLICT DO UPDATE` com contador é atômico sob concorrência no projeto. | T-RL-I01. |
| PV-22 | Cota diária do plano Resend e impacto de picos no e-mail de leads e alertas. | DEP-02. |
| PV-23 | Clientes de e-mail e scanners não removem o fragmento `#t=` dos links. | Teste com clientes reais (LC-03). |
| PV-24 | `after()` roda após a resposta em Route Handlers na Vercel (só caminho rápido; o processador é a garantia). | Documentação + teste (LC-01). |
| PV-25 | O rastreamento de abertura e de clique do Resend pode ser desativado para o domínio e para os envios da newsletter, de modo que os links com token não sejam reescritos nem registrados pelo provedor. | Configuração do domínio no Resend + e-mail real (LC-02). |
| PV-26 | É possível criar um papel `NOLOGIN` dono das funções `SECURITY DEFINER` no Supabase hospedado, com privilégios mínimos e policies próprias, **inclusive `SELECT (id)` em `admin_users` limitado à linha do chamador e acesso a `auth.uid()` (ou leitura equivalente dos claims)**. Se não for viável, o fallback `postgres` só vale com análise de risco, testes adicionais e aprovação explícita (SDD Newsletter §11.5). | Ambiente isolado (T-NL-I16, T-NL-I17, T-NL-I30, T-NL-I31). |
| PV-28 | Em triggers `BEFORE UPDATE`, a cláusula `WHEN` do segundo trigger enxerga o `NEW` já alterado pelo primeiro (ordem alfabética dos nomes). | Ambiente isolado (T-LEAD-I15). |
| PV-27 | Timeout de requisição e limite de taxa do Resend, e `maxDuration` da Vercel, são compatíveis com os valores do dimensionamento (PRP-11). | Documentação + LC-01. |

## 11. Dependências externas

| ID | Dependência | Dono |
|---|---|---|
| DEP-01 | Projeto/branch Supabase isolado para testes de RLS. | Infraestrutura |
| DEP-02 | Domínio de envio `newsletter@rc2solucoes.com.br` no Resend: SPF, DKIM, DMARC. | Infraestrutura |
| DEP-03 | Mecanismo confiável de processamento do outbox (proposta: `pg_cron` + `pg_net`; alternativas no SDD Newsletter). | Infraestrutura |
| DEP-04 | Monitor externo da fila (sonda do endpoint de saúde). | Infraestrutura |
| DEP-05 | Novas variáveis de ambiente: `NEWSLETTER_DISPATCH_SECRET`, `RATE_LIMIT_PEPPER`, `NEWSLETTER_SIGNUP_ENABLED`, `NEWSLETTER_CONFIRMATION_DISPATCH_ENABLED` (sinalizadores desligados por padrão em produção). **Não há chave de token.** | Infraestrutura |
| DEP-06 | Revisão jurídica (LGPD) da política, do texto de consentimento e das retenções. | Jurídico |
| DEP-07 | Integração da branch de tracking em `main` antes da E3. | Engenharia |

## 12. Bloqueios de lançamento

| ID | Bloqueio | Bloqueia |
|---|---|---|
| BL-01 | Validação jurídica: base legal, texto de consentimento, retenção de descadastrados **e das evidências de consentimento (que hoje vivem tanto quanto a linha do assinante; se o jurídico exigir retê-las além disso, o modelo precisa de extensão e o SDD é revisado)**, eliminação, supressão, transferência internacional, canal e identificação do titular, retenção de `ip_hash`, cópias no provedor de e-mail e em backups, **período de manutenção dos links de descadastro após um eventual encerramento (L9)**, e retenção de leads. | Lançamento da newsletter (E3) e parâmetros `P-RET-*` |
| BL-02 | Domínio e DNS de `newsletter@` validados, com DKIM cobrindo cabeçalhos de lista. | E3 |
| BL-03 | Processador do outbox demonstrado em ambiente isolado, com falha injetada e alerta de fila parada. | E3 |
| BL-04 | Suíte de RLS verde em ambiente isolado para todas as tabelas tocadas. | E0b, E2, E3, E4 |
| BL-05 | Verificação obrigatória de exposição de token **e do isolamento de rastreadores** nas páginas de token (GTM, scripts de terceiros, logs, Referer). O isolamento é requisito arquitetural (DEC-27), não contingência; esta verificação o confirma. | Ativação da newsletter (E3) |
| BL-06 | Variáveis reais do Turnstile verificadas em Production e Preview. | E0b.4 |
| BL-07 | Branch de tracking integrada (ou base empilhada aprovada). | E3 |
| BL-08 | Política de privacidade atualizada e publicada. | E3 |
| BL-09 | Preflight remoto concluído e aprovado (PV-01 a PV-04). | E0b |
| BL-10 | Aprovação da copy da seção da Home e do texto de consentimento. | E3 |
| BL-11 | Administração essencial (E4-essencial) implantada e verificada em produção: busca e detalhe de assinante, descadastrar, excluir e indicador da fila (DEC-25). | Ativação pública da newsletter |

## 13. Riscos e dívida técnica

| ID | Item | Tratamento |
|---|---|---|
| DT-01 | Republicar um post gera nova data (`published_at` zerado ao despublicar). Impacto de SEO. | Registrado; sem mudança nesta evolução. |
| DT-02 | Cron de publicação não revalida cache (PV-14). | Registrado. |
| DT-03 | Policies existentes com `auth.uid()` sem `(select …)` (advisor `auth_rls_initplan`). | Fora do escopo; policies novas usam o padrão correto. |
| DT-04 | Dashboard rotula "Posts publicados" mas conta todos os posts. | Registrado. |
| DT-05 | UI do admin usa classes legadas fora dos tokens. | Sem refatoração; componentes novos usam tokens. |
| DT-06 | Grants padrão do Supabase dão `arwdDxtm` a `anon` em todas as tabelas; RLS é a única barreira. | Tabelas novas usam `REVOKE` explícito; tabelas antigas fora do escopo. |
| DT-07 | Tabela `idx02_links_backup_20260928` sem policy e fora do repositório. | Registrado; fora do escopo. |
| DT-08 | Envio de e-mail de lead sem `await`/`after()` (EV-14). | Registrado; fora do escopo. |
| R-01 | Deploy do Turnstile fail-closed sem variáveis válidas derruba o formulário de contato. | BL-06 e preflight. |
| R-02 | Conflito entre a E3 e a branch de tracking nos mesmos arquivos. | BL-07. |
| R-03 | Reenvio de confirmação usado como mail-bomb contra terceiros. | Rate limit por e-mail e cooldown (SDD Newsletter §5). |
| R-04 | Abuso da inscrição esgota a cota do Resend e atrasa e-mail de leads e alertas de segurança. | Bucket global dimensionado pela cota, com folga (SDD Newsletter §5.2); PV-22. |
| R-05 | **Residual, ainda não validado:** o token de descadastro (sem expiração) pode ficar visível em logs da plataforma (one-click na query), no armazenamento de mensagens do Resend e em gateways de e-mail do destinatário. | Mitigações propostas: impacto limitado a descadastrar, sem *log drains*, rastreamento do Resend desativado (PV-25). **Não aceito** até BL-05 e a decisão de engenharia. |
| R-06 | **Residual:** com o isolamento arquitetural (DEC-27) o risco de scripts de terceiros nas páginas de token deixa de ser uma contingência; resta o que está fora do nosso controle (extensões do navegador do titular, gateways do destinatário). | Verificação em BL-05 (T-NL-E06, LC-03). |
| R-07 | **Residual:** resultado ambíguo seguido de novo pedido pode gerar dois e-mails ao titular (só o último link de confirmação vale). | Tratamento proposto no SDD Newsletter §8.4; **a aceitação formal é decisão pendente** da revisão. |
| R-08 | **Residual:** o admin lê todos os e-mails da newsletter e pode descadastrar ou excluir assinantes; não consegue fabricar consentimento nem escrever direto nas tabelas (DEC-19 revisada). | Modelo de ameaça (SDD Newsletter §11.2); operações atômicas e auditadas; **aceitação pendente**. |
| R-09 | **Residual:** até a decisão jurídica, a evidência de consentimento não sobrevive à eliminação do assinante. | BL-01; extensão aditiva se exigida. |
| R-11 | **Residual, novo:** o token bruto fica em `newsletter_outbox_payload` por até ~20 h enquanto a mensagem está em aberto. | Tabela restrita ao `service_role`, invisível ao admin, apagada nos estados terminais; **aceitação pendente**. |
| R-10 | Dois PRs (E0b.4 e E0c) alteram `api/contact/route.ts`, arquivo que a branch de tracking também altera. | Empilhar sobre a ponta da branch de tracking, sem alterá-la (§14). |

## 14. Entregas

Dois tipos de condição, que não se confundem: **início** (o que precisa existir para começar a desenvolver) e **merge/lançamento** (o que precisa estar satisfeito para integrar em `main` ou ligar em produção).

| Entrega | Conteúdo | Pode começar quando | Só integra ou é lançada quando |
|---|---|---|---|
| **E0a** | Runbook de migrations, ambiente isolado, suíte de integração, Vitest `.tsx` | DEP-01 disponível | BL-04 (a própria suíte) |
| **E0b.1** | Preflight remoto somente leitura | E0a (runbook) e autorização explícita | BL-09 concluído |
| **E0b.2** | Remover acesso `anon` a `leads` | E0a | E0b.1, PV-20, BL-04 |
| **E0b.3** | Leitura de `admin_audit_logs` | E0a | E0b.1, BL-04 |
| **E0b.4** | Turnstile fail-closed e IP do cliente na rota de contato | E0a; **empilhada sobre a ponta da branch de tracking** (R-10) | BL-06; ordem de integração da tracking (DEC-01) |
| **E0c** | Rate limit atômico e desacoplamento do contato | E0a, E0b.1 (`pg_cron` presente), E0b.4 (mesma rota) | BL-04; PV-21 |
| **E1** | CMS; **entrega os utilitários compartilhados de lista** (parâmetros, escape de busca, paginação) | E0a | BL-04; aprovação de PRP-03 e PRP-07 |
| **E2** | Leads | E0a, E1 (utilitários compartilhados) | E0b.2 e E0b.3 já aplicadas no ambiente de teste (testes de RLS assumem `anon` sem acesso); BL-04 |
| **E3** | Newsletter: banco, fluxo público, outbox, e-mail, Home, isolamento das páginas de token | E0a, E0b.4, E0c; tracking empilhada ou integrada (R-10) | **Integrar:** BL-03, BL-04. **Ativar publicamente:** BL-01, BL-02, BL-03, BL-05, BL-07, BL-08, BL-10 **e BL-11** |
| **E4-essencial** | Admin da newsletter: busca, detalhe, descadastrar, excluir, indicador da fila (migration N4) | E3 funcionando no ambiente isolado; E1 (utilitários) | BL-04; **precisa estar em produção antes de qualquer ativação pública (BL-11)** |
| **E4-complemento** | Contadores, filtro por período, reenviar confirmação, revogar tokens | E4-essencial | BL-04; não bloqueia a ativação |

**Gate E3/E4 (DEC-25):** as duas entregas se desenvolvem de forma independente e podem ser integradas separadamente, mas `NEWSLETTER_SIGNUP_ENABLED` só pode ser ligado em produção depois de a E4-essencial estar implantada e verificada (BL-11).

**Ordem:** E0a → E0b.1 → (E0b.2, E0b.3, E0b.4 em PRs independentes) → E0c; E1 pode correr em paralelo a E0b; E2 depois de E1; E3 depois de E0c; E4 depois de E3 (no ambiente isolado) e de E1.

**Sobre BL-03:** a E3 pode ser desenvolvida enquanto o processador do outbox é demonstrado no ambiente isolado, mas **não é integrada nem ligada** sem a demonstração (DEC-17).

**Isolamento de rastreadores (DEC-27):** a opção escolhida (PRP-10) altera o layout raiz e componentes de tracking, arquivos que a branch de tracking também altera. Por isso essa parte da E3 se sequencia **depois** da integração da tracking ou em acordo com seu responsável; as demais partes da E3 podem avançar empilhadas.

**Desativação e rollback (DEC-26):** depois do primeiro e-mail com link enviado a destinatário real (ponto sem retorno), o rollback de código ou de banco só vale para implantações que contenham os componentes de manutenção obrigatória (SDD Newsletter §18.4 e §18.5).

Cada entrega é um PR separado com migration reversível. Esta fase de documentação não cria nenhum deles.

## 15. Indicadores de sucesso

Sem metas numéricas inventadas; a calibração é feita após a medição inicial.

- **CMS:** o editor localiza um post pela busca sem rolar a lista; a resposta da listagem não contém `content`.
- **Leads:** todo lead tem status; leads com próxima ação vencida são identificáveis em uma tela.
- **Segurança:** zero políticas `anon` em `leads`; `/admin/security` lista eventos; formulário de contato segue funcionando.
- **Newsletter:** taxa de confirmação e de falhas do outbox observáveis; zero mensagens duplicadas por incidente de retry; zero tokens em eventos analíticos.
- **Qualidade:** suíte de RLS verde em cada entrega.
