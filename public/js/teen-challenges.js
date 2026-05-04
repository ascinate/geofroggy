// public/js/teen-challenges.js

document.addEventListener('DOMContentLoaded', async () => {
    const missionsContainer = document.getElementById('missions-container');
    const missionsCount = document.getElementById('missions-count');
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/teen-login.html';
        return;
    }

    try {
        // Fetch missions and user progress in parallel
        const [missionsRes, progressRes] = await Promise.all([
            fetch(`${CONFIG.API_URL}/api/missions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${CONFIG.API_URL}/api/missions/user/progress`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const missionsData = await missionsRes.json();
        const progressData = await progressRes.json();

        if (missionsData.status === 'success') {
            renderMissions(missionsData.data, progressData.data || []);
        } else {
            missionsContainer.innerHTML = '<p class="error-msg">Failed to load missions.</p>';
        }
    } catch (err) {
        console.error('Error fetching missions:', err);
        missionsContainer.innerHTML = '<p class="error-msg">Connection error. Please try again later.</p>';
    }

    function renderMissions(missions, progressList) {
        missionsContainer.innerHTML = '';
        missionsCount.textContent = `All Missions (${missions.length})`;

        if (missions.length === 0) {
            missionsContainer.innerHTML = '<p class="empty-msg">No missions available right now. Check back later!</p>';
            return;
        }

        // Render Featured Mission (Hero)
        const featured = missions[0];
        const featuredProgress = progressList.find(p => p.mission_id === featured.id);
        const featuredStatus = featuredProgress ? featuredProgress.status : 'not-started';
        
        const heroSection = document.querySelector('.featured-mission-hero');
        if (heroSection && featured) {
            heroSection.innerHTML = `
                <img src="${featured.thumbnail_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200'}" alt="${featured.title}" class="hero-bg-img">
                <div class="hero-overlay">
                    <div class="hero-tag">
                        <i class="fa-solid fa-magnifying-glass"></i> Featured Mission
                    </div>
                    <h2>${featured.title}</h2>
                    <p>${featured.description || 'Take on our latest challenge and earn big rewards.'}</p>
                    <div class="hero-meta">
                        <span><i class="fa-regular fa-clock"></i> 30-45 min</span>
                        <span><i class="fa-solid fa-chart-simple"></i> ${getDifficultyText(featured.xp_reward)}</span>
                        <span class="reward-tag-green">+${featured.xp_reward} XP</span>
                        <button class="btn-start-hero" onclick="window.location.href='/teen-mission-details.html?id=${featured.id}'">
                            ${featuredStatus === 'completed' ? 'View Details' : 'Start Mission'} <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
                <div class="hero-xp-badge">
                    <span class="xp-val-big">${featured.xp_reward}</span>
                    <span class="xp-label-tiny">XP Reward</span>
                </div>
            `;
        }

        missions.forEach(mission => {
            const userProgress = progressList.find(p => p.mission_id === mission.id);
            const status = userProgress ? userProgress.status : 'not-started';
            
            const card = document.createElement('div');
            card.className = 'mission-card';
            card.innerHTML = `
                <div class="mission-thumb">
                    <img src="${mission.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400'}" alt="${mission.title}">
                    <div class="mission-status-tag status-${status}">
                        ${getStatusIcon(status)} ${formatStatus(status)}
                    </div>
                </div>
                <div class="mission-body">
                    <div class="mission-difficulty diff-${getDifficultyClass(mission.xp_reward)}">
                        <i class="fa-solid fa-circle"></i> ${getDifficultyText(mission.xp_reward)}
                    </div>
                    <h3 class="mission-title">${mission.title}</h3>
                    <p class="mission-desc">${mission.description || 'No description provided.'}</p>
                    <div class="mission-footer">
                        <div class="mission-xp">+${mission.xp_reward} XP</div>
                        <div class="mission-tools">
                            <i class="fa-solid fa-chart-line"></i>
                            <i class="fa-solid fa-earth-americas"></i>
                        </div>
                    </div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = `/teen-mission-details.html?id=${mission.id}`;
            });

            missionsContainer.appendChild(card);
        });
    }

    function getStatusIcon(status) {
        switch (status) {
            case 'completed': return '<i class="fa-solid fa-circle-check"></i>';
            case 'in-progress': return '<i class="fa-solid fa-circle-play"></i>';
            default: return '<i class="fa-regular fa-circle"></i>';
        }
    }

    function formatStatus(status) {
        if (status === 'in-progress') return 'In Progress';
        return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
    }

    function getDifficultyClass(xp) {
        if (xp <= 100) return 'beginner';
        if (xp <= 200) return 'intermediate';
        return 'advanced';
    }

    function getDifficultyText(xp) {
        if (xp <= 100) return 'Beginner';
        if (xp <= 200) return 'Intermediate';
        return 'Advanced';
    }
});
