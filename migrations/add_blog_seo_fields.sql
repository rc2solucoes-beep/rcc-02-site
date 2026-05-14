-- Fase 1: Adicionar campos de SEO, Publicação, Autor, Imagem e Posts Relacionados

-- Alterar status para enum com "scheduled"
ALTER TABLE posts DROP CONSTRAINT posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check CHECK (status IN ('draft', 'scheduled', 'published'));

-- Campos de SEO
ALTER TABLE posts ADD COLUMN seo_keyword_primary VARCHAR(60) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN seo_keyword_secondary TEXT[] DEFAULT NULL; -- Array de tags
ALTER TABLE posts ADD COLUMN seo_meta_title VARCHAR(60) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN seo_meta_description VARCHAR(160) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN seo_index_status VARCHAR(20) DEFAULT 'index' CHECK (seo_index_status IN ('index', 'noindex', 'nofollow'));

-- Campos de Publicação
ALTER TABLE posts ADD COLUMN category VARCHAR(50) DEFAULT NULL CHECK (category IN ('Tecnologia', 'Automação', 'Gestão Empresarial', 'Segurança', 'Produtividade', 'Transformação Digital', 'Infraestrutura', 'Sistemas e Processos'));
ALTER TABLE posts ADD COLUMN tags TEXT[] DEFAULT NULL; -- Array de tags
ALTER TABLE posts ADD COLUMN content_type VARCHAR(20) DEFAULT NULL CHECK (content_type IN ('artigo', 'guia', 'tutorial', 'case', 'notícia'));
ALTER TABLE posts ADD COLUMN scheduled_publish_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE posts ADD COLUMN reading_time_minutes INTEGER DEFAULT NULL;

-- Campos de Autor (denormalizado)
ALTER TABLE posts ADD COLUMN author_id UUID DEFAULT NULL;
ALTER TABLE posts ADD COLUMN author_name VARCHAR(255) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN author_title VARCHAR(255) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN author_photo TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN author_bio TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN author_linkedin TEXT DEFAULT NULL;

-- Campos de Imagem & Social (expandido)
ALTER TABLE posts ADD COLUMN cover_url_alt VARCHAR(255) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN cover_url_caption TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN og_image TEXT DEFAULT NULL;
ALTER TABLE posts ADD COLUMN og_title VARCHAR(200) DEFAULT NULL;
ALTER TABLE posts ADD COLUMN og_description TEXT DEFAULT NULL;

-- Campos de Relacionamento
ALTER TABLE posts ADD COLUMN related_post_ids UUID[] DEFAULT NULL; -- Array de IDs de posts relacionados

-- Índices para performance
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_content_type ON posts(content_type);
CREATE INDEX idx_posts_scheduled_publish_at ON posts(scheduled_publish_at);
CREATE INDEX idx_posts_seo_keyword_primary ON posts(seo_keyword_primary);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);

-- Comentários explicativos
COMMENT ON COLUMN posts.seo_keyword_primary IS 'Palavra-chave principal para SEO (máx 60 chars)';
COMMENT ON COLUMN posts.seo_meta_title IS 'Meta title da página (máx 60 chars)';
COMMENT ON COLUMN posts.seo_meta_description IS 'Meta description da página (máx 160 chars)';
COMMENT ON COLUMN posts.category IS 'Categoria principal do artigo';
COMMENT ON COLUMN posts.tags IS 'Array de tags para classificação';
COMMENT ON COLUMN posts.reading_time_minutes IS 'Tempo estimado de leitura em minutos';
COMMENT ON COLUMN posts.author_id IS 'Referência ao usuário que criou o post';
COMMENT ON COLUMN posts.related_post_ids IS 'Array de IDs de posts relacionados';
