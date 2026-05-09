/**
 * Geofroggy Admin Components Loader
 * Handles dynamic loading of sidebar, header, and footer for the admin panel.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const adminComponents = [
        { id: 'admin-sidebar-placeholder', file: '/components/admin-sidebar.html' },
        { id: 'admin-header-placeholder', file: '/components/admin-header.html' },
        { id: 'admin-footer-placeholder', file: '/components/admin-footer.html' }
    ];

    async function loadAdminComponents() {
        for (const comp of adminComponents) {
            const placeholder = document.getElementById(comp.id);
            if (!placeholder) continue;

            try {
                const response = await fetch(comp.file);
                if (response.ok) {
                    const html = await response.text();
                    placeholder.innerHTML = html;

                    // Trigger initialization after loading
                    if (comp.id === 'admin-sidebar-placeholder') {
                        initSidebar();
                        updateUserProfile();
                    }
                    if (comp.id === 'admin-header-placeholder') {
                        updateHeaderWelcome();
                    }
                }
            } catch (err) {
                console.error(`Failed to load admin component ${comp.file}:`, err);
            }
        }
    }

    function initSidebar() {
        const path = window.location.pathname;
        const currentPath = path.split('/').filter(Boolean).pop() || '/';
        const cleanPath = currentPath.replace('.html', '');

        const navLinks = document.querySelectorAll('.sidebar .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const cleanHref = href.replace('.html', '');
            if (cleanHref === cleanPath) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Mobile Sidebar Toggle (if needed)
        const sidebar = document.getElementById('sidebar');
        // Add toggle logic here if you have a toggle button in the header
    }

    function updateUserProfile() {
        const profileData = localStorage.getItem('profile');
        if (!profileData) return;
        const profile = JSON.parse(profileData);
        
        const userPill = document.querySelector('.user-pill');
        if (userPill) {
            const nameEl = userPill.querySelector('.name');
            const roleEl = userPill.querySelector('.role');
            const avatarEl = userPill.querySelector('img');

            if (nameEl) nameEl.textContent = profile.username || 'Admin User';
            if (roleEl) roleEl.textContent = profile.role === 'admin' ? 'Super Admin' : 'Staff Member';
            if (avatarEl && profile.avatar_url) avatarEl.src = profile.avatar_url;
        }
    }

    function updateHeaderWelcome() {
        const profileData = localStorage.getItem('profile');
        if (!profileData) return;
        const profile = JSON.parse(profileData);
        
        const headerDesc = document.querySelector('.header p');
        if (headerDesc) {
            headerDesc.textContent = `Welcome back, ${profile.username}. Here's what's happening today.`;
        }
    }

    // Protect Admin Session
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('admin-login.html')) {
        window.location.href = 'admin-login.html';
        return;
    }

    await loadAdminComponents();
});
