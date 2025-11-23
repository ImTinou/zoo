// Debug Menu - Activé avec le code "Tinou"
class DebugMenu {
    constructor(game) {
        this.game = game;
        this.isUnlocked = false;
        this.isVisible = false;
        this.inputBuffer = '';
        this.secretCode = 'tinou';

        this.setupKeyboardListener();
        this.createDebugModal();
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            // Ajouter le caractère au buffer
            if (e.key.length === 1) {
                this.inputBuffer += e.key.toLowerCase();

                // Garder seulement les derniers 10 caractères
                if (this.inputBuffer.length > 10) {
                    this.inputBuffer = this.inputBuffer.slice(-10);
                }

                // Vérifier si le code secret est dans le buffer
                if (this.inputBuffer.includes(this.secretCode)) {
                    if (!this.isUnlocked) {
                        this.unlockDebugMenu();
                    }
                    // Ouvrir le menu directement
                    if (!this.isVisible) {
                        this.toggleDebugMenu();
                    }
                    this.inputBuffer = ''; // Reset le buffer
                }
            }

            // Ouvrir/Fermer avec F3 si débloqué
            if (e.key === 'F3' && this.isUnlocked) {
                e.preventDefault();
                this.toggleDebugMenu();
            }
        });
    }

    unlockDebugMenu() {
        if (!this.isUnlocked) {
            this.isUnlocked = true;
            this.game.notifications.success(
                'Debug Menu Unlocked!',
                'Press F3 to open/close',
                '🔓'
            );
        }
    }

    toggleDebugMenu() {
        if (!this.isUnlocked) return;

        this.isVisible = !this.isVisible;
        this.modal.style.display = this.isVisible ? 'flex' : 'none';

        if (this.isVisible) {
            this.updateDebugInfo();
        }
    }

    createDebugModal() {
        const modal = document.createElement('div');
        modal.id = 'debugModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(28, 28, 30, 0.95);
            border: 2px solid #30d158;
            border-radius: 15px;
            padding: 20px;
            z-index: 10001;
            min-width: 400px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;

        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h2 style="color: #30d158; margin: 0; font-size: 18px;">🔧 Debug Menu</h2>
                <button id="closeDebugMenu" style="background: #ff453a; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #fff; font-size: 14px; margin-bottom: 10px;">💰 Money Cheats</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <button class="debug-btn" data-action="add1k">+$1,000</button>
                    <button class="debug-btn" data-action="add10k">+$10,000</button>
                    <button class="debug-btn" data-action="add100k">+$100,000</button>
                    <button class="debug-btn" data-action="add1m">+$1,000,000</button>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #fff; font-size: 14px; margin-bottom: 10px;">⏰ Time Cheats</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <button class="debug-btn" data-action="speed10">10x Speed</button>
                    <button class="debug-btn" data-action="speedNormal">Normal Speed</button>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #fff; font-size: 14px; margin-bottom: 10px;">🎮 Game Cheats</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <button class="debug-btn" data-action="unlockAnimals">Unlock All Animals</button>
                    <button class="debug-btn" data-action="maxHappiness">Max Happiness</button>
                    <button class="debug-btn" data-action="spawn100visitors">Spawn 100 Visitors</button>
                    <button class="debug-btn" data-action="clearVisitors">Clear All Visitors</button>
                </div>
            </div>

            <div style="margin-bottom: 15px;">
                <h3 style="color: #fff; font-size: 14px; margin-bottom: 10px;">📊 Info</h3>
                <div id="debugInfo" style="background: #2c2c2e; padding: 10px; border-radius: 8px; font-size: 11px; color: #8e8ea0; font-family: monospace; line-height: 1.6;">
                    Loading...
                </div>
            </div>

            <div>
                <h3 style="color: #fff; font-size: 14px; margin-bottom: 10px;">💾 Save/Load</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
                    <button class="debug-btn" data-action="saveGame">Save Game</button>
                    <button class="debug-btn" data-action="loadGame">Load Game</button>
                    <button class="debug-btn" data-action="clearSave" style="grid-column: 1/-1; background: #ff453a;">Clear Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Setup button listeners
        modal.querySelectorAll('.debug-btn').forEach(btn => {
            btn.style.cssText = `
                background: #30d158;
                color: white;
                border: none;
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                transition: all 0.2s;
            `;

            btn.addEventListener('mouseover', () => {
                btn.style.background = '#28a745';
            });

            btn.addEventListener('mouseout', () => {
                if (btn.dataset.action !== 'clearSave') {
                    btn.style.background = '#30d158';
                } else {
                    btn.style.background = '#ff453a';
                }
            });

            btn.addEventListener('click', () => {
                this.executeDebugAction(btn.dataset.action);
            });
        });

        // Close button
        modal.querySelector('#closeDebugMenu').addEventListener('click', () => {
            this.toggleDebugMenu();
        });

        // Update info every second
        setInterval(() => {
            if (this.isVisible) {
                this.updateDebugInfo();
            }
        }, 1000);
    }

    updateDebugInfo() {
        const infoDiv = document.getElementById('debugInfo');
        if (!infoDiv) return;

        const zoo = this.game.zoo;
        const info = `
Money: $${zoo.money.toLocaleString()}
Guests: ${zoo.guestCount}
Animals: ${zoo.animals.length}
Exhibits: ${zoo.exhibits.length}
Buildings: ${zoo.buildings.length}
Zoo Rating: ${zoo.zooRating}/100
Game Speed: ${zoo.gameSpeed}x
FPS: ${this.getFPS()}
Grid Size: ${this.game.grid.width}x${this.game.grid.height}
        `.trim();

        infoDiv.textContent = info;
    }

    getFPS() {
        // Approximation simple du FPS
        return Math.round(1000 / 16.67); // Assume 60 FPS
    }

    executeDebugAction(action) {
        const zoo = this.game.zoo;

        switch (action) {
            case 'add1k':
                zoo.earn(1000);
                this.game.notifications.success('Debug', '+$1,000', '💰');
                break;

            case 'add10k':
                zoo.earn(10000);
                this.game.notifications.success('Debug', '+$10,000', '💰');
                break;

            case 'add100k':
                zoo.earn(100000);
                this.game.notifications.success('Debug', '+$100,000', '💰');
                break;

            case 'add1m':
                zoo.earn(1000000);
                this.game.notifications.success('Debug', '+$1,000,000', '💰');
                break;

            case 'speed10':
                zoo.setGameSpeed(10);
                zoo.isPaused = false;
                this.game.notifications.success('Debug', 'Speed set to 10x', '⏩');
                break;

            case 'speedNormal':
                zoo.setGameSpeed(1);
                this.game.notifications.success('Debug', 'Speed set to 1x', '▶️');
                break;

            case 'unlockAnimals':
                if (!zoo.unlockedAnimals) {
                    zoo.unlockedAnimals = [];
                }
                Object.keys(RareAnimals).forEach(key => {
                    if (!zoo.unlockedAnimals.includes(key)) {
                        zoo.unlockedAnimals.push(key);
                    }
                });
                this.game.notifications.success('Debug', 'All rare animals unlocked!', '🦁');
                break;

            case 'maxHappiness':
                zoo.animals.forEach(animal => {
                    animal.happiness = 100;
                    animal.hunger = 100;
                });
                this.game.visitorManager.visitors.forEach(visitor => {
                    visitor.happiness = 100;
                    visitor.hunger = 100;
                    visitor.thirst = 100;
                    visitor.bladder = 100;
                    visitor.energy = 100;
                });
                this.game.notifications.success('Debug', 'All happiness maxed!', '😊');
                break;

            case 'spawn100visitors':
                for (let i = 0; i < 100; i++) {
                    this.game.visitorManager.spawnVisitor();
                }
                this.game.notifications.success('Debug', '100 visitors spawned!', '🧑‍🤝‍🧑');
                break;

            case 'clearVisitors':
                this.game.visitorManager.visitors = [];
                this.game.notifications.success('Debug', 'All visitors cleared!', '👋');
                break;

            case 'saveGame':
                if (this.game.saveSystem) {
                    this.game.saveSystem.saveGame(this.game);
                    this.game.notifications.success('Debug', 'Game saved!', '💾');
                }
                break;

            case 'loadGame':
                if (this.game.saveSystem) {
                    this.game.saveSystem.loadGame(this.game);
                    this.game.notifications.success('Debug', 'Game loaded!', '📂');
                }
                break;

            case 'clearSave':
                if (confirm('Are you sure you want to delete your save?')) {
                    localStorage.removeItem('zooTycoonSave');
                    this.game.notifications.success('Debug', 'Save deleted!', '🗑️');
                }
                break;
        }

        this.game.ui.updateStats();
        this.updateDebugInfo();
    }
}
