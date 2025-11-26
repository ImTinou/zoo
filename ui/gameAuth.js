// Game Authentication Manager - Simple auth check and user menu
import firebaseService from '../firebase/config.js';

class GameAuthUI {
    constructor() {
        this.currentUser = null;
        this.createUserMenu();
        this.setupAuthListeners();

        // Check authentication and redirect if not logged in
        firebaseService.onAuthStateChange((user) => {
            this.currentUser = user;

            if (!user) {
                // Not logged in, redirect to home
                console.log('❌ Not authenticated, redirecting to home...');
                window.location.href = 'index.html';
            } else {
                // Logged in, update UI
                console.log('✅ User authenticated:', user.email);
                this.updateUI();
                this.autoLoadZoo();
            }
        });
    }

    createUserMenu() {
        // Create user menu in top right corner
        const userMenu = document.createElement('div');
        userMenu.id = 'gameUserMenu';
        userMenu.innerHTML = `
            <div class="user-info" id="userInfo">
                <span id="gameUserName" class="user-name">Loading...</span>
                <span class="user-avatar">👤</span>
            </div>
            <div class="user-dropdown" id="gameUserDropdown">
                <div class="dropdown-header">
                    <div class="dropdown-avatar">👤</div>
                    <div class="dropdown-info">
                        <div id="gameDropdownUserName" class="dropdown-name">User</div>
                        <div id="gameDropdownUserEmail" class="dropdown-email">user@email.com</div>
                    </div>
                </div>
                <div class="dropdown-divider"></div>
                <button id="gameSocialBtn" class="dropdown-item">
                    🌍 Social
                </button>
                <button id="gameShareBtn" class="dropdown-item">
                    🔗 Share Settings
                </button>
                <button id="gameMyZooBtn" class="dropdown-item">
                    🏰 My Zoo
                </button>
                <div class="dropdown-divider"></div>
                <button id="gameLogoutBtn" class="dropdown-item danger">
                    🚪 Logout
                </button>
            </div>
        `;
        document.body.appendChild(userMenu);

        // Add styles for game user menu
        const style = document.createElement('style');
        style.textContent = `
            #gameUserMenu {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                padding: 12px 20px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid rgba(255, 255, 255, 0.1);
            }

            .user-info:hover {
                background: rgba(0, 0, 0, 0.9);
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            .user-name {
                color: white;
                font-weight: 600;
                font-size: 14px;
            }

            .user-avatar {
                font-size: 20px;
            }

            .user-dropdown {
                position: absolute;
                top: 60px;
                right: 0;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                min-width: 250px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                display: none;
                border: 2px solid rgba(255, 255, 255, 0.1);
            }

            .user-dropdown.show {
                display: block;
            }

            .dropdown-header {
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .dropdown-avatar {
                font-size: 32px;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
            }

            .dropdown-name {
                color: white;
                font-weight: 700;
                font-size: 16px;
            }

            .dropdown-email {
                color: #8e8ea0;
                font-size: 12px;
                margin-top: 2px;
            }

            .dropdown-divider {
                height: 1px;
                background: rgba(255, 255, 255, 0.1);
                margin: 5px 0;
            }

            .dropdown-item {
                width: 100%;
                padding: 14px 20px;
                background: transparent;
                border: none;
                color: white;
                text-align: left;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .dropdown-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .dropdown-item.danger {
                color: #ff453a;
            }

            .dropdown-item.danger:hover {
                background: rgba(255, 69, 58, 0.2);
            }
        `;
        document.head.appendChild(style);
    }

    setupAuthListeners() {
        // Toggle dropdown
        document.getElementById('userInfo').addEventListener('click', () => {
            const dropdown = document.getElementById('gameUserDropdown');
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#gameUserMenu')) {
                document.getElementById('gameUserDropdown').classList.remove('show');
            }
        });

        // Logout
        document.getElementById('gameLogoutBtn').addEventListener('click', async () => {
            await firebaseService.logout();
            window.location.href = 'index.html';
        });

        // Social button
        document.getElementById('gameSocialBtn').addEventListener('click', () => {
            document.getElementById('gameUserDropdown').classList.remove('show');
            if (window.game && window.game.socialUI) {
                window.game.socialUI.show();
            }
        });

        // Share settings button
        document.getElementById('gameShareBtn').addEventListener('click', () => {
            document.getElementById('gameUserDropdown').classList.remove('show');
            this.showShareSettings();
        });

        // My Zoo button
        document.getElementById('gameMyZooBtn').addEventListener('click', () => {
            document.getElementById('gameUserDropdown').classList.remove('show');
            this.loadMyZoo();
        });
    }

    updateUI() {
        if (this.currentUser) {
            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            document.getElementById('gameUserName').textContent = displayName;
            document.getElementById('gameDropdownUserName').textContent = displayName;
            document.getElementById('gameDropdownUserEmail').textContent = this.currentUser.email;
        }
    }

    showShareSettings() {
        if (window.game && window.game.socialUI) {
            window.game.socialUI.showShareSettings();
        }
    }

    async loadMyZoo() {
        const result = await firebaseService.loadZoo();
        if (result.success && window.game) {
            window.game.saveSystem.applyLoadedData(window.game, result.data);
            if (window.game.notifications) {
                window.game.notifications.success('Zoo loaded!', 'Your zoo has been loaded', '🏰');
            }
        } else {
            if (window.game && window.game.notifications) {
                window.game.notifications.info('No saved zoo', 'Start building your zoo!', '🏗️');
            }
        }
    }

    async autoLoadZoo() {
        if (!firebaseService.isAuthenticated() || !window.game) {
            return;
        }

        try {
            // Try to load the zoo from Firebase
            const result = await firebaseService.loadZoo();

            if (result.success) {
                window.game.saveSystem.applyLoadedData(window.game, result.data);
                if (window.game.notifications) {
                    window.game.notifications.success('Welcome back!', 'Your zoo has been loaded', '👋');
                }
            } else {
                // No saved zoo, that's ok - they can start fresh
                console.log('ℹ️ No saved zoo found, starting fresh');
            }
        } catch (error) {
            console.error('Error loading zoo:', error);
            if (window.game && window.game.notifications) {
                window.game.notifications.warning('Load Error', 'Starting with a fresh zoo', '⚠️');
            }
        }
    }
}

export default GameAuthUI;
