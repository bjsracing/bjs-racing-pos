const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call Gemini or NVIDIA NIM via Supabase Edge Function (server-side proxy).
 * Keeps the API key secure on the server — never exposed to the client bundle.
 *
 * @param {object} payload - { contents, generationConfig?, systemInstruction?, provider? }
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<object>} - Raw AI API response (always in Gemini format)
 */
export async function callGeminiProxy(payload, signal) {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      errorMsg = errData.error?.message || errData.message || errorMsg;
    } catch (_) {
      /* not JSON */
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

const RATE_LIMIT_KEYWORDS = ["high demand", "429", "503", "rate limit", "quota", "resource exhausted"];

function isRateLimitError(msg) {
  const lower = (msg || "").toLowerCase();
  return RATE_LIMIT_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Call Gemini with automatic fallback to NVIDIA NIM on rate limit errors.
 * Edge function auto-detects image parts and selects the vision model on NIM.
 *
 * @param {object} geminiPayload - { contents, generationConfig?, systemInstruction? }
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<object>} - AI response in Gemini format
 */
export async function callGeminiWithFallback(geminiPayload, signal) {
  try {
    return await callGeminiProxy({ ...geminiPayload, provider: "gemini" }, signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    if (!isRateLimitError(err.message)) throw err;

    console.warn("Gemini rate-limited, falling back to NVIDIA NIM...");
    return await callGeminiProxy({ ...geminiPayload, provider: "nvidia" }, signal);
  }
}
