// Main Game Loop
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.grid = new Grid(40, 40, 64);
        this.camera = new Camera(this.canvas);
        this.renderer = new Renderer(this.canvas, this.grid, this.camera);
        this.zoo = new Zoo();
        this.ui = new UIManager(this.zoo);

        this.mouseGridX = -1;
        this.mouseGridY = -1;
        this.selectedObject = null;

        this.init();
        this.setupControls();
        this.gameLoop();
    }

    init() {
        // Centrer la caméra sur la grille
        const center = this.grid.gridToIso(this.grid.width / 2, this.grid.height / 2);
        this.camera.x = center.x;
        this.camera.y = center.y - 200;

        // Créer un enclos de départ
        this.createStarterExhibit();
    }

    createStarterExhibit() {
        // Créer un petit enclos 3x3 pour commencer
        const startX = 18;
        const startY = 18;

        // Créer l'exhibit
        const exhibit = new Exhibit(startX, startY, 4, 4);
        exhibit.hasShelter = true;
        exhibit.hasWater = true;
        this.zoo.exhibits.push(exhibit);

        // Marquer les tuiles comme occupées
        for (let y = startY; y < startY + 4; y++) {
            for (let x = startX; x < startX + 4; x++) {
                const tile = this.grid.getTile(x, y);
                if (tile) {
                    tile.terrain = 'grass';
                    tile.occupied = true;
                }
            }
        }

        // Ajouter une clôture visuelle (bâtiment fictif pour représenter)
        for (let y = startY; y < startY + 4; y++) {
            for (let x = startX; x < startX + 4; x++) {
                // Seulement sur les bords
                if (x === startX || x === startX + 3 || y === startY || y === startY + 3) {
                    const tile = this.grid.getTile(x, y);
                    if (tile && !tile.building) {
                        // Marqueur de clôture simple
                        tile.scenery.push({ emoji: '🪵', type: 'fence' });
                    }
                }
            }
        }

        // Ajouter un lion de départ
        const lion = new Animal('lion', startX + 1.5, startY + 1.5);
        exhibit.addAnimal(lion);
        this.zoo.addAnimal(lion);

        // Ajouter quelques chemins
        for (let i = 15; i < 25; i++) {
            this.grid.placePath(i, 15, 'asphalt');
            this.grid.placePath(15, i, 'asphalt');
        }
    }

    setupControls() {
        // Camera controls
        document.getElementById('rotateLeftBtn').addEventListener('click', () => {
            this.camera.rotate(-1);
        });

        document.getElementById('rotateRightBtn').addEventListener('click', () => {
            this.camera.rotate(1);
        });

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.camera.setZoom(this.camera.zoom * 1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.camera.setZoom(this.camera.zoom / 1.2);
        });

        // Grid toggle
        document.getElementById('gridToggleBtn').addEventListener('click', () => {
            this.renderer.showGrid = !this.renderer.showGrid;
        });

        // Terrain toggle
        document.getElementById('terrainToggleBtn').addEventListener('click', () => {
            this.renderer.showTerrain = !this.renderer.showTerrain;
        });

        // Mouse controls
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        const world = this.camera.screenToWorld(screenX, screenY);
        const gridPos = this.grid.screenToGrid(world.x, world.y, this.camera);

        this.mouseGridX = gridPos.x;
        this.mouseGridY = gridPos.y;
    }

    onClick(e) {
        if (!this.grid.isValid(this.mouseGridX, this.mouseGridY)) return;

        const tile = this.grid.getTile(this.mouseGridX, this.mouseGridY);

        // Mode bulldoze
        if (this.ui.bulldozeMode) {
            if (tile.building) {
                this.zoo.removeBuilding(tile.building);
                this.grid.remove(this.mouseGridX, this.mouseGridY);
                this.zoo.earn(50); // Remboursement partiel
            } else if (tile.path) {
                this.grid.remove(this.mouseGridX, this.mouseGridY);
                this.zoo.earn(5);
            }
            this.ui.updateStats();
            return;
        }

        // Mode construction
        if (this.ui.selectedBuildMode) {
            this.handleBuildMode(tile);
            return;
        }

        // Sélection d'objet
        this.handleSelection(tile);
    }

    handleBuildMode(tile) {
        const mode = this.ui.selectedBuildMode;

        if (mode.type === 'path') {
            const cost = PathCosts[mode.material] || 10;
            if (this.zoo.canAfford(cost)) {
                if (this.grid.placePath(this.mouseGridX, this.mouseGridY, mode.material)) {
                    this.zoo.spend(cost);
                }
            } else {
                this.showMessage('Not enough money!');
            }
        } else if (mode.type === 'facility') {
            const buildingType = mode.building;
            const spec = BuildingTypes[buildingType];

            if (this.zoo.canAfford(spec.cost)) {
                if (tile.occupied || tile.building) {
                    this.showMessage('Tile is occupied!');
                    return;
                }

                const building = new Building(buildingType, this.mouseGridX, this.mouseGridY);
                this.grid.placeBuilding(this.mouseGridX, this.mouseGridY, building);
                this.zoo.addBuilding(building);
                this.zoo.spend(spec.cost);
            } else {
                this.showMessage('Not enough money!');
            }
        } else if (mode.type === 'scenery') {
            const itemType = mode.item;
            const spec = SceneryTypes[itemType];

            if (this.zoo.canAfford(spec.cost)) {
                const item = new SceneryItem(itemType, this.mouseGridX, this.mouseGridY);
                tile.scenery.push(item);
                this.zoo.spend(spec.cost);
            } else {
                this.showMessage('Not enough money!');
            }
        } else if (mode.type === 'animal') {
            const species = mode.animal;
            const spec = AnimalSpecies[species];

            if (this.zoo.canAfford(spec.cost)) {
                // Trouver un enclos à cette position
                let targetExhibit = null;
                for (let exhibit of this.zoo.exhibits) {
                    const bounds = exhibit.getBounds();
                    if (this.mouseGridX >= bounds.x && this.mouseGridX < bounds.x + bounds.width &&
                        this.mouseGridY >= bounds.y && this.mouseGridY < bounds.y + bounds.height) {
                        targetExhibit = exhibit;
                        break;
                    }
                }

                if (targetExhibit) {
                    const animal = new Animal(species, this.mouseGridX + 0.5, this.mouseGridY + 0.5);
                    targetExhibit.addAnimal(animal);
                    this.zoo.addAnimal(animal);
                    this.zoo.spend(spec.cost);
                } else {
                    this.showMessage('Place animals in exhibits!');
                }
            } else {
                this.showMessage('Not enough money!');
            }
        }

        this.ui.updateStats();
    }

    handleSelection(tile) {
        // Vérifier s'il y a un animal
        const clickedAnimal = this.zoo.animals.find(a =>
            Math.floor(a.x) === this.mouseGridX && Math.floor(a.y) === this.mouseGridY
        );

        if (clickedAnimal) {
            this.selectedObject = { type: 'animal', animal: clickedAnimal };
            this.ui.showSelectionInfo(this.selectedObject);
            return;
        }

        // Vérifier s'il y a un bâtiment
        if (tile.building) {
            this.selectedObject = { type: 'building', building: tile.building };
            this.ui.showSelectionInfo(this.selectedObject);
            return;
        }

        // Sinon afficher les infos de la tuile
        this.selectedObject = { type: 'tile', tile: tile, x: this.mouseGridX, y: this.mouseGridY };
        this.ui.showSelectionInfo(this.selectedObject);
    }

    showMessage(text) {
        // Simple alert pour l'instant
        console.log(text);
    }

    update() {
        this.camera.update();
        this.zoo.update();
        this.ui.updateStats();
    }

    render() {
        this.renderer.render();

        // Highlight de la tuile survolée
        if (this.grid.isValid(this.mouseGridX, this.mouseGridY)) {
            let color = 'rgba(52, 152, 219, 0.3)';
            if (this.ui.bulldozeMode) {
                color = 'rgba(231, 76, 60, 0.5)';
            } else if (this.ui.selectedBuildMode) {
                color = 'rgba(46, 204, 113, 0.4)';
            }
            this.renderer.highlightTile(this.mouseGridX, this.mouseGridY, color);
        }

        // Dessiner les animaux
        this.camera.apply(this.renderer.ctx);
        this.zoo.animals.forEach(animal => {
            const iso = this.grid.gridToIso(animal.x, animal.y);
            this.renderer.ctx.font = '32px Arial';
            this.renderer.ctx.textAlign = 'center';
            this.renderer.ctx.textBaseline = 'bottom';

            // Ombre
            this.renderer.ctx.fillStyle = 'rgba(0,0,0,0.3)';
            this.renderer.ctx.fillText(animal.emoji, iso.x + 2, iso.y + 2);

            // Animal
            this.renderer.ctx.fillText(animal.emoji, iso.x, iso.y);

            // Nom et barre de vie si sélectionné
            if (this.selectedObject && this.selectedObject.animal === animal) {
                this.renderer.ctx.fillStyle = 'white';
                this.renderer.ctx.font = 'bold 12px Arial';
                this.renderer.ctx.fillText(animal.name, iso.x, iso.y - 25);

                // Barre de bonheur
                const barWidth = 40;
                const barHeight = 4;
                this.renderer.ctx.fillStyle = 'rgba(0,0,0,0.5)';
                this.renderer.ctx.fillRect(iso.x - barWidth/2, iso.y - 20, barWidth, barHeight);
                this.renderer.ctx.fillStyle = this.ui.getBarColor(animal.happiness);
                this.renderer.ctx.fillRect(iso.x - barWidth/2, iso.y - 20, barWidth * (animal.happiness/100), barHeight);
            }
        });
        this.camera.restore(this.renderer.ctx);
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Démarrer le jeu
window.addEventListener('load', () => {
    const game = new Game();
});
