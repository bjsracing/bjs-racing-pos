import { supabase } from "../supabaseClient.js";

export const AI_CONFIG_DEFAULTS = {
  primary_provider: "gemini",
  fallback_provider: "nvidia",
  auto_fallback: "true",
  gemini_model: "gemini-3-flash-preview",
  nvidia_text_model: "nvidia/nemotron-3-ultra-550b-a55b",
  nvidia_vision_model: "nvidia/nemotron-nano-12b-v2-vl",
  pos_copilot_enabled: "true",
  wa_draft_enabled: "true",
  ocr_enabled: "true",
  voice_enabled: "true",
  advisor_enabled: "true",
};

export const PROVIDER_OPTIONS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "nvidia", label: "NVIDIA NIM" },
];

export const CONFIG_GROUPS = {
  provider: { label: "Provider Settings", icon: "FiCpu" },
  model: { label: "Model Configuration", icon: "FiBox" },
  feature: { label: "Feature Toggles", icon: "FiToggleLeft" },
};

export async function fetchAiConfig() {
  const { data, error } = await supabase
    .from("ai_config")
    .select("*")
    .order("id");

  if (error) throw error;

  const config = {};
  (data || []).forEach((item) => {
    config[item.key] = item.value;
  });
  return config;
}

export async function updateAiConfig(key, value) {
  const { error } = await supabase
    .from("ai_config")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key);

  if (error) throw error;
}

export async function getUserRole() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role || null;
}

export async function testAiEndpoint(provider, model) {
  const startTime = Date.now();
  try {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {
      body: {
        provider: provider === "gemini" ? "gemini" : "nvidia",
        contents: [{ role: "user", parts: [{ text: "Reply with one word: OK" }] }],
        generationConfig: { maxOutputTokens: 10 },
      },
    });

    if (error) throw error;

    const latency = Date.now() - startTime;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { success: true, latency, response: text.trim() };
  } catch (err) {
    const latency = Date.now() - startTime;
    return { success: false, latency, error: err.message };
  }
}
