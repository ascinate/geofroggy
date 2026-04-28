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
        { id: 'sidebar-placeholder', file: '/components/teen-dash-sidebar.html' },
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
            } else if (res.status === 401) {
                localStorage.clear();
                window.location.href = 'teen-login.html';
            }
        } catch (err) {
            console.error("Session sync failed:", err);
        }
    }

    await syncSession();

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

    // Load each component
    const loadPromises = components.map(async (comp) => {
        const placeholder = document.getElementById(comp.id);
        if (placeholder) {
            try {
                const response = await fetch(comp.file);
                if (response.ok) {
                    const html = await response.text();
                    placeholder.innerHTML = html;

                    if (comp.id === 'header-placeholder') {
                        const statsStr = localStorage.getItem("stats");
                        const stats = statsStr ? JSON.parse(statsStr) : {};
                        const xpEl = placeholder.querySelector('.xp-badge span');
                        if (xpEl && stats.xp) {
                            xpEl.textContent = `${stats.xp.toLocaleString()} XP`;
                        }
                    }
                }
            } catch (err) {
                console.error(`Failed to load component ${comp.file}:`, err);
            }
        }
    });

    await Promise.all(loadPromises);
    
    // Set active links after all components are loaded
    setActiveLinks();
});
