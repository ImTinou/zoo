// Modern UI Manager
class ModernUIManager {
    constructor(zoo) {
        this.zoo = zoo;
        this.selectedBuildMode = null;
        this.bulldozeMode = false;
        this.currentCategory = null;

        this.setupBuildMenu();
        this.setupSpeedControls();
        this.setupEntranceControls();
        this.setupExpansionControls();
    }

    setupBuildMenu() {
        const categoryButtons = document.querySelectorAll('.build-category-btn[data-category]');
        const buildPanel = document.getElementById('buildPanel');
        const buildPanelContent = document.getElementById('buildPanelContent');

        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.dataset.category;

                // Toggle panel
                if (this.currentCategory === category && buildPanel.classList.contains('active')) {
                    buildPanel.classList.remove('active');
                    this.currentCategory = null;
                    btn.classList.remove('active');
                } else {
                    // Deactivate all
                    categoryButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Show panel with content
                    this.currentCategory = category;
                    buildPanelContent.innerHTML = this.getBuildContent(category);
                    buildPanel.classList.add('active');

                    // Setup card listeners
                    this.setupBuildCards();
                }
            });
        });

        // Bulldoze button
        const bulldozeBtn = document.getElementById('bulldozeBtn');
        bulldozeBtn.addEventListener('click', () => {
            this.bulldozeMode = !this.bulldozeMode;
            bulldozeBtn.classList.toggle('active');

            if (this.bulldozeMode) {
                buildPanel.classList.remove('active');
                categoryButtons.forEach(b => b.classList.remove('active'));
                this.currentCategory = null;
            }
        });
    }

    getBuildContent(category) {
        const content = {
            animals: this.getAnimalsContent(),
            exhibits: this.getExhibitsContent(),
            paths: this.getPathsContent(),
            facilities: this.getFacilitiesContent(),
            scenery: this.getSceneryContent(),
            staff: this.getStaffContent()
        };

        return `<div class="build-grid">${content[category] || ''}</div>`;
    }

    getAnimalsContent() {
        const biomes = {
            'Savanna': ['lion', 'elephant', 'giraffe', 'zebra', 'rhinoceros'],
            'Arctic': ['polarBear', 'penguin', 'arcticFox', 'walrus'],
            'Jungle': ['panda', 'tiger', 'gorilla', 'parrot', 'sloth', 'crocodile'],
            'Desert': ['camel', 'meerkat', 'rattlesnake', 'scorpion'],
            'Aquatic': ['seal', 'otter', 'turtle']
        };

        let html = '';
        for (const [biome, animals] of Object.entries(biomes)) {
            html += `<div style="grid-column: 1/-1; color: #fff; font-weight: 600; margin-top: 12px;">${biome}</div>`;
            animals.forEach(animal => {
                const spec = AnimalSpecies[animal];
                html += `
                    <div class="build-card" data-type="animal" data-animal="${animal}">
                        <div class="build-card-icon">${spec.emoji}</div>
                        <div class="build-card-name">${spec.name}</div>
                        <div class="build-card-cost">$${spec.cost.toLocaleString()}</div>
                    </div>
                `;
            });
        }
        return html;
    }

    getExhibitsContent() {
        const fences = [
            { type: 'wood', icon: '🪵', name: 'Wooden Fence', cost: 50 },
            { type: 'metal', icon: '⛓️', name: 'Metal Fence', cost: 100 },
            { type: 'glass', icon: '🪟', name: 'Glass Fence', cost: 150 },
            { type: 'moat', icon: '🌊', name: 'Moat', cost: 200 }
        ];

        const enrichments = [
            { type: 'waterPond', icon: '💧', name: 'Water Pond', cost: 200 },
            { type: 'tree', icon: '🌳', name: 'Tree', cost: 100 },
            { type: 'rock', icon: '🪨', name: 'Rock', cost: 75 },
            { type: 'shelter', icon: '🏠', name: 'Shelter', cost: 300 },
            { type: 'feeder', icon: '🍖', name: 'Feeder', cost: 150 }
        ];

        let html = '<div style="grid-column: 1/-1; color: #fff; font-weight: 600;">Fences (Drag to Build)</div>';
        fences.forEach(fence => {
            html += `
                <div class="build-card" data-type="fence" data-fence="${fence.type}">
                    <div class="build-card-icon">${fence.icon}</div>
                    <div class="build-card-name">${fence.name}</div>
                    <div class="build-card-cost">$${fence.cost}/tile</div>
                </div>
            `;
        });

        html += '<div style="grid-column: 1/-1; color: #fff; font-weight: 600; margin-top: 12px;">Enrichments</div>';
        enrichments.forEach(enrich => {
            html += `
                <div class="build-card" data-type="enrichment" data-item="${enrich.type}">
                    <div class="build-card-icon">${enrich.icon}</div>
                    <div class="build-card-name">${enrich.name}</div>
                    <div class="build-card-cost">$${enrich.cost}</div>
                </div>
            `;
        });

        return html;
    }

    getPathsContent() {
        const paths = [
            { material: 'dirt', name: 'Dirt Path', cost: 10, color: '#8B7355' },
            { material: 'asphalt', name: 'Asphalt', cost: 25, color: '#555' },
            { material: 'cobblestone', name: 'Cobblestone', cost: 50, color: '#999' }
        ];

        return paths.map(path => `
            <div class="build-card" data-type="path" data-material="${path.material}">
                <div class="build-card-icon" style="width: 48px; height: 48px; background: ${path.color}; border-radius: 8px;"></div>
                <div class="build-card-name">${path.name}</div>
                <div class="build-card-cost">$${path.cost}/tile</div>
            </div>
        `).join('');
    }

    getFacilitiesContent() {
        const facilities = [
            { building: 'entrance', icon: '🎪', name: 'Park Entrance', cost: 5000 },
            { building: 'food', icon: '🍔', name: 'Food Stand', cost: 800 },
            { building: 'drink', icon: '🥤', name: 'Drink Stand', cost: 600 },
            { building: 'restroom', icon: '🚻', name: 'Restroom', cost: 1000 },
            { building: 'gift', icon: '🎁', name: 'Gift Shop', cost: 1500 }
        ];

        return facilities.map(fac => `
            <div class="build-card" data-type="${fac.building === 'entrance' ? 'entrance' : 'facility'}" data-building="${fac.building}">
                <div class="build-card-icon">${fac.icon}</div>
                <div class="build-card-name">${fac.name}</div>
                <div class="build-card-cost">$${fac.cost.toLocaleString()}</div>
            </div>
        `).join('');
    }

    getSceneryContent() {
        const scenery = [
            { item: 'tree', icon: '🌳', name: 'Tree', cost: 75 },
            { item: 'bush', icon: '🌿', name: 'Bush', cost: 25 },
            { item: 'rock', icon: '🪨', name: 'Rock', cost: 50 },
            { item: 'bench', icon: '🪑', name: 'Bench', cost: 150 }
        ];

        return scenery.map(item => `
            <div class="build-card" data-type="scenery" data-item="${item.item}">
                <div class="build-card-icon">${item.icon}</div>
                <div class="build-card-name">${item.name}</div>
                <div class="build-card-cost">$${item.cost}</div>
            </div>
        `).join('');
    }

    getStaffContent() {
        const staff = [
            { type: 'zookeeper', icon: '👨‍🌾', name: 'Zookeeper', cost: 500, salary: 200 },
            { type: 'vet', icon: '👨‍⚕️', name: 'Veterinarian', cost: 800, salary: 350 },
            { type: 'maintenance', icon: '👷', name: 'Maintenance', cost: 400, salary: 150 },
            { type: 'security', icon: '👮', name: 'Security', cost: 600, salary: 250 }
        ];

        return staff.map(s => `
            <div class="build-card" data-type="staff" data-staff="${s.type}">
                <div class="build-card-icon">${s.icon}</div>
                <div class="build-card-name">${s.name}</div>
                <div class="build-card-cost">$${s.cost} (${s.salary}/mo)</div>
            </div>
        `).join('');
    }

    setupBuildCards() {
        const cards = document.querySelectorAll('.build-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Deselect all
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Set build mode
                this.bulldozeMode = false;
                document.getElementById('bulldozeBtn').classList.remove('active');

                this.selectedBuildMode = {
                    type: card.dataset.type,
                    animal: card.dataset.animal,
                    fence: card.dataset.fence,
                    material: card.dataset.material,
                    building: card.dataset.building,
                    item: card.dataset.item,
                    staff: card.dataset.staff
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

    setupEntranceControls() {
        const slider = document.getElementById('ticketPriceSlider');
        const priceDisplay = document.getElementById('ticketPrice');

        if (slider) {
            slider.addEventListener('input', (e) => {
                const price = parseInt(e.target.value);
                priceDisplay.textContent = price;
                if (this.zoo.entrance) {
                    this.zoo.entrance.setTicketPrice(price);
                }
            });
        }

        const upgradeBtn = document.getElementById('upgradeEntranceBtn');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                if (this.zoo.entrance && this.zoo.entrance.upgrade(this.zoo)) {
                    this.updateEntranceUI();
                    this.updateStats();
                }
            });
        }
    }

    setupExpansionControls() {
        const expandBtn = document.getElementById('expandZooBtn');
        if (expandBtn) {
            expandBtn.addEventListener('click', () => {
                if (this.zoo.expansion.canExpand()) {
                    const event = new CustomEvent('expandZoo');
                    window.dispatchEvent(event);
                }
            });
        }
    }

    updateStats() {
        document.getElementById('money').textContent = `$${this.zoo.money.toLocaleString()}`;
        document.getElementById('guests').textContent = this.zoo.guestCount.toLocaleString();
        document.getElementById('rating').textContent = this.zoo.zooRating;
        document.getElementById('date').textContent = this.zoo.getDateString().substring(0, 8);

        // Financial
        const income = this.zoo.getTotalIncome();
        const expenses = this.zoo.getTotalExpenses();
        const net = income - expenses;

        document.getElementById('totalIncome').textContent = `$${income.toLocaleString()}`;
        document.getElementById('totalExpenses').textContent = `$${expenses.toLocaleString()}`;
        document.getElementById('netIncome').textContent = `$${net.toLocaleString()}`;
        document.getElementById('netIncome').style.color = net >= 0 ? '#30d158' : '#ff453a';
    }

    updateEntranceUI() {
        const statusEl = document.getElementById('entranceStatus');
        const controlsEl = document.getElementById('entranceControls');

        if (this.zoo.entrance) {
            statusEl.textContent = this.zoo.entrance.isOpen ? 'Open' : 'Closed';
            statusEl.style.color = this.zoo.entrance.isOpen ? '#30d158' : '#ff453a';
            controlsEl.style.display = 'block';

            document.getElementById('entranceLevel').textContent = this.zoo.entrance.upgradeLevel;
            document.getElementById('guestsEntered').textContent = this.zoo.entrance.guestsEntered.toLocaleString();

            const upgradeBtn = document.getElementById('upgradeEntranceBtn');
            if (this.zoo.entrance.upgradeLevel >= 3) {
                upgradeBtn.disabled = true;
                upgradeBtn.textContent = 'Max Level';
            } else {
                upgradeBtn.disabled = false;
                const costs = { 2: 5000, 3: 15000 };
                const nextLevel = this.zoo.entrance.upgradeLevel + 1;
                upgradeBtn.textContent = `Upgrade ($${costs[nextLevel].toLocaleString()})`;
            }
        }
    }

    updateExpansionUI() {
        if (this.zoo.expansion) {
            const size = this.zoo.expansion.currentSize;
            document.getElementById('zooSize').textContent = `${size}x${size}`;

            const expandBtn = document.getElementById('expandZooBtn');
            if (this.zoo.expansion.canExpand()) {
                const cost = this.zoo.expansion.getExpansionCost();
                document.getElementById('expansionCostValue').textContent = cost.toLocaleString();
                expandBtn.disabled = false;
                expandBtn.textContent = 'Expand Zoo';
            } else {
                expandBtn.disabled = true;
                expandBtn.textContent = 'Max Size';
            }
        }
    }
}
