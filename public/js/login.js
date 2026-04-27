let form = document.getElementById("loginForm");
let emailInput = document.getElementById("email");
let passwordInput = document.getElementById("password");

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // 🔥 stop page reload

    let email = emailInput.value;
    let password = passwordInput.value;

    try {
        const baseUrl = window.APP_CONFIG.API_BASE_URL.replace(/\/$/, ""); // Remove trailing slash if present
        const apiUrl = `${baseUrl}/api/auth/login`;

        console.log("Attempting login at:", apiUrl);

        const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            showAlert("success", "Login Successful. Redirecting...");
            setTimeout(() => {
                localStorage.setItem("token", data.session.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("profile", JSON.stringify(data.profile || {}));
                localStorage.setItem("stats", JSON.stringify(data.stats || {}));
                window.location.href = "/dashboard";
            }, 2000);
        } else {
            showAlert("error", "Login Failed: " + (data.error || "Invalid credentials"));
        }

        console.log(data);

    } catch (err) {
        console.error("Login error:", err);
        showAlert("error", "⚠️ Something went wrong");
    }
});