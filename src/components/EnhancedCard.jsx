// src/components/EnhancedCard.jsx
// Kartu metrik reusable dengan gaya konsisten "Target Bulanan":
// - Icon + judul + nilai utama
// - Circular progress (opsional)
// - Trend indicator (arrow naik/turun + persentase)
// - Badge status (warna dinamis)
// - Hover effect
// Bisa dipakai di seluruh Dashboard untuk menggantikan/menyamakan tampilan kartu.

import { Link } from "react-router-dom";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const BADGE_STYLES = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-100 text-indigo-700",
};

const CircularProgress = ({ percent = 0, size = 110, strokeWidth = 8 }) => {
  const pct = Math.max(0, Math.min(percent, 100));
  const radius = (size - strokeWidth) / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;
  const strokeColor =
    pct >= 100 ? "#22c55e" : pct >= 60 ? "#eab308" : "#ef4444";
  return (
    <div className="relative my-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color: strokeColor }}>
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
};

const EnhancedCard = ({
  icon,
  title,
  value,
  color = "bg-blue-500",
  // Circular progress (opsional)
  progress = null, // angka 0-100
  progressSize = 110,
  // Trend indicator (opsional)
  trendChange = null, // angka; positif = naik, negatif = turun
  trendLabel = "vs minggu lalu",
  // Badge status (opsional)
  badge = null, // { text: string, color: "green"|"yellow"|"red"|"blue"|"slate"|"indigo" }
  // Konten tambahan di bawah nilai (opsional)
  children,
  // Link (opsional)
  isLink = false,
  to = "#",
  state = {},
  className = "",
  // Index untuk staggered entrance animation (opsional)
  animationIndex = null,
}) => {
  const hasProgress = progress !== null && progress !== undefined;
  const animClass =
    animationIndex !== null && animationIndex !== undefined
      ? `card-fade-in card-fade-in-${Math.min(animationIndex, 9)}`
      : "";

  const content = (
    <div
      className={`bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center text-center h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${animClass} ${className}`}
    >
      {/* Header: ikon + judul */}
      <div className="flex items-center gap-2 mb-2">
        {icon && (
          <div className={`p-2.5 rounded-full text-white ${color}`}>{icon}</div>
        )}
        <p className="text-sm text-slate-500 font-medium">{title}</p>
      </div>

      {/* Circular progress (opsional) */}
      {hasProgress && (
        <CircularProgress percent={progress} size={progressSize} />
      )}

      {/* Nilai utama */}
      {value !== undefined && value !== null && (
        <p className="text-2xl font-bold">{value}</p>
      )}

      {/* Badge status (opsional) */}
      {badge?.text && (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5 ${
            BADGE_STYLES[badge.color] || BADGE_STYLES.slate
          }`}
        >
          {badge.text}
        </span>
      )}

      {/* Trend indicator (opsional) */}
      {trendChange !== null && trendChange !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${
            trendChange >= 0 ? "text-green-600" : "text-red-500"
          }`}
        >
          {trendChange >= 0 ? (
            <FaArrowUp size={10} />
          ) : (
            <FaArrowDown size={10} />
          )}
          <span>
            {trendChange >= 0 ? "+" : ""}
            {trendChange}%
          </span>
          <span className="text-slate-400 font-normal">{trendLabel}</span>
        </div>
      )}

      {/* Konten tambahan */}
      {children}
    </div>
  );

  return isLink ? (
    <Link to={to} state={state} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  );
};

export default EnhancedCard;
