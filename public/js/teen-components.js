document.addEventListener('DOMContentLoaded', async () => {
    // Function to load favicon from assets
    function loadFavicon() {
        const faviconPath = '/assets/favicon.ico';
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconPath;
    }

    loadFavicon();

    const components = [
        { id: 'header-placeholder', file: '/components/teen-dash-header.html' },
        { id: 'footer-placeholder', file: '/components/teen-dash-footer.html' }
    ];

    async function syncSession() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
                ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
                : 'https://geo-froggy-backend.devhhtk.workers.dev';

            const res = await fetch(`${baseUrl}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("profile", JSON.stringify(data.profile || {}));
                localStorage.setItem("stats", JSON.stringify(data.stats || {}));
                populateDynamicData();
            } else if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'teen-login.html';
            }
        } catch (err) {
            console.error("Session sync failed:", err);
        }
    }

    function populateDynamicData() {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const profile = JSON.parse(localStorage.getItem("profile") || "{}");
        const stats = JSON.parse(localStorage.getItem("stats") || "{}");

        // Main Dashboard Data
        const heroName = document.getElementById("hero-username");
        if (heroName && user.username) heroName.textContent = `${user.username}!`;

        const levelNum = document.getElementById("dash-level-num");
        const levelTitle = document.getElementById("dash-level-title");
        const currentLevel = profile.level || 1;
        if (levelNum) levelNum.textContent = currentLevel;
        if (levelTitle) levelTitle.textContent = `Level ${currentLevel} Explorer`;

        const xpNeeded = document.getElementById("dash-progress-xp");
        const progressFill = document.getElementById("dash-progress-fill");
        const currentXP = stats.xp || 0;
        const targetXP = currentLevel * 1000; // Simplified logic
        const progressPercent = Math.min((currentXP / targetXP) * 100, 100);

        if (xpNeeded) xpNeeded.textContent = `${currentXP.toLocaleString()} XP / ${targetXP.toLocaleString()} XP to Level ${currentLevel + 1}`;
        if (progressFill) progressFill.style.width = `${progressPercent}%`;

        // Stats
        const streak = document.getElementById("stat-streak");
        if (streak) streak.textContent = stats.streak || 0;

        const accuracy = document.getElementById("stat-accuracy");
        if (accuracy) accuracy.textContent = `${stats.accuracy || 0}%`;

        const missions = document.getElementById("stat-missions");
        if (missions) missions.textContent = `${stats.missions_completed || 0}/50`;

        const countries = document.getElementById("stat-countries");
        if (countries) countries.textContent = stats.countries_explored || 0;

        // Header Data (populated after components load)
        updateHeaderDynamic(stats, profile, user);
    }

    function updateHeaderDynamic(stats, profile, user) {
        const headerStreak = document.getElementById("header-streak");
        if (headerStreak) headerStreak.textContent = stats.streak || 12;

        const headerLevel = document.getElementById("header-level");
        if (headerLevel) headerLevel.textContent = `Level ${profile.level || 4}`;

        const headerAvatar = document.querySelector(".mascot-avatar img");
        if (headerAvatar && user.avatar_url) {
            headerAvatar.src = user.avatar_url;
        }

        const userGreeting = document.querySelector(".user-greeting");
        if (userGreeting) userGreeting.textContent = `Hi, ${user.username || 'Alex'}`;
    }

    function setActiveLinks() {
        const path = window.location.pathname;
        const currentPath = path.split('/').filter(Boolean).pop() || '/';
        const cleanPath = currentPath.replace('.html', '');

        // Sidebar links
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const cleanHref = href.replace('.html', '').split('/').pop();
            if (cleanHref === cleanPath) {
                link.parentElement.classList.add('active');
            } else {
                link.parentElement.classList.remove('active');
            }
        });

        // Header links
        const headerLinks = document.querySelectorAll('.header-nav a');
        headerLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const cleanHref = href.replace('.html', '').split('/').pop();
            if (cleanHref === cleanPath) {
                link.parentElement.classList.add('active');
            } else {
                link.parentElement.classList.remove('active');
            }
        });
    }

    // Initial population from existing storage
    populateDynamicData();

    // Sync with backend
    await syncSession();

    // Load each component
    const loadPromises = components.map(async (comp) => {
        const placeholder = document.getElementById(comp.id);
        if (placeholder) {
            try {
                const response = await fetch(comp.file);
                if (response.ok) {
                    const html = await response.text();
                    placeholder.innerHTML = html;
                }
            } catch (err) {
                console.error(`Failed to load component ${comp.file}:`, err);
            }
        }
    });

    await Promise.all(loadPromises);

    // Refresh dynamic data once header is in the DOM
    const stats = JSON.parse(localStorage.getItem("stats") || "{}");
    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    updateHeaderDynamic(stats, profile, user);

    // Set active links after all components are loaded
    setActiveLinks();

    // Add logout functionality
    const logoutBtn = document.getElementById('sidebar-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                window.location.href = 'teen-login.html';
            }
        });
    }
});
