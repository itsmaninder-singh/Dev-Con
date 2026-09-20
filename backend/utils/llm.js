const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = {
  fast: process.env.LLM_MODEL_FAST || "qwen/qwen3.8-27b",
  strong: process.env.LLM_MODEL_STRONG || "openai/gpt-oss-120b",
};

// Fallback models in order if primary model is unavailable or encounters 404
const FALLBACK_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
  "groq/compound-mini",
];

export const callLLM = async (systemPrompt, userPrompt, tier = "fast") => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Groq Api Key is not set, so at this moment u r not able to use ai feature sorry"
    );
  }

  const primaryModel = MODELS[tier] || tier;
  const candidateModels = [
    primaryModel,
    ...FALLBACK_MODELS.filter((m) => m !== primaryModel),
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch(GROQ_API, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        // If model not found or forbidden, try fallback model in list
        if (res.status === 404 || body.includes("model_not_found")) {
          console.warn(`[Groq LLM] Model "${model}" not found. Trying next fallback...`);
          lastError = new Error(`Groq API error (${res.status}): ${body}`);
          continue;
        }
        throw new Error(`Groq API error (${res.status}): ${body}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastError = err;
      // If it wasn't a 404 / model error (e.g. network or auth), rethrow
      if (!err.message.includes("404") && !err.message.includes("model_not_found")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Groq models failed");
};

export const callLLMForJSON = async (systemPrompt, userPrompt, tier = "fast") => {
  const jsonSystemPrompt = `${systemPrompt}\n\nRespond with only valid JSON - no prose, no explanation, no markdown code fences. Just the raw JSON.`;

  const raw = await callLLM(jsonSystemPrompt, userPrompt, tier);

  let cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();

  // If there's still wrapping text, attempt to locate the first { or [ and matching last } or ]
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const firstBrace = cleaned.indexOf("{");
    const firstBracket = cleaned.indexOf("[");
    let startIdx = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
      startIdx = Math.min(firstBrace, firstBracket);
    } else {
      startIdx = Math.max(firstBrace, firstBracket);
    }

    if (startIdx !== -1) {
      const isObject = cleaned[startIdx] === "{";
      const endIdx = isObject ? cleaned.lastIndexOf("}") : cleaned.lastIndexOf("]");
      if (endIdx !== -1 && endIdx > startIdx) {
        cleaned = cleaned.substring(startIdx, endIdx + 1);
      }
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse structured JSON from LLM: ${err.message}\nRaw Response: ${raw.slice(
        0,
        500
      )}`
    );
  }
};