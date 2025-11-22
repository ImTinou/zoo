// Grid System - Gestion de la grille de construction isométrique
class Grid {
    constructor(width, height, tileSize) {
        this.width = width;
        this.height = height;
        this.tileSize = tileSize;
        this.tiles = [];

        // Initialiser la grille
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                this.tiles[y][x] = {
                    x: x,
                    y: y,
                    terrain: 'grass',
                    occupied: false,
                    building: null,
                    path: null,
                    scenery: [],
                    elevation: 0
                };
            }
        }
    }

    // Convertir coordonnées grille vers isométrique
    gridToIso(gridX, gridY) {
        const isoX = (gridX - gridY) * (this.tileSize / 2);
        const isoY = (gridX + gridY) * (this.tileSize / 4);
        return { x: isoX, y: isoY };
    }

    // Convertir coordonnées écran vers grille
    screenToGrid(screenX, screenY, camera) {
        // Appliquer la transformation de la caméra
        const worldX = screenX - camera.offsetX;
        const worldY = screenY - camera.offsetY;

        // Rotation inverse
        const angle = -camera.rotation * Math.PI / 180;
        const rotatedX = worldX * Math.cos(angle) - worldY * Math.sin(angle);
        const rotatedY = worldX * Math.sin(angle) + worldY * Math.cos(angle);

        // Conversion iso vers grille
        const gridX = Math.floor((rotatedX / (this.tileSize / 2) + rotatedY / (this.tileSize / 4)) / 2);
        const gridY = Math.floor((rotatedY / (this.tileSize / 4) - rotatedX / (this.tileSize / 2)) / 2);

        return { x: gridX, y: gridY };
    }

    // Vérifier si une position est valide
    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Obtenir une tuile
    getTile(x, y) {
        if (!this.isValid(x, y)) return null;
        return this.tiles[y][x];
    }

    // Vérifier si une tuile est libre
    isFree(x, y) {
        const tile = this.getTile(x, y);
        return tile && !tile.occupied;
    }

    // Placer un bâtiment
    placeBuilding(x, y, building) {
        const tile = this.getTile(x, y);
        if (tile && !tile.occupied) {
            tile.occupied = true;
            tile.building = building;
            return true;
        }
        return false;
    }

    // Placer un chemin
    placePath(x, y, material) {
        const tile = this.getTile(x, y);
        if (tile && !tile.building) {
            tile.path = material;
            return true;
        }
        return false;
    }

    // Supprimer un élément
    remove(x, y) {
        const tile = this.getTile(x, y);
        if (tile) {
            tile.occupied = false;
            tile.building = null;
            tile.path = null;
            return true;
        }
        return false;
    }

    // Obtenir les voisins d'une tuile (pour les chemins)
    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            { dx: 0, dy: -1, dir: 'north' },
            { dx: 1, dy: 0, dir: 'east' },
            { dx: 0, dy: 1, dir: 'south' },
            { dx: -1, dy: 0, dir: 'west' }
        ];

        directions.forEach(({ dx, dy, dir }) => {
            const nx = x + dx;
            const ny = y + dy;
            const tile = this.getTile(nx, ny);
            if (tile) {
                neighbors.push({
                    tile: tile,
                    direction: dir,
                    x: nx,
                    y: ny
                });
            }
        });

        return neighbors;
    }

    // Vérifier les connexions de chemins pour affichage correct
    getPathConnections(x, y) {
        const tile = this.getTile(x, y);
        if (!tile || !tile.path) return 0;

        const neighbors = this.getNeighbors(x, y);
        let connections = 0;

        neighbors.forEach((neighbor, index) => {
            if (neighbor.tile.path) {
                connections |= (1 << index); // Bit flag pour chaque direction
            }
        });

        return connections;
    }
}
