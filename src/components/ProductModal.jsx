import { useState, useEffect } from "react";

function ProductModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  supplierOptions,
  saveError,
  setSaveError,
  allProducts, // <-- TAMBAHKAN INIINI
}) {
  const initialProductState = {
    kode: "",
    nama: "",
    merek: "",
    kategori: "",
    supplier_id: "",
    harga_beli: "",
    harga_jual: "",
    stok: "",
    stok_min: "",
    catatan: "",
    status: "Aktif",
    satuan_dasar: "",
    satuan_pembelian: "",
    nilai_konversi: "",
  };

  const [product, setProduct] = useState(initialProductState);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        const cleanState = {};
        for (const key in initialProductState) {
          const value = productToEdit[key];
          cleanState[key] =
            value !== null && value !== undefined ? String(value) : "";
        }
        cleanState.id = productToEdit.id;
        setProduct(cleanState);
      } else {
        setProduct(initialProductState);
      }
    }
  }, [productToEdit, isOpen]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (saveError) setSaveError("");
    const numericFields = [
      "harga_beli",
      "harga_jual",
      "stok",
      "stok_min",
      "nilai_konversi",
    ];
    if (numericFields.includes(id)) {
      const rawValue = value.replace(/[^0-9]/g, "");
      setProduct((prev) => ({ ...prev, [id]: rawValue }));
    } else {
      setProduct((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // --- LOGIKA VALIDASI KODE PRODUK DUPLIKAT ---
    const isCodeDuplicate = allProducts.some((p) => {
      // Jika mode Tambah Baru, cek apakah kode sudah ada.
      if (!productToEdit) {
        return p.kode.toLowerCase() === product.kode.toLowerCase();
      }
      // Jika mode Edit, cek apakah kode diubah menjadi kode yang sudah ada di produk LAIN.
      if (productToEdit && p.id !== productToEdit.id) {
        return p.kode.toLowerCase() === product.kode.toLowerCase();
      }
      return false;
    });

    if (isCodeDuplicate) {
      setSaveError(
        `Kode produk "${product.kode}" sudah digunakan. Silakan gunakan kode lain.`
      );
      return; // Hentikan proses simpan jika duplikat
    }
    // --- AKHIR VALIDASI ---

    const finalProduct = {
      ...product,
      harga_beli: Number(product.harga_beli) || 0,
      harga_jual: Number(product.harga_jual) || 0,
      stok: Number(product.stok) || 0,
      stok_min: Number(product.stok_min) || 0,
      supplier_id: product.supplier_id === "" ? null : product.supplier_id,
      satuan_dasar: product.satuan_dasar || "Pcs",
      nilai_konversi: Number(product.nilai_konversi) || 1,
    };

    onSave(finalProduct); // Lanjutkan simpan jika semua validasi lolos
  };

  const handleClose = () => {
    if (saveError) setSaveError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {productToEdit ? "Edit Produk" : "Tambah Produk Baru"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="kode"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Kode Produk
              </label>
              <input
                id="kode"
                type="text"
                value={product.kode}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                htmlFor="nama"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Nama Produk
              </label>
              <input
                id="nama"
                type="text"
                value={product.nama}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label
                htmlFor="merek"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Merek
              </label>
              <input
                id="merek"
                type="text"
                value={product.merek}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                htmlFor="kategori"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Kategori
              </label>
              <input
                id="kategori"
                type="text"
                value={product.kategori}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-semibold mb-2 text-slate-800">
              📦 Pengaturan Satuan & Konversi
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Isi bagian ini jika produk dibeli dalam satuan besar (grosir) dan
              dijual eceran.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="satuan_dasar"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Satuan Dasar (Ecer)
                </label>
                <input
                  id="satuan_dasar"
                  type="text"
                  value={product.satuan_dasar}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Cth: Pcs, Biji, Botol"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="satuan_pembelian"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Satuan Pembelian (Grosir)
                </label>
                <input
                  id="satuan_pembelian"
                  type="text"
                  value={product.satuan_pembelian}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Cth: Dus, Pack, Box"
                />
              </div>
              <div>
                <label
                  htmlFor="nilai_konversi"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Isi per Grosir
                </label>
                <input
                  id="nilai_konversi"
                  type="text"
                  inputMode="numeric"
                  value={
                    product.nilai_konversi
                      ? new Intl.NumberFormat("id-ID").format(
                          product.nilai_konversi
                        )
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Cth: 12"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  htmlFor="supplier_id"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Supplier
                </label>
                <select
                  id="supplier_id"
                  value={product.supplier_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {supplierOptions &&
                    supplierOptions.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.nama_supplier}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="harga_beli"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Harga Beli (per Satuan Dasar)
                </label>
                <input
                  id="harga_beli"
                  type="text"
                  value={
                    product.harga_beli
                      ? new Intl.NumberFormat("id-ID").format(
                          product.harga_beli
                        )
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="harga_jual"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Harga Jual (per Satuan Dasar)
                </label>
                <input
                  id="harga_jual"
                  type="text"
                  value={
                    product.harga_jual
                      ? new Intl.NumberFormat("id-ID").format(
                          product.harga_jual
                        )
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="stok"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Stok (dalam Satuan Dasar)
                </label>
                <input
                  id="stok"
                  type="number"
                  value={product.stok}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="stok_min"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Stok Minimal
                </label>
                <input
                  id="stok_min"
                  type="number"
                  value={product.stok_min}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="status"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={product.status}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="catatan"
                  className="block mb-1 text-sm font-medium text-slate-700"
                >
                  Catatan
                </label>
                <textarea
                  id="catatan"
                  value={product.catatan}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>
            </div>
          </div>
          {saveError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
              <strong>Gagal Menyimpan:</strong> {saveError}
            </div>
          )}
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
            >
              {productToEdit ? "Simpan Perubahan" : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default ProductModal;
