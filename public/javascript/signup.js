document.getElementById("signup-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const messageDiv = document.getElementById("login-message");
    messageDiv.textContent = "";
    try {
        const response = await axios.post("/api/admin/create", { username, password });
        if (response.data && response.data.success) {
            messageDiv.style.color = "var(--success)";
            messageDiv.textContent = "Login successful!";
            // Optionally redirect or perform other actions
        } else {
            messageDiv.style.color = "var(--primary)";
            messageDiv.textContent = response.data.message || "Login failed.";
        }
    } catch (error) {
        messageDiv.style.color = "var(--primary)";
        messageDiv.textContent = error.response?.data?.message || "An error occurred during login.";
    }
}); 