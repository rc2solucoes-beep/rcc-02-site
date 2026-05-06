-- ─────────────────────────────────────────────────────────────────────────────
-- Add postal code and address locality for complete PostalAddress schema
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS address_locality TEXT;

COMMENT ON COLUMN settings.postal_code IS 'CEP/Postal code (e.g., 07100-500)';
COMMENT ON COLUMN settings.address_locality IS 'City/Locality (e.g., Guarulhos)';
