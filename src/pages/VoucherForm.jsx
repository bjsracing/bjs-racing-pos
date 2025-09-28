// File: src/pages/VoucherForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Sesuaikan path
import { FiArrowLeft, FiSave, FiTrash2 } from "react-icons/fi";

const VoucherForm = () => {
    const { voucherId } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(voucherId);

    const [formData, setFormData] = useState({
        code: "",
        description: "",
        type: "fixed_amount",
        discount_value: 0,
        max_discount: null,
        min_purchase: 0,
        valid_until: "",
        usage_limit: null,
        is_public: true,
        is_active: true,
    });
    const [loading, setLoading] = useState(isEditMode);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isEditMode) {
            const fetchVoucher = async () => {
                const { data, error } = await supabase
                    .from("vouchers")
                    .select("*")
                    .eq("id", voucherId)
                    .single();

                if (error) {
                    alert("Gagal memuat data voucher.");
                    console.error(error);
                } else if (data) {
                    // Format tanggal untuk input datetime-local
                    const validUntilDate = new Date(data.valid_until);
                    const formattedDate = validUntilDate
                        .toISOString()
                        .slice(0, 16);
                    setFormData({ ...data, valid_until: formattedDate });
                }
                setLoading(false);
            };
            fetchVoucher();
        }
    }, [voucherId, isEditMode]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const dataToSubmit = { ...formData };
            if (dataToSubmit.type !== "percentage") {
                dataToSubmit.max_discount = null;
            }

            if (isEditMode) {
                // Mode Edit: UPDATE data
                const { error } = await supabase
                    .from("vouchers")
                    .update(dataToSubmit)
                    .eq("id", voucherId);
                if (error) throw error;
                alert("Voucher berhasil diperbarui!");
            } else {
                // Mode Buat Baru: INSERT data
                const { error } = await supabase
                    .from("vouchers")
                    .insert(dataToSubmit);
                if (error) throw error;
                alert("Voucher baru berhasil dibuat!");
            }
            navigate("/manajemen-voucher");
        } catch (error) {
            alert("Terjadi kesalahan: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (
            window.confirm(
                "Apakah Anda yakin ingin menghapus voucher ini secara permanen?",
            )
        ) {
            try {
                const { error } = await supabase
                    .from("vouchers")
                    .delete()
                    .eq("id", voucherId);
                if (error) throw error;
                alert("Voucher berhasil dihapus.");
                navigate("/manajemen-voucher");
            } catch (error) {
                alert("Gagal menghapus voucher: " + error.message);
            }
        }
    };

    if (loading) return <p className="p-6 text-center">Memuat form...</p>;

    return (
        <div className="p-6">
            <Link
                to="/manajemen-voucher"
                className="text-blue-600 hover:underline flex items-center gap-2 mb-4 w-fit"
            >
                <FiArrowLeft />
                <span>Kembali ke Daftar Voucher</span>
            </Link>
            <h1 className="text-3xl font-bold mb-6">
                {isEditMode ? "Edit Voucher" : "Buat Voucher Baru"}
            </h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-lg shadow-md space-y-6 max-w-4xl mx-auto"
            >
                {/* ... Form inputs ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="code">Kode Voucher</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="type">Tipe Voucher</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded-md bg-white"
                        >
                            <option value="fixed_amount">
                                Potongan Tetap (Rp)
                            </option>
                            <option value="percentage">Persentase (%)</option>
                            <option value="free_shipping">Gratis Ongkir</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="discount_value">Nilai Diskon</label>
                        <input
                            type="number"
                            name="discount_value"
                            value={formData.discount_value}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 p-2 border rounded-md"
                        />
                    </div>
                    {formData.type === "percentage" && (
                        <div>
                            <label htmlFor="max_discount">
                                Maksimal Diskon (Rp)
                            </label>
                            <input
                                type="number"
                                name="max_discount"
                                value={formData.max_discount || ""}
                                onChange={handleChange}
                                className="w-full mt-1 p-2 border rounded-md"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="min_purchase">
                            Minimal Pembelian (Rp)
                        </label>
                        <input
                            type="number"
                            name="min_purchase"
                            value={formData.min_purchase}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="valid_until">Berlaku Hingga</label>
                        <input
                            type="datetime-local"
                            name="valid_until"
                            value={formData.valid_until}
                            onChange={handleChange}
                            required
                            className="w-full mt-1 p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="usage_limit">
                            Batas Penggunaan (kosongkan jika tak terbatas)
                        </label>
                        <input
                            type="number"
                            name="usage_limit"
                            value={formData.usage_limit || ""}
                            onChange={handleChange}
                            className="w-full mt-1 p-2 border rounded-md"
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="description">Deskripsi</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full mt-1 p-2 border rounded-md"
                    ></textarea>
                </div>
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_public"
                            checked={formData.is_public}
                            onChange={handleChange}
                        />{" "}
                        Tampilkan di halaman promo
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                        />{" "}
                        Aktifkan voucher
                    </label>
                </div>

                <div className="flex justify-between items-center pt-6 border-t">
                    <div>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 text-red-600 font-semibold hover:underline"
                            >
                                <FiTrash2 /> Hapus Voucher Ini
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        <FiSave />{" "}
                        {isSaving ? "Menyimpan..." : "Simpan Voucher"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VoucherForm;
