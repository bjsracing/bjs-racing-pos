import { useState, useEffect, useCallback } from "react";
import {
  FiCpu,
  FiBox,
  FiToggleLeft,
  FiToggleRight,
  FiSave,
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiKey,
  FiInfo,
} from "react-icons/fi";
import {
  fetchAiConfig,
  updateAiConfig,
  getUserRole,
  testAiEndpoint,
  AI_CONFIG_DEFAULTS,
  PROVIDER_OPTIONS,
} from "../config/aiConfig.js";
import { supabase } from "../supabaseClient.js";

const GEMINI_MODEL_OPTIONS = [
  "gemini-3-flash-preview",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

const NVIDIA_TEXT_MODEL_OPTIONS = [
  "nvidia/nemotron-3-ultra-550b-a55b",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "meta/llama-3.1-405b-instruct",
  "meta/llama-3.3-70b-instruct",
];

const NVIDIA_VISION_MODEL_OPTIONS = [
  "nvidia/nemotron-nano-12b-v2-vl",
  "meta/llama-3.2-11b-vision-instruct",
  "meta/llama-3.2-90b-vision-instruct",
  "microsoft/phi-3-vision-128k-instruct",
];

const MODEL_OPTIONS = {
  gemini_model: GEMINI_MODEL_OPTIONS,
  nvidia_text_model: NVIDIA_TEXT_MODEL_OPTIONS,
  nvidia_vision_model: NVIDIA_VISION_MODEL_OPTIONS,
};

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
      <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center space-x-2">
        <Icon className="text-orange-500" size={18} />
        <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-orange-500" : "bg-slate-300"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((opt) => (
          <option key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
            {typeof opt === "string" ? opt : opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextField({ label, value, onChange, disabled, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function TestResultBadge({ result }) {
  if (!result) return null;
  if (result.testing) {
    return (
      <span className="inline-flex items-center space-x-1 text-xs text-slate-500">
        <FiLoader className="animate-spin" size={12} />
        <span>Testing...</span>
      </span>
    );
  }
  if (result.success) {
    return (
      <span className="inline-flex items-center space-x-1 text-xs text-emerald-600">
        <FiCheckCircle size={12} />
        <span>{result.latency}ms</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center space-x-1 text-xs text-red-500" title={result.error}>
      <FiAlertCircle size={12} />
      <span>Gagal</span>
    </span>
  );
}

export default function ManajemenModelAI() {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [apiKeyStatus, setApiKeyStatus] = useState({ gemini: null, nvidia: null });

  useEffect(() => {
    const init = async () => {
      const role = await getUserRole();
      setUserRole(role);
      if (role !== "admin" && role !== "owner") return;

      try {
        const cfg = await fetchAiConfig();
        setConfig(cfg);
      } catch (err) {
        console.error("Failed to load AI config:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleChange = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaveMsg(null);
  }, []);

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const promises = Object.entries(config).map(([key, value]) =>
        updateAiConfig(key, value)
      );
      await Promise.all(promises);
      setSaveMsg({ type: "success", text: "Semua pengaturan berhasil disimpan!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: `Gagal menyimpan: ${err.message}` });
    } finally {
      setSaving(false);
    }
  }, [config]);

  const handleTest = useCallback(async (provider) => {
    setTestResults((prev) => ({ ...prev, [provider]: { testing: true } }));
    const model = provider === "gemini"
      ? config.gemini_model
      : config.nvidia_text_model;
    const result = await testAiEndpoint(provider, model);
    setTestResults((prev) => ({ ...prev, [provider]: result }));
  }, [config]);

  const handleCheckKeys = useCallback(async () => {
    const results = {};
    for (const provider of ["gemini", "nvidia"]) {
      const model = provider === "gemini" ? config.gemini_model : config.nvidia_text_model;
      const result = await testAiEndpoint(provider, model);
      results[provider] = { configured: result.success, ...result };
    }
    setApiKeyStatus(results);
  }, [config]);

  if (userRole !== "admin" && userRole !== "owner") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FiAlertCircle className="text-red-400 mb-3" size={48} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 text-sm">
          Hanya role <span className="font-semibold">admin</span> atau{" "}
          <span className="font-semibold">owner</span> yang dapat mengakses halaman ini.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FiLoader className="animate-spin text-orange-500" size={32} />
        <span className="ml-3 text-slate-600 font-medium">Memuat pengaturan AI...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Model AI</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Konfigurasi provider, model, dan fitur AI
          </p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? <FiLoader className="animate-spin" size={16} /> : <FiSave size={16} />}
          <span>{saving ? "Menyimpan..." : "Simpan Semua"}</span>
        </button>
      </div>

      {saveMsg && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 ${
            saveMsg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {saveMsg.type === "success" ? <FiCheckCircle size={16} /> : <FiAlertCircle size={16} />}
          <span>{saveMsg.text}</span>
        </div>
      )}

      <SectionCard title="Provider Settings" icon={FiCpu}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectField
            label="Primary Provider"
            value={config.primary_provider || "gemini"}
            onChange={(v) => handleChange("primary_provider", v)}
            options={PROVIDER_OPTIONS}
          />
          <SelectField
            label="Fallback Provider"
            value={config.fallback_provider || "nvidia"}
            onChange={(v) => handleChange("fallback_provider", v)}
            options={[{ value: "none", label: "Tidak ada" }, ...PROVIDER_OPTIONS]}
          />
          <div className="flex items-end">
            <div className="flex items-center space-x-3">
              <ToggleSwitch
                enabled={config.auto_fallback === "true"}
                onChange={(v) => handleChange("auto_fallback", v ? "true" : "false")}
              />
              <span className="text-sm text-slate-700 font-medium">Auto-fallback</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400 flex items-center space-x-1">
          <FiInfo size={12} />
          <span>Jika primary provider error, otomatis switch ke fallback provider.</span>
        </p>
      </SectionCard>

      <SectionCard title="Model Configuration" icon={FiBox}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Google Gemini</p>
                <div className="flex items-center space-x-2">
                  <TestResultBadge result={testResults.gemini} />
                  <button
                    onClick={() => handleTest("gemini")}
                    className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center space-x-1"
                  >
                    <FiActivity size={12} />
                    <span>Test</span>
                  </button>
                </div>
              </div>
              <SelectField
                label="Model"
                value={config.gemini_model || AI_CONFIG_DEFAULTS.gemini_model}
                onChange={(v) => handleChange("gemini_model", v)}
                options={GEMINI_MODEL_OPTIONS}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-green-600 uppercase tracking-wide">NVIDIA NIM</p>
                <div className="flex items-center space-x-2">
                  <TestResultBadge result={testResults.nvidia} />
                  <button
                    onClick={() => handleTest("nvidia")}
                    className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center space-x-1"
                  >
                    <FiActivity size={12} />
                    <span>Test</span>
                  </button>
                </div>
              </div>
              <SelectField
                label="Text Model"
                value={config.nvidia_text_model || AI_CONFIG_DEFAULTS.nvidia_text_model}
                onChange={(v) => handleChange("nvidia_text_model", v)}
                options={NVIDIA_TEXT_MODEL_OPTIONS}
              />
              <SelectField
                label="Vision Model"
                value={config.nvidia_vision_model || AI_CONFIG_DEFAULTS.nvidia_vision_model}
                onChange={(v) => handleChange("nvidia_vision_model", v)}
                options={NVIDIA_VISION_MODEL_OPTIONS}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Feature Toggles" icon={FiToggleLeft}>
        <div className="space-y-3">
          {[
            { key: "pos_copilot_enabled", label: "AI POS Copilot", desc: "Asisten AI di halaman kasir" },
            { key: "wa_draft_enabled", label: "AI WhatsApp Draft", desc: "Draft pesan WhatsApp otomatis" },
            { key: "ocr_enabled", label: "AI OCR Nota", desc: "Scan nota pembelian via gambar" },
            { key: "voice_enabled", label: "Voice Input", desc: "Input suara (Bahasa Indonesia)" },
            { key: "advisor_enabled", label: "AI Business Advisor", desc: "Asisten CFO di Dashboard" },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <ToggleSwitch
                enabled={config[key] === "true"}
                onChange={(v) => handleChange(key, v ? "true" : "false")}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="API Key Status" icon={FiKey}>
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            API key disimpan sebagai Supabase Secret (server-side). Tidak bisa diubah dari sini.
            Gunakan Supabase CLI atau Dashboard untuk update.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { provider: "gemini", label: "GEMINI_API_KEY", color: "blue" },
              { provider: "nvidia", label: "NVIDIA_API_KEY", color: "green" },
            ].map(({ provider, label, color }) => (
              <div key={provider} className="border border-slate-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-xs font-bold text-${color}-600 uppercase`}>{label}</p>
                  <TestResultBadge result={apiKeyStatus[provider]} />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-1.5 bg-slate-100 rounded text-xs text-slate-400 font-mono">
                    {apiKeyStatus[provider]?.configured ? "Configured ●●●●●●●●" : "Not Set"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleCheckKeys}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
          >
            <FiRefreshCw size={14} />
            <span>Cek Status API Key</span>
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">Cara update API Key:</p>
            <code className="block text-xs bg-slate-800 text-green-400 rounded-lg p-3 font-mono whitespace-pre-wrap">
{`# Gemini API Key
npx supabase secrets set GEMINI_API_KEY=your-key \\
  --project-ref ykotzsmncvyfveypeevb

# NVIDIA NIM API Key
npx supabase secrets set NVIDIA_API_KEY=your-key \\
  --project-ref ykotzsmncvyfveypeevb`}
            </code>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
