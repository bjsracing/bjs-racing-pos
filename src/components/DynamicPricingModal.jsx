import { useState } from "react";
import {
  FiX,
  FiCheck,
  FiXCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiInfo,
  FiEdit3,
} from "react-icons/fi";
import { formatRupiah } from "../lib/dynamicPricing.js";

function DynamicPricingModal({
  isOpen,
  onClose,
  priceChange,
  analysisResult,
  hetData,
  marginPct,
  isAnalyzing,
  onAccept,
  onReject,
  onReAnalyze,
}) {
  const [customPrice, setCustomPrice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen || !priceChange) return null;

  const { product, oldHargaBeli, newHargaBeli, pctIncrease } = priceChange;
  const recommendedPrice = analysisResult?.recommended_price || 0;
  const newMargin = analysisResult?.margin_pct || marginPct;
  const confidence = analysisResult?.confidence || "low";
  const reason = analysisResult?.reason || "";
  const het = hetData?.het || analysisResult?.het_reference;
  const currentHargaJual = product.harga_jual || 0;
  const currentMargin = currentHargaJual > 0
    ? ((currentHargaJual - oldHargaBeli) / currentHargaJual * 100).toFixed(1)
    : 0;

  const handleApply = async (price) => {
    setIsApplying(true);
    await onAccept(Number(price));
    setIsApplying(false);
  };

  const handleApplyCustom = () => {
    const parsed = Number(customPrice);
    if (parsed > 0) handleApply(parsed);
  };

  const confidenceColors = {
    high: "bg-emerald-100 text-emerald-700 border-emerald-300",
    medium: "bg-amber-100 text-amber-700 border-amber-300",
    low: "bg-red-100 text-red-700 border-red-300",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FiTrendingUp className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Dynamic Pricing</h3>
              <p className="text-xs text-slate-500">Rekomendasi harga jual AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Product Info */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">Produk</p>
            <p className="font-bold text-slate-800">{product.nama}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {product.kode} • {product.merek || "-"} • {product.kategori || "-"}
            </p>
          </div>

          {/* Price Change */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 rounded-xl p-3 border border-red-200">
              <p className="text-xs text-red-500 font-medium">Harga Beli</p>
              <p className="text-sm text-red-400 line-through">{formatRupiah(oldHargaBeli)}</p>
              <p className="text-lg font-bold text-red-700">{formatRupiah(newHargaBeli)}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-200 text-red-700">
                +{pctIncrease.toFixed(1)}%
              </span>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
              <p className="text-xs text-blue-500 font-medium">Margin Kategori</p>
              <p className="text-lg font-bold text-blue-700">{marginPct}%</p>
              <p className="text-xs text-blue-500 mt-1">Min. margin wajib</p>
            </div>
          </div>

          {/* HET Reference */}
          {het && (
            <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <FiInfo size={14} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-700">HET dari Google</span>
              </div>
              <p className="text-lg font-bold text-purple-700">{formatRupiah(het)}</p>
              {hetData?.source && (
                <p className="text-xs text-purple-500 mt-0.5">{hetData.source}</p>
              )}
            </div>
          )}

          {/* AI Analysis */}
          {isAnalyzing ? (
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-slate-500">AI sedang menganalisis...</p>
            </div>
          ) : analysisResult ? (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Rekomendasi AI</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${confidenceColors[confidence]}`}>
                  {confidence === "high" ? "Tinggi" : confidence === "medium" ? "Sedang" : "Rendah"}
                </span>
              </div>

              <div className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <p className="text-xs text-slate-500 mb-1">Harga Jual Rekomendasi</p>
                <p className="text-2xl font-bold text-emerald-600">{formatRupiah(recommendedPrice)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Margin: {newMargin}% • Saat ini: {formatRupiah(currentHargaJual)} ({currentMargin}%)
                </p>
              </div>

              {reason && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">Alasan AI</p>
                  <p className="text-sm text-amber-800">{reason}</p>
                </div>
              )}
            </div>
          ) : null}

          {/* Custom Price Edit */}
          {analysisResult && !isAnalyzing && (
            <div>
              {!isEditing ? (
                <button
                  onClick={() => {
                    setCustomPrice(String(recommendedPrice));
                    setIsEditing(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  <FiEdit3 size={14} />
                  Edit Harga Manual
                </button>
              ) : (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Harga Jual Manual
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                      min="0"
                    />
                    <button
                      onClick={handleApplyCustom}
                      disabled={!customPrice || Number(customPrice) <= 0 || isApplying}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {analysisResult && !isAnalyzing && (
          <div className="p-5 border-t bg-slate-50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                onClick={onReject}
                disabled={isApplying}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-red-300 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                <FiXCircle size={16} />
                Tolak
              </button>
              <button
                onClick={() => handleApply(recommendedPrice)}
                disabled={isApplying}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 shadow-md hover:shadow-lg transition-all"
              >
                <FiCheck size={16} />
                {isApplying ? "Menerapkan..." : "Terapkan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DynamicPricingModal;
