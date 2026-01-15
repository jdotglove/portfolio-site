document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const messageDiv = document.getElementById("login-message");
    messageDiv.textContent = "";
    
    // Validate password confirmation
    if (password !== confirmPassword) {
        messageDiv.style.color = "var(--primary)";
        messageDiv.textContent = "Passwords do not match.";
        return;
    }
    
    try {
        const response = await axios.post("/api/admin/create", { username, password });
        if (response.data && response.data.success) {
            messageDiv.style.color = "var(--success)";
            messageDiv.textContent = "Admin created successfully! Logging in...";
            document.cookie = `session_token=${response.data.session.token}; path=/; httpOnly; secure; sameSite=strict; max-age=86400`;
            setTimeout(() => {
                window.location.href = "/knowledge-hub.html";
            }, 1000);
        } else {
            messageDiv.style.color = "var(--primary)";
            messageDiv.textContent = response.data.message || "Failed to create admin account.";
        }
    } catch (error) {
        messageDiv.style.color = "var(--primary)";
        messageDiv.textContent = error.response?.data?.message || "An error occurred while creating the account.";
    }
}); 