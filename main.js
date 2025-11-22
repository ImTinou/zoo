// Main Game Loop - 3D Version
class Game {
    constructor() {
        this.container = document.getElementById('gameContainer');
        this.grid = new Grid(40, 40, 2);
        this.camera3d = new Camera3D(this.container);
        this.renderer3d = new Renderer3D(this.container, this.grid, this.camera3d);
        this.fenceBuilder = new FenceBuilder(this.renderer3d, this.grid);
        this.zoo = new Zoo();
        this.ui = new UIManager(this.zoo);

        this.currentMousePos = null;
        this.isDragging = false;
        this.isPanning = false;
        this.selectedAnimalMesh = null;
        this.animalMeshes = [];
        this.enrichmentMeshes = [];

        this.setupControls();
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

        // Pan avec middle click ou espace + drag
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
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
                console.log(`Exhibit built! Cost: $${result.cost}`);
            } else if (result) {
                console.log(result.message);
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
            }
        } else if (mode.type === 'facility') {
            const spec = BuildingTypes[mode.building];
            if (this.zoo.spend(spec.cost)) {
                const building = new Building(mode.building, gridX, gridY);
                this.grid.placeBuilding(gridX, gridY, building);
                this.renderer3d.addBuilding(building);
                this.zoo.addBuilding(building);
                this.ui.updateStats();
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
            }
        } else if (mode.type === 'animal') {
            const spec = AnimalSpecies[mode.animal];
            if (this.zoo.spend(spec.cost)) {
                // Trouver l'exhibit à cette position
                const tile = this.grid.getTile(gridX, gridY);
                if (tile && tile.exhibit) {
                    const animal = new Animal(mode.animal, gridX + 0.5, gridY + 0.5);
                    tile.exhibit.addAnimal(animal);
                    this.zoo.addAnimal(animal);

                    // Créer le mesh 3D
                    const animalMesh = this.renderer3d.createAnimalMesh(animal);
                    this.renderer3d.getScene().add(animalMesh);
                    this.animalMeshes.push({ animal, mesh: animalMesh });

                    this.ui.updateStats();
                } else {
                    console.log('Place animals inside exhibits!');
                    this.zoo.earn(spec.cost); // Refund
                }
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
        this.ui.updateStats();

        // Update animal meshes positions
        this.animalMeshes.forEach(({ animal, mesh }) => {
            mesh.position.set(
                animal.x * 2 - this.grid.width,
                0,
                animal.y * 2 - this.grid.height
            );

            // Rotation vers la direction de déplacement
            if (animal.targetX && animal.targetY) {
                const dx = animal.targetX - animal.x;
                const dy = animal.targetY - animal.y;
                if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
                    mesh.rotation.y = Math.atan2(dx, dy);
                }
            }
        });
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
    console.log('Zoo Tycoon 3D loaded! Drag to build fences for exhibits!');
});
