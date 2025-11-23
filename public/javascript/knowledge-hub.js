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
      // Add user message to chat
      addMessageToChat("user", message);
      const conversationItem = document.getElementById(`conversation-${selectedConversation._id}`);
      conversationItem.style.background = 'var(--primary)';
      conversationItem.style.borderColor = 'var(--primary)';
      conversationItem.style.color = 'white';
       // Create the conversation content
       const title = selectedConversation.name || selectedConversation.title || `Conversation ${index + 1}`;
       const lastMessage = selectedConversation.lastMessage ? 
         (selectedConversation.lastMessage.length > 50 ? 
          selectedConversation.lastMessage.substring(0, 50) + '...' : 
          selectedConversation.lastMessage) : 
         'No messages yet';
       const date = selectedConversation.updatedAt ? 
         new Date(selectedConversation.updatedAt).toLocaleDateString() : '';
 
       const time = selectedConversation.updatedAt ? 
         new Date(selectedConversation.updatedAt).toLocaleTimeString() : '';
       
         conversationItem.innerHTML = `
         <div style='font-weight:500;color:var(--text);margin-bottom:0.25rem;'>
           ${title}
         </div>
         <div style='font-size:0.85rem;opacity:0.7;line-height:1.3;'>
           ${lastMessage}
         </div>
         <div style='font-size:0.75rem;margin-top:0.25rem;opacity:0.5;'>
           ${date} ${time}
         </div>
       `;


      input.value = "";
      
      // Close any existing EventSource connection
      if (currentEventSource) {
        currentEventSource.close();
      }

      // Create new EventSource for streaming response
      const eventSource = new EventSource(`/api/knowledge?message=${encodeURIComponent(message)}&conversationId=${selectedConversation._id || ''}&userId=${currentUserId}`);
      currentEventSource = eventSource;

      // Handle streaming messages
      eventSource.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (event.data && event.data !== "") {
            switch(data.type) {
              case 'connected':
                console.log('Connected to knowledge stream');
                break;
                
              case 'message':
                // Append chunk to assistant message
                addMessageToChat("assistant", data.message);
                break;
                
              case 'complete':
                console.log('Streaming complete');
                eventSource.close();
                currentEventSource = null;
                break;
                
              case 'error':
                console.error('Streaming error:', data.message);
                addMessageToChat("assistant", "Sorry, I encountered an error. Please try again.");
                eventSource.close();
                currentEventSource = null;
                break;
            }
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = function(event) {
        console.error('EventSource error:', event);
        addMessageToChat("assistant", "Connection error. Please try again.");
        eventSource.close();
        currentEventSource = null;
      };

    } catch (error) {
      console.error("Error sending message:", error);
      addMessageToChat("assistant", "Sorry, I encountered an error. Please try again.");
    }
  });

  // Modal functionality
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

  // Handle input changes to enable/disable create button
  conversationNameInput.addEventListener("input", function() {
    createConversationBtn.disabled = !this.value.trim();
  });

  // Handle Enter key in input
  conversationNameInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter" && this.value.trim()) {
      createConversation();
    }
  });

  // Handle cancel button
  cancelConversationBtn.addEventListener("click", hideConversationModal);

  // Handle create button
  createConversationBtn.addEventListener("click", createConversation);

  // Handle clicking outside modal to close
  conversationModal.addEventListener("click", function(e) {
    if (e.target === conversationModal) {
      hideConversationModal();
    }
  });

  // Function to create conversation
  async function createConversation() {
    const conversationName = conversationNameInput.value.trim();
    if (!conversationName) return;

    try {
      createConversationBtn.disabled = true;
      // Create a new conversation via API
      const response = await axios.post("/api/conversation", { name: conversationName });
      
      if (response.data && response.data.success) {
        // Hide modal
        hideConversationModal();
        
        // Reload conversations to show the new one
        await loadConversations();
        
        // Automatically select the newly created conversation
        if (response.data.conversation && response.data.conversation.id) {
          // Small delay to ensure the DOM is updated
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

  // Disable input and send button by default
  input.disabled = true;
  sendButton.disabled = true;
  form.classList.add("disabled");

  // Load conversations on page load
  loadConversations();

  // Function to load conversations from API
  async function loadConversations() {
    try {
      // Show loading state
      //conversationList.innerHTML = "<li style='color:var(--text-secondary);text-align:center;padding:1rem;'>Loading conversations...</li>";
      
      const response = await axios.get("/api/conversation");
      
      if (response.data && response.data.conversations) {
        displayConversations(response.data.conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      } else {
        displayConversations([]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      document.getElementById('newConversationBtn').style.display = 'none';
      // Show error state with retry option
      conversationList.innerHTML = `
        <li style='color:var(--text-secondary);text-align:center;padding:1rem;'>
          <p>Failed to load conversations</p>
          <br>
          <a 
            href='/login' 
            style='text-decoration:none;margin-top:0.5rem;padding:0.5rem 1rem;background:var(--primary);color:white;border:none;border-radius:4px;cursor:pointer;'
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
          addMessageToChat("user", messageData.body);
        } else {
          addMessageToChat("assistant", messageData.body);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  // Function to display conversations in the sidebar
  function displayConversations(conversations) {
    if (conversations.length === 0) {
      conversationList.innerHTML = `
        <li style='color:var(--text-secondary);text-align:center;padding:1rem;'>
          No conversations yet
          <br>
          <small>Start a new conversation below</small>
        </li>
      `;
      return;
    }

    // Clear the list first
    conversationList.innerHTML = '';
    
    conversations.forEach((conversation, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'conversation-item';
      listItem.setAttribute('data-conversation-id', conversation._id);
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
      
      // Add hover effect
      listItem.addEventListener('mouseenter', function() {
        if (!this.classList.contains('active')) {
          this.style.background = 'var(--surface)';
          this.style.borderColor = 'var(--border)';
        }
      });
      
      listItem.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) {
          this.style.background = 'var(--background)';
          this.style.borderColor = 'transparent';
        }
      });
      
      // Add click handler
      listItem.addEventListener('click', function() {
        currentUserId = conversation.user;
        selectConversation(conversation);
      });
      
      // Create the conversation content
      const title = conversation.name || conversation.title || `Conversation ${index + 1}`;
      const lastMessage = conversation.lastMessage ? 
        (conversation.lastMessage.length > 50 ? 
          conversation.lastMessage.substring(0, 50) + '...' : 
          conversation.lastMessage) : 
        'No messages yet';
      const date = conversation.updatedAt ? 
        new Date(conversation.updatedAt).toLocaleDateString() : '';
      const time = conversation.updatedAt ? 
        new Date(conversation.updatedAt).toLocaleTimeString() : '';
      
      listItem.innerHTML = `
        <div style='font-weight:500;color:var(--text);margin-bottom:0.25rem;'>
          ${title}
        </div>
        <div style='font-size:0.85rem;opacity:0.7;line-height:1.3;'>
          ${lastMessage}
        </div>
        <div style='font-size:0.75rem;margin-top:0.25rem;opacity:0.5;'>
          ${date} ${time}
        </div>
      `;
      
      // Add to the list
      conversationList.appendChild(listItem);
    });
  }

  // Function to add message to chat
  async function addMessageToChat(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.style.whiteSpace = 'pre-wrap';
    messageDiv.innerHTML = message;
    
    // Remove the placeholder message if it exists
    const placeholder = chatMessages.querySelector("div[style*='text-align:center']");
    if (placeholder) {
      placeholder.remove();
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (sender === "assistant") {
      await loadConversations();
    }
    
  }

  // Function to select a conversation
  function selectConversation(conversation) {
    // Enable input and send button when a conversation is selected
    input.disabled = false;
    sendButton.disabled = false;
    form.classList.remove("disabled");
    
    // Clear chat messages and show placeholder
    chatMessages.innerHTML = `
      <div style="color:var(--text-secondary);text-align:center;margin-top:2rem;">
        Start chatting in this conversation...
      </div>
    `;
    
    // Update active state in sidebar
    const conversationItems = conversationList.querySelectorAll('.conversation-item');
    conversationItems.forEach(item => {
      item.classList.remove('active');
      item.style.background = 'var(--background)';
      item.style.borderColor = 'transparent';
    });
    
    const selectedItem = conversationList.querySelector(`[data-conversation-id="${conversation._id}"]`);
    if (selectedItem) {
      selectedItem.classList.add('active');
      selectedItem.style.background = 'var(--primary)';
      selectedItem.style.borderColor = 'var(--primary)';
      selectedItem.style.color = 'white';
      
      // Update text colors for selected item
      const titleElement = selectedItem.querySelector('div:first-child');
      const messageElement = selectedItem.querySelector('div:nth-child(2)');
      const dateElement = selectedItem.querySelector('div:last-child');
      
      if (titleElement) {
        titleElement.style.color = 'white';
      }
      if (messageElement) {
        messageElement.style.color = 'rgba(255,255,255,0.8)';
      }
      if (dateElement) {
        dateElement.style.color = 'rgba(255,255,255,0.6)';
      }
    }
    selectedConversation = conversation;
    // TODO: Load conversation messages
    // This would typically make another API call to get the conversation history
    loadConversationMessages(conversation._id);
  };
});