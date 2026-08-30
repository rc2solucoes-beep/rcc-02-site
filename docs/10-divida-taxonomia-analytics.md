# Dívida técnica — taxonomia de analytics

> **Registro de dívida, não implementação.** Nenhum evento, parâmetro, trigger,
> container GTM ou propriedade GA4 foi alterado. Este documento existe para que
> a divergência abaixo seja uma **decisão consciente rastreável**, e não um
> defeito silencioso.
>
> Criado após a Fase 2 (`main @ 3a645d5`). Não bloqueia a Fase 3.

## O que aconteceu

A Fase 2 substituiu os CTAs descontinuados pelos rótulos aprovados em
`AGENTS.md`. Os **labels de eventos de analytics foram deliberadamente
preservados**, para não quebrar a comparabilidade das séries históricas no
GA4/GTM.

O resultado é uma divergência intencional entre o que o usuário lê e o que o
evento registra:

| Local | Texto visível (Fase 2) | Evento histórico preservado |
|---|---|---|
| Header desktop | Falar com a RC2 | `diagnostico_gratuito` |
| Header mobile | Falar com a RC2 | `diagnostico_gratuito` |
| Home — grid de serviços | Falar sobre minha operação | `solicitar_diagnostico` |
| Home — CTA final | Falar sobre minha operação | `comenzar_diagnostico` |
| Home — escolha por dor | Falar sobre minha operação | *(usa `item.label`)* |
| Blog — estado vazio | Falar sobre minha operação | `solicitar_diagnostico` |
| Blog — CTA padrão do post | *(CMS)* | `solicitar_diagnostico` |
| Serviço — benefícios | *(contextual)* | `solicitar_diagnostico` |
| Formulário de contato | Agendar conversa de diagnóstico | `form_name: "diagnostico_gratuito"` |

**15 ocorrências** de labels/parâmetros com a nomenclatura antiga, em `src/`.

Há ainda `comenzar_diagnostico` — grafia em espanhol, provável erro de digitação
histórico. **Não corrigido**: renomear também quebra a série.

## Por que isso não é bug

Nome de evento é **identificador**, não rótulo de interface. Renomeá-lo:

- interrompe a continuidade da série histórica no GA4;
- invalida comparações período a período;
- quebra qualquer dashboard, exploração, público ou conversão que filtre pelo
  nome antigo;
- pode afetar integrações downstream que consomem o nome.

Preservar foi a escolha correta no momento da Fase 2. O custo é a divergência
acima, que cresce a cada fase editorial se não for tratada.

## Escopo da revisão futura

A revisão precisa **investigar antes de decidir**. Nada abaixo está decidido.

### Levantamento necessário

- nomes atuais de todos os eventos e parâmetros
- triggers e variáveis no container GTM
- eventos-chave / conversões configuradas no GA4
- relatórios, explorações e dashboards que filtram por nome
- públicos e audiences
- integrações e consumidores downstream
- volume histórico por evento — quanta série está em jogo
- `src/lib/tracking.ts`, que hoje **tipa** `form_name: "diagnostico_gratuito"`

### Estratégias a avaliar

| Estratégia | Ideia | Custo histórico |
|---|---|---|
| Manter + parametrizar | preserva o evento, adiciona parâmetro semântico novo | nenhum |
| Eventos v2 | novo nome convivendo com o antigo | baixo, exige período de coexistência |
| Camada de compatibilidade | mapeia antigo ↔ novo na borda | médio |
| Só labels internos | muda apenas nomenclatura de código, não o que é enviado | nenhum |
| Migração com coexistência | dispara ambos por um período, depois corta | médio, mas auditável |

O critério declarado é: **taxonomia semântica durável sem destruir
comparabilidade histórica.**

## Restrições

- Não renomear eventos sem plano de coexistência e data de corte.
- Não alterar GA4/GTM por conveniência estética.
- Não misturar esta revisão com fase editorial ou comercial.
- Qualquer mudança precisa de janela de validação com dados reais.

## Estado

**Aberta.** Sem responsável e sem prazo definidos. Não bloqueia a Fase 3.
