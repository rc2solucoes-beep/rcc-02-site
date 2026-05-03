# Guia do Administrador — RC2 Soluções CMS

Acesse o painel em: **https://rc2solucoes.com.br/admin**

---

## Login

1. Acesse `/admin`
2. Informe o e-mail e a senha cadastrados no Supabase Auth
3. Você será redirecionado para o Dashboard

> Se precisar redefinir a senha, use a opção "Forgot password" no painel do Supabase → Authentication → Users.

---

## Dashboard

Visão geral com três métricas:

| Card | O que mostra |
|---|---|
| Posts publicados | Total de posts com status "Publicado" |
| Leads totais | Total de solicitações de diagnóstico recebidas |
| Leads esta semana | Leads dos últimos 7 dias |

---

## Posts

### Criar um post

1. Clique em **"+ Novo post"** (botão laranja no topo)
2. Preencha os campos:
   - **Título** — o slug é gerado automaticamente; edite se necessário
   - **Slug** — aparece como `/blog/seu-slug`. Só letras minúsculas, números e hífens
   - **Resumo** — 1–2 frases para SEO e listagem (aparece nos cards do blog)
   - **URL da imagem de capa** — cole a URL completa de uma imagem hospedada (Supabase Storage, Cloudinary, etc.)
   - **Conteúdo** — editor rico com toolbar (negrito, itálico, títulos, listas, links, citações)
   - **Status** — escolha entre Rascunho, Publicado ou Arquivado
3. Clique em **"Salvar post"**

### Status dos posts

| Status | Visível no site | Descrição |
|---|---|---|
| Rascunho | Não | Trabalho em andamento |
| Publicado | Sim | Aparece em `/blog` e indexado pelo Google |
| Arquivado | Não | Preservado no banco, fora do ar |

### Editar um post

1. Vá em **Posts** na sidebar
2. Clique em **"Editar"** no post desejado
3. Faça as alterações e clique em **"Salvar post"**

### Excluir um post

1. Abra o post para edição
2. Clique no botão **"Excluir"** (canto superior direito, vermelho)
3. Confirme na caixa de diálogo

> **Atenção:** a exclusão é permanente e não pode ser desfeita.

### Boas práticas de conteúdo

- Slug deve ser descritivo: `como-usar-ia-no-whatsapp` ✓, `post-1` ✗
- Resumo entre 120–160 caracteres para SEO ideal
- Use H2 e H3 no editor para estruturar o conteúdo
- Publique imagens de capa com proporção 16:9 (sugestão: 1200×675px)

---

## Leads

Lista todas as solicitações de diagnóstico recebidas pelo formulário de contato.

- **E-mail** — clique para abrir o cliente de e-mail
- **WhatsApp** — clique para abrir o WhatsApp Web
- Os leads não podem ser editados ou excluídos pelo admin (preservação de dados)

Para exportar leads, acesse diretamente o Supabase → Table Editor → `leads` → Export CSV.

---

## Configurações

Dados gerais usados pelo site e pela equipe:

| Campo | Usado para |
|---|---|
| E-mail de contato | Receber notificações de novos leads via Resend |
| WhatsApp | Links de "fale pelo WhatsApp" no site |
| URL do Instagram | Ícone de rede social no rodapé |
| URL do LinkedIn | Ícone de rede social no rodapé |
| URL OG Image padrão | Imagem exibida ao compartilhar páginas sem imagem própria |

Clique em **"Salvar configurações"** após qualquer alteração.

> **Nota:** alterações nas configurações têm efeito após o próximo deploy ou revalidação (até 60 segundos em produção).

---

## Logout

Clique em **"Sair"** na parte inferior da sidebar esquerda.

---

## Problemas comuns

| Problema | Solução |
|---|---|
| Post publicado não aparece no blog | Aguarde até 60s (revalidação ISR) ou force um novo deploy |
| Imagem de capa não carrega | Verifique se a URL é pública e acessível. Use HTTPS |
| Login não funciona | Verifique as credenciais no Supabase → Authentication → Users |
| Configurações não salvam | Verifique se o usuário tem permissão `authenticated` no Supabase |
