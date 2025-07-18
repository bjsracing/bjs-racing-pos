// src/components/SpecialPriceModal.jsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { FiSearch, FiX } from "react-icons/fi";

// Helper Hook untuk debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const PILOK_BRANDS = ["Diton", "Nippon Paint", "Samurai", "Sapporo"];

function SpecialPriceModal({ isOpen, onClose, customer }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    merek: "semua",
    kategori: "semua",
    ukuran: "semua",
    searchTerm: "",
  });
  const [merekOptions, setMerekOptions] = useState([]);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [ukuranOptions, setUkuranOptions] = useState([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState("semua");
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  const fetchProductsForEditor = useCallback(async () => {
    if (!customer?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "get_products_for_special_price_editor",
        {
          p_customer_id: customer.id,
          p_search_term: debouncedSearchTerm,
          p_kategori_filter: filters.kategori,
          p_merek_filter: filters.merek,
          p_ukuran_filter: filters.ukuran,
        },
      );
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products for editor:", error);
      alert("Gagal memuat data produk.");
    } finally {
      setLoading(false);
    }
  }, [
    customer?.id,
    debouncedSearchTerm,
    filters.kategori,
    filters.merek,
    filters.ukuran,
  ]);

  useEffect(() => {
    if (isOpen) {
      fetchProductsForEditor();
    }
  }, [isOpen, fetchProductsForEditor]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFilterOptions = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("merek, kategori, ukuran");
      if (error) {
        console.error("Error fetching filter options:", error);
        return;
      }
      if (data) {
        setMerekOptions(
          [...new Set(data.map((p) => p.merek).filter(Boolean))].sort(),
        );
        setKategoriOptions(
          [...new Set(data.map((p) => p.kategori).filter(Boolean))].sort(),
        );
        setUkuranOptions(
          [...new Set(data.map((p) => p.ukuran).filter(Boolean))].sort(),
        );
      }
    };
    fetchFilterOptions();
  }, [isOpen]);

  const handlePriceChange = async (productId, price) => {
    const finalPrice = price || 0;

    if (finalPrice === 0) {
      const { error } = await supabase
        .from("daftar_harga_mitra")
        .delete()
        .match({ customer_id: customer.id, product_id: productId });

      if (error) console.error("Gagal menghapus harga spesial:", error.message);
    } else {
      const { error } = await supabase.rpc("upsert_special_price", {
        customer_uuid: customer.id,
        product_uuid: productId,
        new_price: finalPrice,
      });

      if (error) console.error("Gagal menyimpan harga spesial:", error.message);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setActiveQuickFilter("semua");
  };

  const handleQuickFilterClick = (brand) => {
    const newBrand = brand === activeQuickFilter ? "semua" : brand;
    setActiveQuickFilter(newBrand);
    setFilters({
      ...filters,
      kategori: newBrand === "semua" ? "semua" : "Pilok",
      merek: newBrand,
    });
  };

  const updateLocalProductPrice = (productId, newPriceValue) => {
    const cleanedValue = newPriceValue.replace(/[^0-9]/g, "");
    setProducts((currentProducts) =>
      currentProducts.map((p) =>
        p.id === productId
          ? { ...p, harga_spesial: cleanedValue ? Number(cleanedValue) : null }
          : p,
      ),
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl shadow-xl w-full max-w-6xl h-[95vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">
            Bulk Edit Harga Spesial:{" "}
            <span className="text-blue-600">{customer?.nama_pelanggan}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-200"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body Modal dengan 2 Kolom */}
        <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
          {/* KOLOM KIRI: FILTER */}
          <div className="w-full md:w-1/4 flex flex-col gap-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-700">
              Filter Produk
            </h3>
            <div className="relative">
              <FiSearch className="absolute top-1/2 left-3 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="searchTerm"
                placeholder="Cari nama atau kode..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
                className="w-full p-2 pl-10 border rounded-lg"
              />
            </div>
            <select
              name="kategori"
              value={filters.kategori}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <select
              name="merek"
              value={filters.merek}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="semua">Semua Merek</option>
              {merekOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              name="ukuran"
              value={filters.ukuran}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-lg"
            >
              <option value="semua">Semua Ukuran</option>
              {ukuranOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <div className="border-t pt-4">
              <h4 className="text-md font-semibold text-slate-600 mb-2">
                Filter Cepat Pilok
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {PILOK_BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => handleQuickFilterClick(brand)}
                    className={`w-full py-2 px-2 text-sm font-bold rounded-md transition-colors border ${
                      activeQuickFilter === brand
                        ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-300"
                        : "bg-white text-slate-700 hover:bg-blue-100"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: TABEL PRODUK */}
          <div className="flex-grow flex flex-col bg-white rounded-lg shadow-inner min-h-0">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-slate-700">
                Daftar Produk
              </h3>
              <p className="text-sm text-slate-500">
                Isi harga di kolom "Harga Spesial", harga akan tersimpan
                otomatis saat fokus berpindah.
              </p>
            </div>
            <div className="flex-grow overflow-y-auto">
              {loading ? (
                <p className="text-center p-10">Memuat data produk...</p>
              ) : (
                <table className="w-full text-sm">
                  {/* --- PERUBAHAN DIMULAI DARI SINI --- */}
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr>
                      <th className="p-3 text-left font-semibold text-slate-600">
                        Nama Produk
                      </th>
                      <th className="p-3 text-left font-semibold text-slate-600">
                        Kode
                      </th>
                      <th className="p-3 text-left font-semibold text-slate-600">
                        Ukuran
                      </th>
                      <th className="p-3 text-left font-semibold text-slate-600">
                        Harga Grosir Default
                      </th>
                      <th className="p-3 text-left font-semibold text-slate-600 w-1/4">
                        Harga Spesial (Rp)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-semibold">{p.nama}</td>
                        <td className="p-3 text-slate-500">{p.kode}</td>
                        <td className="p-3 text-slate-500">
                          {p.ukuran || "-"}
                        </td>
                        <td className="p-3">
                          {`Rp ${new Intl.NumberFormat("id-ID").format(p.harga_grosir || 0)}`}
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="-"
                            value={
                              p.harga_spesial
                                ? new Intl.NumberFormat("id-ID").format(
                                    p.harga_spesial,
                                  )
                                : ""
                            }
                            onChange={(e) =>
                              updateLocalProductPrice(p.id, e.target.value)
                            }
                            onBlur={() =>
                              handlePriceChange(p.id, p.harga_spesial)
                            }
                            className="w-full p-2 border rounded-md bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* --- PERUBAHAN BERAKHIR DI SINI --- */}
                </table>
              )}
              {!loading && products.length === 0 && (
                <p className="text-center p-10 text-slate-500">
                  Tidak ada produk yang cocok dengan filter.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpecialPriceModal;
