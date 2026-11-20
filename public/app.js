const searchInput = document.querySelector("[data-filter-input]");
const promptInput = document.querySelector("#copilot-message");
const chatForm = document.querySelector("#copilot-chat-form");
const chatMessages = document.querySelector("#chat-messages");
const chatStatus = document.querySelector("#chat-status");

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

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = promptInput?.value.trim();
  if (!message || !chatMessages || !chatStatus) {
    return;
  }

  const submitButton = chatForm.querySelector('button[type="submit"]');
  const addMessage = (label, text, isUser) => {
    const bubble = document.createElement("div");
    bubble.className = isUser
      ? "ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-cyan/10 p-4"
      : "max-w-xl rounded-2xl rounded-tl-sm border border-line bg-background/70 p-4";
    const heading = document.createElement("p");
    heading.className = "text-xs font-semibold text-cyan";
    heading.textContent = label;
    const content = document.createElement("p");
    content.className = "mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200";
    content.textContent = text;
    bubble.append(heading, content);
    chatMessages.append(bubble);
    bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  addMessage("TÚ", message, true);
  promptInput.value = "";
  chatStatus.textContent = "Consultando al copiloto…";
  if (submitButton) {
    submitButton.disabled = true;
  }

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
    addMessage("TSOLI · ASISTENTE", result.answer, false);
    chatStatus.textContent = "Respuesta generada con el contexto anonimizado del negocio.";
  } catch (error) {
    chatStatus.textContent = error.message || "No se pudo conectar con el copiloto.";
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
    promptInput?.focus();
  }
});

document.querySelectorAll("[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    const message = form.dataset.confirm;
    if (message && !window.confirm(message)) {
      event.preventDefault();
    }
  });
});
