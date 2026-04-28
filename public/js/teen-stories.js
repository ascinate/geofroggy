document.addEventListener('DOMContentLoaded', async () => {
    const storiesGrid = document.getElementById('stories-grid');
    let allStories = [];

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/stories`);
        if (!response.ok) throw new Error('Failed to fetch stories');

        allStories = await response.json();
        renderStories(allStories);

        // Filter Logic
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');
                if (filter === 'all') {
                    renderStories(allStories);
                } else {
                    const filtered = allStories.filter(s => 
                        (s.category || '').toLowerCase() === filter.toLowerCase()
                    );
                    renderStories(filtered);
                }
            });
        });

    } catch (error) {
        console.error('Error:', error);
        storiesGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; color: #ef4444; margin-bottom: 15px;"></i>
                <h3>Unable to load stories</h3>
                <p class="text-muted">Please check your connection and try again.</p>
            </div>
        `;
    }

    function renderStories(stories) {
        if (stories.length === 0) {
            storiesGrid.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No stories found in this category.</p>
                </div>
            `;
            return;
        }

        storiesGrid.innerHTML = stories.map(story => {
            const readTime = story.read_time || Math.ceil((story.content || "").split(' ').length / 200) || '5';
            const excerpt = story.excerpt || (story.content ? story.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : 'No description available.');
            
            return `
                <div class="story-card-premium animate__animated animate__fadeIn">
                    <div class="story-card-img">
                        <span class="card-category">${story.category || 'General'}</span>
                        <img src="${story.image_url || '/assets/mascot_landscape.png'}" alt="${story.title}">
                    </div>
                    <div class="story-card-body">
                        <h3 class="story-card-title">${story.title}</h3>
                        <p class="story-card-excerpt">${excerpt}</p>
                        <div class="story-card-footer">
                            <div class="story-card-meta">
                                <span><i class="fa-regular fa-clock"></i> ${readTime} min</span>
                                <span><i class="fa-solid fa-star star-icon" style="color: #f59e0b;"></i> 4.8</span>
                            </div>
                            <a href="teen-story-details.html?id=${story.id}" class="btn-read">
                                Read More <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
});
