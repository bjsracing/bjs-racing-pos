-- Fitur 5: AI Business Advisor Chatbot
-- RPC agregat konteks bisnis untuk asisten CFO di Dashboard.
-- Mengembalikan satu objek JSONB berisi ringkasan laba-rugi, metrik, perbandingan
-- periode sebelumnya, produk terlaris, stok rendah/habis, penjualan per merek,
-- margin per kategori, dan tren time-series harian.
--
-- Catatan skema (dari penggunaan di aplikasi):
--   transactions: total, diskon, total_akhir, total_laba, items (jsonb), created_at, customer_id
--   products:     nama, merek, kategori, kode, harga_jual, harga_beli, stok, stok_min, status

CREATE OR REPLACE FUNCTION public.get_ai_business_context(
  start_date timestamptz,
  end_date timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration interval := end_date - start_date;
  v_prev_start timestamptz := start_date - (end_date - start_date);
  v_prev_end timestamptz := start_date;

  v_result jsonb;

  -- Periode berjalan
  v_omzet numeric := 0;
  v_diskon numeric := 0;
  v_laba numeric := 0;
  v_trx_count integer := 0;

  -- Periode sebelumnya
  v_prev_omzet numeric := 0;
  v_prev_laba numeric := 0;
  v_prev_trx_count integer := 0;

  v_total_produk_aktif integer := 0;
  v_total_stok_habis integer := 0;
  v_total_stok_rendah integer := 0;
BEGIN
  -- === Metrik periode berjalan ===
  SELECT
    COALESCE(SUM(t.total_akhir), 0),
    COALESCE(SUM(t.diskon), 0),
    COALESCE(SUM(t.total_laba), 0),
    COUNT(*)
  INTO v_omzet, v_diskon, v_laba, v_trx_count
  FROM transactions t
  WHERE t.created_at >= start_date AND t.created_at <= end_date;

  -- === Metrik periode sebelumnya (durasi sama sebelum start_date) ===
  SELECT
    COALESCE(SUM(t.total_akhir), 0),
    COALESCE(SUM(t.total_laba), 0),
    COUNT(*)
  INTO v_prev_omzet, v_prev_laba, v_prev_trx_count
  FROM transactions t
  WHERE t.created_at >= v_prev_start AND t.created_at < v_prev_end;

  -- === Hitungan produk ===
  SELECT COUNT(*) INTO v_total_produk_aktif
  FROM products WHERE status = 'Aktif';

  SELECT COUNT(*) INTO v_total_stok_habis
  FROM products WHERE status = 'Aktif' AND stok = 0;

  SELECT COUNT(*) INTO v_total_stok_rendah
  FROM products WHERE status = 'Aktif' AND stok > 0 AND stok <= stok_min;

  -- === Susun hasil JSONB ===
  v_result := jsonb_build_object(
    'periode', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date,
      'durasi_hari', GREATEST(1, CEIL(EXTRACT(EPOCH FROM v_duration) / 86400.0))
    ),

    'laba_rugi', jsonb_build_object(
      'omzet', v_omzet,
      'total_diskon', v_diskon,
      'laba_bersih', v_laba,
      'hpp_estimasi', GREATEST(v_omzet - v_diskon - v_laba, 0),
      'margin_persen', CASE WHEN v_omzet > 0
        THEN ROUND((v_laba / v_omzet) * 100, 1) ELSE 0 END
    ),

    'metrik', jsonb_build_object(
      'jumlah_transaksi', v_trx_count,
      'rata_rata_per_transaksi', CASE WHEN v_trx_count > 0
        THEN ROUND(v_omzet / v_trx_count) ELSE 0 END
    ),

    'perbandingan_periode_sebelumnya', jsonb_build_object(
      'omzet_sebelumnya', v_prev_omzet,
      'laba_sebelumnya', v_prev_laba,
      'transaksi_sebelumnya', v_prev_trx_count,
      'perubahan_omzet_persen', CASE WHEN v_prev_omzet > 0
        THEN ROUND(((v_omzet - v_prev_omzet) / v_prev_omzet) * 100, 1)
        WHEN v_omzet > 0 THEN 100 ELSE 0 END,
      'perubahan_laba_persen', CASE WHEN v_prev_laba > 0
        THEN ROUND(((v_laba - v_prev_laba) / v_prev_laba) * 100, 1)
        WHEN v_laba > 0 THEN 100 ELSE 0 END
    ),

    'ringkasan_produk', jsonb_build_object(
      'total_produk_aktif', v_total_produk_aktif,
      'total_stok_habis', v_total_stok_habis,
      'total_stok_rendah', v_total_stok_rendah
    ),

    -- === Top 10 produk terlaris (berdasarkan kuantitas dari items jsonb) ===
    'top_produk_terlaris', COALESCE((
      SELECT jsonb_agg(row_to_json(sub))
      FROM (
        SELECT
          item->>'nama' AS nama,
          item->>'merek' AS merek,
          SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)) AS total_terjual,
          SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)
              * COALESCE((item->>'harga_jual')::numeric, 0)) AS total_nilai
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(t.items) = 'array' THEN t.items ELSE '[]'::jsonb END
        ) AS item
        WHERE t.created_at >= start_date AND t.created_at <= end_date
          AND (item->>'nama') IS NOT NULL
        GROUP BY item->>'nama', item->>'merek'
        ORDER BY total_terjual DESC
        LIMIT 10
      ) sub
    ), '[]'::jsonb),

    -- === 10 produk stok rendah ===
    'produk_stok_rendah', COALESCE((
      SELECT jsonb_agg(row_to_json(sub))
      FROM (
        SELECT nama, merek, kategori, stok, stok_min
        FROM products
        WHERE status = 'Aktif' AND stok > 0 AND stok <= stok_min
        ORDER BY (stok::numeric / NULLIF(stok_min, 0)) ASC NULLS LAST
        LIMIT 10
      ) sub
    ), '[]'::jsonb),

    -- === 10 produk habis (stok 0) ===
    'produk_habis', COALESCE((
      SELECT jsonb_agg(row_to_json(sub))
      FROM (
        SELECT nama, merek, kategori
        FROM products
        WHERE status = 'Aktif' AND stok = 0
        ORDER BY nama ASC
        LIMIT 10
      ) sub
    ), '[]'::jsonb),

    -- === Penjualan per merek (top 8) ===
    'penjualan_per_merek', COALESCE((
      SELECT jsonb_agg(row_to_json(sub))
      FROM (
        SELECT
          COALESCE(NULLIF(item->>'merek', ''), 'Tanpa Merek') AS merek,
          SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)
              * COALESCE((item->>'harga_jual')::numeric, 0)) AS total_penjualan
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(t.items) = 'array' THEN t.items ELSE '[]'::jsonb END
        ) AS item
        WHERE t.created_at >= start_date AND t.created_at <= end_date
        GROUP BY COALESCE(NULLIF(item->>'merek', ''), 'Tanpa Merek')
        ORDER BY total_penjualan DESC
        LIMIT 8
      ) sub
    ), '[]'::jsonb),

    -- === Margin per kategori ===
    'margin_per_kategori', COALESCE((
      SELECT jsonb_agg(row_to_json(sub))
      FROM (
        SELECT
          COALESCE(NULLIF(item->>'kategori', ''), 'Lainnya') AS kategori,
          SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)
              * COALESCE((item->>'harga_jual')::numeric, 0)) AS total_penjualan,
          SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)
              * (COALESCE((item->>'harga_jual')::numeric, 0) - COALESCE((item->>'harga_beli')::numeric, 0))) AS total_laba
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE WHEN jsonb_typeof(t.items) = 'array' THEN t.items ELSE '[]'::jsonb END
        ) AS item
        WHERE t.created_at >= start_date AND t.created_at <= end_date
        GROUP BY COALESCE(NULLIF(item->>'kategori', ''), 'Lainnya')
        HAVING SUM(COALESCE((item->>'quantity')::numeric, (item->>'kuantitas')::numeric, 0)
              * COALESCE((item->>'harga_jual')::numeric, 0)) > 0
        ORDER BY total_penjualan DESC
        LIMIT 15
      ) sub
    ), '[]'::jsonb),

    -- === Tren time-series harian (maks 31 titik) ===
    'tren_harian', COALESCE((
      SELECT jsonb_agg(row_to_json(sub) ORDER BY sub.tanggal)
      FROM (
        SELECT
          date_trunc('day', t.created_at)::date AS tanggal,
          COALESCE(SUM(t.total_akhir), 0) AS penjualan,
          COALESCE(SUM(t.total_laba), 0) AS laba,
          COUNT(*) AS jumlah_transaksi
        FROM transactions t
        WHERE t.created_at >= start_date AND t.created_at <= end_date
        GROUP BY date_trunc('day', t.created_at)::date
        ORDER BY tanggal DESC
        LIMIT 31
      ) sub
    ), '[]'::jsonb),

    'generated_at', now()
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_ai_business_context(timestamptz, timestamptz) TO authenticated;

-- Toggle fitur AI Business Advisor
INSERT INTO ai_config (key, value, description, type, grp) VALUES
  ('advisor_enabled', 'true', 'Aktifkan AI Business Advisor (Dashboard)', 'boolean', 'feature')
ON CONFLICT (key) DO NOTHING;
