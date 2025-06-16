import { useState, useEffect } from "react";

function ProductModal({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  supplierOptions,
}) {
  const initialProductState = {
    kode: "",
    nama: "",
    merek: "",
    kategori: "",
    supplier_id: null,
    harga_beli: "",
    harga_jual: "",
    stok: "",
    stok_min: "",
    catatan: "",
    status: "Aktif",
  };

  const [product, setProduct] = useState(initialProductState);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setProduct({ ...initialProductState, ...productToEdit });
      } else {
        setProduct(initialProductState);
      }
    }
  }, [productToEdit, isOpen]);

  // --- PERUBAHAN DI SINI: handleChange sekarang lebih pintar ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    // Jika field ini adalah field harga, hapus format non-angka
    if (
      id === "harga_beli" ||
      id === "harga_jual" ||
      id === "stok" ||
      id === "stok_min"
    ) {
      const rawValue = value.replace(/[^0-9]/g, "");
      setProduct((prev) => ({ ...prev, [id]: rawValue }));
    } else {
      setProduct((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalProduct = {
      ...product,
      harga_beli: Number(product.harga_beli) || 0,
      harga_jual: Number(product.harga_jual) || 0,
      stok: Number(product.stok) || 0,
      stok_min: Number(product.stok_min) || 0,
      supplier_id: product.supplier_id === "" ? null : product.supplier_id,
    };
    onSave(finalProduct);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
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
                value={product.merek || ""}
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
                value={product.kategori || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="supplier_id"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Supplier
              </label>
              <select
                id="supplier_id"
                value={product.supplier_id || ""}
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

            {/* --- PERUBAHAN DI INPUT HARGA --- */}
            <div>
              <label
                htmlFor="harga_beli"
                className="block mb-1 text-sm font-medium text-slate-700"
              >
                Harga Beli
              </label>
              <input
                id="harga_beli"
                type="text"
                value={
                  product.harga_beli
                    ? new Intl.NumberFormat("id-ID").format(product.harga_beli)
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
                Harga Jual
              </label>
              <input
                id="harga_jual"
                type="text"
                value={
                  product.harga_jual
                    ? new Intl.NumberFormat("id-ID").format(product.harga_jual)
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
                Stok
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
                value={product.catatan || ""}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-2 px-4 rounded"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded"
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
