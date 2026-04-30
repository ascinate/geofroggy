document.addEventListener('DOMContentLoaded', () => {
    // initSparklines(); // Removed as cards are now dynamic/cleared
    initMainChart();
    initBarChart();
    initModal();
});

async function initModal() {
    const addCountryBtn = document.getElementById('addCountryBtn');
    const countryModal = document.getElementById('countryModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const countrySearch = document.getElementById('countrySearch');
    const countryOptionsGrid = document.querySelector('.country-options-grid');

    let allCountries = [];

    // Open Modal
    addCountryBtn.addEventListener('click', async () => {
        countryModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (allCountries.length === 0) {
            await fetchCountries();
        }
    });

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
            const option = document.createElement('div');
            option.className = 'country-option';
            option.setAttribute('data-country', country.country);
            option.innerHTML = `
                <img src="https://flagcdn.com/${country.code.toLowerCase()}.svg" alt="${country.country}">
                <span>${country.country}</span>
            `;
            
            option.addEventListener('click', () => {
                selectCountry(country);
            });
            
            countryOptionsGrid.appendChild(option);
        });
    }

    function selectCountry(country) {
        console.log('Selected:', country);
        alert(`You selected ${country.country}! (Selection logic can be expanded here)`);
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
