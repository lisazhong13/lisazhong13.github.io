const GEMINI_MODEL = "gemini-2.0-flash";

function getGeminiUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function setCorsHeaders(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function buildSystemPrompt(baseSystem, instruction, context) {
  const sections =
    Array.isArray(context?.portfolio_sections) && context.portfolio_sections.length
      ? context.portfolio_sections.join(", ")
      : "about, experience, research, projects, leadership, skills";

  const resumeLink = context?.resume_link || "Jingwen Zhong CV.pdf";

  return [
    baseSystem ||
      "You are Lisa Zhong's portfolio assistant. Answer questions about Lisa's profile in a concise recruiter-friendly tone.",
    instruction || "Keep answers within 3 to 6 sentences.",
    `Available portfolio sections: ${sections}.`,
    `When relevant, end with one actionable link, preferably resume: ${resumeLink}.`,
  ].join("\n");
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed. Use POST." });
  }

  if (!process.env.GEMINI_API_KEY) {
    return json(res, 500, { error: "Missing GEMINI_API_KEY environment variable." });
  }

  const { question, system, instruction, context, history } = req.body || {};

  if (!question || typeof question !== "string") {
    return json(res, 400, { error: "Missing required field: question (string)." });
  }

  const conversation = [];
  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) {
      if (!item || typeof item.content !== "string") continue;
      const role = item.role === "assistant" ? "model" : "user";
      conversation.push({
        role,
        parts: [{ text: item.content }],
      });
    }
  }
  conversation.push({
    role: "user",
    parts: [{ text: question }],
  });

  try {
    const geminiRes = await fetch(getGeminiUrl(process.env.GEMINI_API_KEY), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(system, instruction, context) }],
        },
        contents: conversation,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return json(res, geminiRes.status, {
        error: data?.error?.message || "Gemini API request failed.",
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("") ||
      "No response generated.";
    return json(res, 200, { answer });
  } catch (error) {
    return json(res, 500, {
      error: "Unexpected server error.",
      details: error?.message || "Unknown error",
    });
  }
};
