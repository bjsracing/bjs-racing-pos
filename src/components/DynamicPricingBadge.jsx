import { useState, useEffect } from "react";
import { FiAlertTriangle, FiCheck, FiClock, FiTrendingUp } from "react-icons/fi";
import DynamicPricingModal from "./DynamicPricingModal.jsx";
import {
  detectPriceChange,
  getMarginByKategori,
  fetchHET,
  analyzePricing,
  savePriceHistory,
  formatRupiah,
} from "../lib/dynamicPricing.js";

function DynamicPricingBadge({ productId, newHargaBeli, productData, onPriceUpdated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [priceChange, setPriceChange] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [hetData, setHetData] = useState(null);
  const [marginPct, setMarginPct] = useState(10);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!productId || newHargaBeli === undefined || newHargaBeli === null) {
      setIsChecking(false);
      return;
    }

    const checkPrice = async () => {
      setIsChecking(true);
      try {
        const detect = await detectPriceChange(productId, Number(newHargaBeli));
        if (detect && detect.changed) {
          setPriceChange(detect);
          const margin = await getMarginByKategori(detect.product.kategori);
          setMarginPct(margin);
        }
      } catch (err) {
        console.warn("Price check error:", err);
      }
      setIsChecking(false);
    };

    checkPrice();
  }, [productId, newHargaBeli]);

  const handleAnalyze = async () => {
    if (!priceChange) return;
    setIsAnalyzing(true);
    try {
      const [hetResult, analysisResult] = await Promise.all([
        fetchHET(priceChange.product.nama, priceChange.product.merek),
        analyzePricing({
          productName: priceChange.product.nama,
          productCode: priceChange.product.kode,
          merek: priceChange.product.merek,
          kategori: priceChange.product.kategori,
          oldHargaBeli: priceChange.oldHargaBeli,
          newHargaBeli: priceChange.newHargaBeli,
          pctIncrease: priceChange.pctIncrease,
          currentHargaJual: priceChange.product.harga_jual,
          marginPct,
          hetReference: null,
        }),
      ]);

      setHetData(hetResult);
      if (hetResult?.het) {
        analysisResult.het_reference = hetResult.het;
      }
      setAnalysisResult(analysisResult);
    } catch (err) {
      console.error("Analysis error:", err);
    }
    setIsAnalyzing(false);
  };

  const handleAccept = async (finalPrice) => {
    if (!priceChange || !analysisResult) return;
    try {
      await savePriceHistory({
        product_id: productId,
        old_harga_beli: priceChange.oldHargaBeli,
        new_harga_beli: priceChange.newHargaBeli,
        old_harga_jual: priceChange.product.harga_jual,
        new_harga_jual: finalPrice,
        het_reference: analysisResult.het_reference || null,
        margin_pct_used: analysisResult.margin_pct,
        recommended_price: analysisResult.recommended_price,
        ai_reason: analysisResult.reason,
        ai_confidence: analysisResult.confidence,
        source: "manual_edit",
        action: "accepted",
      });

      if (onPriceUpdated) onPriceUpdated();
      setIsOpen(false);
      setPriceChange(null);
    } catch (err) {
      console.error("Save price history error:", err);
    }
  };

  const handleReject = async () => {
    if (!priceChange || !analysisResult) return;
    try {
      await savePriceHistory({
        product_id: productId,
        old_harga_beli: priceChange.oldHargaBeli,
        new_harga_beli: priceChange.newHargaBeli,
        old_harga_jual: priceChange.product.harga_jual,
        new_harga_jual: priceChange.product.harga_jual,
        het_reference: analysisResult.het_reference || null,
        margin_pct_used: analysisResult.margin_pct,
        recommended_price: analysisResult.recommended_price,
        ai_reason: analysisResult.reason,
        ai_confidence: analysisResult.confidence,
        source: "manual_edit",
        action: "rejected",
      });

      setIsOpen(false);
      setPriceChange(null);
    } catch (err) {
      console.error("Save price history error:", err);
    }
  };

  if (isChecking || !priceChange) return null;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(true);
          if (!analysisResult && !isAnalyzing) handleAnalyze();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-700 hover:from-amber-100 hover:to-orange-100 hover:border-amber-400 hover:shadow-md"
      >
        <FiTrendingUp size={14} />
        Harga Naik {priceChange.pctIncrease.toFixed(1)}%
        <span className="text-amber-500">
          {" "}({formatRupiah(priceChange.oldHargaBeli)} → {formatRupiah(priceChange.newHargaBeli)})
        </span>
      </button>

      {isOpen && (
        <DynamicPricingModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          priceChange={priceChange}
          analysisResult={analysisResult}
          hetData={hetData}
          marginPct={marginPct}
          isAnalyzing={isAnalyzing}
          onAccept={handleAccept}
          onReject={handleReject}
          onReAnalyze={handleAnalyze}
        />
      )}
    </>
  );
}

export default DynamicPricingBadge;
