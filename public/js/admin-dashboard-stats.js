/**
 * Geofroggy Admin Dashboard Stats Loader
 * Fetches real-time data for the dashboard stats and recent activity.
 */

document.addEventListener('DOMContentLoaded', () => {
    const apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : '';
    const token = localStorage.getItem('token');

    if (!token) return;

    async function fetchDashboardData() {
        try {
            // 1. Fetch All Users
            const usersRes = await fetch(`${apiUrl}/api/auth/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const usersData = await usersRes.json();

            // 2. Fetch Missions
            const missionsRes = await fetch(`${apiUrl}/api/manage/missions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const missionsData = await missionsRes.json();

            if (usersData.status === 'success' && missionsData.status === 'success') {
                updateStats(usersData.data, missionsData.data);
                updateRecentTable(usersData.data);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        }
    }

    function updateStats(users, missions) {
        // Total Users
        const totalUsers = users.length;
        animateValue('total-users-value', totalUsers);
        
        // Active Missions
        const activeMissions = missions.filter(m => m.is_active).length;
        animateValue('active-missions-value', activeMissions);
        
        // Total XP Distributed
        let totalXp = 0;
        users.forEach(u => {
            const stats = Array.isArray(u.stats) ? u.stats[0] : u.stats;
            totalXp += (stats ? stats.xp || 0 : 0);
        });
        
        const xpDisplay = totalXp > 1000 ? (totalXp / 1000).toFixed(1) + 'k' : totalXp;
        document.getElementById('total-xp-value').textContent = xpDisplay;

        // Retention Rate (Proxy: % of users with XP > 100)
        const activeUsers = users.filter(u => {
            const stats = Array.isArray(u.stats) ? u.stats[0] : u.stats;
            return (stats ? stats.xp || 0 : 0) > 100;
        }).length;
        const retentionRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
        document.getElementById('retention-rate-value').textContent = `${retentionRate}%`;

        // Update Trends (Mocking growth based on recent joins)
        const recentJoins = users.filter(u => {
            const joined = new Date(u.created_at);
            const now = new Date();
            return (now - joined) < (7 * 24 * 60 * 60 * 1000); // Past 7 days
        }).length;
        
        const growth = totalUsers > 0 ? Math.round((recentJoins / totalUsers) * 100) : 0;
        document.getElementById('total-users-trend').innerHTML = `<i class="ri-arrow-up-line"></i> ${growth}% growth`;
        
        const newMissionsToday = missions.filter(m => {
            const created = new Date(m.created_at);
            const today = new Date();
            return created.toDateString() === today.toDateString();
        }).length;
        document.getElementById('active-missions-trend').innerHTML = `<i class="ri-arrow-up-line"></i> ${newMissionsToday} new today`;
    }

    function updateRecentTable(users) {
        const tbody = document.getElementById('recent-activity-table-body');
        if (!tbody) return;

        // Sort by joined date descending
        const recentUsers = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

        if (recentUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-dim">No recent activity found.</td></tr>';
            return;
        }

        tbody.innerHTML = recentUsers.map(user => {
            const stats = Array.isArray(user.stats) ? user.stats[0] : user.stats;
            const missionsCount = stats ? (stats.missions_completed || 0) : 0;
            const streak = stats ? (stats.streak || 0) : 0;
            const status = (new Date() - new Date(user.created_at)) < (30 * 24 * 60 * 60 * 1000) ? 'Active' : 'Dormant';
            const statusClass = status === 'Active' ? 'status-active' : 'status-pending';

            return `
                <tr>
                    <td>
                        <div class="user-cell">
                            <img src="${user.avatar_url || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`}"
                                class="user-avatar" alt="">
                            <div>
                                <div class="fw-bold">${user.username}</div>
                                <div class="text-dim" style="font-size: 0.75rem;">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${status}</span></td>
                    <td>${missionsCount}</td>
                    <td>${streak} Days</td>
                    <td>${new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td><i class="ri-more-2-fill text-dim cursor-pointer"></i></td>
                </tr>
            `;
        }).join('');
    }

    function animateValue(id, value) {
        const obj = document.getElementById(id);
        if (!obj) return;
        let start = 0;
        const end = parseInt(value);
        const duration = 1000;
        const range = end - start;
        let current = start;
        const increment = end > start ? 1 : -1;
        const stepTime = Math.abs(Math.floor(duration / range));
        
        if (range === 0) {
            obj.textContent = value;
            return;
        }

        const timer = setInterval(() => {
            current += increment;
            obj.textContent = current.toLocaleString();
            if (current == end) {
                clearInterval(timer);
            }
        }, Math.max(stepTime, 10));
    }

    fetchDashboardData();
});
