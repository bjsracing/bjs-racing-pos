import React, { useState, useEffect } from "react";

const PRESETS = [
  { value: "semua", label: "Semua" },
  { value: "nol", label: "Rp 0" },
  { value: "0-15000", label: "1-15rb" },
  { value: "15000-25000", label: "15-25rb" },
  { value: "25000-50000", label: "25-50rb" },
  { value: "50000-100000", label: "50-100rb" },
  { value: "100000+", label: "100rb+" },
];

function parseValue(value) {
  if (!value || value === "semua") return { min: "", max: "" };
  if (value === "nol") return { min: "0", max: "0" };
  if (value === "100000+") return { min: "100000", max: "" };
  const parts = value.split("-");
  if (parts.length === 2) {
    const max = parts[1].includes("+") ? "" : parts[1];
    return { min: parts[0], max };
  }
  return { min: "", max: "" };
}

function toRPCValue(min, max) {
  const minNum = min === "" ? 0 : parseInt(min, 10);
  const maxNum = max === "" ? 0 : parseInt(max, 10);
  if (minNum === 0 && maxNum === 0) return "semua";
  if (minNum === 100000 && maxNum === 0) return "100000+";
  if (maxNum === 0) return `${minNum}-100000+`;
  return `${minNum}-${maxNum}`;
}

function formatPrice(val) {
  if (val === "" || val === "0") return val === "0" ? "0" : "";
  return val.toLocaleString("id-ID");
}

function parseFormatted(str) {
  return str.replace(/[^0-9]/g, "");
}

const PriceRangeSlider = ({ value, priceCounts = {}, onChange }) => {
  const { min: initMin, max: initMax } = parseValue(value);
  const [inputMin, setInputMin] = useState(initMin);
  const [inputMax, setInputMax] = useState(initMax);

  useEffect(() => {
    const { min, max } = parseValue(value);
    setInputMin(min);
    setInputMax(max);
  }, [value]);

  const handleInputMin = (e) => {
    setInputMin(parseFormatted(e.target.value));
  };

  const handleInputMax = (e) => {
    setInputMax(parseFormatted(e.target.value));
  };

  const handleBlurMin = () => {
    setInputMin(formatPrice(inputMin));
    onChange(toRPCValue(inputMin, inputMax));
  };

  const handleBlurMax = () => {
    setInputMax(formatPrice(inputMax));
    onChange(toRPCValue(inputMin, inputMax));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const handlePreset = (presetValue) => {
    onChange(presetValue);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-0.5 block">Min</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputMin}
              onChange={handleInputMin}
              onBlur={handleBlurMin}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
        </div>
        <span className="text-slate-400 mt-4">-</span>
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-0.5 block">Max</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">Rp</span>
            <input
              type="text"
              inputMode="numeric"
              value={inputMax}
              onChange={handleInputMax}
              onBlur={handleBlurMax}
              onKeyDown={handleKeyDown}
              className="w-full pl-8 pr-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const isActive = value === p.value;
          const count = p.value !== "semua" && priceCounts[p.value] != null
            ? priceCounts[p.value]
            : null;
          return (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                isActive
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {p.label}
              {count != null ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PriceRangeSlider;
