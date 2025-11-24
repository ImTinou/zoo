// Save Status UI Indicator
class SaveStatusUI {
    constructor() {
        this.statusElement = document.getElementById('saveStatus');
        this.iconElement = this.statusElement?.querySelector('.save-status-icon');
        this.textElement = this.statusElement?.querySelector('.save-status-text');
        this.hideTimeout = null;
    }

    show(status, message, icon) {
        if (!this.statusElement) return;

        // Clear previous timeout
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        // Update content
        if (this.iconElement) this.iconElement.textContent = icon;
        if (this.textElement) this.textElement.textContent = message;

        // Update classes
        this.statusElement.className = '';
        this.statusElement.classList.add('show', status);

        // Auto-hide after delay (except for 'saving' status)
        if (status !== 'saving') {
            this.hideTimeout = setTimeout(() => {
                this.hide();
            }, 3000);
        }
    }

    showSaving() {
        if (!this.statusElement) return;

        if (this.iconElement) {
            this.iconElement.innerHTML = '<div class="save-status-spinner"></div>';
        }
        if (this.textElement) this.textElement.textContent = 'Saving...';

        this.statusElement.className = 'show saving';
    }

    showSaved() {
        this.show('saved', 'Saved to cloud', '✓');
    }

    showError(message = 'Save failed') {
        this.show('error', message, '✗');
    }

    hide() {
        if (this.statusElement) {
            this.statusElement.classList.remove('show');
        }
    }
}

export default SaveStatusUI;
