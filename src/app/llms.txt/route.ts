export const dynamic = "force-static";

const content = `# RC2 Soluções

> Consultoria especializada em IA, automações, integrações, e-commerce e operações digitais para pequenas e médias empresas brasileiras.

A RC2 Soluções ajuda empresas a transformar processos manuais, atendimento desorganizado e sistemas desconectados em operações digitais mais eficientes, com uso prático de IA, automações, n8n, integrações, sites inteligentes e e-commerce.

## Principais páginas

- [Página inicial](https://rc2solucoes.com.br/): visão geral da empresa, proposta de valor e principais serviços.
- [Serviços](https://rc2solucoes.com.br/servicos): soluções de IA, automação, e-commerce, integrações e sites.
- [Soluções por Problema](https://rc2solucoes.com.br/solucoes): páginas organizadas por dores de negócio como atendimento lento, leads sem resposta, processos manuais, sistemas desconectados e WhatsApp desorganizado.
- [Automações com IA](https://rc2solucoes.com.br/servicos/automacoes-com-ia): automação de atendimento, vendas, WhatsApp, CRM e operação.
- [Agentes de IA](https://rc2solucoes.com.br/servicos/agentes-de-ia): implantação de assistentes internos para equipes.
- [Automação de processos](https://rc2solucoes.com.br/servicos/automacao-de-processos): n8n, APIs, CRM, ERP, planilhas e WhatsApp.
- [E-commerce](https://rc2solucoes.com.br/servicos/e-commerce): estruturação de lojas virtuais e operações digitais.
- [Sites e landing pages](https://rc2solucoes.com.br/servicos/sites-e-landing-pages): páginas para geração de leads e conversão.
- [Soluções com IA](https://rc2solucoes.com.br/solucoes-com-ia): exemplos de aplicação de IA em atendimento, vendas e operação.
- [Sobre](https://rc2solucoes.com.br/sobre): posicionamento, experiência e forma de trabalho.
- [Blog](https://rc2solucoes.com.br/blog): artigos sobre IA, automação, atendimento e produtividade.
- [Contato](https://rc2solucoes.com.br/contato): canal para solicitar diagnóstico.

## Temas principais

- Automação de atendimento com IA
- WhatsApp para vendas e suporte
- Agentes de IA internos
- n8n e automação de processos
- Integração com CRM, ERP, APIs e planilhas
- E-commerce para PMEs
- Sites e landing pages de conversão
- Operações digitais para pequenas e médias empresas

## Contato

- Site: https://rc2solucoes.com.br/
- Página de contato: https://rc2solucoes.com.br/contato
`;

export async function GET() {
  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
