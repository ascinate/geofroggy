/**
 * dashboard.js
 * Handles dynamic data population for the dashboard using data from localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Load Data from LocalStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const profile = JSON.parse(localStorage.getItem('profile') || '{}');
    const stats = JSON.parse(localStorage.getItem('stats') || '{}');

    console.log('Dashboard data loaded:', { profile, stats });

    // 3. Update UI Elements

    // Dashboard Greeting/Title
    const dashboardTitle = document.querySelector('.profilest-text015 h1');
    if (dashboardTitle && profile.username) {
        dashboardTitle.innerText = `${profile.username}'s Dashboard`;
    }

    // Display Name and XP Bonus in card
    const displayName = document.getElementById('display-name');
    const xpBonus = document.getElementById('xp-bonus');
    if (displayName) {
        // Keep the structure but update the name
        const role = profile.role ? `(${profile.role})` : '';
        displayName.childNodes[0].textContent = `${profile.username || 'Adventurer'} ${role} `;
    }
    if (xpBonus) {
        xpBonus.innerText = `+${stats.xp || 0} XP Total`;
    }

    // Level Text
    const levelText = document.getElementById('level-text');
    if (levelText) {
        const level = stats.level || 1;
        const username = profile.username || 'Adventurer';
        levelText.innerText = `Great job, ${username}! You are currently Level ${level}.`;
    }

    // Progress Bar
    const levelProgress = document.getElementById('level-progress');
    if (levelProgress) {
        // Simple progress logic: assuming 1000 XP per level for visualization
        const xp = stats.xp || 0;
        const progress = (xp % 1000) / 10; // Percentage of current level progress
        levelProgress.style.width = `${Math.max(progress, 5)}%`; // Min 5% for visibility
        levelProgress.setAttribute('aria-valuenow', progress);
    }

    // Streak Count
    const streakCount = document.getElementById('streak-count');
    if (streakCount) {
        streakCount.innerText = stats.streak || 0;
    }

    const streakDaysText = document.querySelector('.curt-text01');
    if (streakDaysText) {
        streakDaysText.innerText = `Current Streak: ${stats.streak || 0} days`;
    }
});
