const searchInput = document.querySelector("[data-filter-input]");
const promptInput = document.querySelector("[data-chat-input]");
const chatForms = document.querySelectorAll("[data-chat-form]");
const chatMessageAreas = document.querySelectorAll("[data-chat-messages]");
const chatStatuses = document.querySelectorAll("[data-chat-status]");
const chatHistoryKey = "tsoli-copilot-history";
const maxChatMessages = 60;
let chatHistory = [];
let chatRequestPending = false;

try {
  const savedHistory = JSON.parse(sessionStorage.getItem(chatHistoryKey) || "[]");
  if (Array.isArray(savedHistory)) {
    chatHistory = savedHistory.filter((message) =>
      message
      && ["user", "assistant"].includes(message.role)
      && typeof message.content === "string"
    ).slice(-maxChatMessages);
  }
} catch (error) {
  console.error("No se pudo cargar el historial del copiloto.", error);
}

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.trim().toLocaleLowerCase("es-MX");
  document.querySelectorAll("[data-searchable]").forEach((item) => {
    const matches = item.textContent.toLocaleLowerCase("es-MX").includes(query);
    item.classList.toggle("hidden", !matches);
  });
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!promptInput) {
      return;
    }

    promptInput.value = button.dataset.prompt ?? "";
    promptInput.focus();
  });
});

function renderChatHistory() {
  if (!chatHistory.length) {
    return;
  }

  chatMessageAreas.forEach((messageArea) => {
    const fullChat = messageArea.id === "chat-messages";
    messageArea.replaceChildren();
    chatHistory.forEach(({ role, content: messageText }) => {
      const bubble = document.createElement("div");
      bubble.className = fullChat
        ? role === "user"
          ? "ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-cyan/10 p-4"
          : "max-w-xl rounded-2xl rounded-tl-sm border border-line bg-background/70 p-4"
        : role === "user"
          ? "ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-cyan/10 p-3"
          : "max-w-[90%] rounded-2xl rounded-tl-sm border border-line bg-background/70 p-3";
      const heading = document.createElement("p");
      heading.className = fullChat ? "text-xs font-semibold text-cyan" : "text-[10px] font-semibold text-cyan";
      heading.textContent = role === "user" ? "TÚ" : "TSOLI · ASISTENTE";
      const messageContent = document.createElement("p");
      messageContent.className = fullChat
        ? "mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200"
        : "mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-slate-200";
      messageContent.textContent = messageText;
      bubble.append(heading, messageContent);
      messageArea.append(bubble);
    });
    messageArea.scrollTop = messageArea.scrollHeight;
  });
}

function persistChatHistory() {
  try {
    sessionStorage.setItem(chatHistoryKey, JSON.stringify(chatHistory));
  } catch (error) {
    console.error("No se pudo guardar el historial del copiloto.", error);
  }
}

function addChatMessage(role, content) {
  chatHistory.push({ role, content });
  chatHistory = chatHistory.slice(-maxChatMessages);
  persistChatHistory();
  renderChatHistory();
}

function setChatStatus(message) {
  chatStatuses.forEach((status) => {
    status.textContent = message;
  });
}

function setChatFormsDisabled(disabled) {
  chatForms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = disabled;
    }
  });
}

renderChatHistory();

chatForms.forEach((chatForm) => {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (chatRequestPending) {
      return;
    }

    const messageInput = chatForm.querySelector("[data-chat-input]");
    const message = messageInput?.value.trim();
    if (!message) {
      return;
    }

    chatRequestPending = true;
    addChatMessage("user", message);
    messageInput.value = "";
    setChatStatus("Consultando base de datos...");
    setChatFormsDisabled(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudo obtener una respuesta.");
      }
      if (typeof result.answer !== "string" || !result.answer.trim()) {
        throw new Error("El copiloto no devolvió una respuesta válida.");
      }
      addChatMessage("assistant", result.answer);
      setChatStatus("Respuesta generada con el contexto anonimizado del negocio.");
    } catch (error) {
      const errorMessage = error.message || "No se pudo conectar con el copiloto.";
      addChatMessage("assistant", errorMessage);
      setChatStatus(errorMessage);
    } finally {
      chatRequestPending = false;
      setChatFormsDisabled(false);
      messageInput?.focus();
    }
  });
});

const chatbotPanel = document.querySelector("[data-chatbot-panel]");
const chatbotToggle = document.querySelector("[data-chatbot-toggle]");
const closeChatbotButtons = document.querySelectorAll("[data-chatbot-close]");

function setChatbotOpen(open) {
  if (!chatbotPanel || !chatbotToggle) {
    return;
  }

  chatbotPanel.hidden = !open;
  chatbotPanel.classList.toggle("hidden", !open);
  chatbotToggle.setAttribute("aria-expanded", String(open));
  chatbotToggle.setAttribute("aria-label", open ? "Minimizar Copiloto IA" : "Abrir Copiloto IA");
  if (open) {
    document.querySelector("#chatbot-message")?.focus();
  }
}

chatbotToggle?.addEventListener("click", () => {
  setChatbotOpen(chatbotPanel?.hidden ?? true);
});

closeChatbotButtons.forEach((button) => {
  button.addEventListener("click", () => setChatbotOpen(false));
});

document.querySelectorAll("[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const message = form.dataset.confirm;
    if (message && !window.confirm(message)) {
      event.preventDefault();
    }
  });
});
