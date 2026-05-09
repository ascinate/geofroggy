/**
 * Geofroggy Database Manager Logic
 * Handles dynamic table switching and DataTables initialization.
 */

const MANAGED_TABLES = [
    {
        id: 'users',
        name: 'Users',
        icon: 'ri-user-3-line',
        endpoint: '/api/auth/admin/users',
        description: 'Monitor and manage all platform users and administrators.',
        columns: [
            { data: 'username', label: 'User', render: (data, type, row) => `
                <div class="user-cell">
                    <img src="${row.avatar_url || `https://ui-avatars.com/api/?name=${data}`}" class="user-avatar" alt="">
                    <div class="fw-bold">${data}</div>
                </div>
            `},
            { data: 'email', label: 'Email' },
            { data: 'role', label: 'Role', render: data => `<span class="badge bg-primary-subtle text-primary border-0 text-uppercase">${data || 'user'}</span>` },
            { data: 'created_at', label: 'Joined', render: data => data ? new Date(data).toLocaleDateString() : 'N/A' },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    },
    {
        id: 'countries',
        name: 'Countries',
        icon: 'ri-flag-line',
        endpoint: '/api/country',
        description: 'Configure countries and regions for Teen and Kids portals.',
        columns: [
            { data: 'name', label: 'Country', render: (data, type, row) => `
                <div class="d-flex align-items-center">
                    <img src="https://flagcdn.com/w40/${(row.code || 'un').toLowerCase()}.png" class="country-flag" alt="">
                    <div class="fw-bold">${data}</div>
                </div>
            `},
            { data: 'region', label: 'Region' },
            { data: 'difficulty', label: 'Difficulty', render: data => `<span class="badge bg-info-subtle text-info border-0">${data || 'Beginner'}</span>` },
            { data: 'status', label: 'Status', render: data => `<span class="status-badge ${data === 'active' ? 'status-active' : 'status-inactive'}">${data || 'active'}</span>` },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    },
    {
        id: 'missions',
        name: 'Missions',
        icon: 'ri-rocket-line',
        endpoint: '/api/missions',
        description: 'Manage educational missions and challenges.',
        columns: [
            { data: 'title', label: 'Mission Title', render: data => `<div class="fw-bold">${data}</div>` },
            { data: 'country_name', label: 'Country' },
            { data: 'xp_reward', label: 'XP Reward', render: data => `<span class="text-primary fw-bold">+${data} XP</span>` },
            { data: 'type', label: 'Type' },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    },
    {
        id: 'stories',
        name: 'Stories',
        icon: 'ri-book-open-line',
        endpoint: '/api/stories',
        description: 'Curate cultural stories and multimedia content.',
        columns: [
            { data: 'title', label: 'Story', render: (data, type, row) => `
                <div class="d-flex align-items-center">
                    <img src="${row.thumbnail_url || 'https://placehold.co/40x40/0f172a/white?text=S'}" class="story-thumbnail" alt="">
                    <div class="fw-bold">${data}</div>
                </div>
            `},
            { data: 'category', label: 'Category' },
            { data: 'author', label: 'Author' },
            { data: 'status', label: 'Status', render: data => `<span class="status-badge status-active">${data || 'Published'}</span>` },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    },
    {
        id: 'quizzes',
        name: 'Quizzes',
        icon: 'ri-questionnaire-line',
        endpoint: '/api/quiz',
        description: 'Manage assessment quizzes and questions.',
        columns: [
            { data: 'title', label: 'Quiz Name', render: data => `<div class="fw-bold">${data}</div>` },
            { data: 'questions_count', label: 'Questions' },
            { data: 'difficulty', label: 'Difficulty' },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    },
    {
        id: 'projects',
        name: 'Projects',
        icon: 'ri-layout-grid-line',
        endpoint: '/api/projects',
        description: 'Manage community projects and impact initiatives.',
        columns: [
            { data: 'name', label: 'Project Name', render: data => `<div class="fw-bold">${data}</div>` },
            { data: 'goal_amount', label: 'Goal', render: data => `$${data.toLocaleString()}` },
            { data: 'status', label: 'Status', render: data => `<span class="status-badge status-active">${data || 'Active'}</span>` },
            { data: null, label: 'Actions', orderable: false, render: () => `
                <div class="d-flex gap-2">
                    <button class="action-btn edit-row" title="Edit"><i class="ri-edit-line"></i></button>
                    <button class="action-btn delete-row text-danger" title="Delete"><i class="ri-delete-bin-line"></i></button>
                </div>
            `}
        ]
    }
];

class DatabaseManager {
    constructor() {
        this.activeTable = null;
        this.dataTable = null;
        this.apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : '';
        this.token = localStorage.getItem('token');

        this.init();
    }

    init() {
        this.renderSidebar();
        this.bindEvents();
        
        // Auto-select first table if hash exists or default to first
        const hash = window.location.hash.substring(1);
        const initialTable = MANAGED_TABLES.find(t => t.id === hash) || MANAGED_TABLES[0];
        if (initialTable) {
            this.switchTable(initialTable.id);
        }
    }

    renderSidebar() {
        const navList = document.getElementById('db-nav-list');
        navList.innerHTML = MANAGED_TABLES.map(table => `
            <a href="#${table.id}" class="db-nav-item" data-table-id="${table.id}">
                <i class="${table.icon}"></i>
                <span>${table.name}</span>
            </a>
        `).join('');

        // Sidebar link clicks
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
        // Global refresh button
        document.getElementById('add-new-btn').addEventListener('click', () => {
            this.showFormModal();
        });

        // Save button in modal
        document.getElementById('save-btn').addEventListener('click', () => {
            this.handleSave();
        });
    }

    async switchTable(tableId) {
        const tableConfig = MANAGED_TABLES.find(t => t.id === tableId);
        if (!tableConfig) return;

        console.log(`Switching to table: ${tableId}`);
        this.activeTable = tableConfig;

        // Update UI states
        document.querySelectorAll('.db-nav-item').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-table-id') === tableId);
        });

        document.getElementById('active-table-name').textContent = tableConfig.name;
        document.getElementById('active-table-desc').textContent = tableConfig.description;

        // Show loader
        $('#table-loader').show();
        $('#table-container').hide();
        $('#empty-state').hide();

        // Initialize DataTable
        this.initDataTable(tableConfig);
    }

    initDataTable(config) {
        // Destroy existing table if it exists
        if (this.dataTable) {
            this.dataTable.destroy();
            $('#dynamicTable').empty();
        }

        // Re-create header row
        const headerHtml = config.columns.map(col => `<th>${col.label}</th>`).join('');
        $('#dynamicTable').html(`<thead><tr>${headerHtml}</tr></thead><tbody></tbody>`);

        // Initialize new DataTable
        this.dataTable = $('#dynamicTable').DataTable({
            responsive: true,
            processing: true,
            serverSide: false, // Set to true if API supports it
            ajax: {
                url: `${this.apiUrl}${config.endpoint}`,
                headers: { 'Authorization': `Bearer ${this.token}` },
                dataSrc: (json) => {
                    $('#table-loader').hide();
                    $('#table-container').fadeIn();
                    if (json.status === 'success') return json.data;
                    console.error('API Error:', json.error);
                    return [];
                },
                error: (xhr) => {
                    $('#table-loader').hide();
                    $('#empty-state').show();
                    console.error('Connection Error', xhr);
                }
            },
            columns: config.columns,
            dom: '<"d-flex justify-content-between align-items-center mb-3"lf>rt<"d-flex justify-content-between align-items-center mt-3"ip>',
            language: {
                search: "_INPUT_",
                searchPlaceholder: `Search ${config.name.toLowerCase()}...`,
                lengthMenu: "Show _MENU_",
            },
            drawCallback: () => {
                // Bind action buttons after draw
                this.bindActionButtons();
            }
        });
    }

    bindActionButtons() {
        $('.edit-row').on('click', (e) => {
            const data = this.dataTable.row($(e.currentTarget).closest('tr')).data();
            this.showFormModal(data);
        });

        $('.delete-row').on('click', (e) => {
            const data = this.dataTable.row($(e.currentTarget).closest('tr')).data();
            if (confirm(`Are you sure you want to delete this record?`)) {
                this.handleDelete(data.id);
            }
        });
    }

    showFormModal(data = null) {
        const modal = new bootstrap.Modal(document.getElementById('formModal'));
        const container = document.getElementById('form-fields-container');
        document.getElementById('modalTitle').textContent = data ? `Edit ${this.activeTable.name}` : `Add New ${this.activeTable.name}`;
        
        // Clear previous fields
        container.innerHTML = '';

        // Generate fields based on columns (excluding actions)
        this.activeTable.columns.forEach(col => {
            if (col.label === 'Actions') return;

            const val = data ? data[col.data] : '';
            const fieldId = `field_${col.data}`;

            container.innerHTML += `
                <div class="col-md-6">
                    <label class="form-label text-dim small fw-bold">${col.label}</label>
                    <input type="text" class="form-control bg-dark border-secondary text-white" id="${fieldId}" name="${col.data}" value="${val || ''}">
                </div>
            `;
        });

        modal.show();
    }

    async handleSave() {
        // Placeholder for save logic
        alert('Save functionality will be connected to the API endpoints.');
        bootstrap.Modal.getInstance(document.getElementById('formModal')).hide();
    }

    async handleDelete(id) {
        // Placeholder for delete logic
        alert(`Delete record with ID: ${id}`);
    }

    refresh() {
        if (this.dataTable) {
            this.dataTable.ajax.reload();
        }
    }
}

// Initialize on load
$(document).ready(() => {
    window.dbManager = new DatabaseManager();
});
