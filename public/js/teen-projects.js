let projectId = new URLSearchParams(window.location.search).get('id');

document.addEventListener('DOMContentLoaded', () => {
    initCountryModal();
    initMetricModal();
    initProjectControls();
    initVisualModals();
    
    if (projectId) {
        loadProject(projectId);
    } else {
        updatePreviewChart();
    }
    
    loadMyProjects();
});

let selectedCountries = [];
let selectedMetrics = [];
let allCountries = [];
let flagCodes = {};
let selectedGraphMetric = null;
let customReferences = [];

async function loadProject(id) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/projects/${id}`);
        const result = await response.json();
        if (result.status === 'success') {
            const p = result.data;
            const questionInput = document.getElementById('projectQuestion');
            if (questionInput) questionInput.value = p.title || '';
            
            selectedCountries = p.countries || [];
            selectedMetrics = p.metrics || [];
            customReferences = p.references || [];
            selectedGraphMetric = p.graph_metric;
            
            const notesArea = document.getElementById('projectNotes');
            if (notesArea) notesArea.value = p.notes || '';
            
            if (p.chart_type) {
                const select = document.getElementById('chartTypeSelect');
                if (select) select.value = p.chart_type;
            }
            
            if (selectedGraphMetric) {
                const label = document.getElementById('currentGraphLabel');
                if (label) label.innerText = `Visualizing: ${selectedGraphMetric.field.replace(/_/g, ' ')}`;
            }

            renderSelectedCountries();
            renderSelectedMetrics();
            renderEvidence();
            updatePreviewChart();
            updateDataTable();
        }
    } catch (e) {
        console.error('Error loading project:', e);
    }
}

async function loadMyProjects() {
    const list = document.getElementById('myProjectsList');
    if (!list) return;
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/projects`);
        const result = await response.json();
        if (result.status === 'success') {
            list.innerHTML = '';
            result.data.forEach(p => {
                const item = document.createElement('div');
                item.className = `mini-project-card ${p.id == projectId ? 'active' : ''}`;
                item.innerHTML = `
                    <div class="mini-project-info">
                        <h5>${p.title || 'Untitled Project'}</h5>
                        <p>${p.countries ? p.countries.length : 0} countries • Updated ${new Date(p.updated_at).toLocaleDateString()}</p>
                        <div class="proj-progress-mini"><div class="proj-progress-fill" style="width: ${p.progress || 20}%"></div></div>
                    </div>
                `;
                item.onclick = () => window.location.href = `teen-projects.html?id=${p.id}`;
                list.appendChild(item);
            });
        }
    } catch (e) { console.error(e); }
}

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
        countryOptionsGrid.innerHTML = '<div class="loading" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><br><br>Finding countries...</div>';
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country`);
            const data = await response.json();
            if (data.status === 'success') {
                allCountries = data.data;
                renderCountries(allCountries);
            }
        } catch (e) { 
            console.error(e); 
            countryOptionsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">Failed to load countries.</div>';
        }
    }

    function renderCountries(countries) {
        countryOptionsGrid.innerHTML = '';
        if (countries.length === 0) {
            countryOptionsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No countries found matching your search.</div>';
            return;
        }
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

    countrySearch.oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = allCountries.filter(c => c.country.toLowerCase().includes(term));
        renderCountries(filtered);
    };

    closeModalBtn.onclick = () => countryModal.classList.remove('active');
}

function selectCountry(country, code) {
    if (selectedCountries.find(c => c.id === country.id)) return;
    country.resolvedCode = code;
    selectedCountries.push(country);
    renderSelectedCountries();
    updatePreviewChart();
    updateDataTable();
    document.getElementById('countryModal').classList.remove('active');
}

function renderSelectedCountries() {
    const container = document.getElementById('selectedCountriesList');
    if (!container) return;
    
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
            updatePreviewChart();
            updateDataTable();
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
        if (selectedCountries.length === 0) {
            fieldsList.innerHTML = '<div class="loading" style="padding: 20px; text-align: center; color: var(--accent-orange);"><i class="fa-solid fa-triangle-exclamation"></i> Select a country first to see available metrics.</div>';
            return;
        }

        fieldsList.innerHTML = '<div class="loading" style="padding: 20px; text-align: center; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Analyzing available data for ' + selectedCountries.length + ' countries...</div>';
        
        try {
            const statsPromises = selectedCountries.map(c => 
                fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/${c.id}/stats`).then(r => r.json())
            );
            const results = await Promise.all(statsPromises);
            
            const countryFieldsSets = results.map(res => {
                if (res.status !== 'success') return new Set();
                const categoryData = res.data[categoryKey] || [];
                return new Set(categoryData.filter(f => f.parent_id === 0).map(f => f.field));
            });

            let commonFields = countryFieldsSets.length > 0 ? [...countryFieldsSets[0]] : [];
            for (let i = 1; i < countryFieldsSets.length; i++) {
                commonFields = commonFields.filter(f => countryFieldsSets[i].has(f));
            }
            
            if (commonFields.length === 0) {
                fieldsList.innerHTML = '<div class="loading" style="padding: 20px; text-align: center; color: var(--text-muted);">No common metrics found for these countries in this category.</div>';
                return;
            }

            fieldsList.innerHTML = '';
            commonFields.sort().forEach(field => {
                const item = document.createElement('div');
                item.className = 'metric-field-option';
                item.innerHTML = `
                    <span>${field.replace(/_/g, ' ')}</span>
                    <i class="fa-solid fa-plus"></i>
                `;
                item.onclick = () => selectMetric(field, categoryKey);
                fieldsList.appendChild(item);
            });
        } catch (e) { 
            console.error(e);
            fieldsList.innerHTML = '<div class="loading" style="padding: 20px; text-align: center; color: #ef4444;">Error analyzing metrics.</div>';
        }
    }

    function selectMetric(field, category) {
        if (selectedMetrics.find(m => m.field === field)) return;
        selectedMetrics.push({ field, category });
        renderSelectedMetrics();
        updatePreviewChart();
        updateDataTable();
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
            updatePreviewChart();
            updateDataTable();
        };
        container.appendChild(pill);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'btn-add-mini';
    addBtn.innerText = '+ Add Metric';
    
    if (selectedCountries.length === 0) {
        addBtn.style.opacity = '0.4';
        addBtn.style.cursor = 'not-allowed';
        addBtn.title = 'Select a country first';
        addBtn.onclick = (e) => {
            e.preventDefault();
            alert('Please select at least one country first!');
        };
    } else {
        addBtn.onclick = () => document.getElementById('metricModal').classList.add('active');
    }
    
    container.appendChild(addBtn);

    const countSpan = document.getElementById('metricCount');
    if (countSpan) countSpan.innerText = `${selectedMetrics.length} metrics`;
}

function initVisualModals() {
    const openGraphBtn = document.getElementById('openGraphMetricBtn');
    const graphModal = document.getElementById('graphMetricModal');
    const closeGraphModalBtn = document.getElementById('closeGraphMetricModalBtn');
    const metricsList = document.getElementById('projectMetricsListForGraph');

    if (openGraphBtn) {
        openGraphBtn.onclick = () => {
            if (selectedMetrics.length === 0) {
                alert('Please select at least one research metric first!');
                return;
            }
            renderProjectMetricsForGraph();
            graphModal.classList.add('active');
        };
    }

    function renderProjectMetricsForGraph() {
        if (!metricsList) return;
        metricsList.innerHTML = '';
        selectedMetrics.forEach(m => {
            const item = document.createElement('div');
            item.className = 'metric-category-item';
            item.style.textAlign = 'left';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '10px';
            item.innerHTML = `<i class="fa-solid fa-chart-line" style="color: var(--accent-blue);"></i> <span>${m.field.replace(/_/g, ' ')}</span>`;
            item.onclick = () => {
                selectedGraphMetric = m;
                document.getElementById('currentGraphLabel').innerText = `Visualizing: ${m.field.replace(/_/g, ' ')}`;
                updatePreviewChart();
                graphModal.classList.remove('active');
            };
            metricsList.appendChild(item);
        });
    }

    if (closeGraphModalBtn) closeGraphModalBtn.onclick = () => graphModal.classList.remove('active');

    const openRefBtn = document.getElementById('openReferenceModalBtn');
    const refModal = document.getElementById('referenceModal');
    const closeRefBtn = document.getElementById('closeReferenceModalBtn');
    const saveRefBtn = document.getElementById('saveReferenceBtn');

    if (openRefBtn) openRefBtn.onclick = () => refModal.classList.add('active');
    if (closeRefBtn) closeRefBtn.onclick = () => refModal.classList.remove('active');

    if (saveRefBtn) {
        saveRefBtn.onclick = () => {
            const title = document.getElementById('refTitle').value;
            const link = document.getElementById('refLink').value;
            const type = document.getElementById('refType').value;
            if (!title) return alert('Please enter a title!');
            customReferences.push({ title, link, type });
            renderEvidence();
            refModal.classList.remove('active');
            document.getElementById('refTitle').value = '';
            document.getElementById('refLink').value = '';
        };
    }

    const chartTypeSelect = document.getElementById('chartTypeSelect');
    if (chartTypeSelect) {
        chartTypeSelect.onchange = () => updatePreviewChart();
    }
}

function renderEvidence() {
    const container = document.getElementById('evidenceList');
    if (!container) return;
    container.innerHTML = '';

    if (selectedMetrics.length === 0 && customReferences.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 20px;">Select data or add references to see evidence</p>';
        return;
    }

    if (selectedMetrics.length > 0) {
        const item = document.createElement('div');
        item.className = 'evidence-item';
        item.innerHTML = `
            <div class="source-icon" style="background: rgba(34, 197, 94, 0.1); color: var(--accent-green);"><i class="fa-solid fa-database"></i></div>
            <div class="source-info">
                <h5>CIA World Factbook <i class="fa-solid fa-circle-check verified-badge"></i></h5>
                <p>Global economic & social statistics</p>
            </div>
        `;
        container.appendChild(item);
    }

    customReferences.forEach(ref => {
        const icon = ref.type === 'web' ? 'fa-globe' : (ref.type === 'book' ? 'fa-book' : 'fa-file-lines');
        const color = ref.type === 'web' ? 'var(--accent-blue)' : 'var(--accent-orange)';
        const item = document.createElement('div');
        item.className = 'evidence-item';
        item.innerHTML = `
            <div class="source-icon" style="background: rgba(255,255,255,0.05); color: ${color};"><i class="fa-solid ${icon}"></i></div>
            <div class="source-info">
                <h5>${ref.title}</h5>
                <p style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;">${ref.link || 'Manual reference'}</p>
            </div>
        `;
        container.appendChild(item);
    });
}

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
    const saveBtn = document.querySelector('.btn-secondary');
    const continueBtn = document.querySelector('.btn-continue');
    
    if (saveBtn) {
        saveBtn.onclick = (e) => {
            e.preventDefault();
            saveProject(false);
        };
    }
    if (continueBtn) {
        continueBtn.onclick = (e) => {
            e.preventDefault();
            saveProject(true);
        };
    }
}

async function saveProject(redirect = false) {
    const questionInput = document.getElementById('projectQuestion');
    const question = questionInput ? questionInput.value : '';
    const notesArea = document.getElementById('projectNotes');
    const notes = notesArea ? notesArea.value : '';
    
    if (!question) {
        alert('Please enter a research question before saving!');
        return;
    }

    const projectData = {
        title: question,
        countries: selectedCountries,
        metrics: selectedMetrics,
        notes: notes,
        graph_metric: selectedGraphMetric,
        chart_type: document.getElementById('chartTypeSelect')?.value || 'line',
        references: customReferences,
        status: redirect ? 'completed' : 'draft',
        progress: selectedMetrics.length > 0 ? 80 : 40
    };

    try {
        // Logic: If projectId exists, we UPDATE (PUT). If not, we CREATE (POST).
        const isUpdate = (projectId !== null && projectId !== undefined && projectId !== "");
        const url = isUpdate 
            ? `${window.APP_CONFIG.API_BASE_URL}/api/projects/${projectId}` 
            : `${window.APP_CONFIG.API_BASE_URL}/api/projects`;
        
        const method = isUpdate ? 'PUT' : 'POST';
        
        console.log(`${isUpdate ? 'Updating' : 'Creating'} project...`);

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        
        if (result.status === 'success') {
            const savedProject = result.data;
            
            // Critical: Update global projectId with the ID returned from server
            projectId = savedProject.id;
            
            if (redirect) {
                window.location.href = `teen-export.html?id=${projectId}`;
            } else {
                alert(`Project ${isUpdate ? 'updated' : 'saved'} successfully!`);
                loadMyProjects();
                
                // Sync URL so refreshing doesn't lose the draft context
                const newUrl = window.location.pathname + '?id=' + projectId;
                window.history.pushState({ path: newUrl }, '', newUrl);
            }
        } else {
            alert('Error saving project: ' + result.error);
        }
    } catch (e) {
        console.error('Save Error:', e);
        alert('Failed to connect to the server. Project not saved.');
    }
}

async function updatePreviewChart() {
    const canvas = document.getElementById('previewChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.previewChartInstance) window.previewChartInstance.destroy();

    if (selectedCountries.length === 0 || !selectedGraphMetric) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '12px Outfit';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Select data to visualize timeline in the chart', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    const chartType = document.getElementById('chartTypeSelect').value;

    try {
        const statsPromises = selectedCountries.map(c => 
            fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/${c.id}/stats`).then(r => r.json())
        );
        const results = await Promise.all(statsPromises);
        
        let allYears = new Set();
        results.forEach(res => {
            if (res.status === 'success') {
                const categoryData = res.data[selectedGraphMetric.category] || [];
                const fieldData = categoryData.filter(d => d.field === selectedGraphMetric.field && d.parent_id === 0);
                fieldData.forEach(d => { if (d.year) allYears.add(d.year); });
            }
        });

        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        const colors = ['#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#14b8a6', '#f43f5e'];

        const datasets = results.map((res, idx) => {
            const country = selectedCountries[idx];
            const color = colors[idx % colors.length];
            let timelineData = [];
            if (res.status === 'success') {
                const categoryData = res.data[selectedGraphMetric.category] || [];
                const fieldData = categoryData.filter(d => d.field === selectedGraphMetric.field && d.parent_id === 0);
                timelineData = sortedYears.map(year => {
                    const dataPoint = fieldData.find(d => d.year === year);
                    return (dataPoint && dataPoint.value) ? parseFloat(dataPoint.value.replace(/[^0-9.]/g, '')) || null : null;
                });
            }
            return {
                label: country.country,
                data: timelineData,
                borderColor: color,
                backgroundColor: chartType === 'bar' ? color + '80' : color + '20',
                borderWidth: 2,
                tension: 0.3,
                fill: chartType === 'line'
            };
        });

        window.previewChartInstance = new Chart(ctx, {
            type: chartType,
            data: { labels: sortedYears, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: selectedCountries.length > 1, position: 'top', labels: { color: '#64748b', boxWidth: 12, font: { size: 10, family: 'Outfit' } } },
                    tooltip: { backgroundColor: '#1e293b', titleFont: { family: 'Outfit', size: 12 }, bodyFont: { family: 'Outfit', size: 11 }, padding: 10, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
                },
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
                }
            }
        });
    } catch (e) { console.error(e); }
}

async function updateDataTable() {
    const container = document.getElementById('dataTableContainer');
    if (!container) return;
    renderEvidence();

    if (selectedCountries.length === 0 || selectedMetrics.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 20px;">Select countries and metrics to see comparison table</p>`;
        return;
    }

    container.innerHTML = '<div class="loading" style="text-align: center; padding: 20px; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Generating comparison matrix...</div>';

    try {
        const statsPromises = selectedCountries.map(c => 
            fetch(`${window.APP_CONFIG.API_BASE_URL}/api/teen-country/${c.id}/stats`).then(r => r.json())
        );
        const results = await Promise.all(statsPromises);
        
        let html = `<table class="project-data-table"><thead><tr><th>Metric</th>`;
        selectedCountries.forEach(c => { html += `<th>${c.country}</th>`; });
        html += `</tr></thead><tbody>`;

        selectedMetrics.forEach(m => {
            html += `<tr><td style="text-transform: capitalize;"><strong>${m.field.replace(/_/g, ' ')}</strong></td>`;
            results.forEach(res => {
                if (res.status === 'success') {
                    const categoryData = res.data[m.category] || [];
                    const fieldData = categoryData.filter(d => d.field === m.field && d.parent_id === 0);
                    const latest = fieldData.sort((a, b) => b.year - a.year)[0];
                    const value = (latest && latest.value && latest.value.trim() !== "") ? latest.value : "N/A";
                    html += `<td class="metric-val">${value}</td>`;
                } else { html += `<td class="metric-val">N/A</td>`; }
            });
            html += `</tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (e) { console.error(e); container.innerHTML = `<p style="color: #ef4444; text-align: center;">Error.</p>`; }
}
