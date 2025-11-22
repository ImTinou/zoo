// Minimap System
class Minimap {
    constructor(grid, camera) {
        this.canvas = document.getElementById('minimapCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = grid;
        this.camera = camera;

        this.width = 200;
        this.height = 200;
        this.scale = this.width / grid.width;

        // Setup click interaction
        this.canvas.addEventListener('click', (e) => this.onClick(e));
    }

    update(game) {
        this.clear();
        this.drawTerrain();
        this.drawPaths(game.grid);
        this.drawBuildings(game.zoo.buildings);
        this.drawExhibits(game.zoo.exhibits);
        this.drawVisitors(game.visitorManager ? game.visitorManager.visitors : []);
        this.drawCamera(this.camera);
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawTerrain() {
        this.ctx.fillStyle = '#2d4a2e';
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const tile = this.grid.getTile(x, y);
                if (tile) {
                    const px = x * this.scale;
                    const py = y * this.scale;
                    this.ctx.fillRect(px, py, this.scale, this.scale);
                }
            }
        }
    }

    drawPaths(grid) {
        this.ctx.fillStyle = '#8B7355';
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                if (tile && tile.path) {
                    const px = x * this.scale;
                    const py = y * this.scale;
                    this.ctx.fillRect(px, py, this.scale, this.scale);
                }
            }
        }
    }

    drawBuildings(buildings) {
        buildings.forEach(building => {
            const px = building.x * this.scale;
            const py = building.y * this.scale;

            // Color by type
            const colors = {
                food: '#FF6347',
                drink: '#4169E1',
                restroom: '#9370DB',
                gift: '#FF69B4'
            };

            this.ctx.fillStyle = colors[building.type] || '#8B4513';
            this.ctx.fillRect(px, py, this.scale * 1.5, this.scale * 1.5);
        });
    }

    drawExhibits(exhibits) {
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 1;

        exhibits.forEach(exhibit => {
            const px = exhibit.x * this.scale;
            const py = exhibit.y * this.scale;
            const w = exhibit.width * this.scale;
            const h = exhibit.height * this.scale;

            this.ctx.strokeRect(px, py, w, h);

            // Fill if has animals
            if (exhibit.animals.length > 0) {
                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                this.ctx.fillRect(px, py, w, h);

                // Draw animal dots
                this.ctx.fillStyle = '#FFA500';
                exhibit.animals.forEach(animal => {
                    const ax = animal.x * this.scale;
                    const ay = animal.y * this.scale;
                    this.ctx.beginPath();
                    this.ctx.arc(ax, ay, 1.5, 0, Math.PI * 2);
                    this.ctx.fill();
                });
            }
        });
    }

    drawVisitors(visitors) {
        this.ctx.fillStyle = '#00FF00';
        visitors.forEach(visitor => {
            const vx = visitor.x * this.scale;
            const vy = visitor.y * this.scale;
            this.ctx.fillRect(vx - 0.5, vy - 0.5, 1, 1);
        });
    }

    drawCamera(camera) {
        // Draw viewport rectangle
        const viewSize = 20; // Approximate view size
        const cx = this.grid.width / 2;
        const cy = this.grid.height / 2;

        const px = (cx - viewSize / 2) * this.scale;
        const py = (cy - viewSize / 2) * this.scale;
        const w = viewSize * this.scale;
        const h = viewSize * this.scale;

        this.ctx.strokeStyle = '#0A84FF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px, py, w, h);
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const gridX = Math.floor(x / this.scale);
        const gridY = Math.floor(y / this.scale);

        // Dispatch event to move camera
        const event = new CustomEvent('minimapClick', {
            detail: { gridX, gridY }
        });
        window.dispatchEvent(event);
    }
}
