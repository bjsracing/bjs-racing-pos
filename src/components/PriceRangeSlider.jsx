import React, { useState, useRef, useCallback, useEffect } from "react";

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
  if (!value || value === "semua") return { min: 0, max: 0 };
  if (value === "nol") return { min: 0, max: 0 };
  if (value === "100000+") return { min: 100000, max: 0 };
  const parts = value.split("-");
  if (parts.length === 2) {
    const min = parseInt(parts[0], 10);
    const max = parts[1].includes("+") ? 0 : parseInt(parts[1], 10);
    return { min: isNaN(min) ? 0 : min, max: isNaN(max) ? 0 : max };
  }
  return { min: 0, max: 0 };
}

function toRPCValue(min, max) {
  if (min === 0 && max === 0) return "semua";
  if (min === 100000 && max === 0) return "100000+";
  if (max === 0) return `${min}-100000+`;
  return `${min}-${max}`;
}

function formatPrice(val) {
  if (val === 0) return "";
  return val.toLocaleString("id-ID");
}

const PriceRangeSlider = ({ value, priceCounts = {}, onChange }) => {
  const { min: initMin, max: initMax } = parseValue(value);
  const [localMin, setLocalMin] = useState(initMin);
  const [localMax, setLocalMax] = useState(initMax);
  const [dragging, setDragging] = useState(null);
  const [inputMin, setInputMin] = useState(formatPrice(initMin));
  const [inputMax, setInputMax] = useState(formatPrice(initMax));
  const trackRef = useRef(null);

  useEffect(() => {
    const { min, max } = parseValue(value);
    setLocalMin(min);
    setLocalMax(max);
    setInputMin(formatPrice(min));
    setInputMax(formatPrice(max));
  }, [value]);

  const dynamicMax = Math.max(localMin, localMax, 50000) * 1.5;

  const getPercent = useCallback(
    (val) => {
      if (val <= 0) return 0;
      return Math.min((val / dynamicMax) * 100, 100);
    },
    [dynamicMax]
  );

  const getValueFromPosition = useCallback(
    (clientX) => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round((pct * dynamicMax) / 1000) * 1000;
    },
    [dynamicMax]
  );

  const handlePointerDown = useCallback((thumb, e) => {
    e.preventDefault();
    setDragging(thumb);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const handleMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const val = getValueFromPosition(clientX);

      if (dragging === "min") {
        const newMin = Math.min(val, localMax || dynamicMax);
        setLocalMin(newMin);
        setInputMin(formatPrice(newMin));
      } else {
        const newMax = Math.max(val, localMin);
        setLocalMax(newMax);
        setInputMax(formatPrice(newMax));
      }
    };

    const handleUp = () => {
      setDragging(null);
      const finalMin = dragging === "min" ? Math.min(localMin, localMax || dynamicMax) : localMin;
      const finalMax = dragging === "max" ? Math.max(localMax, localMin) : localMax;
      setLocalMin(finalMin);
      setLocalMax(finalMax);
      onChange(toRPCValue(finalMin, finalMax));
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, [dragging, localMin, localMax, dynamicMax, getValueFromPosition, onChange]);

  const handleInputMin = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputMin(raw);
    if (raw !== "") {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) {
        setLocalMin(val);
        onChange(toRPCValue(val, localMax));
      }
    }
  };

  const handleInputMax = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputMax(raw);
    if (raw !== "") {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) {
        setLocalMax(val);
        onChange(toRPCValue(localMin, val));
      }
    } else {
      setLocalMax(0);
      onChange(toRPCValue(localMin, 0));
    }
  };

  const handleInputMinBlur = () => {
    setInputMin(formatPrice(localMin));
  };

  const handleInputMaxBlur = () => {
    setInputMax(formatPrice(localMax));
  };

  const handlePreset = (presetValue) => {
    onChange(presetValue);
  };

  const minPct = localMin === 0 && localMax === 0 ? 0 : getPercent(localMin);
  const maxPct = localMin === 0 && localMax === 0 ? 100 : getPercent(localMax || dynamicMax);

  return (
    <div className="space-y-3">
      <div className="relative h-8" ref={trackRef}>
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-200 rounded-full" />
        {localMin !== 0 || localMax !== 0 ? (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-500 rounded-full"
            style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 1)}%` }}
          />
        ) : null}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-md z-10 touch-none"
          style={{ left: `${minPct}%` }}
          onMouseDown={(e) => handlePointerDown("min", e)}
          onTouchStart={(e) => handlePointerDown("min", e)}
        />
        {(localMin !== 0 || localMax !== 0) && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-md z-10 touch-none"
            style={{ left: `${maxPct}%` }}
            onMouseDown={(e) => handlePointerDown("max", e)}
            onTouchStart={(e) => handlePointerDown("max", e)}
          />
        )}
      </div>

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
              onBlur={handleInputMinBlur}
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
              onBlur={handleInputMaxBlur}
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
