// src/pages/PermintaanPelanggan.jsx (Versi Final dengan semua fitur)
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiPlusCircle,
  FiEdit,
  FiTrash2,
  FiArrowRight,
  FiFilter,
  FiMessageCircle,
} from "react-icons/fi";
import ProductModal from "../components/ProductModal.jsx";
import WhatsAppDraftModal from "../components/WhatsAppDraftModal.jsx";

const PermintaanPelanggan = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "semua",
    kategori: "semua",
  });
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState(new Set());

  // State untuk Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [supplierOptions, setSupplierOptions] = useState([]);
  const [productSaveError, setProductSaveError] = useState("");

  // State untuk WhatsApp Draft Modal
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("permintaan_pelanggan")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.status !== "semua") {
        query = query.eq("status", filters.status);
      }
      if (filters.kategori !== "semua") {
        query = query.eq("kategori", filters.kategori);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);

      // Ambil opsi filter kategori dari data yang ada
      const { data: categories } = await supabase.rpc(
        "get_unique_request_categories",
      );
      setKategoriOptions(categories.map((c) => c.kategori));
    } catch (error) {
      alert("Gagal memuat data permintaan: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch supplier options saat modal akan dibuka
  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from("suppliers")
        .select("id, nama_supplier");
      setSupplierOptions(data || []);
    };
    if (isProductModalOpen) {
      fetchSuppliers();
    }
  }, [isProductModalOpen]);

  const handleOpenAddProductModal = (request) => {
    setModalData({
      isEdit: false,
      product: {
        // Data awal untuk pre-fill
        nama: request.nama_produk_diminta,
        kategori: request.kategori,
        catatan: request.catatan,
      },
      request_id: request.id,
    });
    setProductSaveError("");
    setIsProductModalOpen(true);
  };

  const handleOpenEditProductModal = async (request) => {
    if (!request.product_id) return;
    const { data: productToEdit, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", request.product_id)
      .single();
    if (error) {
      alert("Gagal memuat data produk untuk diedit.");
      return;
    }
    setModalData({
      isEdit: true,
      product: productToEdit,
      request_id: request.id,
    });
    setProductSaveError("");
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (productData) => {
    try {
      setProductSaveError("");
      const { id, ...dataToSave } = productData;

      const { data: newProduct, error: saveError } = await supabase
        .from("products")
        .insert(dataToSave)
        .select()
        .single();
      if (saveError) throw saveError;

      // Update status permintaan dan tautkan product_id
      const { error: updateReqError } = await supabase
        .from("permintaan_pelanggan")
        .update({
          status: "Produk Sudah Ditambahkan",
          product_id: newProduct.id,
        })
        .eq("id", modalData.request_id);
      if (updateReqError) throw updateReqError;

      alert(`Produk "${dataToSave.nama}" berhasil ditambahkan!`);
      setIsProductModalOpen(false);
      fetchData(); // Refresh data di halaman
    } catch (error) {
      setProductSaveError(error.message);
      console.error("Gagal menyimpan produk:", error);
    }
  };

  const handleDeleteRequest = async (requestId, productName) => {
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus permintaan untuk "${productName}"?`,
      )
    ) {
      const { error } = await supabase
        .from("permintaan_pelanggan")
        .delete()
        .eq("id", requestId);
      if (error) {
        alert("Gagal menghapus permintaan: " + error.message);
      } else {
        alert("Permintaan berhasil dihapus.");
        fetchData();
      }
    }
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status) => {
    if (status === "Baru") return "bg-blue-100 text-blue-800";
    if (status === "Produk Sudah Ditambahkan")
      return "bg-purple-100 text-purple-800";
    if (status === "Sudah Dipesan") return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={modalData?.isEdit ? () => {} : handleSaveProduct} // Untuk sementara onSave hanya untuk add
        productToEdit={modalData?.product}
        supplierOptions={supplierOptions}
        saveError={productSaveError}
        setSaveError={setProductSaveError}
      />
      <WhatsAppDraftModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => {
          setIsWhatsAppModalOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Manajemen Permintaan Pelanggan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lacak, kelola, dan tindak lanjuti produk yang dicari pelanggan.
          </p>
        </div>
        <Link
          to="/pembelian/baru"
          state={{ selectedRequests: Array.from(selectedRequests) }}
          className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-lg shadow-md ${selectedRequests.size > 0 ? "bg-orange-500 hover:bg-orange-600" : "bg-slate-400 cursor-not-allowed"}`}
          onClick={(e) => selectedRequests.size === 0 && e.preventDefault()}
        >
          <span>Buat Pesanan ({selectedRequests.size})</span>
          <FiArrowRight />
        </Link>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label
              htmlFor="statusFilter"
              className="text-sm font-medium text-slate-600"
            >
              Filter Status
            </label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full p-2 mt-1 border rounded-lg bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="Baru">Baru</option>
              <option value="Produk Sudah Ditambahkan">
                Produk Sudah Ditambahkan
              </option>
              <option value="Sudah Dipesan">Sudah Dipesan</option>
            </select>
          </div>
          <div className="flex-1">
            <label
              htmlFor="kategoriFilter"
              className="text-sm font-medium text-slate-600"
            >
              Filter Kategori
            </label>
            <select
              id="kategoriFilter"
              value={filters.kategori}
              onChange={(e) =>
                setFilters((f) => ({ ...f, kategori: e.target.value }))
              }
              className="w-full p-2 mt-1 border rounded-lg bg-white"
            >
              <option value="semua">Semua Kategori</option>
              {kategoriOptions.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10">Memuat data...</p>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            ...
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-slate-50 p-4 rounded-lg border flex gap-4"
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(req.id)}
                    onChange={() => handleSelectRequest(req.id)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-slate-800">
                    {req.nama_produk_diminta}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {req.kategori ? (
                      <span className="font-semibold">{req.kategori}</span>
                    ) : (
                      ""
                    )}{" "}
                    {req.kategori && req.catatan ? "·" : ""}{" "}
                    <span className="italic">
                      "{req.catatan || "Tidak ada catatan"}"
                    </span>
                  </p>
                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(req.status)}`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-end items-center gap-2 flex-shrink-0">
                  {req.status === "Baru" && (
                    <button
                      onClick={() => handleOpenAddProductModal(req)}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center px-3 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 text-sm"
                    >
                      <FiPlusCircle size={16} />
                      <span>Jadikan Produk</span>
                    </button>
                  )}
                  {req.status === "Produk Sudah Ditambahkan" && (
                    <button
                      onClick={() => handleOpenEditProductModal(req)}
                      className="flex items-center gap-2 w-full sm:w-auto justify-center px-3 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600 text-sm"
                    >
                      <FiEdit size={16} />
                      <span>Edit Produk</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedRequest({ ...req });
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="flex items-center gap-2 w-full sm:w-auto justify-center px-3 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 text-sm"
                  >
                    <FiMessageCircle size={16} />
                    <span>Hubungi via WA</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteRequest(req.id, req.nama_produk_diminta)
                    }
                    className="flex items-center gap-2 w-full sm:w-auto justify-center px-3 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 text-sm"
                  >
                    <FiTrash2 size={16} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PermintaanPelanggan;
