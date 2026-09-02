export const dynamic = "force-static";

const content = `# RC2 Soluções

> Consultoria e implementação de automação de processos, integração de sistemas e IA para operações de pequenas e médias empresas brasileiras.

A RC2 Soluções atua em quatro frentes conectadas para que processos e sistemas acompanhem o tamanho da operação: automação de processos, integração de sistemas, IA para operações e operações digitais & commerce.

## Principais páginas

- [Página inicial](https://www.rc2solucoes.com.br/): posicionamento, competências, método e produtos próprios.
- [Soluções](https://www.rc2solucoes.com.br/solucoes): página comercial central, com as quatro competências, o modelo de trabalho e a Operação Gerenciada.
- [Sobre](https://www.rc2solucoes.com.br/sobre): posicionamento, trajetória e forma de trabalho.
- [Blog](https://www.rc2solucoes.com.br/blog): artigos sobre automação, integração, IA aplicada à operação e processos.
- [Avaliações e Projetos](https://www.rc2solucoes.com.br/avaliacoes): avaliações e projetos da RC2.
- [Contato](https://www.rc2solucoes.com.br/contato): canal para falar sobre sua operação com a RC2.

## Competências

- [Automação de Processos](https://www.rc2solucoes.com.br/solucoes#automacao-de-processos): trabalho manual, tarefas repetitivas, regras de negócio, tratamento de exceções e rastreabilidade do que foi executado.
- [Integração de Sistemas](https://www.rc2solucoes.com.br/solucoes#integracao-de-sistemas): ERP, CRM, plataformas e sistemas internos conectados por API ou webhook, com fonte da verdade definida por dado.
- [IA para Operações](https://www.rc2solucoes.com.br/solucoes#ia-para-operacoes): agentes aplicados a processos definidos, classificação e triagem, leitura de documentos, governança e handoff humano.
- [Operações Digitais & Commerce](https://www.rc2solucoes.com.br/solucoes#operacoes-digitais-commerce): plataforma, ERP, logística, pagamentos, estoque e pedidos em uma operação integrada.
- [Operação Gerenciada](https://www.rc2solucoes.com.br/solucoes#operacao-gerenciada): acompanhamento técnico contínuo do que já está implantado.

## Produto

- [Zapbox](https://www.rc2solucoes.com.br/zapbox): produto próprio da RC2 para atendimento e vendas pelo WhatsApp, com equipe, CRM comercial e Sales AI. A página explica a fronteira entre o produto e as competências de consultoria da RC2, e encaminha para https://www.zapbox.cloud/.

## Temas principais

- Automação de processos e workflows
- Integração entre ERP, CRM, APIs, webhooks e planilhas
- Agentes de IA aplicados a processos internos
- Governança e handoff humano em IA operacional
- Operações digitais e commerce integrados
- Operação Gerenciada e continuidade técnica

## Contato

- Site: https://www.rc2solucoes.com.br/
- Página de contato: https://www.rc2solucoes.com.br/contato
`;

export async function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

