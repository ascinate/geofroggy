document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('id');
    const token = localStorage.getItem('token');

    if (!storyId) {
        showError('No story ID provided.');
        return;
    }

    try {
        // Fetch story details
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/stories/${storyId}`);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Story not found.');
            }
            throw new Error('Failed to fetch story details.');
        }

        const story = await response.json();
        updateUI(story);

        // Check completion status if logged in
        if (token) {
            checkCompletionStatus(storyId, token);
        }
    } catch (error) {
        console.error('Error fetching story:', error);
        showError(error.message);
    }
});

async function checkCompletionStatus(storyId, token) {
    try {
        const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/stories/progress/${storyId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.completed) {
                showCompletedBadge();
            } else {
                addCompleteButton(storyId, token);
            }
        }
    } catch (err) {
        console.error('Error checking progress:', err);
    }
}

function showCompletedBadge() {
    const meta = document.querySelector('.story-meta');
    const badge = document.createElement('span');
    badge.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #10b981;"></i> Completed`;
    badge.style.color = '#10b981';
    badge.style.fontWeight = '700';
    meta.appendChild(badge);
}

function addCompleteButton(storyId, token) {
    const footer = document.querySelector('.story-footer');
    const btnContainer = document.createElement('div');
    btnContainer.id = 'complete-btn-container';
    btnContainer.innerHTML = `
        <button id="mark-complete-btn" class="btn btn-warning rounded-pill px-4 fw-bold" style="background: #f5d372; border: 1px solid #d4a33b; color: #451a03;">
            <i class="fa-solid fa-check-double"></i> Complete Story & Earn XP
        </button>
    `;
    footer.prepend(btnContainer);

    document.getElementById('mark-complete-btn').onclick = async () => {
        const btn = document.getElementById('mark-complete-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Processing...';

        try {
            const res = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/stories/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ storyId })
            });

            if (res.ok) {
                const data = await res.json();
                btnContainer.innerHTML = `
                    <div class="animate__animated animate__bounceIn" style="color: #10b981; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-trophy" style="font-size: 24px;"></i>
                        <div>
                            <div>Story Completed!</div>
                            <div style="font-size: 12px;">+${data.xp_rewarded} XP Earned</div>
                        </div>
                    </div>
                `;
                showCompletedBadge();
                // Optionally update local stats
                const stats = JSON.parse(localStorage.getItem('stats') || '{}');
                stats.xp = data.total_xp;
                localStorage.setItem('stats', JSON.stringify(stats));
            } else {
                const errorData = await res.json();
                console.error('Story Progress Error:', errorData.error);
                throw new Error(errorData.error || 'Failed to update progress');
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'Retry Completion';
            console.error('Frontend Error:', err);
        }
    };
}

function updateUI(story) {
    // Update UI elements with story data
    document.getElementById('story-title').textContent = story.title || 'Untitled Story';
    document.getElementById('story-category').textContent = story.category || 'General';
    document.getElementById('read-time').textContent = story.read_time || '5';
    
    // Format date
    const publishDate = story.created_at ? new Date(story.created_at).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
    }) : 'April 25, 2026';
    
    document.getElementById('publish-date').textContent = publishDate;
    
    if (story.image_url) {
        document.getElementById('story-banner').src = story.image_url;
    }
    
    document.getElementById('story-content').innerHTML = story.content || '<p>No content available for this story.</p>';
    document.title = `${story.title || 'Story'} | Geofroggy`;
}

function showError(message) {
    const container = document.querySelector('.page-wrapper');
    if (container) {
        container.innerHTML = `
            <div class="position-relative" style="z-index: 2; text-align: center; padding: 100px 40px;">
                <i class="ri-error-warning-line" style="font-size: 80px; color: #ef4444;"></i>
                <h2 class="mt-4" style="font-family: 'Playfair Display', serif; font-size: 42px; color: #451a03;">Oops!</h2>
                <p class="text-muted" style="font-size: 18px;">${message}</p>
                <a href="map.html" class="btn btn-warning mt-4 rounded-pill px-5 fw-bold" style="background: #854d0e; color: white; border: none; padding: 12px 30px;">Back to Map</a>
            </div>
        `;
    }
}
