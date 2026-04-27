document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : 'https://geo-froggy-backend.devhhtk.workers.dev';

    async function loadExplorerFlags() {
        try {
            const res = await fetch(`${API_URL}/api/country`);
            if (res.ok) {
                const countries = await res.json();
                window.allCountries = countries; // Store for search
                const container = document.getElementById('explorer-flags-container');
                if (container) {
                    // Show 4 countries
                    const featured = countries.slice(0, 4);
                    container.innerHTML = featured.map(c => {
                        const detailUrl = `https://geofroggy-five.vercel.app/details?id=${encodeURIComponent(c.name)}`;
                        const flagId = `flag-${c.id}`;
                        
                        // We'll update the flag src asynchronously if code is missing
                        if (!c.code) {
                            fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(c.name)}?fullText=true`)
                                .then(res => res.json())
                                .then(data => {
                                    if (data && data[0] && data[0].flags) {
                                        const img = document.getElementById(flagId);
                                        if (img) img.src = data[0].flags.png || data[0].flags.svg;
                                    }
                                }).catch(err => console.error('RestCountries fallback failed:', err));
                        }

                        const initialFlagUrl = c.code ? `https://flagcdn.com/w80/${c.code.toLowerCase()}.png` : (c.flag_url || '/assets/f1.jpg');
                        
                        return `
                        <div class="col">
                            <a href="${detailUrl}" class="flags-btn text-center card-tb d-block text-center text-decoration-none">
                                <img id="${flagId}" src="${initialFlagUrl}" alt="${c.name}" style="width: 30px; height: auto; border-radius: 2px;" />
                                <p class="mb-0 mt-1" style="font-size: 10px; color: #333;">${c.name}</p>
                            </a>
                        </div>
                    `}).join('');
                }
                
                // Also update the Hero Country card with the first country
                if (featured.length > 0) {
                    updateHeroCountry(featured[0]);
                }
            }
        } catch (err) {
            console.error('Failed to load explorer flags:', err);
        }
    }

    function updateHeroCountry(country) {
        const nameEl = document.getElementById('hero-country-name');
        const subtitleEl = document.getElementById('hero-country-subtitle');
        if (nameEl) nameEl.textContent = country.name;
        if (subtitleEl) subtitleEl.textContent = country.capital || 'Explore the world';
        
        const startLessonHero = document.getElementById('start-lesson-hero');
        if (startLessonHero) {
            startLessonHero.href = `map1.html?countryId=${country.id}`;
        }

        // Load a quiz for this country
        loadHeroQuiz(country.id);
    }

    async function loadHeroQuiz(countryId) {
        try {
            const res = await fetch(`${API_URL}/api/quiz/country/${countryId}`);
            if (res.ok) {
                const quizzes = await res.json();
                if (quizzes.length > 0) {
                    const quiz = quizzes[0];
                    if (quiz.questions && quiz.questions.length > 0) {
                        const question = quiz.questions[0];
                        
                        const questionEl = document.getElementById('hero-quiz-question');
                        const optionsEl = document.getElementById('hero-quiz-options');
                        const linkEl = document.getElementById('hero-quiz-link');

                        if (questionEl) questionEl.textContent = question.question_text;
                        if (optionsEl) {
                            optionsEl.innerHTML = question.options.map((opt, i) => `
                                <div class="quiz-option ${i === 0 ? 'active' : ''}">
                                    ${opt}
                                </div>
                            `).join('');
                            
                            // Re-add click listener for options
                            optionsEl.querySelectorAll(".quiz-option").forEach(option => {
                                option.addEventListener("click", function () {
                                    optionsEl.querySelectorAll(".quiz-option").forEach(o => o.classList.remove("active"));
                                    this.classList.add("active");
                                });
                            });
                        }
                        if (linkEl) {
                            linkEl.href = `map1.html?id=${quiz.id}`;
                            linkEl.innerHTML = `<img src="/assets/btn2.png" alt="start" style="width: 150px;" />`;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load hero quiz:', err);
        }
    }

    function updatePassport() {
        const statsStr = localStorage.getItem('stats');
        const stats = statsStr ? JSON.parse(statsStr) : null;
        
        if (stats) {
            const levelEl = document.getElementById('passport-level');
            const countEl = document.getElementById('passport-progress-count');
            const starsEl = document.getElementById('passport-stars');

            if (levelEl) levelEl.textContent = `Explore • Level ${stats.level || 1}`;
            if (countEl) countEl.textContent = `${stats.countries_explored || 0} / 250`;
            if (starsEl) starsEl.textContent = stats.xp || 0;
        }
    }

    // Search functionality
    const searchInput = document.getElementById('country-search-input');
    const searchBtn = document.querySelector('.btn-search-next01');
    
    function performSearch(query) {
        const container = document.getElementById('explorer-flags-container');
        if (container && window.allCountries) {
            const filtered = window.allCountries.filter(c => 
                c.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 8); // Show up to 8 results
            
            if (filtered.length === 0) {
                container.innerHTML = '<div class="col-12 text-center mt-3"><p style="font-size: 12px; color: #666;">No countries found</p></div>';
                return;
            }

            container.innerHTML = filtered.map(c => {
                const detailUrl = `https://geofroggy-five.vercel.app/details?id=${encodeURIComponent(c.name)}`;
                const flagId = `flag-search-${c.id}`;
                
                // Fetch flag from RestCountries if code is missing
                if (!c.code) {
                    fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(c.name)}?fullText=true`)
                        .then(res => res.json())
                        .then(data => {
                            if (data && data[0] && data[0].flags) {
                                const img = document.getElementById(flagId);
                                if (img) img.src = data[0].flags.png || data[0].flags.svg;
                            }
                        }).catch(err => console.error('RestCountries fallback failed:', err));
                }

                const initialFlagUrl = c.code ? `https://flagcdn.com/w80/${c.code.toLowerCase()}.png` : (c.flag_url || '/assets/f1.jpg');
                
                return `
                <div class="col mb-3">
                    <a href="${detailUrl}" class="flags-btn text-center card-tb d-block text-center text-decoration-none">
                        <img id="${flagId}" src="${initialFlagUrl}" alt="${c.name}" style="width: 35px; height: auto; border-radius: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
                        <p class="mb-0 mt-1" style="font-size: 10px; color: #333; font-weight: 500;">${c.name}</p>
                    </a>
                </div>
            `}).join('');
        }
    }

    if (searchInput) {
        // Prevent carousel label from hijacking clicks
        searchInput.addEventListener('click', (e) => e.stopPropagation());
        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        
        searchInput.addEventListener('input', (e) => performSearch(e.target.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch(e.target.value);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (searchInput) performSearch(searchInput.value);
        });
    }

    // Call updates
    loadExplorerFlags();
    updatePassport();

    // Prevent carousel labels from hijacking clicks on interactive elements
    document.querySelectorAll('.mycard a, .mycard button, .mycard input').forEach(el => {
        el.addEventListener('click', (e) => e.stopPropagation());
        el.addEventListener('mousedown', (e) => e.stopPropagation());
    });

    // Passport card navigation
    const passportNav = document.getElementById('passport-card-nav');
    if (passportNav) {
        passportNav.addEventListener('click', () => {
            window.location.href = 'passport.html';
        });
    }

    // Listen for session sync events if any
    window.addEventListener('storage', (e) => {
        if (e.key === 'stats') {
            updatePassport();
        }
    });
});
