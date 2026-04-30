module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { question } = req.body || {};
  if (!question) return res.status(400).json({ error: "Missing question" });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are Lisa Zhong's portfolio assistant.

STRICT RULES:
- You MUST ONLY use the facts provided below.
- DO NOT add, assume, or infer any new information.
- DO NOT mention companies, roles, or experiences not explicitly listed.
- DO NOT use generic phrases like "highly skilled professional" unless directly supported.

If the question cannot be answered using the facts:
Say: "I don't have enough information to answer that precisely."

STYLE:
- Be factual, grounded, and specific.
- Avoid generic business language.

FACTS:
- Lisa Zhong is an incoming MScAC student at the University of Toronto.
- She has experience in actuarial pricing, data science, machine learning, and statistical modeling.
- Aviva: actuarial/data science internship using SAS, SQL, Python, Excel VBA, Earnix.
- Built data pipelines and reduced data preparation time by ~30%.
- Research: satellite image downscaling (U-Net, DDPM, VAE), R² ~0.9.
- Research: wildfire forecasting using Microsoft Aurora and Fire Weather Index.
- Research: patent analysis with embeddings, UMAP, HDBSCAN, BERTopic (260k+ patents).
- Project: CAS competition (1st place, insurance visualization).
- Project: Kaggle PII detection (95.74% F1, Bronze Medal).
- Skills: Python, R, SQL, SAS, PyTorch, TensorFlow, etc.
`,
        },
        { role: "user", content: question },
      ],
      temperature: 0.4,
      max_tokens: 300,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({
      error: data.error?.message || "Groq API error",
      raw: data,
    });
  }

  const answer = data.choices?.[0]?.message?.content?.trim();

  return res.status(200).json({
    answer: answer || "Sorry, I could not generate a response.",
  });
};