-- ========================================
-- FITUR 9: Dynamic Pricing Engine
-- margin_settings + price_history tables
-- ========================================

-- 1. Tabel margin_settings
CREATE TABLE IF NOT EXISTS margin_settings (
  id          BIGSERIAL PRIMARY KEY,
  kategori    TEXT UNIQUE NOT NULL,
  margin_pct  NUMERIC NOT NULL DEFAULT 10,
  description TEXT DEFAULT '',
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE margin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON margin_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for admin/owner" ON margin_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow update for admin/owner" ON margin_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow delete for admin/owner" ON margin_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- 2. Tabel price_history
CREATE TABLE IF NOT EXISTS price_history (
  id                BIGSERIAL PRIMARY KEY,
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_harga_beli    NUMERIC,
  new_harga_beli    NUMERIC,
  old_harga_jual    NUMERIC,
  new_harga_jual    NUMERIC,
  het_reference     NUMERIC,
  margin_pct_used   NUMERIC,
  recommended_price NUMERIC,
  ai_reason         TEXT,
  ai_confidence     TEXT DEFAULT 'medium',
  source            TEXT DEFAULT 'manual',
  action            TEXT DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON price_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for admin/owner" ON price_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow update for admin/owner" ON price_history
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow delete for admin/owner" ON price_history
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

-- 3. Seed data: default margins
INSERT INTO margin_settings (kategori, margin_pct, description) VALUES
  ('Oli',         10, 'Volume tinggi, sensitif harga'),
  ('Pelumas',     10, 'Mirip oli'),
  ('Ban',         12, 'Komoditas, kompetitif'),
  ('Kampas Rem',  15, 'Wear part'),
  ('Shoes',       15, 'Wear part'),
  ('Aki',         15, 'Moderate'),
  ('Accu',        15, 'Moderate'),
  ('Sparepart',   20, 'Hard part, specialist'),
  ('Mesin',       20, 'Specialist'),
  ('Kelistrikan', 20, 'Specialist'),
  ('Aksesoris',   25, 'High perceived value'),
  ('default',     10, 'Fallback untuk kategori lain')
ON CONFLICT (kategori) DO NOTHING;

-- 4. Tambah dynamic_pricing_enabled ke ai_config
INSERT INTO ai_config (key, value, description, type, grp) VALUES
  ('dynamic_pricing_enabled', 'true', 'Aktifkan AI Dynamic Pricing Engine', 'boolean', 'feature')
ON CONFLICT (key) DO NOTHING;

-- 5. Index untuk price_history
CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_action ON price_history(action);
