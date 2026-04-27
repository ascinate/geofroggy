// js/demo.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Map Control Interactions
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    let currentZoom = 1;

    if (zoomInBtn && zoomOutBtn) {
        zoomInBtn.addEventListener('click', () => {
            currentZoom = Math.min(currentZoom + 0.2, 3);
            console.log(`Zooming in: ${currentZoom}x`);
            document.body.style.backgroundSize = `${100 * currentZoom}%`;
        });

        zoomOutBtn.addEventListener('click', () => {
            currentZoom = Math.max(currentZoom - 0.2, 1);
            console.log(`Zooming out: ${currentZoom}x`);
            document.body.style.backgroundSize = `${100 * currentZoom}%`;
        });
    }

    // 2. Quiz Interactions
    const quizChoices = document.querySelectorAll('.quiz-choice');
    
    // For demonstration, clicking ANY choice that isn't already correct will make it 'correct' 
    // to simulate the state shown in the mockup.
    quizChoices.forEach(choice => {
        choice.addEventListener('click', function() {
            // Remove selection from others
            quizChoices.forEach(c => c.classList.remove('correct'));
            // Add to clicked
            this.classList.add('correct');
        });
    });
    
    // 3. Tab Interactions
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // If they are hash links, intercept them for demo purposes
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // 4. Timeline Slider Interaction
    const timelineSlider = document.getElementById('timelineSlider');
    const currentYearDisplay = document.getElementById('currentYearDisplay');
    const narratorText = document.getElementById('narratorText');
    const narratorBubble = document.getElementById('narratorBubble');

    if (timelineSlider && currentYearDisplay && narratorText) {
        timelineSlider.addEventListener('input', (e) => {
            const year = parseInt(e.target.value);
            currentYearDisplay.textContent = year;
            
            // Brief fade effect
            narratorBubble.style.opacity = '0';
            
            setTimeout(() => {
                if (year < 2005) {
                    narratorText.textContent = '"In the early 2000s, things were just getting started!"';
                } else if (year < 2012) {
                    narratorText.textContent = '"The cities grew quickly during this time period!"';
                } else if (year < 2018) {
                    narratorText.textContent = `"Around ${year}, more families moved to the cities!"`;
                } else {
                    narratorText.textContent = '"Today, it is a bustling modern center full of life!"';
                }
                narratorBubble.style.opacity = '1';
            }, 300);
        });
    }

    // 5. Story Mode Interactions
    const storiesData = {
        'Animals': [
            { text: '"Did you know Brazil is home to the Amazon Rainforest, which produces 20% of the world\'s oxygen?"', icon: '<i class="fa-solid fa-leaf"></i> Rainforest Fact', bg: 'url("/assets/crew1.png")' },
            { text: '"The Amazon contains over 2,000 species of animals and birds!"', icon: '<i class="fa-solid fa-crow"></i> Wildlife Fact', bg: 'url("/assets/crew2.png")' },
            { text: '"Jaguars are an apex predator found across the Brazilian biome."', icon: '<i class="fa-solid fa-cat"></i> Panther Fact', bg: 'url("/assets/crew3.png")' }
        ],
        'People': [
            { text: '"Brazil has a vibrant mix of cultures and traditions!"', icon: '<i class="fa-solid fa-users"></i> Culture Fact', bg: 'url("/assets/crew4.jpg")' },
            { text: '"The Carnival in Rio is the largest festival in the world."', icon: '<i class="fa-solid fa-masks-theater"></i> Festival Fact', bg: 'url("/assets/crew5.jpg")' }
        ],
        'Nature': [
            { text: '"From waterfalls to beaches, Brazil has it all."', icon: '<i class="fa-solid fa-water"></i> Water Fact', bg: 'url("/assets/crew2.png")' },
            { text: '"The Pantanal is the world\'s largest tropical wetland area."', icon: '<i class="fa-solid fa-frog"></i> Biome Fact', bg: 'url("/assets/crew3.png")' }
        ],
        'Cities': [
            { text: '"São Paulo is one of the most populated cities on Earth!"', icon: '<i class="fa-solid fa-city"></i> Urban Fact', bg: 'url("/assets/crew4.jpg")' },
            { text: '"Brasília, the capital, was built in just 41 months."', icon: '<i class="fa-solid fa-building"></i> Architecture Fact', bg: 'url("/assets/crew5.jpg")' }
        ],
        'Landmarks': [
            { text: '"Christ the Redeemer overlooks the beautiful city of Rio."', icon: '<i class="fa-solid fa-monument"></i> Monument Fact', bg: 'url("/assets/crew1.png")' }
        ]
    };

    const storyTabs = document.querySelectorAll('.story-tab');
    const storyVisualScene = document.getElementById('storyVisualScene');
    const storyText = document.getElementById('storyText');
    const storyFloatingIcon = document.getElementById('storyFloatingIcon');
    const storyPrevBtn = document.getElementById('storyPrevBtn');
    const storyNextBtn = document.getElementById('storyNextBtn');
    const storyDots = document.getElementById('storyDots');
    const storyJourneyTitle = document.getElementById('storyJourneyTitle');

    if (storyTabs.length > 0 && storyVisualScene) {
        let currentTopic = 'Animals';
        let currentSlide = 0;

        function renderStory() {
            const data = storiesData[currentTopic] || storiesData['Animals'];
            const slide = data[currentSlide % data.length];
            
            // Fade out
            storyText.style.opacity = '0';
            storyFloatingIcon.style.opacity = '0';
            
            setTimeout(() => {
                storyVisualScene.style.background = slide.bg + ' center/contain no-repeat #fff';
                storyText.textContent = slide.text;
                storyFloatingIcon.innerHTML = slide.icon;
                
                // Update Dots
                storyDots.innerHTML = '';
                for(let i=0; i<data.length; i++) {
                    const bg = i === currentSlide ? '#3B82F6' : '#E2E8F0';
                    storyDots.innerHTML += `<div class="story-dot" style="width: 10px; height: 10px; border-radius: 50%; background: ${bg}; transition: background 0.3s ease;"></div>`;
                }
                
                storyText.style.opacity = '1';
                storyFloatingIcon.style.opacity = '1';
            }, 300);
        }

        storyTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Update styling
                storyTabs.forEach(t => {
                    t.style.background = 'rgba(255,255,255,0.6)';
                    t.style.border = '2px solid transparent';
                    t.style.color = 'var(--text-muted)';
                    t.classList.remove('active');
                    const check = t.querySelector('.active-check');
                    if(check) check.style.display = 'none';
                });
                
                this.style.background = 'white';
                this.style.border = '2px solid #3B82F6';
                this.style.color = '#1E3A8A';
                this.classList.add('active');
                const check = this.querySelector('.active-check');
                if(check) check.style.display = 'flex';
                
                currentTopic = this.getAttribute('data-topic');
                currentSlide = 0;
                storyJourneyTitle.textContent = `Journey Across Brazil: ${currentTopic}`;
                renderStory();
            });
        });

        storyNextBtn.addEventListener('click', () => {
             const data = storiesData[currentTopic] || storiesData['Animals'];
             currentSlide = (currentSlide + 1) % data.length;
             renderStory();
        });

        storyPrevBtn.addEventListener('click', () => {
             const data = storiesData[currentTopic] || storiesData['Animals'];
             currentSlide = (currentSlide - 1 + data.length) % data.length;
             renderStory();
        });
        
        // Initial render
        renderStory();
    }

    // 6. Interactive Mouse Parallax (For Landing Page)
    document.addEventListener('mousemove', (e) => {
        // Adjust body background position slightly based on cursor to create deep parallax
        const xPos = (e.clientX / window.innerWidth - 0.5) * 30; // Max 15px shift
        const yPos = (e.clientY / window.innerHeight - 0.5) * 30;
        
        // Ensure this only affects pages with the world map background inline style
        if(document.body.style.backgroundImage.includes('world_map_bg.png')) {
            document.body.style.backgroundPosition = `calc(50% + ${xPos}px) calc(50% + ${yPos}px)`;
        }
    });

    console.log('Demo scripts initialized successfully.');
});
