/**
 * Geofroggy Dynamic Database Manager
 * Logic for metadata-driven table management and CSV flows.
 */

class DynamicDatabaseManager {
    constructor() {
        this.config = null;
        this.activeTable = null;
        this.dataTable = null;
        this.apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : '';
        this.token = localStorage.getItem('token');

        this.init();
    }

    async init() {
        try {
            // 1. Load the Table Schema
            const response = await fetch('/config/db-schema.json');
            this.config = await response.json();
            
            // 2. Render UI Components
            this.renderSidebar();
            this.bindEvents();
            
            // 3. Initial Table Selection
            const hash = window.location.hash.substring(1);
            const initialTable = this.config.tables.find(t => t.id === hash) || this.config.tables[0];
            if (initialTable) {
                this.switchTable(initialTable.id);
            }
        } catch (err) {
            console.error('Failed to initialize Database Manager:', err);
        }
    }

    renderSidebar() {
        const navList = document.getElementById('db-nav-list');
        navList.innerHTML = this.config.tables.map(table => `
            <a href="#${table.id}" class="db-nav-item" data-table-id="${table.id}">
                <i class="${table.icon}"></i>
                <span>${table.label}</span>
            </a>
        `).join('');

        document.querySelectorAll('.db-nav-item').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tableId = link.getAttribute('data-table-id');
                this.switchTable(tableId);
                window.location.hash = tableId;
            });
        });
    }

    bindEvents() {
        // Add New Button
        document.getElementById('add-new-btn').addEventListener('click', () => {
            this.showFormModal();
        });

        // Save Button
        document.getElementById('save-btn').addEventListener('click', () => {
            this.handleSave();
        });

        // Import CSV Button (Optional: We can add a button for this)
        this.injectCsvTools();
    }

    injectCsvTools() {
        const headerActions = document.querySelector('.header-actions');
        if (!headerActions.querySelector('.btn-csv-import')) {
            const importBtn = document.createElement('button');
            importBtn.className = 'btn-glass btn-csv-import';
            importBtn.innerHTML = '<i class="ri-upload-cloud-2-line"></i> Import CSV';
            importBtn.onclick = () => this.showCsvImportModal();
            headerActions.prepend(importBtn);
        }
    }

    async switchTable(tableId) {
        const tableConfig = this.config.tables.find(t => t.id === tableId);
        if (!tableConfig) return;

        this.activeTable = tableConfig;

        // UI Updates
        document.querySelectorAll('.db-nav-item').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-table-id') === tableId);
        });

        document.getElementById('active-table-name').textContent = tableConfig.label;
        document.getElementById('active-table-desc').textContent = tableConfig.description;

        // Show container but keep loader on top
        $('#table-container').show();
        $('#table-loader').fadeIn(200);

        this.initDataTable(tableConfig);
    }

    initDataTable(config) {
        if (this.dataTable) {
            this.dataTable.destroy();
            $('#dynamicTable').empty();
        }

        // Build headers from fields (only those with view: true)
        const viewableFields = config.fields.filter(f => f.view !== false);
        const headerHtml = viewableFields.map(f => `<th>${f.label}</th>`).join('') + '<th>Actions</th>';
        $('#dynamicTable').html(`<thead><tr>${headerHtml}</tr></thead><tbody></tbody>`);

        // Suppress DataTables alert warnings (show in console instead)
        $.fn.dataTable.ext.errMode = 'none';
        $('#dynamicTable').on('error.dt', (e, settings, techNote, message) => {
            console.warn('DataTables Error:', message);
        });

        const columns = viewableFields.map(f => ({
            data: f.name,
            defaultContent: '<span class="text-dim">N/A</span>',
            render: (data) => {
                if (data === null || data === undefined) return '<span class="text-dim">N/A</span>';
                if (f.type === 'date') return new Date(data).toLocaleDateString();
                return data;
            }
        }));

        // Add Actions Column
        columns.push({
            data: null,
            orderable: false,
            render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `
        });

        this.dataTable = $('#dynamicTable').DataTable({
            responsive: true,
            autoWidth: false,
            ajax: {
                url: `${this.apiUrl}/api/manage/${config.dbTable}`,
                headers: { 'Authorization': `Bearer ${this.token}` },
                dataSrc: (json) => {
                    $('#table-loader').fadeOut(200);
                    return json.data || [];
                }
            },
            columns: columns,
            dom: '<"d-flex justify-content-between align-items-center mb-3"lf>rt<"d-flex justify-content-between align-items-center mt-3"ip>',
            language: {
                search: "_INPUT_",
                searchPlaceholder: `Search ${config.label.toLowerCase()}...`
            },
            drawCallback: () => {
                this.bindTableActions();
                // Force responsive recalc after draw
                setTimeout(() => {
                    if (this.dataTable) this.dataTable.columns.adjust().responsive.recalc();
                }, 100);
            }
        });
    }

    bindTableActions() {
        $('.edit-row').off().on('click', (e) => {
            const data = this.dataTable.row($(e.currentTarget).closest('tr')).data();
            this.showFormModal(data);
        });

        $('.delete-row').off().on('click', (e) => {
            const data = this.dataTable.row($(e.currentTarget).closest('tr')).data();
            if (confirm('Are you sure you want to delete this record?')) {
                this.handleDelete(data.id);
            }
        });
    }

    showFormModal(data = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const container = document.getElementById('form-fields-container');
        document.getElementById('modalTitle').textContent = data ? `Edit ${this.activeTable.label}` : `Add New ${this.activeTable.label}`;
        
        container.innerHTML = '';
        this.activeTable.fields.forEach(field => {
            // Skip readonly fields for NEW records (they are auto-generated)
            if (!data && field.readonly) return;

            const value = data ? data[field.name] : '';
            const readonly = field.readonly ? 'readonly disabled' : '';
            const required = field.required && !field.readonly ? 'required' : '';
            
            let inputHtml = '';
            if (field.type === 'select') {
                inputHtml = `
                    <select class="form-select bg-dark border-secondary text-white" name="${field.name}" ${readonly} ${required}>
                        ${field.options.map(opt => `<option value="${opt}" ${opt === value ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>`;
            } else if (field.type === 'textarea') {
                inputHtml = `<textarea class="form-control bg-dark border-secondary text-white" name="${field.name}" ${readonly} ${required}>${value}</textarea>`;
            } else {
                inputHtml = `<input type="${field.type}" class="form-control bg-dark border-secondary text-white" name="${field.name}" value="${value}" ${readonly} ${required}>`;
            }

            container.innerHTML += `
                <div class="col-md-6">
                    <label class="form-label text-dim small fw-bold">${field.label}</label>
                    ${inputHtml}
                </div>
            `;
        });

        this.editingId = data ? data.id : null;
        modal.show();
    }

    async handleSave() {
        const formData = new FormData(document.getElementById('genericForm'));
        const payload = Object.fromEntries(formData.entries());

        // Ensure ID is NOT sent for new records (POST)
        if (!this.editingId) {
            delete payload.id;
        }
        
        const method = this.editingId ? 'PUT' : 'POST';
        const url = this.editingId 
            ? `${this.apiUrl}/api/manage/${this.activeTable.dbTable}/${this.editingId}`
            : `${this.apiUrl}/api/manage/${this.activeTable.dbTable}`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.status === 'success') {
                bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
                this.dataTable.ajax.reload();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (err) {
            console.error('Save failed:', err);
        }
    }

    async handleDelete(id) {
        try {
            const response = await fetch(`${this.apiUrl}/api/manage/${this.activeTable.dbTable}/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            const result = await response.json();
            if (result.status === 'success') this.dataTable.ajax.reload();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

    // --- CSV LOGIC ---

    showCsvImportModal() {
        const modalHtml = `
            <div class="modal fade" id="csvModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark border-secondary">
                        <div class="modal-header border-secondary">
                            <h5 class="modal-title text-white">Import CSV to ${this.activeTable.label}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="text-dim small">Accepted Headers: <br>
                                <code class="text-primary">${this.activeTable.fields.filter(f => !f.readonly).map(f => f.name).join(', ')}</code>
                            </p>
                            <input type="file" id="csvFileInput" class="form-control bg-dark border-secondary text-white" accept=".csv">
                            <div id="csvPreview" class="mt-3 small text-dim" style="max-height: 200px; overflow-y: auto;"></div>
                        </div>
                        <div class="modal-footer border-secondary">
                            <button type="button" class="btn btn-glass" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary-custom" id="processCsvBtn">Process Upload</button>
                        </div>
                    </div>
                </div>
            </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('csvModal'));
        modal.show();

        document.getElementById('processCsvBtn').onclick = () => this.handleCsvUpload();
        
        document.getElementById('csvModal').addEventListener('hidden.bs.modal', (e) => {
            e.target.remove();
        });
    }

    async handleCsvUpload() {
        const fileInput = document.getElementById('csvFileInput');
        if (!fileInput.files.length) return alert('Please select a file');

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            const text = e.target.result;
            const rows = text.split('\n').map(r => r.split(',').map(c => c.trim()));
            const headers = rows[0];
            const dataRows = rows.slice(1).filter(r => r.length === headers.length && r.some(c => c !== ''));

            // Validate Headers
            const requiredFields = this.activeTable.fields.filter(f => !f.readonly).map(f => f.name);
            const missingHeaders = requiredFields.filter(f => !headers.includes(f));

            if (missingHeaders.length > 0) {
                return alert('Missing headers: ' + missingHeaders.join(', '));
            }

            // Map data to objects
            const payload = dataRows.map(row => {
                const obj = {};
                headers.forEach((h, i) => {
                    if (requiredFields.includes(h)) obj[h] = row[i];
                });
                return obj;
            });

            // Send to API
            try {
                const response = await fetch(`${this.apiUrl}/api/manage/${this.activeTable.dbTable}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    alert(`Successfully imported ${payload.length} records!`);
                    bootstrap.Modal.getInstance(document.getElementById('csvModal')).hide();
                    this.dataTable.ajax.reload();
                } else {
                    alert('Import Error: ' + result.error);
                }
            } catch (err) {
                console.error('CSV Import failed:', err);
            }
        };

        reader.readAsText(file);
    }
}

$(document).ready(() => {
    window.dbManager = new DynamicDatabaseManager();
});
