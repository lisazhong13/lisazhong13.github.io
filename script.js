document.getElementById("year").textContent = new Date().getFullYear();

const CHAT_CONFIG = {
  // Replace with your deployed backend API endpoint.
  // Example: "https://your-vercel-app.vercel.app/api/chat"
  apiUrl: "https://project-qtev2.vercel.app/api/chat",
  systemPrompt:
    "You are Lisa Zhong's portfolio assistant. Answer questions about Lisa's education, experience, projects, skills, and fit for data science / actuarial / analytics roles. Use a confident but honest tone. If asked something not in the portfolio, say you don't have that information. Keep answers concise and recruiter-friendly.",
  resumeLink: "Jingwen Zhong CV.pdf",
  maxSentencesHint: "Keep it within 3 to 6 sentences.",
};

const state = {
  messages: [],
};
let isSending = false;

const chatFab = document.getElementById("chat-fab");
const chatPanel = document.getElementById("chat-panel");
const chatClose = document.getElementById("chat-close");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const quickButtons = document.querySelectorAll(".quick-question");
const heroInput = document.getElementById("hero-ai-input");
const heroSend = document.getElementById("hero-ai-send");

function openChat() {
  chatPanel.classList.remove("hidden");
  if (!state.messages.length) {
    addAssistantMessage(
      "Hi, I am Lisa's portfolio assistant. Ask me about her projects, experience, skills, or role fit."
    );
  }
  chatInput.focus();
}

function closeChat() {
  chatPanel.classList.add("hidden");
}

function addMessage(role, content) {
  state.messages.push({ role, content });
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = content;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addUserMessage(content) {
  addMessage("user", content);
}

function addAssistantMessage(content) {
  addMessage("assistant", content);
}

function buildApiPayload(userQuestion) {
  return {
    system: CHAT_CONFIG.systemPrompt,
    instruction: CHAT_CONFIG.maxSentencesHint,
    question: userQuestion,
    context: {
      resume_link: CHAT_CONFIG.resumeLink,
      portfolio_sections: ["about", "experience", "research", "projects", "leadership", "skills"],
    },
    history: state.messages.slice(-8),
  };
}

async function fetchAssistantReply(userQuestion) {
  if (!CHAT_CONFIG.apiUrl) {
    return "AI backend is not connected yet. Please set CHAT_CONFIG.apiUrl in script.js to your Vercel/Netlify endpoint.";
  }

  const response = await fetch(CHAT_CONFIG.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildApiPayload(userQuestion)),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.answer ||
    data.output_text ||
    "I could not generate a response right now. Please try again."
  );
}

async function submitQuestion(rawQuestion) {
  if (isSending) return;
  isSending = true;

  const question = rawQuestion.trim();
  if (!question) {
    isSending = false;
    return;
  }

  openChat();
  addUserMessage(question);
  addAssistantMessage("Thinking...");
  chatSend.disabled = true;
  heroSend.disabled = true;

  try {
    const reply = await fetchAssistantReply(question);
    chatMessages.lastChild.textContent = `${reply}\n\nResume: ${CHAT_CONFIG.resumeLink}`;
  } catch (error) {
    chatMessages.lastChild.textContent =
      "The AI assistant is temporarily rate-limited. Please try again in a few minutes.";
  } finally {
    chatSend.disabled = false;
    heroSend.disabled = false;
    isSending = false;
  }
}

chatFab.addEventListener("click", openChat);
chatClose.addEventListener("click", closeChat);

chatSend.addEventListener("click", () => {
  submitQuestion(chatInput.value);
  chatInput.value = "";
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    chatSend.click();
  }
});

heroSend.addEventListener("click", () => {
  submitQuestion(heroInput.value);
  heroInput.value = "";
});

heroInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    heroSend.click();
  }
});

for (const button of quickButtons) {
  button.addEventListener("click", () => {
    submitQuestion(button.dataset.question || "");
  });
}
