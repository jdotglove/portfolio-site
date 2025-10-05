document.getElementById('login-form').addEventListener('submit', async function (e) {
    console.log('=== Login Form Submit Debug ===');
    console.log('Event:', e);
    console.log('Preventing default...');
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('login-message');
    messageDiv.textContent = '';
    try {
        //const response = await axios.post('/api/admin/login', { username, password });
        const response = await axios({
            method: 'POST',
            url: '/api/admin/login',
            data: { username, password },
        })
        if (response.data && response.data.success) {
            const session = response.data.session;
            console.log('Login successful:', session);
            messageDiv.style.color = 'var(--success)';
            messageDiv.textContent = 'Login successful! Redirecting...';
            document.cookie = `session_token=${session.token}; path=/; httpOnly; secure; sameSite=strict; max-age=86400`;
            // Redirect to knowledge hub (session token is stored in httpOnly cookie)
            setTimeout(() => {
                window.location.href = '/knowledge-hub';
            }, 1000);
        } else {
            messageDiv.style.color = 'var(--primary)';
            messageDiv.textContent = response.data.message || 'Login failed.';
        }
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error response:', error.response);
        messageDiv.style.color = 'var(--primary)';
        messageDiv.textContent = error.response?.data?.message || 'An error occurred during login.';
    }
});

// Add this to see if the form is being submitted multiple times
let submitCount = 0;
document.getElementById('login-form').addEventListener('submit', function(e) {
    submitCount++;
    console.log(`Form submit event #${submitCount}`);
});