// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notifications = [];
        this.maxNotifications = 5;
        this.duration = 5000; // 5 seconds
    }

    show(title, message, type = 'info', icon = null) {
        // Remove oldest if at max
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            oldest.element.remove();
        }

        // Create notification element
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;

        // Determine icon
        const notifIcon = icon || this.getDefaultIcon(type);

        notif.innerHTML = `
            <div class="notification-icon">${notifIcon}</div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
        `;

        // Add to container
        this.container.appendChild(notif);

        // Store reference
        const notification = {
            element: notif,
            timestamp: Date.now()
        };
        this.notifications.push(notification);

        // Auto-remove after duration
        setTimeout(() => {
            this.remove(notification);
        }, this.duration);

        // Click to dismiss
        notif.addEventListener('click', () => {
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            notification.element.style.animation = 'slideOutLeft 0.3s ease';
            setTimeout(() => {
                notification.element.remove();
                this.notifications.splice(index, 1);
            }, 300);
        }
    }

    getDefaultIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    // Convenience methods
    info(title, message, icon) {
        return this.show(title, message, 'info', icon);
    }

    success(title, message, icon) {
        return this.show(title, message, 'success', icon);
    }

    warning(title, message, icon) {
        return this.show(title, message, 'warning', icon);
    }

    error(title, message, icon) {
        return this.show(title, message, 'error', icon);
    }

    // Game-specific notifications
    animalSick(animalName, species) {
        this.warning(
            'Animal Needs Attention',
            `${animalName} the ${species} is sick and needs a vet!`,
            '🏥'
        );
    }

    animalUnhappy(animalName, species) {
        this.warning(
            'Unhappy Animal',
            `${animalName} the ${species} is unhappy with their habitat`,
            '😢'
        );
    }

    guestUnhappy(reason) {
        this.warning(
            'Guest Complaint',
            reason,
            '😞'
        );
    }

    newAnimalBorn(species) {
        this.success(
            'New Baby!',
            `A baby ${species} was born in your zoo!`,
            '🎉'
        );
    }

    lowFunds() {
        this.error(
            'Low Funds',
            'Your zoo is running low on money!',
            '💰'
        );
    }

    exhibitComplete(exhibitType) {
        this.success(
            'Exhibit Complete',
            `New ${exhibitType} exhibit has been built!`,
            '🏗️'
        );
    }

    monthlyReport(income, expenses) {
        const net = income - expenses;
        if (net > 0) {
            this.success(
                'Monthly Report',
                `Profit: $${net.toLocaleString()}`,
                '📈'
            );
        } else {
            this.error(
                'Monthly Report',
                `Loss: $${Math.abs(net).toLocaleString()}`,
                '📉'
            );
        }
    }
}

// Add CSS animation for slideOutLeft
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutLeft {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(-100%);
        }
    }
`;
document.head.appendChild(style);
