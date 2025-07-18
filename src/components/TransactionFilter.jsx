// src/components/TransactionFilter.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const TransactionFilter = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        searchTerm: "",
        status: "semua",
        customer: "semua",
        startDate: "",
        endDate: "",
    });
    const [customerOptions, setCustomerOptions] = useState([]);
    const debouncedSearchTerm = useDebounce(filters.searchTerm, 500);

    useEffect(() => {
        const fetchCustomers = async () => {
            const { data } = await supabase
                .from("customers")
                .select("id, nama_pelanggan")
                .order("nama_pelanggan");
            setCustomerOptions(data || []);
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        onFilterChange({ ...filters, searchTerm: debouncedSearchTerm });
    }, [
        debouncedSearchTerm,
        filters.status,
        filters.customer,
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
            customer: "semua",
            startDate: "",
            endDate: "",
        };
        setFilters(initialFilters);
        onFilterChange(initialFilters);
    };

    return (
        <div className="mb-6 bg-white p-4 rounded-xl shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-3">
                    <label
                        htmlFor="searchTerm"
                        className="text-sm font-medium text-slate-600"
                    >
                        Cari ID Transaksi / Nama Pelanggan
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
                <div>
                    <label
                        htmlFor="status"
                        className="text-sm font-medium text-slate-600"
                    >
                        Status Bayar
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={filters.status}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                        <option value="semua">Semua Status</option>
                        <option value="Lunas">Lunas</option>
                        <option value="Belum Lunas">Belum Lunas</option>
                    </select>
                </div>
                <div>
                    <label
                        htmlFor="customer"
                        className="text-sm font-medium text-slate-600"
                    >
                        Pelanggan
                    </label>
                    <select
                        id="customer"
                        name="customer"
                        value={filters.customer}
                        onChange={handleInputChange}
                        className="w-full mt-1 p-2 border rounded-lg bg-white"
                    >
                        <option value="semua">Semua Pelanggan</option>
                        {customerOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nama_pelanggan}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <button
                        onClick={resetFilters}
                        className="w-full h-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg"
                    >
                        <FiRefreshCw size={16} /> Reset
                    </button>
                </div>
            </div>
        </div>
    );
};
export default TransactionFilter;
