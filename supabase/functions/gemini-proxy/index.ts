import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const NVIDIA_API_KEY = Deno.env.get("NVIDIA_API_KEY");

const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const DEFAULT_NVIDIA_TEXT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const DEFAULT_NVIDIA_VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl";

function geminiToOpenAIPayload(contents, generationConfig, modelOverrides) {
  const messages = [];
  let hasImages = false;

  for (const content of contents) {
    const role = content.role === "model" ? "assistant" : "user";

    if (content.parts?.length === 1 && content.parts[0].text) {
      messages.push({ role, content: content.parts[0].text });
    } else {
      const contentParts = [];
      for (const part of content.parts || []) {
        if (part.text) {
          contentParts.push({ type: "text", text: part.text });
        } else if (part.inlineData) {
          hasImages = true;
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
            },
          });
        }
      }
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        messages.push({ role, content: contentParts[0].text });
      } else {
        messages.push({ role, content: contentParts });
      }
    }
  }

  const defaultModel = hasImages
    ? (modelOverrides?.nvidia_vision_model || DEFAULT_NVIDIA_VISION_MODEL)
    : (modelOverrides?.nvidia_text_model || DEFAULT_NVIDIA_TEXT_MODEL);
  const params = { model: defaultModel, messages };
  if (generationConfig?.temperature != null) params.temperature = generationConfig.temperature;
  if (generationConfig?.maxOutputTokens != null) params.max_tokens = generationConfig.maxOutputTokens;
  if (!params.temperature) params.temperature = 0.3;
  if (!params.max_tokens) params.max_tokens = 8192;

  return params;
}

function openAIResponseToGemini(openAIResponse) {
  const content = openAIResponse.choices?.[0]?.message?.content || "";
  return {
    candidates: [
      {
        content: {
          parts: [{ text: content }],
          role: "model",
        },
      },
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { contents, generationConfig, systemInstruction, provider, modelConfig, useGoogleSearch } =
      await req.json();

    if (!contents || !Array.isArray(contents)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'contents' array" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (provider === "nvidia") {
      if (!NVIDIA_API_KEY) {
        return new Response(
          JSON.stringify({ error: "NVIDIA_API_KEY not configured on server" }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const openAIPayload = geminiToOpenAIPayload(contents, generationConfig, modelConfig);

      if (systemInstruction?.parts) {
        const sysText = systemInstruction.parts
          .map((p: { text?: string }) => p.text || "")
          .filter(Boolean)
          .join("\n");
        openAIPayload.messages.unshift({
          role: "system",
          content: sysText,
        });
      }

      const response = await fetch(NVIDIA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify(openAIPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new Response(JSON.stringify(openAIResponseToGemini(data)), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Default: Gemini
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured on server" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const geminiModel = modelConfig?.gemini_model || DEFAULT_GEMINI_MODEL;
    const body: Record<string, unknown> = { contents };
    if (generationConfig) body.generationConfig = generationConfig;
    if (systemInstruction) body.systemInstruction = systemInstruction;
    if (useGoogleSearch) body.tools = [{ google_search: {} }];

    const response = await fetch(
      `${GEMINI_BASE_URL}/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    data._provider = "gemini";
    data._model = geminiModel;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
