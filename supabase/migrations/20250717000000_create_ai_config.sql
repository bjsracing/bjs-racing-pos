CREATE TABLE IF NOT EXISTS ai_config (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'text',
  grp TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON ai_config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for admin/owner" ON ai_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow update for admin/owner" ON ai_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Allow delete for admin/owner" ON ai_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'owner')
    )
  );

INSERT INTO ai_config (key, value, description, type, grp) VALUES
  ('primary_provider', 'gemini', 'Provider AI utama', 'select', 'provider'),
  ('fallback_provider', 'nvidia', 'Provider AI fallback', 'select', 'provider'),
  ('auto_fallback', 'true', 'Auto-fallback ke provider lain jika error', 'boolean', 'provider'),
  ('gemini_model', 'gemini-3-flash-preview', 'Model Gemini untuk text & vision', 'text', 'model'),
  ('nvidia_text_model', 'nvidia/nemotron-3-ultra-550b-a55b', 'Model NVIDIA NIM untuk text', 'text', 'model'),
  ('nvidia_vision_model', 'nvidia/nemotron-nano-12b-v2-vl', 'Model NVIDIA NIM untuk vision/gambar', 'text', 'model'),
  ('pos_copilot_enabled', 'true', 'Aktifkan AI POS Copilot', 'boolean', 'feature'),
  ('wa_draft_enabled', 'true', 'Aktifkan AI WhatsApp Draft', 'boolean', 'feature'),
  ('ocr_enabled', 'true', 'Aktifkan AI OCR Nota', 'boolean', 'feature'),
  ('voice_enabled', 'true', 'Aktifkan Input Suara', 'boolean', 'feature')
ON CONFLICT (key) DO NOTHING;
