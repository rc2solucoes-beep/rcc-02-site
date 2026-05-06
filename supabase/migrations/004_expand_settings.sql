-- ─── Expand Settings for Organization & Schema.org ────────────────────────────

-- Add new columns to settings table if they don't exist
alter table settings
add column if not exists phone text default '',
add column if not exists address text default '',
add column if not exists address_lat numeric,
add column if not exists address_lng numeric,
add column if not exists business_area text default '',
add column if not exists gmb_url text default '',
add column if not exists facebook_url text default '',
add column if not exists youtube_url text default '';

-- Insert default values for new settings (if not exists)
insert into settings (key, value) values
  ('phone',           ''),
  ('address',         ''),
  ('address_lat',     ''),
  ('address_lng',     ''),
  ('business_area',   ''),
  ('gmb_url',         ''),
  ('facebook_url',    ''),
  ('youtube_url',     '')
on conflict (key) do nothing;
