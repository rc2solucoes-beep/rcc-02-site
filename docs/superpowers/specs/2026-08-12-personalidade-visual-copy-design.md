# Personalidade visual por copy — design

## Objetivo

Reforçar o posicionamento prático e operacional da RC2 com uma nova seção de contraste na home, prova direta sobre o fundador no hero e rótulos de CTA contextualizados. A implementação preserva componentes compartilhados, classes existentes, tokens e destinos.

## Escopo

### Home: seção “O que a RC2 não é”

A nova seção entra imediatamente antes da seção “Diferencial”. Ela usa `bg-rc2-bg-alt` para criar alternância com a seção de serviços clara anterior e com a seção navy seguinte.

Não haverá componente novo nem CSS novo. A seção será montada na própria página com os elementos e utilities já existentes:

- `SectionLabel` com eyebrow “POSICIONAMENTO”;
- título “O que a RC2 não é” com a escala existente;
- três itens em sequência, cada um marcado pela utility `.rc2-rule`;
- fechamento com peso tipográfico superior aos itens.

Conteúdo:

1. Não é agência de marketing que também “faz automação”.
2. Não é revenda de ferramenta com treinamento incluso.
3. Não é entusiasta de IA que nunca operou um negócio de verdade.
4. Fechamento: “A RC2 implementa. Do diagnóstico ao processo rodando — e fica até funcionar.”

### Home: prova sobre o fundador

O texto de apoio abaixo das ações do hero será substituído por duas linhas:

- “A RC2 usa no próprio comercial o que implementa nos clientes: um agente de IA filtra, e quem conversa com você é o Robson.” com maior peso;
- “20+ anos em TI, e-commerce e operação digital.” como apoio secundário.

No viewport de 390 px, a primeira linha deve ocupar no máximo três linhas. Se ultrapassar esse limite, a implementação deve parar antes das demais alterações para comunicar o problema.

A assinatura em itálico existente permanece abaixo desse bloco. Não haverá mudança nas classes dos botões ou no componente `HeroActions` além do rótulo do CTA primário.

### Rótulos contextuais

Todos os destinos permanecem inalterados. O valor padrão de `CTABlock` também permanece inalterado; quando a chamada usa o padrão, ela passará a informar `primaryLabel` localmente.

| Local | Rótulo |
|---|---|
| Header desktop e mobile | Solicitar diagnóstico |
| Hero da home | Ver onde minha operação trava |
| Link para `/contato` em “Escolha pela sua dor” | Diagnosticar minha dor |
| Sexto card após serviços na home | Mapear meus gargalos |
| CTA intermediário da página individual de serviço | Ver se serve para o meu caso |
| CTA final da página individual de serviço | Aplicar isso na minha operação |
| CTA final da página individual de solução | Aplicar isso na minha operação |
| CTA padrão no fim de post do blog | Falar sobre o meu caso |
| CTA final da home | Começar pelo diagnóstico |
| Submit do formulário de contato | Solicitar diagnóstico |

## Restrições

- Não alterar CSS, tokens ou classes existentes.
- Não alterar a estrutura interna de componentes compartilhados.
- Não criar componente novo.
- A única nova estrutura de página é a seção explicitamente solicitada na home.
- Não alterar destinos, tracking ou comportamento dos CTAs.
- Não alterar o valor padrão de `CTABlock`.
- Preservar o CTA do header e o submit do formulário.

## Tom de voz

Os textos novos seguem a seção 3 do guia de marca: linguagem profissional, direta, confiante e operacional. Nenhum texto novo usa “revolução”, “disruptivo”, “mágico”, “solução completa”, “líder de mercado”, “simples assim”, “chatbot” ou “barato”.

## Verificação

1. Testes de conteúdo devem falhar antes das alterações e passar depois.
2. `npm run build` deve concluir sem erro.
3. `npm run audit:brand` deve concluir sem violações.
4. A home deve ser capturada antes e depois em 1440 px e 390 px.
5. No viewport de 390 px, cada novo rótulo de CTA deve ser inspecionado para identificar quebra de linha.
6. “Mapear meus gargalos” deve permanecer em uma linha no sexto card da home em 1440 px e 390 px; qualquer necessidade de encurtar exige comunicação prévia.
