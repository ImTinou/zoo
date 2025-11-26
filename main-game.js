// Firebase imports
import firebaseService from './firebase/config.js';
import GameAuthUI from './ui/gameAuth.js';
import SocialUI from './ui/social.js';
import SaveStatusUI from './ui/saveStatus.js';

// Zoo Tycoon 3D Ultimate - Main Game
class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.grid = new Grid(40, 40, 2);
        this.camera3d = new Camera3D(this.container);
        this.renderer3d = new Renderer3D(this.container, this.grid, this.camera3d);
        this.fenceBuilder = new FenceBuilder(this.renderer3d, this.grid);
        this.pathBuilder = new PathBuilder(this.renderer3d, this.grid);
        this.terrainManager = new TerrainManager(this.renderer3d);
        this.animalFactory = new AnimalModelFactory();
        this.zoo = new Zoo();
        this.ui = new ModernUIManager(this.zoo);
        this.notifications = new NotificationManager();
        this.minimap = new Minimap(this.grid, this.camera3d);
        this.visitorManager = new VisitorManager(this.zoo, this.grid);
        this.saveSystem = new SaveSystem();
        this.minigameUI = new MinigameUI(this.zoo);
        this.debugMenu = new DebugMenu(this);

        // Firebase & Social Features
        this.firebaseService = firebaseService;
        this.authUI = new GameAuthUI(); // Use GameAuthUI instead of AuthUI
        this.socialUI = new SocialUI(this);
        this.saveStatusUI = new SaveStatusUI();
        this.saveSystem.setFirebaseService(firebaseService);
        this.saveSystem.setSaveStatusUI(this.saveStatusUI);

        this.currentMousePos = null;
        this.isDragging = false;
        this.isPanning = false;
        this.animalMeshes = [];
        this.visitorMeshes = [];
        this.enrichmentMeshes = [];
        this.entranceMesh = null;

        this.setupControls();
        this.setupExpansionHandler();
        this.setupMinimapHandler();
        this.setupSaveControls();

        // Always start with default entrance
        // The zoo will be loaded from Firebase after authentication
        this.createDefaultEntrance();

        // Start auto-save (will only save when authenticated)
        this.saveSystem.startAutoSave(this);

        // Initialize UI
        this.ui.updateEntranceUI();
        this.ui.updateExpansionUI();

        this.gameLoop();
    }

    setupControls() {
        const canvas = this.renderer3d.getRenderer().domElement;

        // Camera rotation buttons
        document.getElementById('rotateLeftBtn').addEventListener('click', () => {
            this.camera3d.rotate(-1);
        });

        document.getElementById('rotateRightBtn').addEventListener('click', () => {
            this.camera3d.rotate(1);
        });

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.camera3d.setZoom(this.camera3d.zoom * 1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.camera3d.setZoom(this.camera3d.zoom / 1.2);
        });

        // Grid toggle
        document.getElementById('gridToggleBtn').addEventListener('click', () => {
            this.renderer3d.toggleGrid();
        });

        // Mouse controls
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    setupExpansionHandler() {
        window.addEventListener('expandZoo', () => {
            if (this.zoo.expansion.expand(this.zoo, this)) {
                this.notifications.success(
                    'Zoo Expanded!',
                    `New size: ${this.zoo.expansion.currentSize}x${this.zoo.expansion.currentSize}`,
                    '🗺️'
                );

                this.fenceBuilder.grid = this.grid;
                this.renderer3d.createGridHelper();
                this.minimap.grid = this.grid;
                this.minimap.scale = this.minimap.width / this.grid.width;

                this.ui.updateExpansionUI();
                this.ui.updateStats();
            } else {
                this.notifications.error('Expansion Failed', 'Not enough money or max size reached');
            }
        });
    }

    setupMinimapHandler() {
        window.addEventListener('minimapClick', (e) => {
            // Pan camera to clicked position on minimap
            const { gridX, gridY } = e.detail;
            console.log(`Minimap clicked: ${gridX}, ${gridY}`);
            // TODO: Implement camera panning to position
        });
    }

    setupSaveControls() {
        // Sauvegarder avec Ctrl+S
        window.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();

                if (!this.firebaseService.isAuthenticated()) {
                    this.notifications.warning('Not logged in', 'Please login to save your zoo', '⚠️');
                    return;
                }

                const success = await this.saveSystem.saveGame(this);
                if (success) {
                    this.notifications.success('Game Saved!', 'Your progress has been saved to cloud', '💾');
                } else {
                    this.notifications.error('Save Failed', 'Could not save to cloud', '❌');
                }
            }
        });
    }

    createDefaultEntrance() {
        // Placer l'entrée en bas au centre de la map (gratuit au démarrage)
        const entranceX = Math.floor(this.grid.width / 2);
        const entranceY = this.grid.height - 5; // 5 cases du bord

        const entrance = new ParkEntrance(entranceX, entranceY);
        this.zoo.entrance = entrance;

        // Créer le mesh 3D
        this.entranceMesh = entrance.create3DMesh(this.grid.width, this.grid.height);
        this.entranceMesh.userData.entrance = entrance;
        this.renderer3d.getScene().add(this.entranceMesh);

        // Créer un chemin de base devant l'entrée (5 tuiles vers le centre)
        for (let i = 1; i <= 5; i++) {
            const pathY = entranceY - i;
            this.grid.placePath(entranceX, pathY, 'asphalt');
            this.renderer3d.addPath(entranceX, pathY, 'asphalt');
        }
    }

    onMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const intersection = this.renderer3d.getMouseIntersection(mouseX, mouseY);
        if (!intersection) return;

        // Pan avec clic droit
        if (e.button === 2) {
            this.isPanning = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            return;
        }

        if (e.button !== 0) return; // Seulement clic gauche pour build

        const gridX = intersection.x;
        const gridY = intersection.y;

        // Mode clôture - démarrer le drag
        if (this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'fence') {
            this.fenceBuilder.setFenceType(this.ui.selectedBuildMode.fence);
            this.fenceBuilder.startDrawing(gridX, gridY);
            this.isDragging = true;
        } else if (this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'path') {
            // Mode chemin - démarrer le drag
            this.pathBuilder.startDrawing(gridX, gridY, this.ui.selectedBuildMode.material);
            this.isDragging = true;
        } else if (this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'terrain') {
            // Mode terrain - modifier le terrain d'un enclos existant
            this.handleTerrainChange(gridX, gridY);
        } else if (this.ui.bulldozeMode) {
            this.handleBulldoze(gridX, gridY);
        } else if (this.ui.selectedBuildMode) {
            this.handleBuild(gridX, gridY);
        } else {
            // Mode inspection - vérifier tous les objets cliquables
            this.handleInspectClick(gridX, gridY);
        }
    }

    handleInspectClick(gridX, gridY) {
        const tile = this.grid.getTile(gridX, gridY);

        // Priorité 1: Visiteur à cette position
        const visitor = this.visitorManager.visitors.find(v =>
            Math.floor(v.x) === gridX && Math.floor(v.y) === gridY
        );
        if (visitor) {
            this.showVisitorInfo(visitor);
            return;
        }

        // Priorité 2: Animal à cette position
        const animal = this.zoo.animals.find(a =>
            Math.floor(a.x) === gridX && Math.floor(a.y) === gridY
        );
        if (animal) {
            this.showAnimalInfo(animal);
            return;
        }

        // Priorité 3: Bâtiment
        if (tile && tile.building) {
            this.showBuildingInfo(tile.building);
            // Si c'est un centre de recherche, ouvrir l'interface
            if (tile.building.type === 'research') {
                this.minigameUI.showResearchOptions();
            }
            return;
        }

        // Priorité 4: Enclos
        if (tile && tile.exhibit) {
            this.showExhibitInfo(tile.exhibit);
            return;
        }

        // Aucun objet cliqué - réinitialiser l'info panel
        this.resetInfoPanel();
    }

    resetInfoPanel() {
        const selectionInfo = document.getElementById('selectionInfo');
        selectionInfo.innerHTML = `
            <h3>🎯 Selection</h3>
            <p style="color: #8e8ea0; font-size: 12px;">Click to select an object</p>
        `;
    }

    handleTerrainChange(gridX, gridY) {
        const tile = this.grid.getTile(gridX, gridY);
        if (!tile || !tile.exhibit) {
            this.notifications.warning('No Exhibit', 'Click inside an exhibit to change its terrain!');
            return;
        }

        const terrainType = this.ui.selectedBuildMode.terrain;
        const cost = this.terrainManager.getCostToChange(tile.exhibit, terrainType);

        if (this.zoo.spend(cost)) {
            this.terrainManager.applyTerrainToExhibit(tile.exhibit, terrainType);
            this.ui.updateStats();
            this.notifications.success(
                'Terrain Changed!',
                `${TerrainTypes[terrainType].name} - $${cost.toLocaleString()}`,
                TerrainTypes[terrainType].emoji
            );
        } else {
            this.notifications.error('Not Enough Money', `Need $${cost.toLocaleString()}`);
        }
    }

    showVisitorInfo(visitor) {
        const selectionInfo = document.getElementById('selectionInfo');
        const info = visitor.getInfo();

        const happinessColor = info.happiness >= 80 ? '#30d158' : info.happiness >= 50 ? '#ffd60a' : '#ff453a';

        selectionInfo.innerHTML = `
            <h3>🧑‍🤝‍🧑 Visitor Info</h3>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Happiness:</span>
                    <span style="color: ${happinessColor}; font-size: 12px; font-weight: 600;">${info.happiness}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Hunger:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.hunger}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Thirst:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.thirst}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Bladder:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.bladder}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Energy:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.energy}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Time in Zoo:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.timeInZoo} min</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Exhibits Visited:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${info.exhibitsVisited}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Ticket Paid:</span>
                    <span style="color: #30d158; font-size: 12px; font-weight: 600;">$${visitor.ticketPaid}</span>
                </div>
                ${info.thought ? `
                    <div style="margin-top: 12px; padding: 10px; background: #2c2c2e; border-radius: 8px;">
                        <span style="color: #fff; font-size: 11px;">${info.thought}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showAnimalInfo(animal) {
        const selectionInfo = document.getElementById('selectionInfo');
        const spec = AnimalSpecies[animal.species] || RareAnimals[animal.species];
        const happinessColor = animal.happiness >= 80 ? '#30d158' : animal.happiness >= 50 ? '#ffd60a' : '#ff453a';

        selectionInfo.innerHTML = `
            <h3>${spec.emoji} ${spec.name}</h3>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Species:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${spec.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Biome:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${spec.biome}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Happiness:</span>
                    <span style="color: ${happinessColor}; font-size: 12px; font-weight: 600;">${Math.round(animal.happiness)}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Hunger:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${Math.round(animal.hunger)}%</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Age:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${Math.floor(animal.age / 60)} days</span>
                </div>
                ${animal.exhibit ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #8e8ea0; font-size: 12px;">Exhibit Size:</span>
                        <span style="color: #fff; font-size: 12px; font-weight: 600;">${animal.exhibit.width}x${animal.exhibit.height}</span>
                    </div>
                ` : ''}
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #3a3a3c;">
                    <h4 style="color: #fff; font-size: 12px; margin-bottom: 8px;">Needs:</h4>
                    <div style="font-size: 11px; color: #8e8ea0; line-height: 1.5;">
                        ${spec.needs.join(', ')}
                    </div>
                </div>
            </div>
        `;
    }

    showBuildingInfo(building) {
        const selectionInfo = document.getElementById('selectionInfo');

        selectionInfo.innerHTML = `
            <h3>${building.emoji} ${building.name}</h3>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Type:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${building.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Position:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">(${building.x}, ${building.y})</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Cost:</span>
                    <span style="color: #ffd60a; font-size: 12px; font-weight: 600;">$${building.cost.toLocaleString()}</span>
                </div>
                ${building.type === 'research' ? `
                    <div style="margin-top: 12px;">
                        <button id="openResearchBtn" class="btn" style="width: 100%; padding: 8px; background: #30d158;">
                            🔬 Open Research Center
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handler for research button
        if (building.type === 'research') {
            const btn = document.getElementById('openResearchBtn');
            if (btn) {
                btn.addEventListener('click', () => {
                    this.minigameUI.showResearchOptions();
                });
            }
        }
    }

    showExhibitInfo(exhibit) {
        const terrain = TerrainTypes[exhibit.terrain] || TerrainTypes.grass;
        const selectionInfo = document.getElementById('selectionInfo');

        // Calculate average happiness
        let avgHappiness = 0;
        if (exhibit.animals.length > 0) {
            const totalHappiness = exhibit.animals.reduce((sum, animal) => sum + animal.happiness, 0);
            avgHappiness = Math.round(totalHappiness / exhibit.animals.length);
        }

        const happinessColor = avgHappiness >= 80 ? '#30d158' : avgHappiness >= 50 ? '#ffd60a' : '#ff453a';

        selectionInfo.innerHTML = `
            <h3>🏗️ Exhibit Info</h3>
            <div style="margin-top: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Size:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${exhibit.width}x${exhibit.height}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Terrain:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${terrain.emoji} ${terrain.name}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Animals:</span>
                    <span style="color: #fff; font-size: 12px; font-weight: 600;">${exhibit.animals.length}</span>
                </div>
                ${exhibit.animals.length > 0 ? `
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #8e8ea0; font-size: 12px;">Happiness:</span>
                        <span style="color: ${happinessColor}; font-size: 12px; font-weight: 600;">${avgHappiness}%</span>
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Has Shelter:</span>
                    <span style="color: ${exhibit.hasShelter ? '#30d158' : '#ff453a'}; font-size: 12px;">${exhibit.hasShelter ? '✓' : '✗'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #8e8ea0; font-size: 12px;">Has Water:</span>
                    <span style="color: ${exhibit.hasWater ? '#30d158' : '#ff453a'}; font-size: 12px;">${exhibit.hasWater ? '✓' : '✗'}</span>
                </div>
            </div>
            ${exhibit.animals.length > 0 ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #3a3a3c;">
                    <h4 style="color: #fff; font-size: 13px; margin-bottom: 8px;">Animals in Exhibit:</h4>
                    ${exhibit.animals.map(animal => {
                        const spec = AnimalSpecies[animal.species] || RareAnimals[animal.species];
                        return `
                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding: 6px; background: #2c2c2e; border-radius: 6px;">
                                <div style="display: flex; align-items: center;">
                                    <span style="font-size: 20px; margin-right: 8px;">${spec.emoji}</span>
                                    <span style="color: #fff; font-size: 11px;">${spec.name}</span>
                                </div>
                                <span style="color: ${animal.happiness >= 80 ? '#30d158' : animal.happiness >= 50 ? '#ffd60a' : '#ff453a'}; font-size: 11px; font-weight: 600;">${Math.round(animal.happiness)}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : ''}
            <button id="changeTerrainBtn" class="btn" style="width: 100%; padding: 8px; margin-top: 12px;">
                🌍 Change Terrain
            </button>
        `;

        // Add event listener for change terrain button
        document.getElementById('changeTerrainBtn').addEventListener('click', () => {
            // Open the exhibits category to show terrain options
            const exhibitsBtn = document.querySelector('.build-category-btn[data-category="exhibits"]');
            if (exhibitsBtn) {
                exhibitsBtn.click();
                // Scroll to terrain section
                setTimeout(() => {
                    const terrainSection = document.querySelector('.build-card[data-type="terrain"]');
                    if (terrainSection) {
                        terrainSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 100);
            }
        });
    }

    onMouseMove(e) {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Pan
        if (this.isPanning) {
            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;
            this.camera3d.pan(deltaX, deltaY);
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            return;
        }

        const intersection = this.renderer3d.getMouseIntersection(mouseX, mouseY);
        if (!intersection) return;

        this.currentMousePos = intersection;

        // Highlight tile
        let color = 0x3498db;
        if (this.ui.bulldozeMode) {
            color = 0xe74c3c;
        } else if (this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'fence') {
            color = 0x27ae60;
        } else if (this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'path') {
            color = 0x8B7355;
        }
        this.renderer3d.highlightTile(intersection.x, intersection.y, color);

        // Update previews pendant le drag
        if (this.isDragging && this.ui.selectedBuildMode) {
            if (this.ui.selectedBuildMode.type === 'fence') {
                this.fenceBuilder.updateDrawing(intersection.x, intersection.y);
            } else if (this.ui.selectedBuildMode.type === 'path') {
                this.pathBuilder.updateDrawing(intersection.x, intersection.y);
            }
        }
    }

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            return;
        }

        if (this.isDragging && this.ui.selectedBuildMode) {
            if (this.ui.selectedBuildMode.type === 'fence' && this.currentMousePos) {
                const result = this.fenceBuilder.finishDrawing(
                    this.currentMousePos.x,
                    this.currentMousePos.y,
                    this.zoo
                );

                if (result && result.success) {
                    this.ui.updateStats();
                    this.notifications.success(
                        'Exhibit Built!',
                        `Cost: $${result.cost.toLocaleString()}`,
                        '🏗️'
                    );
                } else if (result) {
                    this.notifications.error('Build Failed', result.message);
                }
            } else if (this.ui.selectedBuildMode.type === 'path') {
                const result = this.pathBuilder.finishDrawing(this.zoo);

                if (result && result.success) {
                    this.ui.updateStats();
                    this.notifications.success(
                        'Path Built!',
                        `${result.count} tiles - $${result.cost.toLocaleString()}`,
                        '🛤️'
                    );
                } else if (result) {
                    this.notifications.error('Build Failed', result.message);
                }
            }

            this.isDragging = false;
        }
    }

    handleBuild(gridX, gridY) {
        const mode = this.ui.selectedBuildMode;

        if (mode.type === 'path') {
            // Les chemins utilisent maintenant le drag - ignorer le simple clic
            return;
        } else if (mode.type === 'facility') {
            const spec = BuildingTypes[mode.building];
            if (this.zoo.spend(spec.cost)) {
                const building = new Building(mode.building, gridX, gridY);
                this.grid.placeBuilding(gridX, gridY, building);
                this.renderer3d.addBuilding(building);
                this.zoo.addBuilding(building);
                this.ui.updateStats();
                this.notifications.success(`${spec.name} Built!`, `Cost: $${spec.cost.toLocaleString()}`, spec.emoji || '🏪');
            } else {
                this.notifications.error('Not Enough Money', `Need $${spec.cost.toLocaleString()}`);
            }
        } else if (mode.type === 'enrichment') {
            const spec = EnrichmentTypes[mode.item];
            if (this.zoo.spend(spec.cost)) {
                const enrichment = new Enrichment(mode.item, gridX, gridY);
                const mesh = spec.create3DMesh(gridX, gridY, this.grid.width, this.grid.height);
                mesh.userData.enrichment = enrichment;
                this.renderer3d.getScene().add(mesh);
                this.enrichmentMeshes.push(mesh);

                const tile = this.grid.getTile(gridX, gridY);
                if (tile) {
                    tile.scenery.push(enrichment);
                }

                this.ui.updateStats();
            } else {
                this.notifications.error('Not Enough Money', `Need $${spec.cost.toLocaleString()}`);
            }
        } else if (mode.type === 'animal') {
            const spec = AnimalSpecies[mode.animal] || RareAnimals[mode.animal];
            if (!spec) return;

            if (this.zoo.spend(spec.cost)) {
                const tile = this.grid.getTile(gridX, gridY);
                if (tile && tile.exhibit) {
                    const animal = new Animal(mode.animal, gridX + 0.5, gridY + 0.5);
                    tile.exhibit.addAnimal(animal);
                    this.zoo.addAnimal(animal);

                    // Use detailed 3D model
                    const animalMesh = this.animalFactory.createAnimal(mode.animal);
                    animalMesh.userData.animal = animal;
                    this.renderer3d.getScene().add(animalMesh);
                    this.animalMeshes.push({ animal, mesh: animalMesh });

                    this.ui.updateStats();
                    this.notifications.success(`${spec.name} Added!`, `Welcome to the zoo!`, spec.emoji);
                } else {
                    this.notifications.warning('Invalid Location', 'Animals must be placed inside exhibits!');
                    this.zoo.earn(spec.cost); // Refund
                }
            } else {
                this.notifications.error('Not Enough Money', `Need $${spec.cost.toLocaleString()}`);
            }
        }
    }

    handleBulldoze(gridX, gridY) {
        const tile = this.grid.getTile(gridX, gridY);
        if (!tile) return;

        if (tile.building) {
            this.zoo.removeBuilding(tile.building);
            this.renderer3d.removeObject(gridX, gridY);
            this.grid.remove(gridX, gridY);
            this.zoo.earn(50);
            this.ui.updateStats();
            this.notifications.info('Demolished', 'Refunded $50');
        } else if (tile.path) {
            this.renderer3d.removeObject(gridX, gridY);
            this.grid.remove(gridX, gridY);
            this.zoo.earn(5);
            this.ui.updateStats();
        }
    }

    update() {
        this.camera3d.update();
        this.zoo.update();
        this.visitorManager.update();
        this.terrainManager.updateWaterAnimation();
        this.ui.updateStats();

        // Update animal meshes
        this.animalMeshes.forEach(({ animal, mesh }) => {
            mesh.position.set(
                animal.x * 2 - this.grid.width,
                0,
                animal.y * 2 - this.grid.height
            );

            if (animal.targetX && animal.targetY) {
                const dx = animal.targetX - animal.x;
                const dy = animal.targetY - animal.y;
                if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                    mesh.rotation.y = Math.atan2(dx, dy);
                }
            }
        });

        // Update visitor meshes
        this.updateVisitorMeshes();

        // Update minimap
        this.minimap.update(this);
    }

    updateVisitorMeshes() {
        // Remove old visitor meshes
        this.visitorMeshes.forEach(mesh => {
            this.renderer3d.getScene().remove(mesh);
        });
        this.visitorMeshes = [];

        // Create new visitor meshes
        this.visitorManager.visitors.forEach(visitor => {
            const visitorMesh = this.createVisitorMesh(visitor);
            this.renderer3d.getScene().add(visitorMesh);
            this.visitorMeshes.push(visitorMesh);
        });
    }

    createVisitorMesh(visitor) {
        const group = new THREE.Group();

        // Simple person model
        const bodyGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: visitor.color });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.25;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.12, 8, 8);
        const head = new THREE.Mesh(headGeom, new THREE.MeshLambertMaterial({ color: 0xFFDBAC }));
        head.position.y = 0.62;
        head.castShadow = true;
        group.add(head);

        // Position
        group.position.set(
            visitor.x * 2 - this.grid.width,
            0,
            visitor.y * 2 - this.grid.height
        );

        return group;
    }

    render() {
        this.renderer3d.render();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start game
window.addEventListener('load', () => {
    window.game = new Game();
    console.log('🎮 Zoo Tycoon 3D Ultimate loaded!');
    console.log('📖 Drag to build exhibits, click to place objects');
});
