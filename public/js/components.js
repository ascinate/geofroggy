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
        { id: 'header-placeholder', file: '/components/header.html' },
        { id: 'footer-placeholder', file: '/components/footer.html' },
        { id: 'offcanvas-placeholder', file: '/components/offcanvas.html' }
    ];

    async function syncSession() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            // Ensure config is available
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
                // Token is invalid or expired
                localStorage.clear();
                if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
                    window.location.href = 'login.html';
                }
            }
        } catch (err) {
            console.error("Session sync failed:", err);
        }
    }

    // Always refresh data if logged in to keep streak updated
    await syncSession();

    // Function to set still not working...ive state for navigation links
    function setActiveLinks() {
        const path = window.location.pathname;
        const currentPath = path.split('/').filter(Boolean).pop() || '/';
        const cleanPath = currentPath.replace('.html', '');

        const navLinks = document.querySelectorAll('.navbar-nav .nav-link, .ft-menus .c-menus');

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;

            const cleanHref = href.replace('.html', '');

            // Normalize path for comparison
            if (cleanHref === cleanPath || (cleanPath === 'index' && cleanHref === 'index')) {
                link.classList.add('active');
                if (link.tagName === 'A' && link.classList.contains('nav-link')) {
                    link.setAttribute('aria-current', 'page');
                }
            } else {
                link.classList.remove('active');
            }
        });
    }

    // Load each component
    for (const comp of components) {
        const placeholder = document.getElementById(comp.id);
        if (placeholder) {
            try {
                const response = await fetch(comp.file);
                if (response.ok) {
                    const html = await response.text();
                    placeholder.innerHTML = html;

                    // After loading the component, we might need to re-initialize some behaviors
                    if (comp.id === 'header-placeholder') {
                        setActiveLinks();

                        const authWrapper = document.getElementById("auth-wrapper");
                        const tokenCount = document.getElementById("token-count");
                        const token = localStorage.getItem("token");
                        const statsStr = localStorage.getItem("stats");
                        const stats = statsStr ? JSON.parse(statsStr) : {};

                        if (token && authWrapper) {
                            authWrapper.innerHTML = `
                                <a href="dashboard.html" class="stat-item ns-btn d-none d-md-flex align-items-center login-btn">
                                    MyProfile
                                </a>
                            `;
                        }

                        if (tokenCount) {
                            tokenCount.innerHTML = stats.tokens || 0;
                        }
                    } else if (comp.id === 'footer-placeholder') {
                        setActiveLinks();
                    }
                }
            } catch (err) {
                console.error(`Failed to load component ${comp.file}:`, err);
            }
        }
    }
});
