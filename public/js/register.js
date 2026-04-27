// frontend/js/register.js

let form = document.getElementById("registerForm");

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const age_group = document.getElementById("age_group").value;
    const role = document.getElementById("role").value;

    try {
        const baseUrl = window.APP_CONFIG.API_BASE_URL.replace(/\/$/, ""); // Remove trailing slash if present
        const apiUrl = `${baseUrl}/api/auth/register`;
        
        console.log("Attempting registration at:", apiUrl);

        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                email, 
                username, 
                password, 
                age_group, 
                role 
            })
        });

        const data = await res.json();

        if (res.ok) {
            showAlert("success", "Registration Successful! Welcome to Geofroggy.");
            window.location.href = "/login";
        } else {
            showAlert("error", "Registration Failed: " + (data.error || "Please check your details"));
        }

        console.log("Registration response:", data);

    } catch (err) {
        console.error("Registration error:", err);
        showAlert("error", "⚠️ Connection error. Make sure the backend is running.");
    }
});
