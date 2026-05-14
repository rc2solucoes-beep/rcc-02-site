-- Fase 2: FAQ e CTA Internos
-- Adicionar campos de FAQ (perguntas frequentes) e CTA (call-to-action) aos posts

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS faq_items JSONB,
  ADD COLUMN IF NOT EXISTS cta_block JSONB;

-- faq_items: array de {question: string, answer: string}
-- Exemplo:
-- [
--   {"question": "Como funciona?", "answer": "Funciona assim..."},
--   {"question": "Quanto custa?",  "answer": "Depende do plano..."}
-- ]

-- cta_block: objeto configurável de CTA
-- Exemplo:
-- {
--   "type": "service",
--   "title": "Conheça nossos serviços",
--   "description": "Automatize seus processos com a RC2",
--   "primaryButton": {"text": "Ver serviços", "url": "/servicos"},
--   "secondaryButton": {"text": "Falar com especialista", "url": "/contato"}
-- }

COMMENT ON COLUMN posts.faq_items IS 'Array JSON de perguntas frequentes: [{question, answer}]';
COMMENT ON COLUMN posts.cta_block  IS 'Configuração do CTA interno: {type, title, description, primaryButton, secondaryButton, items}';
