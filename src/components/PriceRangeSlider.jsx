import React, { useState, useRef, useCallback, useEffect } from "react";

const BOUNDARIES = [0, 15000, 25000, 50000, 100000];
const LABELS = ["0", "15rb", "25rb", "50rb", "100rb", "Max"];

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
  if (!value || value === "semua") return { min: 0, max: 100001 };
  if (value === "nol") return { min: 0, max: 0 };
  if (value === "100000+") return { min: 100000, max: 100001 };
  const parts = value.split("-");
  if (parts.length === 2) {
    return { min: parseInt(parts[0], 10), max: parseInt(parts[1], 10) };
  }
  return { min: 0, max: 100001 };
}

function toRPCValue(min, max) {
  if (min === 0 && max === 0) return "nol";
  if (min === 0 && max >= 100001) return "semua";
  if (min === 0 && max === 15000) return "0-15000";
  if (min === 15000 && max === 25000) return "15000-25000";
  if (min === 25000 && max === 50000) return "25000-50000";
  if (min === 50000 && max === 100000) return "50000-100000";
  if (min === 100000 && max >= 100001) return "100000+";
  if (min >= 100000 && max >= 100001) return "100000+";
  if (min === 0 && max < 100001) return `0-${max}`;
  if (max >= 100001) return `${min}-100000+`;
  return `${min}-${max}`;
}

function snapToBoundary(val) {
  let closest = BOUNDARIES[0];
  let minDist = Math.abs(val - closest);
  for (const b of BOUNDARIES) {
    const dist = Math.abs(val - b);
    if (dist < minDist) {
      closest = b;
      minDist = dist;
    }
  }
  if (val > 100000) return 100001;
  return closest;
}

function formatPrice(val) {
  if (val >= 100001) return "Max";
  if (val === 0) return "Rp 0";
  return `Rp ${val.toLocaleString("id-ID")}`;
}

const PriceRangeSlider = ({ value, priceCounts = {}, onChange }) => {
  const { min: initMin, max: initMax } = parseValue(value);
  const [localMin, setLocalMin] = useState(initMin);
  const [localMax, setLocalMax] = useState(initMax);
  const [dragging, setDragging] = useState(null);
  const [inputMin, setInputMin] = useState(String(initMin === 0 && initMax === 0 ? 0 : initMin));
  const [inputMax, setInputMax] = useState(String(initMax >= 100001 ? "" : initMax));
  const trackRef = useRef(null);

  useEffect(() => {
    const { min, max } = parseValue(value);
    setLocalMin(min);
    setLocalMax(max);
    setInputMin(String(min === 0 && max === 0 ? 0 : min));
    setInputMax(String(max >= 100001 ? "" : max));
  }, [value]);

  const getPercent = useCallback((val) => {
    if (val >= 100001) return 100;
    if (val <= 0) return 0;
    const pct = (val / 100000) * 100;
    return Math.min(Math.max(pct, 0), 100);
  }, []);

  const getValueFromPosition = useCallback((clientX) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = pct * 100000;
    return snapToBoundary(raw);
  }, []);

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
        const newMin = Math.min(val, localMax);
        setLocalMin(newMin);
        setInputMin(String(newMin === 0 && localMax === 0 ? 0 : newMin));
      } else {
        const newMax = Math.max(val, localMin);
        setLocalMax(newMax);
        setInputMax(String(newMax >= 100001 ? "" : newMax));
      }
    };

    const handleUp = () => {
      setDragging(null);
      const rpcVal = toRPCValue(
        dragging === "min" ? snapToBoundary(localMin) : localMin,
        dragging === "max" ? snapToBoundary(localMax) : localMax
      );
      onChange(rpcVal);
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
  }, [dragging, localMin, localMax, getValueFromPosition, onChange]);

  const handleInputMin = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputMin(raw);
    if (raw !== "") {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) {
        const clamped = Math.min(val, localMax);
        setLocalMin(clamped);
        onChange(toRPCValue(clamped, localMax));
      }
    }
  };

  const handleInputMax = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setInputMax(raw);
    if (raw !== "") {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) {
        const clamped = Math.max(val, localMin);
        setLocalMax(clamped);
        onChange(toRPCValue(localMin, clamped));
      }
    } else {
      setLocalMax(100001);
      onChange(toRPCValue(localMin, 100001));
    }
  };

  const handleInputMinBlur = () => {
    setInputMin(String(localMin === 0 && localMax === 0 ? 0 : localMin));
  };

  const handleInputMaxBlur = () => {
    setInputMax(String(localMax >= 100001 ? "" : localMax));
  };

  const handlePreset = (presetValue) => {
    onChange(presetValue);
  };

  const minPct = getPercent(localMin);
  const maxPct = getPercent(localMax);

  return (
    <div className="space-y-3">
      <div className="relative pt-2 pb-4" ref={trackRef}>
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 bg-slate-200 rounded-full" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-500 rounded-full"
          style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
        />
        {BOUNDARIES.map((b) => (
          <div
            key={b}
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-300"
            style={{ left: `${getPercent(b)}%` }}
          />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-md z-10 touch-none"
          style={{ left: `${minPct}%` }}
          onMouseDown={(e) => handlePointerDown("min", e)}
          onTouchStart={(e) => handlePointerDown("min", e)}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full cursor-grab active:cursor-grabbing shadow-md z-10 touch-none"
          style={{ left: `${maxPct}%` }}
          onMouseDown={(e) => handlePointerDown("max", e)}
          onTouchStart={(e) => handlePointerDown("max", e)}
        />
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          {LABELS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
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
