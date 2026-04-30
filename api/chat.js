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
          content:
            "You are Lisa Zhong's portfolio assistant. Answer in 3-5 concise, recruiter-friendly sentences.",
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