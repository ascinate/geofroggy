// frontend/js/alert.js

/**
 * Premium Geofroggy Alert System
 * Shows a beautiful glassmorphism toast notification
 * 
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {string} msg - The message to display
 */
function showAlert(type, msg) {
    // 1. Inject Styles if not already present
    if (!document.getElementById('froggy-alert-styles')) {
        const style = document.createElement('style');
        style.id = 'froggy-alert-styles';
        style.textContent = `
            .froggy-alert-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                pointer-events: none;
            }

            .froggy-alert {
                padding: 14px 20px;
                border-radius: 18px;
                background: rgba(255, 255, 255, 0.75);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.8);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 320px;
                max-width: 450px;
                transform: translateY(-150%);
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: auto;
            }

            .froggy-alert.show {
                transform: translateY(0);
            }

            .froggy-alert-icon {
                font-size: 20px;
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 14px;
                flex-shrink: 0;
            }

            .froggy-alert-content {
                flex: 1;
            }

            .froggy-alert-title {
                font-weight: 800;
                font-size: 16px;
                margin-bottom: 1px;
                font-family: 'Nunito', sans-serif;
            }

            .froggy-alert-msg {
                font-size: 14px;
                color: #576d82;
                font-weight: 600;
                line-height: 1.4;
            }

            /* Success Type */
            .alert-success .froggy-alert-icon { background: #e6f4ea; color: #1e7e34; }
            .alert-success .froggy-alert-title { color: #1e7e34; }
            .alert-success { border-left: 5px solid #1e7e34; }

            /* Error Type */
            .alert-error .froggy-alert-icon { background: #fce8e6; color: #d93025; }
            .alert-error .froggy-alert-title { color: #d93025; }
            .alert-error { border-left: 5px solid #d93025; }

            /* Warning Type */
            .alert-warning .froggy-alert-icon { background: #fef7e0; color: #f29900; }
            .alert-warning .froggy-alert-title { color: #f29900; }
            .alert-warning { border-left: 5px solid #f29900; }

            /* Info Type */
            .alert-info .froggy-alert-icon { background: #e8f0fe; color: #1a73e8; }
            .alert-info .froggy-alert-title { color: #1a73e8; }
            .alert-info { border-left: 5px solid #1a73e8; }
        `;
        document.head.appendChild(style);
    }

    // 2. Setup Container
    let container = document.querySelector('.froggy-alert-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'froggy-alert-container';
        document.body.appendChild(container);
    }

    // 3. Create Alert Element
    const alert = document.createElement('div');
    alert.className = `froggy-alert alert-${type}`;

    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-triangle-exclamation',
        warning: 'fa-circle-exclamation',
        info: 'fa-circle-info'
    };

    const titleMap = {
        success: 'Great Job!',
        error: 'Oops!',
        warning: 'Wait a second',
        info: 'Did you know?'
    };

    alert.innerHTML = `
        <div class="froggy-alert-icon">
            <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
        </div>
        <div class="froggy-alert-content">
            <div class="froggy-alert-title">${titleMap[type] || 'Notice'}</div>
            <div class="froggy-alert-msg">${msg}</div>
        </div>
    `;

    // 4. Add to DOM and Show
    container.appendChild(alert);
    
    // Small delay to trigger CSS transition
    setTimeout(() => alert.classList.add('show'), 50);

    // 5. Auto-remove
    setTimeout(() => {
        alert.classList.remove('show');
        // Wait for transition to end before removing from DOM
        setTimeout(() => alert.remove(), 500);
    }, 4500);
}
