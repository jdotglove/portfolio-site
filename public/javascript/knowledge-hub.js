// Wait for DOM to load
let currentEventSource = null;
let baseUrl = null;

window.addEventListener("DOMContentLoaded", async function () {
  const form = document.querySelector(".chat-input-bar");
  const input = form.querySelector("input[type='text']");
  const sendButton = form.querySelector("button[type='submit']");
  const conversationList = document.querySelector(".chat-sidebar ul");
  const chatMessages = document.getElementById("chatMessages");
  const newConversationBtn = document.getElementById("newConversationBtn");

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
      
      if (currentEventSource) {
        currentEventSource.close();
      }

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
                addMessageToChat("assistant", data);
                break;
              case "complete":
                console.log("Streaming complete");
                eventSource.close();
                currentEventSource = null;
                break;
              case "error":
                console.error("Streaming error:", data.message);
                addMessageToChat("assistant", "Sorry, I encountered an error. Please try again.");
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
        addMessageToChat("assistant", "Connection error. Please try again.");
        eventSource.close();
        currentEventSource = null;
      };

    } catch (error) {
      console.error("Error sending message:", error);
      addMessageToChat("assistant", "Sorry, I encountered an error. Please try again.");
    }
  });

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

  loadConversations();

  async function loadConversations() {
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
    bodyDiv.style.whiteSpace = "pre-wrap";
    bodyDiv.innerHTML = messageData.body;
    messageDiv.appendChild(bodyDiv);
    const senderDiv = document.createElement("div");
    senderDiv.style.fontSize = "0.85rem";
    senderDiv.style.opacity = "0.7";
    senderDiv.style.lineHeight = "1.3";
    senderDiv.innerHTML = sender === "user" ? `
      ${new Date(messageData.createdAt).toLocaleTimeString()}
    ` : `
      ${messageData.sender} - ${new Date(messageData.createdAt).toLocaleTimeString()}
    `;
    messageDiv.appendChild(senderDiv);
    
    const placeholder = chatMessages.querySelector("div[style*='text-align:center']");
    if (placeholder) {
      placeholder.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (sender === "assistant") {
      await loadConversations();
    }
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
    loadConversationMessages(conversation._id);
  };
});