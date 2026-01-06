const baseModels = [
  { value: "claude-opus-4-5-20251101", label: "Claude Opus 4.5" },
  { value: "claude-sonnet-4-5-20250929", label: "Claude Sonnet 4.5" },
  { value: "claude-haiku-4-5-20251001", label: "Claude 4.5 Haiku" },
  { value: "claude-opus-4-1-20250805", label: "Claude Opus 4.1" },
  { value: "gpt-5.2-chat-latest", label: "GPT 5.2" },
  { value: "gpt-5.1-chat-latest", label: "GPT 5.1" },
  { value: "gpt-5-chat-latest", label: "GPT 5" },
  { value: "gpt-4o", label: "GPT 4o" },
];
const MAX_CHARACTERS = 300;
let currentEventSource = null;
let baseUrl = null;
let currentAssistantMessageDiv = null; // Track the current assistant message being streamed
let deliberationIndicator = null; // Track the delibration indicator
let conversationsLoaded = false;

window.addEventListener("DOMContentLoaded", async function () {
  const form = document.querySelector(".chat-input-bar");
  const input = form.querySelector("textarea#messageInput") || form.querySelector("input[type='text']");
  const messageCounter = document.getElementById("messageCounter");
  const sendButton = form.querySelector("button[type='submit']");
  const conversationList = document.querySelector(".chat-sidebar ul");
  const chatMessages = document.getElementById("chatMessages");
  const newConversationBtn = document.getElementById("newConversationBtn");
  
  
  
  // Auto-grow textarea function
  function autoGrowTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height 200px
    textarea.style.height = newHeight + "px";
  }
  
  // Update character counter
  function updateCharacterCounter() {
    if (!input || !messageCounter) return;
    const length = input.value.length;
    const remaining = MAX_CHARACTERS - length;
    
    messageCounter.textContent = `${length} / ${MAX_CHARACTERS}`;
    
    // Update visual indicator
    messageCounter.classList.remove("warning", "danger");
    if (remaining <= 20 && remaining > 10) {
      messageCounter.classList.add("warning");
    } else if (remaining <= 10) {
      messageCounter.classList.add("danger");
    }
  }
  
  // Initialize textarea if it exists
  if (input && input.tagName === "TEXTAREA") {
    // Set initial height
    autoGrowTextarea(input);
    
    // Auto-grow on input
    input.addEventListener("input", function() {
      autoGrowTextarea(this);
      updateCharacterCounter();
    });
    
    // Update counter on load
    updateCharacterCounter();
    
    // Prevent pasting text that exceeds limit
    input.addEventListener("paste", function(e) {
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      const currentLength = this.value.length;
      const remaining = MAX_CHARACTERS - currentLength;
      
      if (paste.length > remaining) {
        e.preventDefault();
        const truncated = paste.substring(0, remaining);
        this.value += truncated;
        autoGrowTextarea(this);
        updateCharacterCounter();
      }
    });
    
    // Prevent typing beyond limit
    input.addEventListener("keydown", function(e) {
      if (this.value.length >= MAX_CHARACTERS) {
        // Allow backspace, delete, arrow keys, etc.
        const allowedKeys = [
          "Backspace", "Delete", "ArrowLeft", "ArrowRight", 
          "ArrowUp", "ArrowDown", "Home", "End", "Tab"
        ];
        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
        }
      }
    });
    
    // Handle Enter key: submit on Enter, new line on Shift+Enter
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        // Submit the form
        if (form && !sendButton.disabled) {
          form.dispatchEvent(new Event("submit"));
        }
      }
      // Shift+Enter will create a new line (default behavior)
    });
  }

  // Modal elements
  const conversationModal = document.getElementById("conversationModal");
  const conversationNameInput = document.getElementById("conversationNameInput");
  const createConversationBtn = document.getElementById("createConversationBtn");
  const cancelConversationBtn = document.getElementById("cancelConversationBtn");

  let selectedConversation = null;
  let currentUserId = null;

  // Handle form submission with Server-Sent Events
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    
    // Enforce character limit
    if (message.length > MAX_CHARACTERS) {
      input.value = message.substring(0, MAX_CHARACTERS);
      autoGrowTextarea(input);
      updateCharacterCounter();
      return;
    }

    try {
      addMessageToChat("user", { body: message, createdAt: new Date().toISOString() });
      const conversationItem = document.getElementById(`conversation-${selectedConversation._id}`);
      conversationItem.style.background = "var(--primary)";
      conversationItem.style.borderColor = "var(--primary)";
      conversationItem.style.color = "#FFFFFF";

       const title = selectedConversation.name || selectedConversation.title || `Conversation ${index + 1}`;
       const lastMessage = selectedConversation.lastMessage ? 
         (selectedConversation.lastMessage.length > 50 ? 
          selectedConversation.lastMessage.substring(0, 50) + "..." : 
          selectedConversation.lastMessage) : 
         "No messages yet";
       const date = selectedConversation.updatedAt ? 
         new Date(selectedConversation.updatedAt).toLocaleDateString() : "";
 
       const time = selectedConversation.updatedAt ? 
         new Date(selectedConversation.updatedAt).toLocaleTimeString() : "";
       
         conversationItem.innerHTML = `
         <div style="font-weight:500;color:var(--text);margin-bottom:0.25rem;">
           ${title}
         </div>
         <div style="font-size:0.85rem;opacity:0.7;line-height:1.3;">
           ${lastMessage}
         </div>
         <div style="font-size:0.75rem;margin-top:0.25rem;opacity:0.5;">
           ${date} ${time}
         </div>
       `;

      input.value = "";
      if (input.tagName === "TEXTAREA") {
        autoGrowTextarea(input);
        updateCharacterCounter();
      }
      
      // Remove any existing typing indicator
      if (deliberationIndicator) {
        deliberationIndicator.remove();
        deliberationIndicator = null;
      }
      
      // Close any existing EventSource connection
      if (currentEventSource) {
        currentEventSource.close();
      }

      // Create and show typing indicator
      deliberationIndicator = createDeliberationIndicator();
      chatMessages.appendChild(deliberationIndicator);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Create assistant message container for streaming
      currentAssistantMessageDiv = document.createElement("div");
      currentAssistantMessageDiv.className = "message assistant";
      currentAssistantMessageDiv.style.display = "none"; // Hide until first chunk arrives
      
      const bodyDiv = document.createElement("div");
      bodyDiv.className = "message-body";
      bodyDiv.style.whiteSpace = "pre-wrap";
      currentAssistantMessageDiv.appendChild(bodyDiv);
      
      //const senderDiv = document.createElement("div");
      //senderDiv.className = "message-sender";
      //senderDiv.style.fontSize = "0.85rem";
      //senderDiv.style.opacity = "0.7";
      //senderDiv.style.lineHeight = "1.3";
      //senderDiv.innerHTML = `Council - ${new Date().toLocaleTimeString()}`;
      //currentAssistantMessageDiv.appendChild(senderDiv);
      
      chatMessages.appendChild(currentAssistantMessageDiv);

      const eventSource = new EventSource(`/api/knowledge?message=${
        encodeURIComponent(message)
      }&conversationId=${
        encodeURIComponent(selectedConversation._id || "")
      }&userId=${
        encodeURIComponent(currentUserId || "")
      }`);
      currentEventSource = eventSource;

      eventSource.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (event.data && event.data !== "") {
            switch(data.type) {
              case "connected":
                console.log("Connected to knowledge stream");
                break;
              case "message":
                console.log("data", data);
                // Remove typing indicator when first message arrives
                if (deliberationIndicator) {
                  deliberationIndicator.remove();
                  deliberationIndicator = null;
                  currentAssistantMessageDiv.style.display = "none"; // Show message
                }
                
                // Append chunk to the assistant message
                addMessageToChat("assistant", data);
                break;

              case "complete":
                console.log("Streaming complete");
                // Remove typing indicator if still present
                if (deliberationIndicator) {
                  deliberationIndicator.remove();
                  deliberationIndicator = null;
                  currentAssistantMessageDiv.style.display = "none"; // Show message
                }
                
                // Finalize the message
                if (currentAssistantMessageDiv) {
                  currentAssistantMessageDiv = null;
                }
                
                eventSource.close();
                currentEventSource = null;
                loadConversations();
                break;
              case "error":
                console.error("Streaming error:", data.message);
                // Remove typing indicator
                if (deliberationIndicator) {
                  deliberationIndicator.remove();
                  deliberationIndicator = null;
                }
                
                // Show error message
                if (currentAssistantMessageDiv) {
                  const bodyDiv = currentAssistantMessageDiv.querySelector(".message-body");
                  if (bodyDiv) {
                    bodyDiv.textContent = data.message || "Sorry, I encountered an error. Please try again.";
                    currentAssistantMessageDiv.style.display = "";
                  }
                  currentAssistantMessageDiv = null;
                } else {
                  addMessageToChat("assistant", { 
                    body: data.message || "Sorry, I encountered an error. Please try again.",
                    createdAt: new Date().toISOString(),
                    sender: "Assistant"
                  });
                }
                
                eventSource.close();
                currentEventSource = null;
                break;
              default:
                console.log("Unknown event type:", data.type);
                break;
            }
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = function(event) {
        console.error("EventSource error:", event);
        
        // Remove typing indicator
        if (deliberationIndicator) {
          deliberationIndicator.remove();
          deliberationIndicator = null;
        }
        
        // Show error message
        if (currentAssistantMessageDiv) {
          const bodyDiv = currentAssistantMessageDiv.querySelector(".message-body");
          if (bodyDiv) {
            bodyDiv.textContent = "Connection error. Please try again.";
            currentAssistantMessageDiv.style.display = "";
          }
          currentAssistantMessageDiv = null;
        } else {
          addMessageToChat("assistant", { 
            body: "Connection error. Please try again.",
            createdAt: new Date().toISOString(),
            sender: "Assistant"
          });
        }
        
        eventSource.close();
        currentEventSource = null;
      };

      loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Remove typing indicator on error
      if (deliberationIndicator) {
        deliberationIndicator.remove();
        deliberationIndicator = null;
      }
      
      addMessageToChat("assistant", { 
        body: "Sorry, I encountered an error. Please try again.",
        createdAt: new Date().toISOString(),
        sender: "Assistant"
      });
    }
  });

  // Function to create typing indicator
  function createDeliberationIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "message assistant deliberation-indicator";
    indicator.innerHTML = `
      <div class="deliberation-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div style="font-size:0.85rem;opacity:0.7;line-height:1.3;margin-top:0.5rem;">
        Council is delibrating...
      </div>
    `;
    return indicator;
  }

  function showConversationModal() {
    conversationModal.classList.add("show");
    conversationNameInput.focus();
    createConversationBtn.disabled = true;
  }

  function hideConversationModal() {
    conversationModal.classList.remove("show");
    conversationNameInput.value = "";
    createConversationBtn.disabled = true;
  }

  conversationNameInput.addEventListener("input", function() {
    createConversationBtn.disabled = !this.value.trim();
  });
  conversationNameInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter" && this.value.trim()) {
      createConversation();
    }
  });
  cancelConversationBtn.addEventListener("click", hideConversationModal);
  createConversationBtn.addEventListener("click", createConversation);
  conversationModal.addEventListener("click", function(e) {
    if (e.target === conversationModal) {
      hideConversationModal();
    }
  });

  async function createConversation() {
    const conversationName = conversationNameInput.value.trim();
    if (!conversationName) return;

    try {
      createConversationBtn.disabled = true;
      const response = await axios.post("/api/conversation", { name: conversationName });
      
      if (response.data && response.data.success) {
        hideConversationModal();
        
        await loadConversations();
        
        if (response.data.conversation && response.data.conversation.id) {
          setTimeout(() => {
            currentUserId = response.data.conversation.user;
            selectConversation(response.data.conversation._id);
          }, 100);
        }
      } else {
        alert("Failed to create conversation.");
        createConversationBtn.disabled = false;
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to create conversation.");
      createConversationBtn.disabled = false;
    }
  }

  if (newConversationBtn) {
    newConversationBtn.addEventListener("click", function () {
      showConversationModal();
    });
  }

  input.disabled = true;
  sendButton.disabled = true;
  form.classList.add("disabled");

  if (!conversationsLoaded) {
    console.log("loading conversations")
    loadConversations();
    conversationsLoaded = true;
  }

  async function loadConversations() {
    console.log("here")
    try {
      const response = await axios.get("/api/conversation");
      
      if (response.data && response.data.conversations) {
        displayConversations(response.data.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      } else {
        displayConversations([]);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      document.getElementById("newConversationBtn").style.display = "none";

      conversationList.innerHTML = `
        <li style="color:var(--text-secondary);text-align:center;padding:1rem;">
          <p>Failed to load conversations</p>
          <br>
          <a 
            href="/login" 
            style="text-decoration:none;margin-top:0.5rem;padding:0.5rem 1rem;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;"
          >
            Return to Login
          </a>
        </li>
      `;
    }
  }


  async function loadCouncilMembers(conversationId) {
    try {
      const response = await axios.get(`/api/conversation/${conversationId}/council`);
      console.log("council members response", response);
      
      if (response.data && response.data.success && response.data.councilMembers) {
        const councilMembers = response.data.councilMembers;
        const memberCount = councilMembers.length;
        
        // Ensure we have between 1-3 members
        if (memberCount >= 1 && memberCount <= 3) {
          // Wait a bit to ensure council management elements are initialized
          setTimeout(() => {
            const councilMembersContainerEl = document.getElementById("councilMembers");
            
            if (councilMembersContainerEl) {
              // Format members data for renderCouncilMembers
              const formattedMembers = councilMembers.map((member) => ({
                name: member.name || "",
                baseModel: member.baseModel || "",
                basePersona: member.basePersona || "",
                active: member.active !== false, // Default to true
                councilMemberId: member._id,
              }));
              
              // Call renderCouncilMembers if it exists (it should be defined by now)
              if (typeof renderCouncilMembers === 'function') {
                // Use the existing function for consistency
                renderCouncilMembers(formattedMembers);
              } else {
                councilMembersContainerEl.innerHTML = "";
                
                for (let i = 0; i < memberCount; i++) {
                  const memberCard = document.createElement("div");
                  const member = formattedMembers[i] || {};
                  const isActive = member.active !== false;
                  
                  memberCard.className = `council-member-card ${isActive ? "" : "inactive"}`;
                  console.log("member", member);
                  
                  memberCard.innerHTML = `
                    <div class="council-member-field">
                      <label for="memberName-${i}">Name</label>
                      <input 
                        type="text" 
                        id="memberName-${i}" 
                        placeholder="Enter member name..."
                        value="${(member.name || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;")}"
                        maxlength="50"
                      >
                    </div>
                    <div class="council-member-field">
                      <label for="memberModel-${i}">AI Model</label>
                      <select id="memberModel-${i}">
                        ${baseModels.map((model) => 
                          `<option value="${model.value}" ${member.baseModel === model.value ? "selected" : ""}>${model.label}</option>`
                        ).join("")}
                      </select>
                    </div>
                    <div class="council-member-active-toggle">
                      <label>
                        <input 
                          type="checkbox" 
                          id="memberActive-${i}" 
                          ${isActive ? "checked" : ""}
                        >
                        <span>Active</span>
                      </label>
                    </div>
                    <div class="council-member-actions">
                      <button type="button" class="council-member-edit-btn" data-member-index="${i}">
                        <i class="fas fa-edit"></i> Edit Persona
                      </button>
                    </div>
                    <textarea id="memberPersona-${i}" style="display: none;">${(member.basePersona || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
                  `;
                  
                  councilMembersContainerEl.appendChild(memberCard);
                  
                  // Add event listener for edit button - will be set up after modal functions are defined
                  setTimeout(() => {
                    const editBtn = memberCard.querySelector(`[data-member-index="${i}"]`);
                    if (editBtn) {
                      editBtn.addEventListener("click", () => {
                        if (typeof openPersonaModal === 'function') {
                          openPersonaModal(i, member);
                        }
                      });
                    }
                    
                    // Add active toggle listener
                    const activeCheckbox = memberCard.querySelector(`#memberActive-${i}`);
                    if (activeCheckbox) {
                      activeCheckbox.addEventListener("change", function() {
                        memberCard.classList.toggle("inactive", !this.checked);
                      });
                    }
                  }, 100);
                }
              }
            }
          }, 100);
        } else {
          console.warn("Invalid council member count:", memberCount);
        }
      }
    } catch (error) {
      console.error("Error loading council members:", error);
      // If there's an error, don't change the UI - keep current state
    }
  }

  async function loadConversationMessages(conversationId) {
    try {
      const response = await axios.get(`/api/conversation/${conversationId}/messages`);
      response.data.messages?.forEach((messageData) => {
        if (messageData.sender === "user") {
          addMessageToChat("user", messageData);
        } else {
          addMessageToChat("assistant", messageData);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  function displayConversations(conversations) {
    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <li style="color:var(--text-secondary);text-align:center;padding:1rem;">
          No conversations yet
          <br>
          <small>Start a new conversation below</small>
        </li>
      `;
      return;
    }

    conversationList.innerHTML = "";
    
    conversations.forEach((conversation, index) => {
      const listItem = document.createElement("li");
      listItem.className = "conversation-item";
      listItem.setAttribute("data-conversation-id", conversation._id);
      listItem.id = `conversation-${conversation._id}`;
      listItem.style.cssText = `
        padding: 0.75rem 1rem;
        border-radius: 8px;
        background: var(--background);
        margin-bottom: 0.5rem;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        position: relative;
      `;
      
      listItem.addEventListener("mouseenter", function() {
        if (!this.classList.contains("active")) {
          this.style.background = "var(--surface)";
          this.style.borderColor = "var(--border)";
        }
      });
      
      listItem.addEventListener("mouseleave", function() {
        if (!this.classList.contains("active")) {
          this.style.background = "var(--background)";
          this.style.borderColor = "transparent";
        }
      });
      
      listItem.addEventListener("click", function() {
        currentUserId = conversation.user;
        selectConversation(conversation);
      });
      
      const title = conversation.name || conversation.title || `Conversation ${index + 1}`;
      const lastMessage = conversation.lastMessage ? 
        (conversation.lastMessage.length > 50 ? 
          conversation.lastMessage.substring(0, 50) + "..." : 
          conversation.lastMessage) : 
        "No messages yet";
      const date = conversation.updatedAt ? 
        new Date(conversation.updatedAt).toLocaleDateString() : "";
      const time = conversation.updatedAt ? 
        new Date(conversation.updatedAt).toLocaleTimeString() : "";
      
      listItem.innerHTML = `
        <div style="font-weight:500;color:var(--text);margin-bottom:0.25rem;">
          ${title}
        </div>
        <div style="font-size:0.85rem;opacity:0.7;line-height:1.3;">
          ${lastMessage}
        </div>
        <div style="font-size:0.75rem;margin-top:0.25rem;opacity:0.5;">
          ${date} ${time}
        </div>
      `;
      
      conversationList.appendChild(listItem);
    });
  }

  async function addMessageToChat(sender, messageData) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    const bodyDiv = document.createElement("div");
    bodyDiv.className = "message-body";
    bodyDiv.style.whiteSpace = "pre-wrap";
    bodyDiv.innerHTML = messageData.body || messageData.message || "";
    messageDiv.appendChild(bodyDiv);
    const senderDiv = document.createElement("div");
    senderDiv.className = "message-sender";
    senderDiv.style.fontSize = "0.85rem";
    senderDiv.style.opacity = "0.7";
    senderDiv.style.lineHeight = "1.3";
    console.log("messageData", messageData);
    senderDiv.innerHTML = sender === "user" ? `
      ${new Date(messageData.createdAt).toLocaleTimeString()}
    ` : `
      ${messageData.sender || "Assistant"} - ${new Date(messageData.createdAt || new Date()).toLocaleTimeString()}
    `;
    messageDiv.appendChild(senderDiv);
    
    const placeholder = chatMessages.querySelector("div[style*='text-align:center']");
    if (placeholder) {
      placeholder.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function selectConversation(conversation) {
    input.disabled = false;
    sendButton.disabled = false;
    form.classList.remove("disabled");
    
    chatMessages.innerHTML = `
      <div style="color:var(--text-secondary);text-align:center;margin-top:2rem;">
        Start chatting in this conversation...
      </div>
    `;
    
    const conversationItems = conversationList.querySelectorAll(".conversation-item");
    conversationItems.forEach(item => {
      item.classList.remove("active");
      item.style.background = "var(--background)";
      item.style.borderColor = "transparent";
    });
    
    const selectedItem = conversationList.querySelector(`[data-conversation-id="${conversation._id}"]`);
    if (selectedItem) {
      selectedItem.classList.add("active");
      selectedItem.style.background = "var(--primary)";
      selectedItem.style.borderColor = "var(--primary)";
      selectedItem.style.color = "#FFFFFF";
      
      const titleElement = selectedItem.querySelector("div:first-child");
      const messageElement = selectedItem.querySelector("div:nth-child(2)");
      const dateElement = selectedItem.querySelector("div:last-child");
      
      if (titleElement) {
        titleElement.style.color = "#FFFFFF";
      }
      if (messageElement) {
        messageElement.style.color = "rgba(255,255,255,0.8)";
      }
      if (dateElement) {
        dateElement.style.color = "rgba(255,255,255,0.6)";
      }
    }
    selectedConversation = conversation;
    showCouncilConfigForm();
    loadCouncilMembers(conversation._id);
    loadConversationMessages(conversation._id);
  };

  // Council Management System
  const councilMembersContainer = document.getElementById("councilMembers");
  const addMemberBtn = document.getElementById("addMemberBtn");
  const addMemberContainer = document.getElementById("addMemberContainer");
  const saveCouncilBtn = document.getElementById("saveCouncilBtn");
  const councilStatus = document.getElementById("councilStatus");
  const councilNoConversation = document.getElementById("councilNoConversation");
  const councilConfigForm = document.getElementById("councilConfigForm");
  
  const MAX_COUNCIL_MEMBERS = 3;

  // Function to show/hide council configuration based on conversation selection
  function showCouncilConfigForm() {
    if (councilNoConversation && councilConfigForm) {
      councilNoConversation.style.display = "none";
      councilConfigForm.classList.add("active");
    }
  }

  function hideCouncilConfigForm() {
    if (councilNoConversation && councilConfigForm) {
      councilNoConversation.style.display = "flex";
      councilConfigForm.classList.remove("active");
    }
  }

  // Hide council form by default (no conversation selected)
  if (councilNoConversation && councilConfigForm) {
    hideCouncilConfigForm();
  }


  // Load saved council configuration
  function loadCouncilConfig() {
    const saved = localStorage.getItem("councilConfig");
    if (saved) {
      try {
        const config = JSON.parse(saved);
        const members = config.members || [];
        renderCouncilMembers(members);
      } catch (e) {
        console.error("Error loading council config:", e);
        renderCouncilMembers([]);
      }
    } else {
      renderCouncilMembers([]);
    }
  }
  
  // Add a new council member
  function addCouncilMember() {
    const currentMembers = getCurrentMembers();
    if (currentMembers.length >= MAX_COUNCIL_MEMBERS) {
      showCouncilStatus(`Maximum of ${MAX_COUNCIL_MEMBERS} council members allowed.`, "error");
      return;
    }
    
    const newMember = {
      name: "",
      baseModel: baseModels[0].value,
      basePersona: "",
      active: true,
      councilListingOrder: currentMembers.length + 1
    };
    
    currentMembers.push(newMember);
    renderCouncilMembers(currentMembers);
  }
  
  // Get current members from DOM
  function getCurrentMembers() {
    const members = [];
    const memberCards = councilMembersContainer.querySelectorAll(".council-member-card");
    
    memberCards.forEach((card, index) => {
      const nameInput = document.getElementById(`memberName-${index}`);
      const modelSelect = document.getElementById(`memberModel-${index}`);
      const personaTextarea = document.getElementById(`memberPersona-${index}`);
      const activeCheckbox = document.getElementById(`memberActive-${index}`);
      
      if (nameInput && modelSelect) {
        members.push({
          name: nameInput.value.trim(),
          baseModel: modelSelect.value,
          basePersona: personaTextarea ? personaTextarea.value : "",
          active: activeCheckbox ? activeCheckbox.checked : true,
          councilListingOrder: index + 1
        });
      }
    });
    
    return members;
  }

  // Render council member cards
  function renderCouncilMembers(savedMembers) {
    councilMembersContainer.innerHTML = "";
    console.log("savedMembers", savedMembers);
    
    const memberCount = savedMembers.length;
    const canAddMore = memberCount < MAX_COUNCIL_MEMBERS;
    
    // Update add member button
    if (addMemberBtn) {
      addMemberBtn.disabled = !canAddMore;
      if (addMemberContainer) {
        addMemberContainer.style.display = canAddMore ? "block" : "none";
      }
    }
    
    for (let i = 0; i < memberCount; i++) {
      const memberCard = document.createElement("div");
      const savedMember = savedMembers[i] || {};
      const isActive = savedMember.active !== false; // Default to true
      
      memberCard.className = `council-member-card ${isActive ? "" : "inactive"}`;
      
      memberCard.innerHTML = `
        <div class="council-member-field">
          <label for="memberName-${i}">Name</label>
          <input 
            type="text" 
            id="memberName-${i}" 
            placeholder="Enter member name..."
            value="${savedMember.name || ""}"
            maxlength="50"
          >
        </div>
        <div class="council-member-field">
          <label for="memberModel-${i}">AI Model</label>
          <select id="memberModel-${i}">
            ${baseModels.map((model) => 
              `<option value="${model.value}" ${savedMember.baseModel === model.value ? "selected" : ""}>${model.label}</option>`
            ).join("")}
          </select>
        </div>
        <div class="council-member-active-toggle">
          <label>
            <input 
              type="checkbox" 
              id="memberActive-${i}" 
              ${isActive ? "checked" : ""}
            >
            <span>Active</span>
          </label>
        </div>
        <div class="council-member-actions">
          <button type="button" class="council-member-edit-btn" data-member-index="${i}">
            <i class="fas fa-edit"></i> Edit Persona
          </button>
        </div>
        <textarea id="memberPersona-${i}" style="display: none;">${(savedMember.basePersona || "").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
      `;
      councilMembersContainer.appendChild(memberCard);
      
      // Add event listener for edit button
      const editBtn = memberCard.querySelector(`[data-member-index="${i}"]`);
      if (editBtn) {
        editBtn.addEventListener("click", () => openPersonaModal(i, savedMember));
      }
      
      // Add event listener for active toggle
      const activeCheckbox = memberCard.querySelector(`#memberActive-${i}`);
      if (activeCheckbox) {
        activeCheckbox.addEventListener("change", function() {
          memberCard.classList.toggle("inactive", !this.checked);
        });
      }
    }
  }

  // Save council configuration
  async function saveCouncilConfig() {
    // Check if a conversation is selected
    if (!selectedConversation || !selectedConversation._id) {
      showCouncilStatus("Please select a conversation first.", "error");
      return;
    }

    const members = getCurrentMembers();
    
    // Validate all members have names
    for (let i = 0; i < members.length; i++) {
      if (!members[i].name) {
        showCouncilStatus("Please enter a name for all council members.", "error");
        return;
      }
    }
    
    if (members.length === 0) {
      showCouncilStatus("Please add at least one council member.", "error");
      return;
    }
    
    const config = {
      count: members.length,
      members: members,
      savedAt: new Date().toISOString()
    };
    
    // Disable save button while saving
    saveCouncilBtn.disabled = true;
    saveCouncilBtn.textContent = "Saving...";
    
    try {
      // Save to backend API
      const response = await axios.post(`/api/conversation/${selectedConversation._id}/council`, {
          councilMembers: members,
        },
      );
      
      if (response.data && response.data.success) {
        // Also save to localStorage as backup
        localStorage.setItem("councilConfig", JSON.stringify(config));
        showCouncilStatus("Council configuration saved successfully!", "success");
      } else {
        throw new Error(response.data?.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving council config:", error);
      const errorMessage = error.response?.data?.message || error.message || "Error saving configuration. Please try again.";
      showCouncilStatus(errorMessage, "error");
    } finally {
      // Re-enable save button
      saveCouncilBtn.disabled = false;
      saveCouncilBtn.textContent = "Save Council Configuration";
    }
  }

  // Show status message
  function showCouncilStatus(message, type) {
    councilStatus.textContent = message;
    councilStatus.className = `council-status ${type}`;
    councilStatus.style.display = "block";
    
    setTimeout(() => {
      councilStatus.style.display = "none";
    }, 3000);
  }

  // Event listeners
  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", addCouncilMember);
  }

  saveCouncilBtn.addEventListener("click", saveCouncilConfig);

  // Council Persona Modal
  const councilPersonaModal = document.getElementById("councilPersonaModal");
  const councilPersonaModalTitle = document.getElementById("councilPersonaModalTitle");
  const councilPersonaTextarea = document.getElementById("councilPersonaTextarea");
  const councilPersonaModalClose = document.getElementById("councilPersonaModalClose");
  const councilPersonaCancelBtn = document.getElementById("councilPersonaCancelBtn");
  const councilPersonaSaveBtn = document.getElementById("councilPersonaSaveBtn");
  
  let currentEditingMemberIndex = null;

  // Open persona modal
  function openPersonaModal(memberIndex, memberData) {
    currentEditingMemberIndex = memberIndex;
    const memberName = memberData?.name || `Council Member ${memberIndex + 1}`;
    
    if (councilPersonaModalTitle) {
      councilPersonaModalTitle.textContent = `Edit Base Persona - ${memberName}`;
    }
    
    // Get current persona value
    const personaTextarea = document.getElementById(`memberPersona-${memberIndex}`);
    const currentPersona = personaTextarea ? personaTextarea.value : (memberData?.basePersona || "");
    
    if (councilPersonaTextarea) {
      councilPersonaTextarea.value = currentPersona;
    }
    
    if (councilPersonaModal) {
      councilPersonaModal.classList.add("show");
      // Focus on textarea
      if (councilPersonaTextarea) {
        setTimeout(() => councilPersonaTextarea.focus(), 100);
      }
    }
  }

  // Close persona modal
  function closePersonaModal() {
    if (councilPersonaModal) {
      councilPersonaModal.classList.remove("show");
    }
    currentEditingMemberIndex = null;
  }

  // Save persona
  function savePersona() {
    if (currentEditingMemberIndex === null) return;
    
    const personaValue = councilPersonaTextarea ? councilPersonaTextarea.value : "";
    const personaTextarea = document.getElementById(`memberPersona-${currentEditingMemberIndex}`);
    
    if (personaTextarea) {
      personaTextarea.value = personaValue;
    }
    
    closePersonaModal();
  }

  // Event listeners for persona modal
  if (councilPersonaModalClose) {
    councilPersonaModalClose.addEventListener("click", closePersonaModal);
  }
  
  if (councilPersonaCancelBtn) {
    councilPersonaCancelBtn.addEventListener("click", closePersonaModal);
  }
  
  if (councilPersonaSaveBtn) {
    councilPersonaSaveBtn.addEventListener("click", savePersona);
  }
  
  // Close modal when clicking outside
  if (councilPersonaModal) {
    councilPersonaModal.addEventListener("click", function(e) {
      if (e.target === councilPersonaModal) {
        closePersonaModal();
      }
    });
  }

  // Initialize council management
  // Only load config if elements exist (they should, but check to be safe)
  if (councilMembersContainer) {
    loadCouncilConfig();
  }
  
  // Ensure the "no conversation" message is shown by default
  if (councilNoConversation && councilConfigForm) {
    hideCouncilConfigForm();
  }
});