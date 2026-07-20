import { useState, useEffect, useCallback } from "react";
import {
  FiPercent,
  FiPlus,
  FiTrash2,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiEdit3,
  FiInfo,
  FiX,
} from "react-icons/fi";
import { getUserRole } from "../config/aiConfig.js";
import { getAllMargins, upsertMargin, deleteMargin } from "../lib/dynamicPricing.js";

export default function ManajemenMargin() {
  const [margins, setMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newKategori, setNewKategori] = useState("");
  const [newMargin, setNewMargin] = useState("10");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    const init = async () => {
      const role = await getUserRole();
      setUserRole(role);
      if (role !== "admin" && role !== "owner") return;

      try {
        const data = await getAllMargins();
        setMargins(data);
      } catch (err) {
        console.error("Failed to load margins:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSave = useCallback(async (kategori, margin_pct, description) => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await upsertMargin(kategori, Number(margin_pct), description);
      const data = await getAllMargins();
      setMargins(data);
      setSaveMsg({ type: "success", text: `Margin "${kategori}" berhasil disimpan!` });
      setEditRow(null);
    } catch (err) {
      setSaveMsg({ type: "error", text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDelete = useCallback(async (kategori) => {
    if (!confirm(`Hapus margin untuk "${kategori}"?`)) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await deleteMargin(kategori);
      const data = await getAllMargins();
      setMargins(data);
      setSaveMsg({ type: "success", text: `Margin "${kategori}" berhasil dihapus.` });
    } catch (err) {
      setSaveMsg({ type: "error", text: `Gagal menghapus: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, []);

  const handleAdd = useCallback(async () => {
    if (!newKategori.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await upsertMargin(newKategori.trim(), Number(newMargin), newDesc);
      const data = await getAllMargins();
      setMargins(data);
      setSaveMsg({ type: "success", text: `Margin "${newKategori.trim()}" berhasil ditambahkan!` });
      setIsAdding(false);
      setNewKategori("");
      setNewMargin("10");
      setNewDesc("");
    } catch (err) {
      setSaveMsg({ type: "error", text: `Gagal menambahkan: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [newKategori, newMargin, newDesc]);

  if (userRole !== "admin" && userRole !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FiAlertCircle className="text-red-400 mb-3" size={48} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm">
          Hanya role <span className="font-semibold">admin</span> atau{" "}
          <span className="font-semibold">owner</span> yang dapat mengakses halaman ini.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="animate-spin text-orange-500" size={32} />
        <span className="ml-3 text-slate-600 font-medium">Memuat pengaturan margin...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Margin per Kategori</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola margin keuntungan default untuk setiap kategori produk
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Cara Kerja Dynamic Pricing</p>
          <p>
            Ketika harga beli suatu produk naik, AI akan menggunakan margin kategori ini sebagai
            batas minimum untuk menghitung harga jual rekomendasi. Jika kategori produk tidak ada di
            tabel ini, sistem menggunakan margin <span className="font-semibold">default (10%)</span>.
          </p>
        </div>
      </div>

      {saveMsg && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
            saveMsg.type === "success"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {saveMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
          {saveMsg.text}
        </div>
      )}

      {/* Add Button */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 shadow-sm transition-all"
        >
          <FiPlus size={16} />
          Tambah Kategori
        </button>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white rounded-xl p-5 border-2 border-dashed border-orange-300 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-3">Tambah Kategori Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nama Kategori</label>
              <input
                type="text"
                value={newKategori}
                onChange={(e) => setNewKategori(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="Cth: Body Part"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Margin (%)</label>
              <input
                type="number"
                value={newMargin}
                onChange={(e) => setNewMargin(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Deskripsi</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                placeholder="(opsional)"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !newKategori.trim()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {/* Margins Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Kategori</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Margin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Deskripsi</th>
              <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {margins.map((row) => (
              <tr
                key={row.kategori}
                className="border-b last:border-b-0 hover:bg-slate-50 transition-colors"
              >
                <td className="px-5 py-3">
                  {editRow === row.kategori ? (
                    <input
                      type="text"
                      value={editRow === "__new__" ? newKategori : row.kategori}
                      onChange={(e) => {
                        /* category name is not editable for existing */
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded text-sm"
                      disabled
                    />
                  ) : (
                    <span className="font-semibold text-slate-800">{row.kategori}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  {editRow === row.kategori ? (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-20 p-1.5 border border-slate-300 rounded text-sm text-center"
                      min="0"
                      max="100"
                    />
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">
                      {row.margin_pct}%
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editRow === row.kategori ? (
                    <input
                      type="text"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm text-slate-500">{row.description || "-"}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      row.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {row.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {editRow === row.kategori ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => setEditRow(null)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded"
                      >
                        <FiX size={14} />
                      </button>
                      <button
                        onClick={() => handleSave(row.kategori, editValue, editDesc)}
                        disabled={saving}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded"
                      >
                        <FiSave size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => {
                          setEditRow(row.kategori);
                          setEditValue(String(row.margin_pct));
                          setEditDesc(row.description || "");
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit"
                      >
                        <FiEdit3 size={14} />
                      </button>
                      {row.kategori !== "default" && (
                        <button
                          onClick={() => handleDelete(row.kategori)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded"
                          title="Hapus"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400 mt-2">
        * Margin default (10%) digunakan sebagai fallback jika kategori produk tidak ada di tabel ini.
      </p>
    </div>
  );
}
