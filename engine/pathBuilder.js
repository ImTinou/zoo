// Path Builder - Construction de chemins par drag
class PathBuilder {
    constructor(renderer3d, grid) {
        this.renderer3d = renderer3d;
        this.grid = grid;
        this.scene = renderer3d.getScene();

        this.isDrawing = false;
        this.startPos = null;
        this.currentMaterial = 'dirt';
        this.drawnTiles = new Set();
        this.previewMeshes = [];
    }

    startDrawing(gridX, gridY, material) {
        this.isDrawing = true;
        this.startPos = { x: gridX, y: gridY };
        this.currentMaterial = material;
        this.drawnTiles.clear();
        this.clearPreview();

        // Ajouter la première tuile
        this.addTileToPath(gridX, gridY);
    }

    updateDrawing(gridX, gridY) {
        if (!this.isDrawing) return;

        // Tracer une ligne de la position précédente à la position actuelle
        const key = `${gridX},${gridY}`;
        if (!this.drawnTiles.has(key)) {
            this.addTileToPath(gridX, gridY);
        }
    }

    addTileToPath(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        if (this.drawnTiles.has(key)) return;

        const tile = this.grid.getTile(gridX, gridY);
        if (!tile) return;

        // Ne pas dessiner sur des bâtiments ou enclos
        if (tile.building || tile.exhibit) return;

        this.drawnTiles.add(key);

        // Créer le preview
        const cost = PathCosts[this.currentMaterial] || 10;
        const colors = {
            dirt: 0x8B7355,
            asphalt: 0x555555,
            cobblestone: 0x999999
        };

        const geometry = new THREE.PlaneGeometry(1.9, 1.9);
        const material = new THREE.MeshLambertMaterial({
            color: colors[this.currentMaterial] || colors.dirt,
            transparent: true,
            opacity: 0.7
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
            gridX * 2 - this.grid.width,
            0.05,
            gridY * 2 - this.grid.height
        );
        mesh.userData.gridPos = { x: gridX, y: gridY };

        this.previewMeshes.push(mesh);
        this.scene.add(mesh);
    }

    finishDrawing(zoo) {
        if (!this.isDrawing) return null;

        this.isDrawing = false;

        const cost = PathCosts[this.currentMaterial] || 10;
        const totalCost = this.drawnTiles.size * cost;

        // Vérifier le budget
        if (!zoo.canAfford(totalCost)) {
            this.clearPreview();
            this.drawnTiles.clear();
            return { success: false, message: 'Not enough money!', cost: totalCost };
        }

        // Placer tous les chemins
        let placedCount = 0;
        this.drawnTiles.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const tile = this.grid.getTile(x, y);
            if (tile && !tile.building && !tile.exhibit) {
                this.grid.placePath(x, y, this.currentMaterial);
                this.renderer3d.addPath(x, y, this.currentMaterial);
                placedCount++;
            }
        });

        // Nettoyer
        this.clearPreview();
        this.drawnTiles.clear();

        // Dépenser l'argent
        const actualCost = placedCount * cost;
        zoo.spend(actualCost);

        return {
            success: true,
            count: placedCount,
            cost: actualCost
        };
    }

    cancelDrawing() {
        this.isDrawing = false;
        this.startPos = null;
        this.clearPreview();
        this.drawnTiles.clear();
    }

    clearPreview() {
        this.previewMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.previewMeshes = [];
    }

    setMaterial(material) {
        this.currentMaterial = material;
    }
}
