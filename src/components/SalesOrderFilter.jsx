// src/components/SalesOrderFilter.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

// Helper Hook untuk debounce
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const SalesOrderFilter = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        searchTerm: "",
        status: "semua",
        mitra: "semua",
        startDate: "",
        endDate: "",
    });
    const [mitraOptions, setMitraOptions] = useState([]);
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    useEffect(() => {
        const fetchMitra = async () => {
            const { data } = await supabase
                .from("customers")
                .select("id, nama_pelanggan")
                .eq("tipe_pelanggan", "Grosir")
                .order("nama_pelanggan");
            setMitraOptions(data || []);
        };
        fetchMitra();
    }, []);

    useEffect(() => {
        // Kirim perubahan filter ke parent component
        onFilterChange({ ...filters, searchTerm: debouncedSearchTerm });
    }, [
        debouncedSearchTerm,
        filters.status,
        filters.mitra,
        filters.startDate,
        filters.endDate,
        onFilterChange,
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        const initialFilters = {
            searchTerm: "",
            status: "semua",
            mitra: "semua",
            startDate: "",
            endDate: "",
        };
        setFilters(initialFilters);
        onFilterChange(initialFilters);
    };

    return (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Bar */}
                <div className="lg:col-span-2">
                    <label
                        htmlFor="searchTerm"
                        className="text-sm font-medium text-slate-600"
                    >
                        Cari No. Pesanan / Nota / Mitra
                    </label>
                    <div className="relative mt-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            id="searchTerm"
                            name="searchTerm"
                            value={filters.searchTerm}
                            onChange={handleInputChange}
                            className="w-full p-2 pl-10 border rounded-lg"
                            placeholder="Ketik untuk mencari..."
                        />
                    </div>
                </div>
                {/* Filter Status */}
                <div>
                    <label
                        htmlFor="status"
                        className="text-sm font-medium text-slate-600"
                    >
                        Status
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                        <option value="semua">Semua Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Dikonfirmasi">Dikonfirmasi</option>
                        <option value="Menunggu Pembayaran">
                            Menunggu Pembayaran
                        </option>
                        <option value="Selesai">Selesai</option>
                        <option value="Batal">Batal</option>
                    </select>
                </div>
                {/* Filter Mitra */}
                <div>
                    <label
                        htmlFor="mitra"
                        className="text-sm font-medium text-slate-600"
                    >
                        Mitra
                    </label>
                    <select
                        id="mitra"
                        name="mitra"
                        value={filters.mitra}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                        <option value="semua">Semua Mitra</option>
                        {mitraOptions.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.nama_pelanggan}
                            </option>
                        ))}
                    </select>
                </div>
                {/* Filter Tanggal */}
                <div>
                    <label className="text-sm font-medium text-slate-600">
                        Dari Tanggal
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">
                        Sampai Tanggal
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg"
                    />
                </div>
                {/* Tombol Reset */}
                <div className="flex items-end">
                    <button
                        onClick={resetFilters}
                        className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg"
                    >
                        <FiRefreshCw size={16} /> Reset Filter
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesOrderFilter;
