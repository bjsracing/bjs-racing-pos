const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Call Gemini via Supabase Edge Function (server-side proxy).
 * Keeps the API key secure on the server — never exposed to the client bundle.
 *
 * @param {object} payload - { contents, generationConfig?, systemInstruction? }
 * @param {AbortSignal} [signal] - Optional AbortController signal
 * @returns {Promise<object>} - Raw Gemini API response
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
