// Authentication UI Manager
import firebaseService from '../firebase/config.js';

class AuthUI {
    constructor() {
        this.currentUser = null;
        this.isInitialLoad = true;
        this.createWelcomeScreen();
        this.createAuthModal();
        this.createUserMenu();
        this.setupAuthListeners();

        // Listen to auth state changes
        firebaseService.onAuthStateChange((user) => {
            this.currentUser = user;
            this.updateUI();

            // Force login on first load if not authenticated
            if (this.isInitialLoad) {
                this.isInitialLoad = false;
                if (!user) {
                    // Wait a bit to ensure the page is fully loaded
                    setTimeout(() => {
                        this.showAuthModal();
                    }, 500);
                } else {
                    // User is already logged in, load their zoo
                    this.autoLoadZoo();
                }
            }
        });
    }

    createWelcomeScreen() {
        const welcomeScreen = document.createElement('div');
        welcomeScreen.id = 'welcomeScreen';
        welcomeScreen.className = 'welcome-screen';
        welcomeScreen.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-logo">🦁</div>
                <h1>Zoo Tycoon 3D</h1>
                <p class="welcome-tagline">Build. Manage. Share.</p>
                <p class="welcome-description">
                    Create your dream zoo and share it with players around the world!
                </p>
                <div class="welcome-features">
                    <div class="feature">
                        <span class="feature-icon">☁️</span>
                        <span>Cloud Saves</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">👥</span>
                        <span>Social Features</span>
                    </div>
                    <div class="feature">
                        <span class="feature-icon">🌍</span>
                        <span>Visit Other Zoos</span>
                    </div>
                </div>
                <div id="welcomeMessage" class="welcome-message">
                    Please login or create an account to continue
                </div>
            </div>
        `;
        document.body.appendChild(welcomeScreen);
    }

    createAuthModal() {
        const modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <span class="modal-close" id="closeAuthModal">&times;</span>

                <!-- Tabs -->
                <div class="auth-tabs">
                    <button class="auth-tab active" data-tab="login">Login</button>
                    <button class="auth-tab" data-tab="register">Register</button>
                </div>

                <!-- Login Form -->
                <div class="auth-form" id="loginForm">
                    <h2>Welcome Back!</h2>
                    <p class="auth-subtitle">Login to save and share your zoo</p>

                    <input type="email" id="loginEmail" placeholder="Email" class="auth-input">
                    <input type="password" id="loginPassword" placeholder="Password" class="auth-input">

                    <button id="loginBtn" class="auth-btn">Login</button>
                    <div id="loginError" class="auth-error"></div>
                </div>

                <!-- Register Form -->
                <div class="auth-form" id="registerForm" style="display: none;">
                    <h2>Create Account</h2>
                    <p class="auth-subtitle">Join the zoo community!</p>

                    <input type="text" id="registerName" placeholder="Display Name" class="auth-input">
                    <input type="email" id="registerEmail" placeholder="Email" class="auth-input">
                    <input type="password" id="registerPassword" placeholder="Password (min 6 characters)" class="auth-input">

                    <button id="registerBtn" class="auth-btn">Create Account</button>
                    <div id="registerError" class="auth-error"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createUserMenu() {
        const userMenu = document.createElement('div');
        userMenu.id = 'userMenu';
        userMenu.innerHTML = `
            <div id="userMenuContent">
                <!-- Not logged in -->
                <div id="notLoggedIn">
                    <button id="showAuthBtn" class="user-menu-btn">
                        <span class="user-icon">👤</span>
                        <span>Login</span>
                    </button>
                </div>

                <!-- Logged in -->
                <div id="loggedIn" style="display: none;">
                    <button id="userProfileBtn" class="user-menu-btn">
                        <span class="user-icon">👤</span>
                        <span id="userName">User</span>
                    </button>
                    <div id="userDropdown" class="user-dropdown" style="display: none;">
                        <div class="user-dropdown-header">
                            <div class="user-avatar">👤</div>
                            <div>
                                <div class="user-dropdown-name" id="dropdownUserName">User</div>
                                <div class="user-dropdown-email" id="dropdownUserEmail">user@email.com</div>
                            </div>
                        </div>
                        <div class="user-dropdown-divider"></div>
                        <button id="myZooBtn" class="user-dropdown-item">
                            🏰 My Zoo
                        </button>
                        <button id="friendsBtn" class="user-dropdown-item">
                            👥 Friends
                        </button>
                        <button id="exploreBtn" class="user-dropdown-item">
                            🌍 Explore Zoos
                        </button>
                        <button id="shareZooBtn" class="user-dropdown-item">
                            🔗 Share Settings
                        </button>
                        <div class="user-dropdown-divider"></div>
                        <button id="logoutBtn" class="user-dropdown-item danger">
                            🚪 Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(userMenu);
    }

    setupAuthListeners() {
        // Modal close
        document.getElementById('closeAuthModal').addEventListener('click', () => {
            this.closeAuthModal();
        });

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;
                this.switchTab(targetTab);
            });
        });

        // Login
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        // Register
        document.getElementById('registerBtn').addEventListener('click', () => {
            this.handleRegister();
        });

        // Show auth modal
        document.getElementById('showAuthBtn').addEventListener('click', () => {
            this.showAuthModal();
        });

        // User profile dropdown
        document.getElementById('userProfileBtn').addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('userDropdown');
            const profileBtn = document.getElementById('userProfileBtn');
            if (!dropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Friends button
        document.getElementById('friendsBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            window.dispatchEvent(new CustomEvent('showFriends'));
        });

        // Explore button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            window.dispatchEvent(new CustomEvent('showExplore'));
        });

        // Share zoo button
        document.getElementById('shareZooBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            this.showShareSettings();
        });

        // My Zoo button
        document.getElementById('myZooBtn').addEventListener('click', () => {
            document.getElementById('userDropdown').style.display = 'none';
            this.loadMyZoo();
        });

        // Close modal on outside click
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.closeAuthModal();
            }
        });
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Show/hide forms
        if (tab === 'login') {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
        } else {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        }

        // Clear errors
        document.getElementById('loginError').textContent = '';
        document.getElementById('registerError').textContent = '';
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (!email || !password) {
            errorDiv.textContent = 'Please fill in all fields';
            return;
        }

        const loginBtn = document.getElementById('loginBtn');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        const result = await firebaseService.login(email, password);

        if (result.success) {
            this.closeAuthModal();
            if (window.game && window.game.notifications) {
                window.game.notifications.success('Welcome back!', 'Successfully logged in', '👋');
            }
        } else {
            errorDiv.textContent = result.error || 'Login failed';
        }

        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const errorDiv = document.getElementById('registerError');

        if (!name || !email || !password) {
            errorDiv.textContent = 'Please fill in all fields';
            return;
        }

        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters';
            return;
        }

        const registerBtn = document.getElementById('registerBtn');
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';

        const result = await firebaseService.register(email, password, name);

        if (result.success) {
            this.closeAuthModal();
            if (window.game && window.game.notifications) {
                window.game.notifications.success('Welcome!', 'Account created successfully', '🎉');
            }
        } else {
            errorDiv.textContent = result.error || 'Registration failed';
        }

        registerBtn.disabled = false;
        registerBtn.textContent = 'Create Account';
    }

    async handleLogout() {
        const result = await firebaseService.logout();

        if (result.success) {
            if (window.game && window.game.notifications) {
                window.game.notifications.info('Logged out', 'See you soon!', '👋');
            }
        }
    }

    showAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
        this.switchTab('login');
    }

    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        // Clear inputs
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    }

    updateUI() {
        const welcomeScreen = document.getElementById('welcomeScreen');

        if (this.currentUser) {
            // User logged in - hide welcome screen
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }

            document.getElementById('notLoggedIn').style.display = 'none';
            document.getElementById('loggedIn').style.display = 'block';

            const displayName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            document.getElementById('userName').textContent = displayName;
            document.getElementById('dropdownUserName').textContent = displayName;
            document.getElementById('dropdownUserEmail').textContent = this.currentUser.email;
        } else {
            // User not logged in - show welcome screen
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
            }

            document.getElementById('notLoggedIn').style.display = 'block';
            document.getElementById('loggedIn').style.display = 'none';
            document.getElementById('userDropdown').style.display = 'none';
        }
    }

    showShareSettings() {
        if (window.game && window.game.socialUI) {
            window.game.socialUI.showShareSettings();
        }
    }

    async loadMyZoo() {
        if (!firebaseService.isAuthenticated()) {
            if (window.game && window.game.notifications) {
                window.game.notifications.warning('Not logged in', 'Please login first');
            }
            return;
        }

        const result = await firebaseService.loadZoo();

        if (result.success && window.game) {
            // Apply loaded data to game
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

        // Silently try to load the zoo
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
    }
}

export default AuthUI;
