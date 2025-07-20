// src/pages/LaporanLabaRugi.jsx

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { FaCalendarAlt } from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
    startOfMonth,
    endOfMonth,
    format,
    startOfDay,
    endOfDay,
} from "date-fns";
import { id } from "date-fns/locale";

registerLocale("id", id);

// Komponen Kartu untuk menampilkan hasil
const ReportCard = ({ title, value, colorClass, note }) => (
    <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
            }).format(value)}
        </p>
        {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
);

const LaporanLabaRugi = () => {
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [dateRange, setDateRange] = useState([
        startOfMonth(new Date()),
        endOfMonth(new Date()),
    ]);

    const fetchReport = useCallback(async (startDate, endDate) => {
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc(
                "calculate_profit_loss",
                {
                    start_date: startOfDay(startDate).toISOString(),
                    end_date: endOfDay(endDate).toISOString(),
                },
            );
            if (error) throw error;
            if (data && data.length > 0) {
                setReportData(data[0]);
            }
        } catch (err) {
            console.error("Gagal mengambil laporan Laba/Rugi:", err);
            alert("Gagal mengambil data laporan.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReport(dateRange[0], dateRange[1]);
    }, [dateRange, fetchReport]);

    return (
        <div className="p-4 sm:p-6">
            <h1 className="text-3xl font-bold mb-6">Laporan Laba / Rugi</h1>

            {/* Filter Tanggal */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm max-w-md">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Rentang Tanggal
                </label>
                <DatePicker
                    selected={dateRange[0]}
                    // --- PERBAIKAN DI SINI ---
                    onChange={(update) => setDateRange(update)}
                    // --- AKHIR PERBAIKAN ---
                    startDate={dateRange[0]}
                    endDate={dateRange[1]}
                    selectsRange
                    locale="id"
                    dateFormat="d MMMM yyyy"
                    customInput={
                        <button className="w-full px-4 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 bg-slate-200 text-slate-700">
                            <FaCalendarAlt />
                            <span>{`${format(dateRange[0], "d MMM yy", { locale: id })} - ${format(dateRange[1], "d MMM yy", { locale: id })}`}</span>
                        </button>
                    }
                />
            </div>

            {loading ? (
                <p>Menghitung laporan...</p>
            ) : reportData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Baris 1: Pendapatan & Biaya */}
                    <ReportCard
                        title="Total Pendapatan"
                        value={reportData.total_pendapatan}
                        colorClass="text-blue-600"
                        note="Total penjualan kotor"
                    />
                    <ReportCard
                        title="Total HPP"
                        value={reportData.total_hpp}
                        colorClass="text-orange-600"
                        note="Modal dari barang yang terjual"
                    />
                    <ReportCard
                        title="Laba Kotor"
                        value={reportData.laba_kotor}
                        colorClass="text-teal-600"
                        note="Pendapatan - HPP"
                    />

                    {/* Baris 2: Pengeluaran & Hasil Akhir */}
                    <ReportCard
                        title="Total Pengeluaran"
                        value={reportData.total_pengeluaran}
                        colorClass="text-red-500"
                        note="Biaya operasional"
                    />
                    <div className="lg:col-start-2">
                        <ReportCard
                            title="LABA BERSIH"
                            value={reportData.laba_bersih}
                            colorClass={
                                reportData.laba_bersih >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            }
                            note="Laba Kotor - Pengeluaran"
                        />
                    </div>
                </div>
            ) : (
                <p>Tidak ada data untuk rentang tanggal yang dipilih.</p>
            )}
        </div>
    );
};

export default LaporanLabaRugi;
