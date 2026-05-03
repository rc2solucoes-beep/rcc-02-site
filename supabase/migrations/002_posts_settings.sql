-- ─── Posts ────────────────────────────────────────────────────────────────────

create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  summary     text not null default '',
  content     text not null default '',
  cover_url   text,
  status      text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on posts
  for each row execute procedure update_updated_at();

-- RLS
alter table posts enable row level security;

-- Public: only published posts are readable
create policy "Public can read published posts"
  on posts for select
  using (status = 'published');

-- Authenticated users (admin): full CRUD
create policy "Authenticated users have full access to posts"
  on posts for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Indexes
create index posts_status_published_at on posts (status, published_at desc);
create index posts_slug on posts (slug);

-- ─── Settings ─────────────────────────────────────────────────────────────────

create table if not exists settings (
  key   text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at
  before update on settings
  for each row execute procedure update_updated_at();

alter table settings enable row level security;

-- Settings are public-readable
create policy "Settings are publicly readable"
  on settings for select
  using (true);

-- Only authenticated users can modify settings
create policy "Authenticated users can modify settings"
  on settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Seed default settings
insert into settings (key, value) values
  ('contact_email',    'contato@rc2solucoes.com.br'),
  ('whatsapp',         '5511988028550'),
  ('instagram_url',    ''),
  ('linkedin_url',     ''),
  ('og_image_url',     '/og-image.png')
on conflict (key) do nothing;
