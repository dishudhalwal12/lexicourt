import { chatWithAssistant } from "./api-client.js";
import { getCasesForCurrentUser, getDocumentsByCase, saveAiChat } from "./firestore-service.js";

class AssistantSidebar {
  constructor() {
    this.isActive = false;
    this.pendingFileContext = "";
    this.pendingFileName = "";
    this.chats = [];
    this.currentCase = null;
    this.documents = [];
    
    this.init();
  }

  async init() {
    this.injectHtml();
    this.bindEvents();
    await this.loadInitialData();
  }

  injectHtml() {
    const overlay = document.createElement("div");
    overlay.className = "ai-sidebar-overlay";
    overlay.id = "aiSidebarOverlay";
    
    const sidebar = document.createElement("aside");
    sidebar.className = "ai-sidebar";
    sidebar.id = "aiSidebar";
    sidebar.innerHTML = `
      <div class="ai-sidebar-header">
        <div class="d-flex align-items-center gap-3">
          <div class="brand-mark" style="width: 32px; height: 32px; border-radius: 8px;"></div>
          <strong style="font-size: 18px; letter-spacing: -0.02em;">LexiAssistant</strong>
        </div>
        <button class="btn-close" id="closeAiSidebar"></button>
      </div>
      
      <div class="ai-sidebar-content" id="aiSidebarContent">
        <div class="ai-chat-bubble ai">
          Hello! I'm your LexiCourt assistant. I can help you analyze cases, summarize orders, and answer legal questions.
        </div>
        
        <div class="panel-card" style="padding: 16px; background: #f9f9f9; border-style: dashed;">
          <span class="section-label mb-2 d-block">Case Learning</span>
          <p class="metric-label mb-3" style="font-size: 12px;">Upload a .txt transcript or document to provide extra context.</p>
          <input type="file" id="aiSidebarFileUpload" accept=".txt" style="display: none;" />
          <button class="btn-dark btn-sm w-100" id="aiSidebarUploadBtn">
            <i class="bi bi-file-earmark-arrow-up"></i> Upload Context (.txt)
          </button>
          <div id="aiSidebarFileIndicator" class="is-hidden mt-2 ai-context-indicator">
            <i class="bi bi-check-circle-fill text-success"></i>
            <span id="aiSidebarFileName" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"></span>
          </div>
        </div>
      </div>
      
      <div class="ai-sidebar-footer">
        <div class="d-flex gap-2">
          <input type="text" id="aiSidebarInput" class="app-input" placeholder="Ask a question..." style="padding: 10px 14px; font-size: 14px;" />
          <button id="aiSidebarSendBtn" class="btn-accent" style="width: 44px; padding: 0; flex-shrink: 0;">
            <i class="bi bi-send-fill"></i>
          </button>
        </div>
      </div>
    `;
    
    const toggleBtn = document.createElement("div");
    toggleBtn.className = "ai-toggle-btn";
    toggleBtn.id = "aiToggleBtn";
    toggleBtn.innerHTML = `<i class="bi bi-stars"></i>`;
    
    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);
    document.body.appendChild(toggleBtn);
  }

  bindEvents() {
    const toggleBtn = document.getElementById("aiToggleBtn");
    const closeBtn = document.getElementById("closeAiSidebar");
    const overlay = document.getElementById("aiSidebarOverlay");
    const sendBtn = document.getElementById("aiSidebarSendBtn");
    const input = document.getElementById("aiSidebarInput");
    const uploadBtn = document.getElementById("aiSidebarUploadBtn");
    const fileInput = document.getElementById("aiSidebarFileUpload");

    const toggle = () => {
      this.isActive = !this.isActive;
      document.getElementById("aiSidebar").classList.toggle("is-active", this.isActive);
      document.getElementById("aiSidebarOverlay").classList.toggle("is-active", this.isActive);
    };

    toggleBtn?.addEventListener("click", toggle);
    closeBtn?.addEventListener("click", toggle);
    overlay?.addEventListener("click", toggle);

    uploadBtn?.addEventListener("click", () => fileInput?.click());
    fileInput?.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      this.pendingFileName = file.name;
      this.pendingFileContext = await this.readFile(file);
      
      const indicator = document.getElementById("aiSidebarFileIndicator");
      const nameEl = document.getElementById("aiSidebarFileName");
      if (indicator && nameEl) {
        indicator.classList.remove("is-hidden");
        nameEl.textContent = file.name;
      }
    });

    sendBtn?.addEventListener("click", () => this.sendMessage());
    input?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendMessage();
    });
  }

  async loadInitialData() {
    try {
      const cases = await getCasesForCurrentUser();
      if (cases.length > 0) {
        this.currentCase = cases[0];
        this.documents = await getDocumentsByCase(this.currentCase.id);
      }
    } catch (err) {
      console.warn("Sidebar: Unable to load case context", err);
    }
  }

  async readFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(file);
    });
  }

  async sendMessage() {
    const input = document.getElementById("aiSidebarInput");
    const question = input.value.trim();
    if (!question) return;
    
    input.value = "";
    this.addBubble("user", question);
    
    const thinkingId = this.addBubble("ai", `<i class="bi bi-hourglass-split"></i> Thinking...`);
    
    try {
      const fullQuestion = this.pendingFileContext 
        ? `[Context from file ${this.pendingFileName}]:\n${this.pendingFileContext}\n\n[User Question]:\n${question}`
        : question;

      const response = await chatWithAssistant({
        caseData: this.currentCase,
        documents: this.documents,
        question: fullQuestion,
        history: this.chats
      });

      this.updateBubble(thinkingId, response.answer);
      this.chats.push({ question, answer: response.answer });
      
      if (this.currentCase) {
        await saveAiChat({
          caseId: this.currentCase.id,
          question,
          answer: response.answer,
          responseType: "sidebar"
        });
      }
    } catch (err) {
      this.updateBubble(thinkingId, "Sorry, I'm having trouble connecting to the LexiCourt API. Please make sure the local server is running.");
    }
  }

  addBubble(type, content) {
    const container = document.getElementById("aiSidebarContent");
    const bubble = document.createElement("div");
    const id = "bubble-" + Date.now();
    bubble.id = id;
    bubble.className = `ai-chat-bubble ${type}`;
    bubble.innerHTML = content.replaceAll("\n", "<br>");
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return id;
  }

  updateBubble(id, content) {
    const bubble = document.getElementById(id);
    if (bubble) {
      bubble.innerHTML = content.replaceAll("\n", "<br>");
      const container = document.getElementById("aiSidebarContent");
      container.scrollTop = container.scrollHeight;
    }
  }
}

// Auto-init when script is loaded
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    new AssistantSidebar();
  });
}
