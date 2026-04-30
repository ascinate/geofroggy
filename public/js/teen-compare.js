document.addEventListener('DOMContentLoaded', () => {
    // initSparklines(); // Removed as cards are now dynamic/cleared
    initMainChart();
    initBarChart();
    initModal();
});

let selectedCountries = [];

async function initModal() {
    const addCountryBtn = document.getElementById('addCountryBtn');
    const countryModal = document.getElementById('countryModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const countrySearch = document.getElementById('countrySearch');
    const countryOptionsGrid = document.querySelector('.country-options-grid');

    let allCountries = [];
    let flagCodes = {};

    // Open Modal
    addCountryBtn.addEventListener('click', async () => {
        countryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (allCountries.length === 0) {
            await fetchFlagCodes(); // Ensure codes are loaded first
            await fetchCountries(); // Then fetch and render countries
        }
    });

    async function fetchFlagCodes() {
        try {
            const response = await fetch('https://flagcdn.com/en/codes.json');
            flagCodes = await response.json();
        } catch (error) {
            console.error('Error fetching flag codes:', error);
        }
    }

    function getCodeFromName(name) {
        if (!name) return 'un';
        const searchName = name.toLowerCase().trim();

        // 1. Check manual overrides
        const manualMappings = {
            'usa': 'us',
            'uk': 'gb',
            'uae': 'ae',
            'russia': 'ru',
            'south korea': 'kr',
            'north korea': 'kp'
        };
        if (manualMappings[searchName]) return manualMappings[searchName];

        // 2. Exact match
        for (const [code, countryName] of Object.entries(flagCodes)) {
            if (countryName.toLowerCase() === searchName) return code;
        }

        // 3. Partial match
        for (const [code, countryName] of Object.entries(flagCodes)) {
            const cleanName = countryName.toLowerCase();
            if (cleanName.includes(searchName) || searchName.includes(cleanName)) {
                return code;
            }
        }
        return 'un';
    }

    async function fetchCountries() {
        try {
            countryOptionsGrid.innerHTML = '<div class="loading-spinner">Loading countries...</div>';
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data) {
                allCountries = data.data;
                renderCountries(allCountries);
            } else {
                countryOptionsGrid.innerHTML = '<div class="error-msg">Failed to load countries.</div>';
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
            countryOptionsGrid.innerHTML = '<div class="error-msg">Error connecting to server.</div>';
        }
    }

    function renderCountries(countries) {
        countryOptionsGrid.innerHTML = '';
        countries.forEach(country => {
            const code = getCodeFromName(country.country);
            const option = document.createElement('div');
            option.className = 'country-option';
            option.setAttribute('data-country', country.country);
            option.innerHTML = `
                <img src="https://flagcdn.com/${code}.svg" alt="${country.country}">
                <span>${country.country}</span>
            `;
            
            option.addEventListener('click', () => {
                // Attach the resolved code to the country object for later use
                country.resolvedCode = code;
                selectCountry(country);
            });
            
            countryOptionsGrid.appendChild(option);
        });
    }

    async function selectCountry(country) {
        if (selectedCountries.length >= 4) {
            alert('You can only compare up to 4 countries.');
            return;
        }
        
        if (selectedCountries.find(c => c.id === country.id)) {
            alert('This country is already selected.');
            return;
        }

        // Fetch detailed stats (People & Society)
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/${country.id}/stats`);
            const statData = await response.json();
            if (statData.status === 'success') {
                country.historicalStats = statData.data;
            }
        } catch (error) {
            console.error('Error fetching country stats:', error);
        }

        selectedCountries.push(country);
        renderSelectedCountries();
        closeModal();
    }

    // Close Modal
    const closeModal = () => {
        countryModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeModalBtn.addEventListener('click', closeModal);
    countryModal.addEventListener('click', (e) => {
        if (e.target === countryModal) closeModal();
    });

    // Search functionality
    countrySearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCountries.filter(c => 
            c.country.toLowerCase().includes(term) || 
            (c.continent && c.continent.toLowerCase().includes(term))
        );
        renderCountries(filtered);
    });
}

function renderSelectedCountries() {
    const grid = document.getElementById('countrySelectionGrid');
    const addBtn = document.getElementById('addCountryBtn');
    
    // Clear and rebuild
    grid.innerHTML = '';
    
    selectedCountries.forEach((country, index) => {
        const code = (country.resolvedCode || country.code || 'un').toLowerCase();
        const card = document.createElement('div');
        card.className = 'country-card';
        card.innerHTML = `
            <button class="remove-country" data-index="${index}"><i class="fa-solid fa-xmark"></i></button>
            <div class="card-header">
                <img src="https://flagcdn.com/${code}.svg" alt="${country.country}" class="country-flag">
                <div class="country-name-info">
                    <h3>${country.country}</h3>
                    <span class="country-region">${country.continent}</span>
                </div>
            </div>
            <div class="card-stats">
                <div class="stat-box">
                    <span class="label">Population</span>
                    <span class="value">${country.population}</span>
                    <div class="trend-indicator trend-up">
                        <i class="fa-solid fa-arrow-trend-up"></i> +1.2%
                    </div>
                </div>
                <div class="stat-box">
                    <span class="label">GDP (Nominal)</span>
                    <span class="value">${country.economy}</span>
                </div>
            </div>
            <div class="sparkline-container">
                <canvas id="sparkline-${country.id}"></canvas>
            </div>
        `;
        
        card.querySelector('.remove-country').addEventListener('click', (e) => {
            removeCountry(index);
        });
        
        grid.appendChild(card);
        initSingleSparkline(`sparkline-${country.id}`, country);
    });
    
    if (selectedCountries.length < 4) {
        grid.appendChild(addBtn);
        // We need to re-attach the listener because we moved the element
        addBtn.onclick = null; // Clear old if any
        // The listener is actually attached in initModal using addEventListener,
        // and addBtn is a persistent element in memory?
        // Actually, grid.appendChild(addBtn) MOVES the element, preserving its listeners.
    }
}

function removeCountry(index) {
    selectedCountries.splice(index, 1);
    renderSelectedCountries();
}

function initSingleSparkline(canvasId, country) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Default mock data
    let sparklineData = [20, 22, 21, 24, 23, 26];
    
    // Use historical data if available
    if (country.historicalStats && country.historicalStats.length > 0) {
        const values = country.historicalStats
            .map(s => parseFloat(s.value.replace(/[^0-9.]/g, '')))
            .filter(v => !isNaN(v));
            
        if (values.length > 0) {
            sparklineData = values.slice(-8); // Take recent entries
        }
    }
    
    const isUp = sparklineData[sparklineData.length - 1] >= sparklineData[0];
    const color = isUp ? '#22c55e' : '#ef4444';
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sparklineData.map((_, i) => i),
            datasets: [{
                data: sparklineData,
                borderColor: color,
                borderWidth: 2,
                fill: true,
                backgroundColor: isUp ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}

function initMainChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const years = [2000, 2004, 2008, 2012, 2016, 2020, 2024];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Australia',
                    data: [19, 20, 21, 23, 24, 25, 26.6],
                    borderColor: '#22c55e',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#22c55e'
                },
                {
                    label: 'Brazil',
                    data: [175, 185, 195, 202, 208, 212, 216.4],
                    borderColor: '#06b6d4',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#06b6d4'
                },
                {
                    label: 'Japan',
                    data: [126.8, 127.8, 128.1, 127.6, 127, 125.8, 124.6],
                    borderColor: '#f97316',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#f97316'
                },
                {
                    label: 'Kenya',
                    data: [31, 35, 40, 45, 49, 52, 54.1],
                    borderColor: '#a855f7',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 2,
                    pointBackgroundColor: '#a855f7'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        padding: 20,
                        usePointStyle: true,
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    usePointStyle: true
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit' },
                        callback: (value) => value + 'M'
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function initBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Australia', 'Brazil', 'Japan', 'Kenya'],
            datasets: [{
                data: [26.6, 216.4, 124.6, 54.1],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)'
                ],
                borderRadius: 6,
                borderWidth: 0,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { family: 'Outfit' } }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                    ticks: { 
                        color: '#64748b', 
                        font: { family: 'Outfit' },
                        callback: (value) => value + 'M'
                    }
                }
            }
        }
    });
}
