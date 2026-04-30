document.addEventListener('DOMContentLoaded', () => {
    // initSparklines(); // Removed as cards are now dynamic/cleared
    initMainChart();
    initBarChart();
    initModal();
});

function initModal() {
    const addCountryBtn = document.getElementById('addCountryBtn');
    const countryModal = document.getElementById('countryModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const countrySearch = document.getElementById('countrySearch');
    const countryOptions = document.querySelectorAll('.country-option');

    // Open Modal
    addCountryBtn.addEventListener('click', () => {
        countryModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    });

    // Close Modal
    const closeModal = () => {
        countryModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeModalBtn.addEventListener('click', closeModal);

    // Close on overlay click
    countryModal.addEventListener('click', (e) => {
        if (e.target === countryModal) closeModal();
    });

    // Search functionality (simple)
    countrySearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        countryOptions.forEach(option => {
            const country = option.getAttribute('data-country').toLowerCase();
            const spanText = option.querySelector('span').textContent.toLowerCase();
            if (country.includes(term) || spanText.includes(term)) {
                option.style.display = 'flex';
            } else {
                option.style.display = 'none';
            }
        });
    });

    // Country selection (static for now as requested)
    countryOptions.forEach(option => {
        option.addEventListener('click', () => {
            const countryName = option.querySelector('span').textContent;
            console.log(`Selected: ${countryName}`);
            alert(`You selected ${countryName}! (This is a static demo)`);
            closeModal();
        });
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
