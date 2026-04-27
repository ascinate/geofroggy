document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const countryName = urlParams.get('id');

    if (!countryName) {
        showError('No country specified in the URL.');
        return;
    }

    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/country/${encodeURIComponent(countryName)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch country details: ${response.statusText}`);
        }

        const country = await response.json();
        updateUI(country);
    } catch (error) {
        console.error('Error fetching country details:', error);
        showError('Could not load country details. Please try again later.');
    }
});

function updateUI(country) {
    // Update Name
    document.getElementById('country-name').textContent = country.name;
    document.getElementById('about-country-name').textContent = country.name;
    document.title = `${country.name} | Geofroggy`;

    // Update Continent
    document.getElementById('continent-text').textContent = country.continent || 'Unknown';

    // Update Description (handle newlines)
    const descriptionEl = document.getElementById('country-description');
    if (country.description) {
        descriptionEl.innerHTML = country.description.split('\n').map(paragraph => {
            if (paragraph.trim()) {
                return `<p style="margin-bottom: 12px;">${paragraph.trim()}</p>`;
            }
            return '';
        }).join('');
    } else {
        descriptionEl.textContent = 'No description available for this country.';
    }

    // Update Flag (using flagcdn as a fallback if code is available, otherwise placeholder)
    const flagImg = document.getElementById('country-flag');
    const flagPlaceholder = document.getElementById('flag-placeholder');

    // Attempt to get flag from RestCountries or similar if code is null?
    // For now, let's try a common naming convention if code is null, or just use a search if possible.
    // Since the API might return the ISO code later, we'll check it.
    if (country.code) {
        flagImg.src = `https://flagcdn.com/w80/${country.code.toLowerCase()}.png`;
        flagImg.style.display = 'block';
        flagPlaceholder.style.display = 'none';
    } else {
        // Search for flag by name as fallback (RestCountries API is good for this)
        fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(country.name)}?fullText=true`)
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].flags) {
                    flagImg.src = data[0].flags.png || data[0].flags.svg;
                    flagImg.style.display = 'block';
                    flagPlaceholder.style.display = 'none';
                }
            })
            .catch(() => {
                console.log('Could not fetch flag from external API');
            });
    }

    // Update Hero Image based on country name (Local Beautiful Asset)
    const heroImage = document.getElementById('hero-image');
    if (heroImage) {
        heroImage.src = '/assets/photo-1502602898657-3e91760cbb34-bg.png';
    }

    // Handle Quiz Button Click
    const quizBtn = document.getElementById('take-quiz-btn');
    if (quizBtn) {
        quizBtn.onclick = () => {
            window.location.href = `quiz.html?id=${encodeURIComponent(country.id)}`;
        };
    }

    // Fetch and render stories for this country
    fetchStories(country.id);
}

async function fetchStories(countryId) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/stories/country/${countryId}`);
        if (!response.ok) throw new Error('Failed to fetch stories');

        const stories = await response.json();
        renderStories(stories);
    } catch (error) {
        console.error('Error fetching stories:', error);
        // Fallback or empty state if needed
    }
}

function renderStories(stories) {
    const carouselInner = document.querySelector('.carousel-inner');
    if (!carouselInner || !stories || stories.length === 0) return;

    carouselInner.innerHTML = ''; // Clear static content

    // Chunk stories into groups of 3 for carousel slides
    const chunkSize = 3;
    for (let i = 0; i < stories.length; i += chunkSize) {
        const chunk = stories.slice(i, i + chunkSize);
        const isActive = i === 0 ? 'active' : '';

        const slide = document.createElement('div');
        slide.className = `carousel-item ${isActive}`;

        const row = document.createElement('div');
        row.className = 'row g-4';

        chunk.forEach(story => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card crad-bgh-stogry w-100 position-relative p-0 " onclick="window.location.href='story-details.html?id=${story.id}'" style="cursor: pointer;">
                    <img src="/assets/story-card.png" alt="" class="story-card-bgs" />
                    <div class="thums-imgs mx-auto d-block">
                        <img src="${story.image_url || '/assets/img-cr1.jpg'}" class="card-img-top" alt="${story.title}">
                    </div>

                    <div class="card-body ">
                        <div class="categrty-titel text-center">
                            <h5> ${story.category || 'General'} </h5>
                        </div>
                        <h5 class="card-title text-center">${story.title}</h5>
                        <p class="card-text">${story.summary || (story.content ? story.content.substring(0, 100) + '...' : 'Discover more about this story...')}</p>
                        <a href="story-details.html?id=${story.id}" class="btn p-0">
                            <img src="/assets/readmore-btn.png" alt="Read More" />
                        </a>
                    </div>
                </div>
            `;

            row.appendChild(col);
        });

        slide.appendChild(row);
        carouselInner.appendChild(slide);
    }
}

function showError(message) {
    const container = document.querySelector('.page-wrapper');
    container.innerHTML = `
        <div style="text-align: center; padding: 50px; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <i class="ri-error-warning-line" style="font-size: 48px; color: #ef4444;"></i>
            <h3 style="margin-top: 16px;">Oops!</h3>
            <p style="color: #64748B;">${message}</p>
            <a href="map.html" class="btn-blue-glow" style="display: inline-block; margin-top: 20px; text-decoration: none;">Go back to Map</a>
        </div>
    `;
}
