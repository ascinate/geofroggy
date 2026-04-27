document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('Container');
    if (!container) return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const countryId = urlParams.get('countryId');
        
        let url = `${window.APP_CONFIG.API_BASE_URL}/api/stories`;
        if (countryId) {
            url = `${window.APP_CONFIG.API_BASE_URL}/api/stories/country/${countryId}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch stories');
        
        const stories = await response.json();
        renderStories(stories);

        // Initialize MixItUp after rendering
        $(function () {
            $('#Container').mixItUp();
        });

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="text-center w-100 py-5 text-danger">Error loading stories: ${error.message}</div>`;
    }
});

function renderStories(stories) {
    const container = document.getElementById('Container');
    container.innerHTML = '';

    if (stories.length === 0) {
        container.innerHTML = '<div class="text-center w-100 py-5">No stories found.</div>';
        return;
    }

    stories.forEach(story => {
        const categoryClass = getCategoryClass(story.category);
        const storyCard = `
            <div class="mix col ${categoryClass}" data-id="${story.id}" style="cursor: pointer;">
                <div class="card crad-bgh-stogry w-100 position-relative p-0 " onclick="window.location.href='story-details.html?id=${story.id}'">
                    <img src="/assets/story-card.png" alt="" class="story-card-bgs" />
                    <div class="thums-imgs mx-auto d-block">
                        <img src="${story.image_url || '/assets/img-cr1.jpg'}" class="card-img-top" alt="${story.title}">
                    </div>

                    <div class="card-body ">
                        <div class="categrty-titel text-center">
                            <h5> ${story.category || 'General'} </h5>
                        </div>
                        <h5 class="card-title text-center">${story.title}</h5>
                        <p class="card-text">${story.summary || story.description || (story.content ? story.content.substring(0, 100) + '...' : 'Discover more about this story...')}</p>
                        <a href="story-details.html?id=${story.id}" class="btn p-0">
                            <img src="/assets/readmore-btn.png" alt="Read More" />
                        </a>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', storyCard);
    });
}

function getCategoryClass(category) {
    if (!category) return 'category-1';
    const cat = category.toLowerCase();
    if (cat.includes('history')) return 'category-1';
    if (cat.includes('culture')) return 'category-2';
    if (cat.includes('nature')) return 'category-3';
    if (cat.includes('animal')) return 'category-4';
    return 'category-1';
}
