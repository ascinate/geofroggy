document.addEventListener('DOMContentLoaded', () => {
    initCountryModal();
    initMetricModal();
    initProjectControls();
    loadSampleChart();
});

let selectedCountries = [];
let selectedMetrics = [];
let allCountries = [];
let flagCodes = {};

// --- Country Selection Logic ---

async function initCountryModal() {
    const addCountryBtn = document.querySelector('.btn-add-mini');
    const countryModal = document.getElementById('countryModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const countrySearch = document.getElementById('countrySearch');
    const countryOptionsGrid = document.querySelector('.country-options-grid');

    addCountryBtn.addEventListener('click', async () => {
        countryModal.classList.add('active');
        if (allCountries.length === 0) {
            await fetchFlagCodes();
            await fetchCountries();
        }
    });

    async function fetchFlagCodes() {
        try {
            const response = await fetch('https://flagcdn.com/en/codes.json');
            flagCodes = await response.json();
        } catch (e) { console.error(e); }
    }

    async function fetchCountries() {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country`);
            const data = await response.json();
            if (data.status === 'success') {
                allCountries = data.data;
                renderCountries(allCountries);
            }
        } catch (e) { console.error(e); }
    }

    function renderCountries(countries) {
        countryOptionsGrid.innerHTML = '';
        countries.forEach(country => {
            const code = getCodeFromName(country.country);
            const option = document.createElement('div');
            option.className = 'country-option';
            option.innerHTML = `
                <img src="https://flagcdn.com/${code}.svg" alt="${country.country}">
                <span>${country.country}</span>
            `;
            option.onclick = () => selectCountry(country, code);
            countryOptionsGrid.appendChild(option);
        });
    }

    function selectCountry(country, code) {
        if (selectedCountries.find(c => c.id === country.id)) return;
        country.resolvedCode = code;
        selectedCountries.push(country);
        renderSelectedCountries();
        countryModal.classList.remove('active');
    }

    countrySearch.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCountries.filter(c => c.country.toLowerCase().includes(term));
        renderCountries(filtered);
    };

    closeModalBtn.onclick = () => countryModal.classList.remove('active');
}

function renderSelectedCountries() {
    const container = document.querySelector('.selection-group .selection-pills');
    const addBtn = container.querySelector('.btn-add-mini');
    
    // Clear current pills except add button
    container.innerHTML = '';
    
    selectedCountries.forEach((country, index) => {
        const pill = document.createElement('div');
        pill.className = 'pill-item';
        pill.innerHTML = `
            <img src="https://flagcdn.com/${country.resolvedCode}.svg" width="16" alt="${country.country}"> 
            ${country.country} 
            <i class="fa-solid fa-xmark remove-country" data-index="${index}"></i>
        `;
        pill.querySelector('.remove-country').onclick = () => {
            selectedCountries.splice(index, 1);
            renderSelectedCountries();
        };
        container.appendChild(pill);
    });
    
    container.appendChild(addBtn);
    document.querySelector('.selection-group span').innerText = `${selectedCountries.length} countries`;
}

// --- Metric Selection Logic ---

const METRIC_CATEGORIES = {
    'people_and_society': 'People & Society',
    'economy': 'Economy',
    'energy': 'Energy',
    'geography': 'Geography',
    'communications': 'Communications',
    'government': 'Government',
    'military_and_security': 'Military & Security',
    'transportation': 'Transportation'
};

async function initMetricModal() {
    const addMetricBtn = document.querySelectorAll('.btn-add-mini')[1];
    const metricModal = document.getElementById('metricModal');
    const closeMetricModalBtn = document.getElementById('closeMetricModalBtn');
    const categoriesGrid = document.querySelector('.metric-categories-grid');
    const fieldsList = document.querySelector('.metric-fields-list');

    addMetricBtn.addEventListener('click', () => {
        metricModal.classList.add('active');
        renderCategories();
    });

    function renderCategories() {
        categoriesGrid.innerHTML = '';
        Object.entries(METRIC_CATEGORIES).forEach(([key, name]) => {
            const cat = document.createElement('div');
            cat.className = 'metric-category-item';
            cat.innerText = name;
            cat.onclick = () => loadFieldsForCategory(key);
            categoriesGrid.appendChild(cat);
        });
    }

    async function loadFieldsForCategory(categoryKey) {
        fieldsList.innerHTML = '<div class="loading">Loading metrics...</div>';
        try {
            // Fetch stats for country 1 to get sample keys
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/1/stats`);
            const data = await response.json();
            if (data.status === 'success') {
                const fields = data.data[categoryKey] || [];
                // Only show fields with parent_id 0 (main fields)
                const mainFields = fields.filter(f => f.parent_id === 0);
                
                fieldsList.innerHTML = '';
                mainFields.forEach(field => {
                    const item = document.createElement('div');
                    item.className = 'metric-field-option';
                    item.innerHTML = `
                        <span>${field.field.replace(/_/g, ' ')}</span>
                        <i class="fa-solid fa-plus"></i>
                    `;
                    item.onclick = () => selectMetric(field.field, categoryKey);
                    fieldsList.appendChild(item);
                });
            }
        } catch (e) { console.error(e); }
    }

    function selectMetric(field, category) {
        if (selectedMetrics.find(m => m.field === field)) return;
        selectedMetrics.push({ field, category });
        renderSelectedMetrics();
        metricModal.classList.remove('active');
    }

    closeMetricModalBtn.onclick = () => metricModal.classList.remove('active');
}

function renderSelectedMetrics() {
    const container = document.querySelectorAll('.selection-group .selection-pills')[1];
    const addBtn = container.querySelector('.btn-add-mini');
    
    container.innerHTML = '';
    selectedMetrics.forEach((metric, index) => {
        const pill = document.createElement('div');
        pill.className = 'pill-item';
        pill.innerHTML = `
            <i class="fa-solid fa-chart-simple"></i>
            ${metric.field.replace(/_/g, ' ')} 
            <i class="fa-solid fa-xmark remove-metric" data-index="${index}"></i>
        `;
        pill.querySelector('.remove-metric').onclick = () => {
            selectedMetrics.splice(index, 1);
            renderSelectedMetrics();
        };
        container.appendChild(pill);
    });
    container.appendChild(addBtn);
    document.querySelectorAll('.selection-group span')[1].innerText = `${selectedMetrics.length} metrics`;
}

// --- Helpers ---

function getCodeFromName(name) {
    if (!name) return 'un';
    const searchName = name.toLowerCase().trim();
    const manualMappings = { 'usa': 'us', 'uk': 'gb', 'uae': 'ae' };
    if (manualMappings[searchName]) return manualMappings[searchName];
    for (const [code, countryName] of Object.entries(flagCodes)) {
        if (countryName.toLowerCase() === searchName) return code;
    }
    return 'un';
}

function initProjectControls() {
    // Placeholder for save/export logic
    const saveBtn = document.querySelector('.btn-secondary');
    saveBtn.onclick = () => alert('Project saved as draft!');
}

function loadSampleChart() {
    const ctx = document.getElementById('previewChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [2018, 2019, 2020, 2021, 2022],
            datasets: [{
                label: 'Sample Growth',
                data: [12, 19, 3, 5, 2],
                borderColor: '#22c55e',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
