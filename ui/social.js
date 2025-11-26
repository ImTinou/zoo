// Social Features UI
import firebaseService from '../firebase/config.js';

class SocialUI {
    constructor(game) {
        this.game = game;
        this.createSocialModals();
        this.setupEventListeners();
    }

    createSocialModals() {
        // Main social modal
        const socialModal = document.createElement('div');
        socialModal.id = 'socialModal';
        socialModal.className = 'modal';
        socialModal.innerHTML = `
            <div class="modal-content social-modal">
                <span class="modal-close" id="closeSocialModal">&times;</span>

                <div class="social-tabs">
                    <button class="social-tab active" data-tab="explore">🌍 Explore</button>
                    <button class="social-tab" data-tab="friends">👥 Friends</button>
                    <button class="social-tab" data-tab="search">🔍 Search</button>
                </div>

                <div id="socialContent">
                    <!-- Explore Tab -->
                    <div id="exploreTab" class="social-tab-content">
                        <h3>Explore Public Zoos</h3>
                        <div id="exploreLoading" class="loading">Loading...</div>
                        <div id="exploreList" class="zoo-list"></div>
                    </div>

                    <!-- Friends Tab -->
                    <div id="friendsTab" class="social-tab-content" style="display: none;">
                        <h3>Your Friends</h3>
                        <div id="friendsLoading" class="loading">Loading...</div>
                        <div id="friendsList" class="friends-list"></div>
                    </div>

                    <!-- Search Tab -->
                    <div id="searchTab" class="social-tab-content" style="display: none;">
                        <h3>Find Players</h3>

                        <div class="search-section">
                            <h4>Add by ID or Username</h4>
                            <div class="add-friend-direct">
                                <input type="text" id="addFriendDirectInput" placeholder="Enter User ID or Username" class="search-input">
                                <button id="addFriendDirectBtn" class="search-btn">➕ Add Friend</button>
                            </div>
                        </div>

                        <div class="search-divider">OR</div>

                        <div class="search-section">
                            <h4>Search by Name or Email</h4>
                            <input type="text" id="searchUserInput" placeholder="Search by name or email..." class="search-input">
                            <button id="searchUserBtn" class="search-btn">🔍 Search</button>
                            <div id="searchResults" class="search-results"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(socialModal);

        // Share settings modal
        const shareModal = document.createElement('div');
        shareModal.id = 'shareModal';
        shareModal.className = 'modal';
        shareModal.innerHTML = `
            <div class="modal-content share-modal">
                <span class="modal-close" id="closeShareModal">&times;</span>

                <h2>Share Your Zoo</h2>
                <p class="modal-subtitle">Let other players visit your amazing zoo!</p>

                <div class="share-option">
                    <div class="share-option-header">
                        <label class="switch">
                            <input type="checkbox" id="publicZooToggle">
                            <span class="slider"></span>
                        </label>
                        <div class="share-option-text">
                            <h4>Make Zoo Public</h4>
                            <p>Allow anyone to visit and explore your zoo</p>
                        </div>
                    </div>
                </div>

                <div class="share-stats">
                    <div class="share-stat">
                        <span class="share-stat-label">Zoo Rating</span>
                        <span class="share-stat-value" id="shareZooRating">0</span>
                    </div>
                    <div class="share-stat">
                        <span class="share-stat-label">Animals</span>
                        <span class="share-stat-value" id="shareAnimalCount">0</span>
                    </div>
                    <div class="share-stat">
                        <span class="share-stat-label">Exhibits</span>
                        <span class="share-stat-value" id="shareExhibitCount">0</span>
                    </div>
                </div>

                <button id="saveShareSettings" class="auth-btn">Save Settings</button>
            </div>
        `;
        document.body.appendChild(shareModal);
    }

    setupEventListeners() {
        // Close modals
        document.getElementById('closeSocialModal').addEventListener('click', () => {
            this.closeSocialModal();
        });

        document.getElementById('closeShareModal').addEventListener('click', () => {
            this.closeShareModal();
        });

        // Social tabs
        document.querySelectorAll('.social-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchSocialTab(e.target.dataset.tab);
            });
        });

        // Show friends
        window.addEventListener('showFriends', () => {
            this.showSocialModal('friends');
        });

        // Show explore
        window.addEventListener('showExplore', () => {
            this.showSocialModal('explore');
        });

        // Add friend directly by ID or username
        document.getElementById('addFriendDirectBtn').addEventListener('click', () => {
            this.addFriendDirect();
        });

        document.getElementById('addFriendDirectInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addFriendDirect();
            }
        });

        // Search users
        document.getElementById('searchUserBtn').addEventListener('click', () => {
            this.searchUsers();
        });

        document.getElementById('searchUserInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchUsers();
            }
        });

        // Share settings
        document.getElementById('saveShareSettings').addEventListener('click', () => {
            this.saveShareSettings();
        });

        // Close modals on outside click
        document.getElementById('socialModal').addEventListener('click', (e) => {
            if (e.target.id === 'socialModal') {
                this.closeSocialModal();
            }
        });

        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.closeShareModal();
            }
        });
    }

    switchSocialTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.social-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelector(`.social-tab[data-tab="${tab}"]`).classList.add('active');

        // Show/hide content
        document.querySelectorAll('.social-tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const tabElement = document.getElementById(`${tab}Tab`);
        if (tabElement) {
            tabElement.style.display = 'block';
        }

        // Load data for the tab
        if (tab === 'explore') {
            this.loadPublicZoos();
        } else if (tab === 'friends') {
            this.loadFriends();
        }
    }

    showSocialModal(tab = 'explore') {
        document.getElementById('socialModal').style.display = 'flex';
        this.switchSocialTab(tab);
    }

    closeSocialModal() {
        document.getElementById('socialModal').style.display = 'none';
    }

    showShareSettings() {
        document.getElementById('shareModal').style.display = 'flex';

        // Update stats
        document.getElementById('shareZooRating').textContent = this.game.zoo.zooRating;
        document.getElementById('shareAnimalCount').textContent = this.game.zoo.animals.length;
        document.getElementById('shareExhibitCount').textContent = this.game.zoo.exhibits.length;

        // Check current public status from localStorage or Firebase
        // For now, default to false
        document.getElementById('publicZooToggle').checked = false;
    }

    closeShareModal() {
        document.getElementById('shareModal').style.display = 'none';
    }

    async saveShareSettings() {
        const isPublic = document.getElementById('publicZooToggle').checked;

        const btn = document.getElementById('saveShareSettings');
        btn.disabled = true;
        btn.textContent = 'Saving...';

        await this.game.saveSystem.saveGame(this.game, isPublic);

        if (this.game.notifications) {
            this.game.notifications.success(
                'Settings Saved!',
                isPublic ? 'Your zoo is now public' : 'Your zoo is now private',
                '⚙️'
            );
        }

        btn.disabled = false;
        btn.textContent = 'Save Settings';
        this.closeShareModal();
    }

    async loadPublicZoos() {
        const loadingDiv = document.getElementById('exploreLoading');
        const listDiv = document.getElementById('exploreList');

        loadingDiv.style.display = 'block';
        listDiv.innerHTML = '';

        const result = await firebaseService.getPublicZoos(20);

        loadingDiv.style.display = 'none';

        if (result.success && result.zoos.length > 0) {
            result.zoos.forEach(zoo => {
                const zooCard = this.createZooCard(zoo);
                listDiv.appendChild(zooCard);
            });
        } else {
            listDiv.innerHTML = '<p class="empty-message">No public zoos found. Be the first to share yours!</p>';
        }
    }

    createZooCard(zoo) {
        const card = document.createElement('div');
        card.className = 'zoo-card';
        card.innerHTML = `
            <div class="zoo-card-header">
                <h4>${zoo.userName}'s Zoo</h4>
                <span class="zoo-rating">⭐ ${zoo.zoo?.zooRating || 0}</span>
            </div>
            <div class="zoo-card-body">
                <div class="zoo-stat">
                    <span>🦁 ${zoo.animals?.length || 0} Animals</span>
                </div>
                <div class="zoo-stat">
                    <span>🏗️ ${zoo.exhibits?.length || 0} Exhibits</span>
                </div>
                <div class="zoo-stat">
                    <span>👥 ${zoo.zoo?.guestCount || 0} Guests</span>
                </div>
            </div>
            <div class="zoo-card-footer">
                <button class="visit-zoo-btn" data-user-id="${zoo.userId}">
                    👁️ Visit Zoo
                </button>
                <button class="add-friend-btn" data-user-id="${zoo.userId}">
                    ➕ Add Friend
                </button>
            </div>
        `;

        // Event listeners
        card.querySelector('.visit-zoo-btn').addEventListener('click', () => {
            this.visitZoo(zoo.userId);
        });

        card.querySelector('.add-friend-btn').addEventListener('click', async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Adding...';

            const result = await firebaseService.addFriend(zoo.userId);

            if (result.success) {
                btn.textContent = '✓ Added';
                if (this.game.notifications) {
                    this.game.notifications.success('Friend Added!', `${zoo.userName} is now your friend`, '👥');
                }
            } else {
                btn.disabled = false;
                btn.textContent = '➕ Add Friend';
            }
        });

        return card;
    }

    async visitZoo(userId) {
        if (this.game.notifications) {
            this.game.notifications.info('Loading zoo...', 'Please wait', '⏳');
        }

        const result = await firebaseService.loadZoo(userId);

        if (result.success) {
            // Apply loaded data but in read-only mode
            this.game.saveSystem.applyLoadedData(this.game, result.data);
            this.closeSocialModal();

            if (this.game.notifications) {
                this.game.notifications.success(
                    'Zoo Loaded!',
                    `Visiting ${result.data.userName}'s zoo`,
                    '🏰'
                );
            }
        } else {
            if (this.game.notifications) {
                this.game.notifications.error('Failed to load zoo', result.error || 'Unknown error');
            }
        }
    }

    async loadFriends() {
        const loadingDiv = document.getElementById('friendsLoading');
        const listDiv = document.getElementById('friendsList');

        loadingDiv.style.display = 'block';
        listDiv.innerHTML = '';

        const result = await firebaseService.getFriends();

        loadingDiv.style.display = 'none';

        if (result.success && result.friends.length > 0) {
            result.friends.forEach(friend => {
                const friendCard = this.createFriendCard(friend);
                listDiv.appendChild(friendCard);
            });
        } else {
            listDiv.innerHTML = '<p class="empty-message">No friends yet. Search for players to add!</p>';
        }
    }

    createFriendCard(friend) {
        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
            <div class="friend-avatar">👤</div>
            <div class="friend-info">
                <h4>${friend.displayName || friend.email}</h4>
                <p>${friend.email}</p>
            </div>
            <div class="friend-actions">
                <button class="visit-friend-btn" data-user-id="${friend.id}">
                    👁️ Visit
                </button>
                <button class="remove-friend-btn" data-user-id="${friend.id}">
                    ❌
                </button>
            </div>
        `;

        card.querySelector('.visit-friend-btn').addEventListener('click', () => {
            this.visitZoo(friend.id);
        });

        card.querySelector('.remove-friend-btn').addEventListener('click', async (e) => {
            const btn = e.target;
            if (confirm(`Remove ${friend.displayName} from friends?`)) {
                btn.disabled = true;
                const result = await firebaseService.removeFriend(friend.id);

                if (result.success) {
                    card.remove();
                    if (this.game.notifications) {
                        this.game.notifications.info('Friend Removed', '', '👋');
                    }
                }
            }
        });

        return card;
    }

    async addFriendDirect() {
        const input = document.getElementById('addFriendDirectInput');
        const searchTerm = input.value.trim();
        const btn = document.getElementById('addFriendDirectBtn');

        if (!searchTerm) {
            if (this.game.notifications) {
                this.game.notifications.error('Invalid Input', 'Please enter a User ID or Username');
            }
            return;
        }

        btn.disabled = true;
        btn.textContent = 'Searching...';

        const result = await firebaseService.findUserByIdOrUsername(searchTerm);

        if (result.success) {
            const user = result.user;

            // Don't add yourself
            if (user.id === firebaseService.currentUser?.uid) {
                if (this.game.notifications) {
                    this.game.notifications.error('Cannot Add', 'You cannot add yourself as a friend!');
                }
                btn.disabled = false;
                btn.textContent = '➕ Add Friend';
                return;
            }

            // Add friend
            btn.textContent = 'Adding...';
            const addResult = await firebaseService.addFriend(user.id);

            if (addResult.success) {
                input.value = '';
                btn.textContent = '✓ Added!';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.textContent = '➕ Add Friend';
                }, 2000);

                if (this.game.notifications) {
                    this.game.notifications.success(
                        'Friend Added!',
                        `${user.displayName || user.email} is now your friend`,
                        '👥'
                    );
                }
            } else {
                btn.disabled = false;
                btn.textContent = '➕ Add Friend';
                if (this.game.notifications) {
                    this.game.notifications.error('Error', addResult.error || 'Could not add friend');
                }
            }
        } else {
            btn.disabled = false;
            btn.textContent = '➕ Add Friend';
            if (this.game.notifications) {
                this.game.notifications.error('User Not Found', 'No user found with that ID or Username');
            }
        }
    }

    async searchUsers() {
        const searchTerm = document.getElementById('searchUserInput').value.trim();
        const resultsDiv = document.getElementById('searchResults');

        if (!searchTerm) {
            resultsDiv.innerHTML = '<p class="empty-message">Enter a name or email to search</p>';
            return;
        }

        resultsDiv.innerHTML = '<p class="loading">Searching...</p>';

        const result = await firebaseService.searchUsers(searchTerm);

        if (result.success && result.users.length > 0) {
            resultsDiv.innerHTML = '';
            result.users.forEach(user => {
                // Don't show current user
                if (user.id === firebaseService.currentUser?.uid) return;

                const userCard = document.createElement('div');
                userCard.className = 'search-result-card';
                userCard.innerHTML = `
                    <div class="search-result-avatar">👤</div>
                    <div class="search-result-info">
                        <h4>${user.displayName || user.email}</h4>
                        <p>${user.email}</p>
                    </div>
                    <button class="add-search-friend-btn" data-user-id="${user.id}">
                        ➕ Add Friend
                    </button>
                `;

                userCard.querySelector('.add-search-friend-btn').addEventListener('click', async (e) => {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.textContent = 'Adding...';

                    const addResult = await firebaseService.addFriend(user.id);

                    if (addResult.success) {
                        btn.textContent = '✓ Added';
                        if (this.game.notifications) {
                            this.game.notifications.success('Friend Added!', `${user.displayName} is now your friend`, '👥');
                        }
                    } else {
                        btn.disabled = false;
                        btn.textContent = '➕ Add Friend';
                    }
                });

                resultsDiv.appendChild(userCard);
            });
        } else {
            resultsDiv.innerHTML = '<p class="empty-message">No users found</p>';
        }
    }
}

export default SocialUI;
