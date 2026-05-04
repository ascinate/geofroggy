document.addEventListener('DOMContentLoaded', () => {
    initCountryModal();
    initMetricModal();
    initProjectControls();
    updatePreviewChart();
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
    const container = document.getElementById('selectedCountriesList');
    if (!container) return;
    
    // Create new add button if it doesn't exist (since we clear innerHTML)
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
    
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-mini';
    addBtn.innerText = '+ Add Country';
    addBtn.onclick = () => document.getElementById('countryModal').classList.add('active');
    container.appendChild(addBtn);

    document.getElementById('countryCount').innerText = `${selectedCountries.length} countries`;
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
    const metricModal = document.getElementById('metricModal');
    const closeMetricModalBtn = document.getElementById('closeMetricModalBtn');
    const categoriesGrid = document.querySelector('.metric-categories-grid');
    const fieldsList = document.querySelector('.metric-fields-list');

    // Delegate click to add button
    document.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-mini') && e.target.innerText.includes('Metric')) {
            metricModal.classList.add('active');
            renderCategories();
        }
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
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/1/stats`);
            const data = await response.json();
            if (data.status === 'success') {
                const fields = data.data[categoryKey] || [];
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
    const container = document.getElementById('selectedMetricsList');
    if (!container) return;
    
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

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-mini';
    addBtn.innerText = '+ Add Metric';
    addBtn.onclick = () => document.getElementById('metricModal').classList.add('active');
    container.appendChild(addBtn);

    document.getElementById('metricCount').innerText = `${selectedMetrics.length} metrics`;
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
    const editBtn = document.getElementById('editQuestionBtn');
    const questionText = document.getElementById('projectQuestion');
    
    if (editBtn) {
        editBtn.onclick = () => {
            const newQuestion = prompt("Enter your research question:", questionText.innerText);
            if (newQuestion) {
                questionText.innerText = newQuestion;
            }
        };
    }

    const saveBtn = document.querySelector('.btn-secondary');
    if (saveBtn) {
        saveBtn.onclick = () => alert('Project draft saved to local storage!');
    }
}

function updatePreviewChart() {
    const ctx = document.getElementById('previewChart').getContext('2d');
    
    // Clear existing chart instance if it exists
    if (window.previewChartInstance) {
        window.previewChartInstance.destroy();
    }

    if (selectedCountries.length === 0 || selectedMetrics.length === 0) {
        // Show placeholder or empty state
        ctx.font = '12px Outfit';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Select countries and metrics to see preview', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    // Otherwise load actual data (logic to be implemented with API)
}
