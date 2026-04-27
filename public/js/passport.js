document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch User Data
        const userRes = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();

        // Fetch Progress Data
        const progressRes = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/country/user/progress`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!progressRes.ok) throw new Error('Failed to fetch progress data');
        const progressData = await progressRes.json();

        renderUserProfile(userData);
        renderUserProgress(progressData);

    } catch (error) {
        console.error('Error:', error);
    }
});

function renderUserProfile(data) {
    const { profile, stats } = data;

    const nameEl = document.querySelector('.riht-text0158 h3');
    if (nameEl) nameEl.textContent = profile ? profile.username : 'Traveler';

    const avatarEl = document.querySelector('.top-centser figure img');
    if (avatarEl && profile && profile.avatar_url) {
        avatarEl.src = profile.avatar_url;
    }

    const xp = stats ? stats.xp : 0;
    const level = Math.floor(xp / 500) + 1;
    const nextLevelXp = level * 500;

    const levelEl = document.querySelector('.riht-text0158 p');
    if (levelEl) levelEl.textContent = `Geo Level ${level}`;

    const xpTextEl = document.querySelector('.nuosi h6');
    if (xpTextEl) xpTextEl.textContent = `${xp}/${nextLevelXp}`;
}

function renderUserProgress(progress) {
    const leftContainer = document.querySelector('.next-sections .row');
    const rightContainer = document.querySelector('.next-sections-right .row');

    if (!leftContainer || !rightContainer) return;

    leftContainer.innerHTML = '';
    rightContainer.innerHTML = '';

    // Filter visited countries (progress > 0) and sort by progress or name
    const visited = progress.filter(p => p.progress > 0).sort((a, b) => b.progress - a.progress);

    // Slots distribution: Left page (6 slots), Right page (9 slots)
    const totalLeftSlots = 6;
    const totalRightSlots = 9;

    // Fill Left Page
    for (let i = 0; i < totalLeftSlots; i++) {
        if (i < visited.length) {
            leftContainer.insertAdjacentHTML('beforeend', createCountryCard(visited[i]));
        } else {
            // Option: Show empty slot or lock on left page? 
            // The image shows only cards, but let's keep it clean. 
            // If the user wants "continuous", we just show stamps as they come.
            // Based on user request "show rest all locked", I will add locks to empty slots.
            leftContainer.insertAdjacentHTML('beforeend', createLockCard());
        }
    }

    // Fill Right Page
    for (let i = 0; i < totalRightSlots; i++) {
        const visitedIndex = i + totalLeftSlots;
        if (visitedIndex < visited.length) {
            rightContainer.insertAdjacentHTML('beforeend', createCountryCard(visited[visitedIndex]));
        } else {
            rightContainer.insertAdjacentHTML('beforeend', createLockCard());
        }
    }
}

function createCountryCard(item) {
    const countryIcon = getCountryIcon(item.countries?.name);
    return `
        <div class="col">
            <div class="card-proser015 text-center position-relative mb-3">
                <img src="/assets/thums-crads.png" class="hover-bg-i" alt="" />
                <div class="imags-progress-bar015 pt-2">
                    <img src="${countryIcon}" alt="${item.countries?.name}" style="width: 100px; height: 90px; object-fit: contain;" />
                    <h5 class="mt-1" style="font-size: 11px; font-weight: 800; color: #1e3a8a; margin-top: 5px;"> ${item.countries?.name || 'Unknown'} </h5>
                </div>
            </div>
        </div>
    `;
}

function createLockCard() {
    return `
        <div class="col">
            <div class="card-proser015 text-center position-relative mb-3">
                <img src="/assets/thums-crads.png" class="hover-bg-i" alt="" />
                <div class="imags-progress-bar015 pt-3">
                    <img src="/assets/locks.png" alt="Locked" style="width: 100px; opacity: 0.7;" />
                </div>
            </div>
        </div>
    `;
}

function getCountryIcon(name) {
    if (!name) return '/assets/c1.png';
    const n = name.toLowerCase();

    // Mapping icons based on available assets
    if (n.includes('india')) return '/assets/c5.png';
    if (n.includes('australia')) return '/assets/c1.png';
    if (n.includes('usa')) return '/assets/c1.png';
    if (n.includes('france')) return '/assets/c2.png';
    if (n.includes('japan')) return '/assets/c3.png';
    if (n.includes('china')) return '/assets/c4.png';
    if (n.includes('brazil')) return '/assets/c6.png';

    // Default fallback
    return '/assets/c1.png';
}
