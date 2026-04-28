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
        } else {
            // If not logged in, we might want to show a message or just hide the button
            document.getElementById('complete-btn-container').style.display = 'none';
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
                showCompletedState(data.xp_rewarded || 50);
            } else {
                showCompleteButton(storyId, token);
            }
        } else {
            // If progress check fails (e.g. story not found in progress table), show the button
            showCompleteButton(storyId, token);
        }
    } catch (err) {
        console.error('Error checking progress:', err);
        showCompleteButton(storyId, token);
    }
}

function showCompletedState(xp) {
    const container = document.getElementById('complete-btn-container');
    container.style.display = 'block';
    container.innerHTML = `
        <div class="completed-state animate__animated animate__fadeIn">
            <div class="completed-icon">
                <i class="fa-solid fa-check"></i>
            </div>
            <div>
                <div style="font-weight: 800; font-size: 1.1rem;">Story Completed!</div>
                <div style="font-size: 0.9rem; opacity: 0.8;">You've earned ${xp} XP for this mission.</div>
            </div>
        </div>
    `;
}

function showCompleteButton(storyId, token) {
    const container = document.getElementById('complete-btn-container');
    container.style.display = 'block';
    
    const btn = document.getElementById('mark-complete-btn');
    btn.onclick = async () => {
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
                showCompletedState(data.xp_rewarded);
                
                // Update local stats
                const stats = JSON.parse(localStorage.getItem('stats') || '{}');
                stats.xp = data.total_xp;
                localStorage.setItem('stats', JSON.stringify(stats));
                
                // Trigger an event or update header if necessary
                if (window.populateDynamicData) window.populateDynamicData();
            } else {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to update progress');
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = 'Retry Completion';
            console.error('Completion Error:', err);
            alert(err.message);
        }
    };
}

function updateUI(story) {
    // Basic fields
    document.getElementById('story-title').textContent = story.title || 'Untitled Story';
    document.getElementById('story-category').textContent = story.category || 'History';
    document.getElementById('read-time').textContent = story.read_time || Math.ceil((story.content || "").split(' ').length / 200) || '5';
    
    // Word count
    const words = (story.content || "").split(' ').length;
    document.getElementById('word-count').textContent = words.toLocaleString();
    
    // Banner image
    if (story.image_url) {
        document.getElementById('story-banner').src = story.image_url;
    }
    
    // Content parsing for premium look
    let contentHtml = story.content || '<p>No content available for this story.</p>';
    
    // Add a quote block if it's the specific Subhas Chandra Bose story for demo
    if (story.title && story.title.includes('Subhas Chandra Bose')) {
        contentHtml += `
            <div class="quote-block">
                <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                <div class="quote-text-wrapper">
                    <div class="quote-text">"Give me blood, and I will give you freedom."</div>
                    <div class="quote-author">— Subhas Chandra Bose</div>
                </div>
            </div>
            <p>From leading student movements to inspiring millions, his story is a reminder that when you stand up for what is right, you can change the world.</p>
        `;
    }

    document.getElementById('story-content').innerHTML = contentHtml;
    document.title = `${story.title || 'Story'} | Geofroggy`;
}

function showError(message) {
    const container = document.querySelector('.story-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 100px 20px;">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 60px; color: #ef4444; margin-bottom: 20px;"></i>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; color: #1e293b; margin-bottom: 10px;">Oops!</h2>
                <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 30px;">${message}</p>
                <a href="teen-stories.html" class="btn-complete" style="text-decoration: none;">Back to Stories</a>
            </div>
        `;
    }
}
