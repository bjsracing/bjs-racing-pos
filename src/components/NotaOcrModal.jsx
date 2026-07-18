import { useState, useRef, useEffect } from "react";
import {
  FiX,
  FiCamera,
  FiLoader,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiImage,
} from "react-icons/fi";
import { supabase } from "../supabaseClient.js";
import { useNotaOcr } from "../hooks/useNotaOcr.js";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function ConfidenceBadge({ confidence }) {
  if (confidence >= 80) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <FiCheckCircle size={12} /> {confidence}%
      </span>
    );
  }
  if (confidence >= 60) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <FiAlertCircle size={12} /> {confidence}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
      <FiAlertCircle size={12} /> {confidence}%
    </span>
  );
}

function ItemCard({ item, allProducts, onUpdate, onRemove, onOverrideProduct, supplierName }) {
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchSeqRef = useRef(0);
  const debouncedSearch = useDebounce(productSearch, 300);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    setSearching(true);

    const doSearch = async () => {
      if (supplierName) {
        const { data, error } = await supabase
          .rpc("search_products", { search_term: debouncedSearch });
        if (seq !== searchSeqRef.current) return;
        if (!error && data && data.length > 0) {
          const matched = data.filter(
            (p) => p.supplier?.toLowerCase() === supplierName.toLowerCase()
          );
          if (matched.length > 0) {
            setSearchResults(matched.slice(0, 15));
            setSearching(false);
            return;
          }
        }
      }
      const { data, error } = await supabase
        .rpc("search_products", { search_term: debouncedSearch });
      if (seq !== searchSeqRef.current) return;
      if (error) {
        console.error("Ganti search error:", error);
        setSearchResults([]);
      } else {
        setSearchResults((data || []).slice(0, 15));
      }
      setSearching(false);
    };
    doSearch();
  }, [debouncedSearch, supplierName]);

  const handleProductSearch = (term) => {
    setProductSearch(term);
  };

  const statusColor =
    item.confidence >= 80
      ? "border-l-emerald-400"
      : item.confidence >= 60
        ? "border-l-amber-400"
        : "border-l-rose-400";

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-3 border-l-4 ${statusColor}`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">
            {item.ocr_nama}
          </p>
          {item.product_nama ? (
            <p className="text-xs text-slate-500 mt-0.5">
              → {item.product_nama}
              <ConfidenceBadge confidence={item.confidence} />
              {item.product_supplier && (
                <span className="text-slate-400 ml-1 text-[10px]">({item.product_supplier})</span>
              )}
            </p>
          ) : (
            <p className="text-xs text-rose-500 mt-0.5 font-semibold">
              Belum dicocokkan
              <ConfidenceBadge confidence={item.confidence} />
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProductPicker(!showProductPicker)}
            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
            title="Ganti Produk"
          >
            Ganti
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded"
            title="Hapus Item"
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">Qty</label>
          <input
            type="number"
            min="1"
            value={item.kuantitas}
            onChange={(e) =>
              onUpdate(item.id, {
                kuantitas: Math.max(1, parseFloat(e.target.value) || 1),
              })
            }
            className="w-full p-1.5 border border-slate-300 rounded text-sm text-center"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-0.5">
            Harga Beli
          </label>
          <input
            type="number"
            min="0"
            value={item.harga_beli}
            onChange={(e) =>
              onUpdate(item.id, {
                harga_beli: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className="w-full p-1.5 border border-slate-300 rounded text-sm text-right"
          />
        </div>
      </div>

      {showProductPicker && (
        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
          <div className="relative">
            <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, merek..."
              value={productSearch}
              onChange={(e) => handleProductSearch(e.target.value)}
              className="w-full p-1.5 pl-7 border border-slate-300 rounded text-sm"
              autoFocus
            />
            {searching && (
              <FiLoader className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={14} />
            )}
          </div>
          {searchResults.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded bg-white">
              {searchResults.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => {
                      onOverrideProduct(item.id, p);
                      setShowProductPicker(false);
                      setProductSearch("");
                      setSearchResults([]);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-700 block truncate">{p.nama}</span>
                      <span className="text-slate-400 text-[10px]">{p.kode || "N/A"} {p.merek ? `• ${p.merek}` : ""}</span>
                      {p.supplier && (
                        <span className={`block text-[10px] mt-0.5 ${supplierName && p.supplier?.toLowerCase() === supplierName.toLowerCase() ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
                          {p.supplier}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.ukuran && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">{p.ukuran}</span>
                      )}
                      {p.stok > 0 ? (
                        <span className="text-[10px] text-emerald-600">stok:{p.stok}</span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-semibold">habis</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!searching && productSearch.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-slate-400 mt-1 text-center">
              Produk tidak ditemukan
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function NotaOcrModal({
  isOpen,
  onClose,
  onConfirm,
  allProducts,
  existingItems,
  selectedSupplierId,
  selectedSupplierName,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [items, setItems] = useState([]);
  const [manualName, setManualName] = useState("");
  const [showManualAdd, setShowManualAdd] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const {
    isProcessing,
    extractedItems,
    error,
    progress,
    processImage,
    reset: resetOcr,
  } = useNotaOcr();

  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setItems([]);
      setManualName("");
      setShowManualAdd(false);
      resetOcr();
    }
  }, [isOpen, resetOcr]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (extractedItems.length > 0) {
      setItems(extractedItems);
    }
  }, [extractedItems]);

  if (!isOpen) return null;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setItems([]);
    await processImage(file, allProducts, selectedSupplierName);
  };

  const handleUpdateItem = (id, updates) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOverrideProduct = (id, product) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              product_id: product.id,
              product_nama: product.nama,
              product_supplier: product.supplier || "",
              confidence: 100,
            }
          : item,
      ),
    );
  };

  const handleAddManualItem = () => {
    if (!manualName.trim()) return;
    const newItem = {
      id: `manual-${Date.now()}`,
      ocr_nama: manualName.trim(),
      product_id: null,
      product_nama: null,
      confidence: 0,
      kuantitas: 1,
      harga_beli: 0,
      source: "manual",
    };
    setItems((prev) => [...prev, newItem]);
    setManualName("");
    setShowManualAdd(false);
  };

  const handleConfirm = () => {
    const hasUnmatched = items.filter(
      (item) => !item.product_id,
    );
    if (hasUnmatched.length > 0) {
      alert(
        `${hasUnmatched.length} item belum dipilih produk database. Silakan gunakan tombol "Ganti" untuk memilih produk atau hapus item tersebut.`,
      );
      return;
    }
    onConfirm(items);
  };

  const matchedCount = items.filter((i) => i.confidence >= 80).length;
  const unsureCount = items.filter(
    (i) => i.confidence >= 60 && i.confidence < 80,
  ).length;
  const unmatchedCount = items.filter(
    (i) => i.source === "ocr" && (i.confidence < 60 || !i.product_id),
  ).length;
  const existingCount = existingItems?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <FiCamera size={20} />
            <div>
              <h2 className="text-lg font-bold">Import Nota Supplier</h2>
              <p className="text-xs text-blue-100">
                OCR + Matching Otomatis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 p-1"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload Area */}
          {!previewUrl && (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FiImage className="mx-auto text-slate-400 mb-3" size={40} />
              <p className="text-sm text-slate-600 mb-3">
                Upload foto nota pembelian supplier
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600"
                >
                  <FiImage size={16} /> Pilih Gambar
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg text-sm font-semibold hover:bg-slate-600"
                >
                  <FiCamera size={16} /> Kamera
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Preview + Processing */}
          {previewUrl && (
            <div className="flex gap-4">
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={previewUrl}
                  alt="Nota"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-slate-400 mb-2">
                  {((selectedFile?.size || 0) / 1024).toFixed(0)} KB
                </p>
                {isProcessing ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <FiLoader className="animate-spin" size={16} />
                    <span>{progress || "Memproses..."}</span>
                  </div>
                ) : items.length > 0 ? (
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setItems([]);
                      resetOcr();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Ganti Gambar
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <FiAlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Supplier Context Banner */}
          {selectedSupplierName && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 flex items-center gap-2">
              <FiCheckCircle size={14} className="flex-shrink-0 text-blue-500" />
              <span>Supplier: <strong>{selectedSupplierName}</strong> — pencarian diprioritaskan ke supplier ini</span>
            </div>
          )}

          {/* Results */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">
                  Hasil OCR ({items.length} item)
                </h3>
                <div className="flex gap-2 text-xs">
                  {matchedCount > 0 && (
                    <span className="text-emerald-600">
                      ✓ {matchedCount} cocok
                    </span>
                  )}
                  {unsureCount > 0 && (
                    <span className="text-amber-600">
                      ⚠ {unsureCount} ragu
                    </span>
                  )}
                  {unmatchedCount > 0 && (
                    <span className="text-rose-600">
                      ✗ {unmatchedCount} belum cocok
                    </span>
                  )}
                </div>
              </div>

              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  allProducts={allProducts}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  onOverrideProduct={handleOverrideProduct}
                  supplierName={selectedSupplierName}
                />
              ))}

              {/* Add Manual Item */}
              {showManualAdd ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama produk manual..."
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                    autoFocus
                  />
                  <button
                    onClick={handleAddManualItem}
                    disabled={!manualName.trim()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:bg-slate-300"
                  >
                    Tambah
                  </button>
                  <button
                    onClick={() => {
                      setShowManualAdd(false);
                      setManualName("");
                    }}
                    className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-300"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowManualAdd(true)}
                  className="w-full flex items-center justify-center gap-2 p-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <FiPlus size={14} /> Tambah Item Manual
                </button>
              )}

              {/* Summary */}
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="text-slate-600">
                  <span className="font-semibold">Ringkasan:</span> PO{" "}
                  {existingCount} item → Final {items.length} item
                  {items.length > existingCount && (
                    <span className="text-emerald-600 font-semibold">
                      {" "}
                      (+{items.length - existingCount} baru)
                    </span>
                  )}
                  {items.length < existingCount && (
                    <span className="text-amber-600 font-semibold">
                      {" "}
                      ({items.length - existingCount} dikurangi)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-slate-50 rounded-b-lg flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={items.length === 0 || isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-sm"
          >
            <FiCheckCircle size={16} />
            Terapkan ke Pesanan ({items.length} item)
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotaOcrModal;
