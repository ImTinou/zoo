// Zoo Tycoon 3D Ultimate - Main Game
class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.grid = new Grid(40, 40, 2);
        this.camera3d = new Camera3D(this.container);
        this.renderer3d = new Renderer3D(this.container, this.grid, this.camera3d);
        this.fenceBuilder = new FenceBuilder(this.renderer3d, this.grid);
        this.animalFactory = new AnimalModelFactory();
        this.zoo = new Zoo();
        this.ui = new ModernUIManager(this.zoo);
        this.notifications = new NotificationManager();
        this.minimap = new Minimap(this.grid, this.camera3d);
        this.visitorManager = new VisitorManager(this.zoo, this.grid);

        this.currentMousePos = null;
        this.isDragging = false;
        this.isPanning = false;
        this.animalMeshes = [];
        this.visitorMeshes = [];
        this.enrichmentMeshes = [];

        this.setupControls();
        this.setupExpansionHandler();
        this.setupMinimapHandler();

        // Initialize UI
        this.ui.updateEntranceUI();
        this.ui.updateExpansionUI();

        // Welcome notification
        this.notifications.success(
            'Welcome to Zoo Tycoon 3D!',
            'Build exhibits, add animals, and create the best zoo!',
            '🎉'
        );

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
        } else if (this.ui.bulldozeMode) {
            this.handleBulldoze(gridX, gridY);
        } else if (this.ui.selectedBuildMode) {
            this.handleBuild(gridX, gridY);
        }
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
        }
        this.renderer3d.highlightTile(intersection.x, intersection.y, color);

        // Update fence preview pendant le drag
        if (this.isDragging && this.ui.selectedBuildMode && this.ui.selectedBuildMode.type === 'fence') {
            this.fenceBuilder.updateDrawing(intersection.x, intersection.y);
        }
    }

    onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            return;
        }

        if (this.isDragging && this.currentMousePos) {
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

            this.isDragging = false;
        }
    }

    handleBuild(gridX, gridY) {
        const mode = this.ui.selectedBuildMode;

        if (mode.type === 'path') {
            const cost = PathCosts[mode.material] || 10;
            if (this.zoo.spend(cost)) {
                this.grid.placePath(gridX, gridY, mode.material);
                this.renderer3d.addPath(gridX, gridY, mode.material);
                this.ui.updateStats();
            } else {
                this.notifications.error('Not Enough Money', `Need $${cost}`);
            }
        } else if (mode.type === 'entrance') {
            if (this.zoo.entrance) {
                this.notifications.warning('Already Built', 'Entrance already exists!');
                return;
            }

            const entranceCost = 5000;
            if (this.zoo.spend(entranceCost)) {
                const entrance = new ParkEntrance(gridX, gridY);
                this.zoo.entrance = entrance;

                const mesh = entrance.create3DMesh(this.grid.width, this.grid.height);
                mesh.userData.entrance = entrance;
                this.renderer3d.getScene().add(mesh);

                this.ui.updateEntranceUI();
                this.ui.updateStats();
                this.notifications.success('Park Entrance Built!', 'Visitors can now enter your zoo', '🎪');
            } else {
                this.notifications.error('Not Enough Money', `Need $${entranceCost.toLocaleString()}`);
            }
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
            const spec = AnimalSpecies[mode.animal];
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
    const game = new Game();
    console.log('🎮 Zoo Tycoon 3D Ultimate loaded!');
    console.log('📖 Drag to build exhibits, click to place objects');
});
