// Renderer - Système de rendu isométrique
class Renderer {
    constructor(canvas, grid, camera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.grid = grid;
        this.camera = camera;

        this.showGrid = true;
        this.showTerrain = true;

        // Couleurs du terrain
        this.terrainColors = {
            grass: ['#5a9e3f', '#4a8e2f', '#6aae4f'],
            dirt: ['#8B7355', '#7B6345', '#9B8365'],
            sand: ['#E4D4A7', '#D4C497', '#F4E4B7']
        };

        // Couleurs des chemins
        this.pathColors = {
            dirt: '#8B7355',
            asphalt: '#555555',
            cobblestone: '#999999'
        };

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    clear() {
        this.ctx.fillStyle = '#1a252f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        this.clear();
        this.camera.apply(this.ctx);

        // Rendre la grille de bas en haut, de gauche à droite
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const tile = this.grid.getTile(x, y);
                const iso = this.grid.gridToIso(x, y);

                // Terrain
                if (this.showTerrain) {
                    this.renderTile(iso.x, iso.y, tile, x, y);
                }

                // Chemins
                if (tile.path) {
                    this.renderPath(iso.x, iso.y, tile, x, y);
                }

                // Bâtiments
                if (tile.building) {
                    this.renderBuilding(iso.x, iso.y, tile.building);
                }

                // Décoration
                tile.scenery.forEach(item => {
                    this.renderScenery(iso.x, iso.y, item);
                });
            }
        }

        this.camera.restore(this.ctx);
    }

    renderTile(isoX, isoY, tile, gridX, gridY) {
        const ctx = this.ctx;
        const size = this.grid.tileSize;

        // Variation de couleur pour effet naturel
        const colors = this.terrainColors[tile.terrain];
        const colorIndex = (gridX + gridY) % colors.length;
        const color = colors[colorIndex];

        // Forme du losange isométrique
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + size / 2, isoY + size / 4);
        ctx.lineTo(isoX, isoY + size / 2);
        ctx.lineTo(isoX - size / 2, isoY + size / 4);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Grille
        if (this.showGrid) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    renderPath(isoX, isoY, tile, gridX, gridY) {
        const ctx = this.ctx;
        const size = this.grid.tileSize;

        // Couleur du chemin
        ctx.fillStyle = this.pathColors[tile.path] || this.pathColors.dirt;

        // Forme du losange pour le chemin
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + size / 2, isoY + size / 4);
        ctx.lineTo(isoX, isoY + size / 2);
        ctx.lineTo(isoX - size / 2, isoY + size / 4);
        ctx.closePath();
        ctx.fill();

        // Bordures des chemins
        const connections = this.grid.getPathConnections(gridX, gridY);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;

        // Dessiner les bordures seulement où il n'y a pas de connexion
        ctx.beginPath();
        if (!(connections & 1)) { // Nord
            ctx.moveTo(isoX, isoY);
            ctx.lineTo(isoX - size / 2, isoY + size / 4);
        }
        if (!(connections & 2)) { // Est
            ctx.moveTo(isoX, isoY);
            ctx.lineTo(isoX + size / 2, isoY + size / 4);
        }
        if (!(connections & 4)) { // Sud
            ctx.moveTo(isoX - size / 2, isoY + size / 4);
            ctx.lineTo(isoX, isoY + size / 2);
            ctx.lineTo(isoX + size / 2, isoY + size / 4);
        }
        ctx.stroke();
    }

    renderBuilding(isoX, isoY, building) {
        const ctx = this.ctx;
        const size = this.grid.tileSize;

        // Base du bâtiment
        ctx.fillStyle = building.color || '#8B4513';

        // Murs avant et côté (effet 3D)
        const height = building.height || size;

        // Mur gauche
        ctx.beginPath();
        ctx.moveTo(isoX - size / 2, isoY + size / 4);
        ctx.lineTo(isoX - size / 2, isoY + size / 4 - height);
        ctx.lineTo(isoX, isoY - height);
        ctx.lineTo(isoX, isoY);
        ctx.closePath();
        ctx.fillStyle = building.color || '#8B4513';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();

        // Mur droit
        ctx.beginPath();
        ctx.moveTo(isoX + size / 2, isoY + size / 4);
        ctx.lineTo(isoX + size / 2, isoY + size / 4 - height);
        ctx.lineTo(isoX, isoY - height);
        ctx.lineTo(isoX, isoY);
        ctx.closePath();
        ctx.fillStyle = building.colorDark || '#6B3513';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();

        // Toit
        ctx.beginPath();
        ctx.moveTo(isoX, isoY - height);
        ctx.lineTo(isoX + size / 2, isoY + size / 4 - height);
        ctx.lineTo(isoX, isoY + size / 2 - height);
        ctx.lineTo(isoX - size / 2, isoY + size / 4 - height);
        ctx.closePath();
        ctx.fillStyle = building.roofColor || '#CD853F';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.stroke();

        // Icône/Emoji du bâtiment
        if (building.emoji) {
            ctx.font = `${size * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(building.emoji, isoX, isoY - height / 2);
        }
    }

    renderScenery(isoX, isoY, item) {
        const ctx = this.ctx;
        const size = this.grid.tileSize;

        ctx.font = `${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(item.emoji || '🌳', isoX, isoY);
    }

    // Highlight de la tuile survolée
    highlightTile(gridX, gridY, color = 'rgba(52, 152, 219, 0.5)') {
        if (!this.grid.isValid(gridX, gridY)) return;

        const iso = this.grid.gridToIso(gridX, gridY);
        const size = this.grid.tileSize;

        this.camera.apply(this.ctx);

        this.ctx.beginPath();
        this.ctx.moveTo(iso.x, iso.y);
        this.ctx.lineTo(iso.x + size / 2, iso.y + size / 4);
        this.ctx.lineTo(iso.x, iso.y + size / 2);
        this.ctx.lineTo(iso.x - size / 2, iso.y + size / 4);
        this.ctx.closePath();

        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#3498db';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.camera.restore(this.ctx);
    }
}
