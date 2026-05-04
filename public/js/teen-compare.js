document.addEventListener('DOMContentLoaded', () => {
    // initSparklines(); // Removed as cards are now dynamic/cleared
    initMainChart();
    initBarChart();
    initModal();
    initMetricSelector();
});

let selectedCountries = [];
let currentMetric = 'Population';
let mainChart = null;
let barChart = null;

const METRIC_CONFIG = {
    'Population': {
        category: 'people_and_society',
        field: 'population',
        yLabel: 'Population',
        format: (val) => (val / 1000000).toFixed(1) + 'M'
    },
    'GDP': {
        category: 'economy',
        field: 'gdp_purchasing_power_parity',
        yLabel: 'GDP (PPP) Billions',
        format: (val) => '$' + (val / 1000000000).toFixed(1) + 'B'
    },
    'Urbanization': {
        category: 'people_and_society',
        field: 'urban_population',
        yLabel: 'Urban Pop %',
        format: (val) => val.toFixed(1) + '%'
    },
    'Literacy': {
        category: 'people_and_society',
        field: 'total_population',
        parentField: 'literacy',
        yLabel: 'Literacy %',
        format: (val) => val.toFixed(1) + '%'
    },
    'Climate': {
        category: 'energy',
        field: 'carbon_dioxide_emissions_from_consumption_of_energy',
        yLabel: 'CO2 Emissions (Mt)',
        format: (val) => val.toFixed(1) + ' Mt'
    }
};

function initMetricSelector() {
    const pills = document.querySelectorAll('.metric-pill');
    pills.forEach(pill => {
        const label = pill.querySelector('span')?.innerText;
        if (label && METRIC_CONFIG[label]) {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentMetric = label;
                updateCharts();
            });
        }
    });
}

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

        // Fetch detailed stats
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
        updateCharts(); // Update charts with new country
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
    updateCharts();
}

function parseValue(val) {
    if (typeof val === 'number') return val;
    if (!val || typeof val !== 'string') return 0;

    // Remove (2018 est.) and other notes
    let clean = val.split('(')[0]
        .replace(/[\$,]/g, '')
        .replace(/&lt;.*?&gt;/g, '') // Remove HTML tags if any
        .trim();

    let multiplier = 1;
    if (clean.toLowerCase().includes('billion')) {
        multiplier = 1000000000;
        clean = clean.replace(/billion/i, '');
    } else if (clean.toLowerCase().includes('million')) {
        multiplier = 1000000;
        clean = clean.replace(/million/i, '');
    } else if (clean.includes('%')) {
        clean = clean.replace('%', '');
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num * multiplier;
}

function getMetricDataForCountry(country, metricName) {
    const config = METRIC_CONFIG[metricName];
    if (!config || !country.historicalStats) return [];

    const categoryData = country.historicalStats[config.category] || [];

    let filtered;
    if (config.parentField) {
        // Find all parent IDs for the given parent field
        const parentIds = categoryData
            .filter(s => s.field === config.parentField)
            .map(p => p.id);

        if (parentIds.length === 0) return [];
        filtered = categoryData.filter(s => s.field === config.field && parentIds.includes(s.parent_id));
    } else {
        filtered = categoryData.filter(s => s.field === config.field);
    }

    return filtered.map(s => ({
        year: parseInt(s.year),
        value: parseValue(s.value)
    })).sort((a, b) => a.year - b.year);
}

function initSingleSparkline(canvasId, country) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Get population trend for sparkline
    const dataPoints = getMetricDataForCountry(country, 'Population');
    let sparklineData = dataPoints.length > 0 ? dataPoints.map(d => d.value) : [20, 22, 21, 24, 23, 26];

    // If we only have one point, mock some trend
    if (sparklineData.length === 1) {
        sparklineData = [sparklineData[0] * 0.95, sparklineData[0]];
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

const CHART_COLORS = ['#22c55e', '#06b6d4', '#f97316', '#a855f7'];

function updateCharts() {
    if (!mainChart || !barChart) return;

    const config = METRIC_CONFIG[currentMetric];

    // Update Titles in UI
    document.querySelectorAll('.chart-title-group h2').forEach((h2, idx) => {
        if (idx === 0) h2.innerHTML = `${currentMetric} Over Time <i class="fa-solid fa-circle-info"></i>`;
        if (idx === 1) h2.innerText = `${currentMetric} Comparison`;
    });
    document.querySelectorAll('.chart-title-group p').forEach(p => p.innerText = config.yLabel);

    // 1. Prepare Main Line Chart Data
    let allYears = new Set();
    selectedCountries.forEach(c => {
        const data = getMetricDataForCountry(c, currentMetric);
        data.forEach(d => allYears.add(d.year));
    });

    let sortedYears = Array.from(allYears).sort((a, b) => a - b);
    if (sortedYears.length === 0) sortedYears = [2024];

    const datasets = selectedCountries.map((c, idx) => {
        const countryData = getMetricDataForCountry(c, currentMetric);
        const dataMap = {};
        countryData.forEach(d => dataMap[d.year] = d.value);

        return {
            label: c.country,
            data: sortedYears.map(y => dataMap[y] || null),
            borderColor: CHART_COLORS[idx % CHART_COLORS.length],
            backgroundColor: 'transparent',
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
            spanGaps: true
        };
    });

    mainChart.data.labels = sortedYears;
    mainChart.data.datasets = datasets;
    mainChart.options.scales.y.ticks.callback = (value) => config.format(value);
    mainChart.update();

    // 2. Prepare Bar Chart Data (Latest available year for each)
    const barData = selectedCountries.map(c => {
        const data = getMetricDataForCountry(c, currentMetric);
        return data.length > 0 ? data[data.length - 1].value : 0;
    });

    barChart.data.labels = selectedCountries.map(c => c.country);
    barChart.data.datasets[0].data = barData;
    barChart.data.datasets[0].backgroundColor = selectedCountries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'CC');
    barChart.options.scales.y.ticks.callback = (value) => config.format(value);
    barChart.update();
}

function initMainChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');

    mainChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 20, usePointStyle: true, font: { family: 'Outfit', size: 12 } }
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f8fafc',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            const config = METRIC_CONFIG[currentMetric];
                            return `${context.dataset.label}: ${config.format(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#64748b' }, beginAtZero: false }
            }
        }
    });
}

function initBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');

    barChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: [], datasets: [{ data: [], borderRadius: 6, barThickness: 30 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const config = METRIC_CONFIG[currentMetric];
                            return config.format(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#64748b' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}
