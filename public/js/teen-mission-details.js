// public/js/teen-mission-details.js

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const missionId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (!missionId) {
        window.location.href = '/teen-challenges.html';
        return;
    }

    if (!token) {
        window.location.href = '/teen-login.html';
        return;
    }

    const elements = {
        loadingScreen: document.getElementById('loading-screen'),
        content: document.getElementById('mission-content'),
        title: document.getElementById('mission-title'),
        desc: document.getElementById('mission-desc'),
        img: document.getElementById('mission-img'),
        xp: document.getElementById('mission-xp'),
        type: document.getElementById('mission-type'),
        diff: document.getElementById('mission-difficulty'),
        statusBadge: document.getElementById('mission-status-badge'),
        actionContainer: document.getElementById('action-container')
    };

    const baseUrl = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL)
        ? window.APP_CONFIG.API_BASE_URL.replace(/\/$/, "")
        : 'https://geo-froggy-backend.devhhtk.workers.dev';
    let missionData = null;
    let userProgress = null;

    async function loadMissionDetails() {
        try {
            const [missionRes, progressRes] = await Promise.all([
                fetch(`${baseUrl}/api/missions/${missionId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${baseUrl}/api/missions/user/progress`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const mResult = await missionRes.json();
            const pResult = await progressRes.json();

            if (mResult.status === 'success') {
                missionData = mResult.data;
                // Find progress for this specific mission
                userProgress = (pResult.data || []).find(p => p.mission_id === missionId);
                renderDetails();
            } else {
                alert('Mission not found');
                window.location.href = '/teen-challenges.html';
            }
        } catch (err) {
            console.error('Error loading mission:', err);
            alert('Failed to load mission details.');
        } finally {
            elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                elements.loadingScreen.style.display = 'none';
                elements.content.style.display = 'block';
            }, 500);
        }
    }

    function renderDetails() {
        elements.title.textContent = missionData.title;
        elements.desc.textContent = missionData.description || 'Join this challenge to test your skills and uncover insights about our world.';
        elements.img.src = missionData.thumbnail_url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200';
        elements.xp.textContent = missionData.xp_reward;
        elements.type.textContent = missionData.mission_type.toUpperCase();
        elements.diff.textContent = getDifficultyText(missionData.xp_reward);

        updateActionUI();
    }

    function updateActionUI() {
        const status = userProgress ? userProgress.status : 'not-started';
        
        // Update badge
        elements.statusBadge.textContent = status.replace('-', ' ').toUpperCase();
        elements.statusBadge.className = `status-badge status-${status}`;

        // Update button
        elements.actionContainer.innerHTML = '';
        
        if (status === 'not-started') {
            const btn = document.createElement('button');
            btn.className = 'btn-mission-action btn-start';
            btn.innerHTML = 'Start Mission <i class="fa-solid fa-play"></i>';
            btn.onclick = startMission;
            elements.actionContainer.appendChild(btn);
        } else if (status === 'in-progress') {
            const btn = document.createElement('button');
            btn.className = 'btn-mission-action btn-complete';
            btn.innerHTML = 'Complete Mission <i class="fa-solid fa-check-double"></i>';
            btn.onclick = completeMission;
            elements.actionContainer.appendChild(btn);
        } else if (status === 'completed') {
            const btn = document.createElement('button');
            btn.className = 'btn-mission-action btn-completed';
            btn.innerHTML = 'Mission Completed <i class="fa-solid fa-circle-check"></i>';
            btn.disabled = true;
            elements.actionContainer.appendChild(btn);
        }
    }

    async function startMission() {
        try {
            const res = await fetch(`${baseUrl}/api/missions/${missionId}/start`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await res.json();
            if (result.status === 'success') {
                userProgress = result.data;
                updateActionUI();
                if (window.showToast) window.showToast('Mission started! Good luck.', 'info');
            }
        } catch (err) {
            console.error('Error starting mission:', err);
        }
    }

    async function completeMission() {
        try {
            const res = await fetch(`${baseUrl}/api/missions/${missionId}/update`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'completed',
                    progress: 100
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                userProgress = result.data;
                updateActionUI();
                if (window.showToast) {
                    window.showToast(`Mission Completed! +${missionData.xp_reward} XP`, 'success');
                } else {
                    alert(`Mission Completed! You earned ${missionData.xp_reward} XP.`);
                }
            }
        } catch (err) {
            console.error('Error completing mission:', err);
        }
    }

    function getDifficultyText(xp) {
        if (xp <= 100) return 'Beginner';
        if (xp <= 200) return 'Intermediate';
        return 'Advanced';
    }

    // Initial load
    loadMissionDetails();
});
