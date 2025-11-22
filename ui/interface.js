// UI Manager
class UIManager {
    constructor(zoo) {
        this.zoo = zoo;
        this.currentTab = 'exhibits';
        this.selectedBuildMode = null;
        this.bulldozeMode = false;

        this.setupTabs();
        this.setupBuildItems();
        this.setupSpeedControls();
        this.setupCameraButtons();
        this.setupViewToggles();
        this.setupBulldoze();
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Désactiver tous les tabs
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Activer le tab sélectionné
                btn.classList.add('active');
                document.getElementById(`${tabName}-panel`).classList.add('active');

                this.currentTab = tabName;
            });
        });
    }

    setupBuildItems() {
        const buildItems = document.querySelectorAll('.build-item');

        buildItems.forEach(item => {
            item.addEventListener('click', () => {
                // Désélectionner tous les items
                buildItems.forEach(i => i.classList.remove('active'));

                // Désactiver le bulldoze
                this.bulldozeMode = false;
                document.getElementById('bulldozeBtn').classList.remove('active');

                // Sélectionner l'item
                item.classList.add('active');

                // Stocker le mode de construction
                this.selectedBuildMode = {
                    type: item.dataset.type,
                    size: item.dataset.size,
                    animal: item.dataset.animal,
                    material: item.dataset.material,
                    building: item.dataset.building,
                    item: item.dataset.item
                };
            });
        });
    }

    setupSpeedControls() {
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.zoo.togglePause();
            this.updateSpeedButtons();
        });

        document.getElementById('speed1Btn').addEventListener('click', () => {
            this.zoo.setGameSpeed(1);
            this.zoo.isPaused = false;
            this.updateSpeedButtons();
        });

        document.getElementById('speed2Btn').addEventListener('click', () => {
            this.zoo.setGameSpeed(2);
            this.zoo.isPaused = false;
            this.updateSpeedButtons();
        });

        document.getElementById('speed3Btn').addEventListener('click', () => {
            this.zoo.setGameSpeed(3);
            this.zoo.isPaused = false;
            this.updateSpeedButtons();
        });
    }

    updateSpeedButtons() {
        const buttons = ['pauseBtn', 'speed1Btn', 'speed2Btn', 'speed3Btn'];
        buttons.forEach(id => {
            document.getElementById(id).classList.remove('active');
        });

        if (this.zoo.isPaused) {
            document.getElementById('pauseBtn').classList.add('active');
        } else {
            document.getElementById(`speed${this.zoo.gameSpeed}Btn`).classList.add('active');
        }
    }

    setupCameraButtons() {
        // Ces boutons seront liés à la caméra dans main.js
        // Juste pour éviter les erreurs
    }

    setupViewToggles() {
        document.getElementById('gridToggleBtn').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
        });

        document.getElementById('terrainToggleBtn').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
        });
    }

    setupBulldoze() {
        document.getElementById('bulldozeBtn').addEventListener('click', () => {
            this.bulldozeMode = !this.bulldozeMode;

            if (this.bulldozeMode) {
                // Désélectionner les items de construction
                document.querySelectorAll('.build-item').forEach(i => i.classList.remove('active'));
                document.getElementById('bulldozeBtn').classList.add('active');
                this.selectedBuildMode = null;
            } else {
                document.getElementById('bulldozeBtn').classList.remove('active');
            }
        });
    }

    updateStats() {
        document.getElementById('money').textContent = `$${this.zoo.money.toLocaleString()}`;
        document.getElementById('guests').textContent = this.zoo.guestCount.toLocaleString();
        document.getElementById('rating').textContent = this.zoo.zooRating;
        document.getElementById('date').textContent = this.zoo.getDateString();
    }

    showSelectionInfo(data) {
        const infoDiv = document.getElementById('selectionInfo');

        if (!data) {
            infoDiv.innerHTML = '<p class="info-hint">Click on an object to view details</p>';
            return;
        }

        let html = '';

        if (data.type === 'animal') {
            const info = data.animal.getInfo();
            html = `
                <h4>${info.name} the ${AnimalSpecies[info.species].name}</h4>
                <div style="margin-top: 15px;">
                    <div class="stat-bar">
                        <span>Happiness:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width: ${info.happiness}%; background: ${this.getBarColor(info.happiness)}"></div>
                        </div>
                        <span>${info.happiness}%</span>
                    </div>
                    <div class="stat-bar">
                        <span>Health:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width: ${info.health}%; background: ${this.getBarColor(info.health)}"></div>
                        </div>
                        <span>${info.health}%</span>
                    </div>
                    <div class="stat-bar">
                        <span>Hunger:</span>
                        <div class="bar">
                            <div class="bar-fill" style="width: ${info.hunger}%; background: ${this.getBarColor(info.hunger)}"></div>
                        </div>
                        <span>${info.hunger}%</span>
                    </div>
                    <p style="margin-top: 10px;">Age: ${info.age} years</p>
                </div>
            `;
        } else if (data.type === 'building') {
            html = `
                <h4>${data.building.name}</h4>
                <p>Type: ${data.building.type}</p>
                <p>Cost: $${data.building.cost}</p>
            `;
        } else if (data.type === 'tile') {
            html = `
                <h4>Tile Information</h4>
                <p>Position: (${data.x}, ${data.y})</p>
                <p>Terrain: ${data.tile.terrain}</p>
                ${data.tile.path ? `<p>Path: ${data.tile.path}</p>` : ''}
            `;
        }

        infoDiv.innerHTML = html;
    }

    getBarColor(value) {
        if (value > 70) return '#27ae60';
        if (value > 40) return '#f39c12';
        return '#e74c3c';
    }
}
