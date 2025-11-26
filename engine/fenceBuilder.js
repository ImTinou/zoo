// Fence Builder - Système de construction d'enclos par drag
class FenceBuilder {
    constructor(renderer3d, grid) {
        this.renderer3d = renderer3d;
        this.grid = grid;
        this.scene = renderer3d.getScene();

        this.isDrawing = false;
        this.startPos = null;
        this.currentFenceType = 'wood';
        this.previewMeshes = [];

        this.fenceTypes = {
            wood: {
                name: 'Wooden Fence',
                cost: 50,
                color: 0x8B4513,
                height: 1.5
            },
            metal: {
                name: 'Metal Fence',
                cost: 100,
                color: 0x708090,
                height: 2.0
            },
            glass: {
                name: 'Glass Fence',
                cost: 150,
                color: 0x87CEEB,
                height: 2.5,
                transparent: true
            },
            moat: {
                name: 'Moat',
                cost: 200,
                color: 0x4A90E2,
                height: 0.5,
                isMoat: true
            }
        };
    }

    startDrawing(gridX, gridY) {
        this.isDrawing = true;
        this.startPos = { x: gridX, y: gridY };
        this.clearPreview();
    }

    updateDrawing(gridX, gridY) {
        if (!this.isDrawing || !this.startPos) return;

        this.clearPreview();

        // Calculer le rectangle
        const minX = Math.min(this.startPos.x, gridX);
        const maxX = Math.max(this.startPos.x, gridX);
        const minY = Math.min(this.startPos.y, gridY);
        const maxY = Math.max(this.startPos.y, gridY);

        // Créer preview des clôtures
        this.createFencePreview(minX, maxX, minY, maxY);
    }

    createFencePreview(minX, maxX, minY, maxY) {
        const spec = this.fenceTypes[this.currentFenceType];

        // Tracer le périmètre
        for (let x = minX; x <= maxX; x++) {
            // Haut et bas
            this.addPreviewFence(x, minY, 'horizontal', spec);
            if (minY !== maxY) {
                this.addPreviewFence(x, maxY, 'horizontal', spec);
            }
        }

        for (let y = minY + 1; y < maxY; y++) {
            // Gauche et droite
            this.addPreviewFence(minX, y, 'vertical', spec);
            if (minX !== maxX) {
                this.addPreviewFence(maxX, y, 'vertical', spec);
            }
        }
    }

    addPreviewFence(x, y, orientation, spec) {
        const mesh = this.createFenceMesh(x, y, orientation, spec, true);
        this.previewMeshes.push(mesh);
        this.scene.add(mesh);
    }

    createFenceMesh(x, y, orientation, spec, isPreview = false) {
        const group = new THREE.Group();

        if (spec.isMoat) {
            // Créer un fossé (creux dans le sol)
            const geometry = new THREE.BoxGeometry(
                orientation === 'horizontal' ? 2 : 0.5,
                spec.height,
                orientation === 'vertical' ? 2 : 0.5
            );
            const material = new THREE.MeshLambertMaterial({
                color: spec.color,
                transparent: isPreview,
                opacity: isPreview ? 0.5 : 0.8
            });
            const moat = new THREE.Mesh(geometry, material);
            moat.position.y = -spec.height / 2;
            group.add(moat);
        } else {
            // Poteaux
            const postGeom = new THREE.CylinderGeometry(0.1, 0.1, spec.height, 6);
            const isTransparent = isPreview || (spec.transparent === true);
            const postMat = new THREE.MeshLambertMaterial({
                color: spec.color,
                transparent: isTransparent,
                opacity: isPreview ? 0.5 : (spec.transparent ? 0.7 : 1)
            });

            const post1 = new THREE.Mesh(postGeom, postMat);
            post1.position.set(-0.9, spec.height / 2, 0);
            post1.castShadow = true;
            group.add(post1);

            const post2 = new THREE.Mesh(postGeom, postMat);
            post2.position.set(0.9, spec.height / 2, 0);
            post2.castShadow = true;
            group.add(post2);

            // Barres horizontales
            const barGeom = new THREE.BoxGeometry(1.8, 0.1, 0.1);
            const barMat = new THREE.MeshLambertMaterial({
                color: spec.color,
                transparent: isTransparent,
                opacity: isPreview ? 0.5 : (spec.transparent ? 0.7 : 1)
            });

            for (let i = 0; i < 3; i++) {
                const bar = new THREE.Mesh(barGeom, barMat);
                bar.position.y = spec.height * (0.3 + i * 0.3);
                bar.castShadow = true;
                group.add(bar);
            }

            // Rotation selon orientation
            if (orientation === 'vertical') {
                group.rotation.y = Math.PI / 2;
            }
        }

        group.position.set(
            x * 2 - this.grid.width,
            0,
            y * 2 - this.grid.height
        );

        return group;
    }

    finishDrawing(gridX, gridY, zoo) {
        if (!this.isDrawing || !this.startPos) return null;

        this.isDrawing = false;

        const minX = Math.min(this.startPos.x, gridX);
        const maxX = Math.max(this.startPos.x, gridX);
        const minY = Math.min(this.startPos.y, gridY);
        const maxY = Math.max(this.startPos.y, gridY);

        // Calculer le coût
        const perimeter = 2 * ((maxX - minX + 1) + (maxY - minY + 1)) - 4;
        const spec = this.fenceTypes[this.currentFenceType];
        const totalCost = perimeter * spec.cost;

        // Vérifier le budget
        if (!zoo.canAfford(totalCost)) {
            this.clearPreview();
            return { success: false, message: 'Not enough money!' };
        }

        // Créer l'enclos
        const exhibit = this.createExhibit(minX, maxX, minY, maxY, zoo);

        // Nettoyer le preview
        this.clearPreview();

        // Dépenser l'argent
        zoo.spend(totalCost);

        return {
            success: true,
            exhibit: exhibit,
            cost: totalCost
        };
    }

    createExhibit(minX, maxX, minY, maxY, zoo) {
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        // Créer l'objet Exhibit
        const exhibit = new Exhibit(minX, minY, width, height);
        exhibit.fenceType = this.currentFenceType;

        const spec = this.fenceTypes[this.currentFenceType];

        // Placer les clôtures
        for (let x = minX; x <= maxX; x++) {
            this.placeFence(x, minY, 'horizontal', spec, exhibit);
            if (minY !== maxY) {
                this.placeFence(x, maxY, 'horizontal', spec, exhibit);
            }
        }

        for (let y = minY + 1; y < maxY; y++) {
            this.placeFence(minX, y, 'vertical', spec, exhibit);
            if (minX !== maxX) {
                this.placeFence(maxX, y, 'vertical', spec, exhibit);
            }
        }

        // Marquer les tuiles intérieures
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const tile = this.grid.getTile(x, y);
                if (tile) {
                    tile.exhibit = exhibit;
                    // Intérieur de l'enclos
                    if (x > minX && x < maxX && y > minY && y < maxY) {
                        tile.terrain = 'grass';
                    }
                }
            }
        }

        zoo.exhibits.push(exhibit);

        return exhibit;
    }

    placeFence(x, y, orientation, spec, exhibit) {
        const mesh = this.createFenceMesh(x, y, orientation, spec, false);
        mesh.userData.fence = true;
        mesh.userData.exhibit = exhibit;
        this.scene.add(mesh);

        // Stocker dans l'exhibit
        if (!exhibit.fenceMeshes) {
            exhibit.fenceMeshes = [];
        }
        exhibit.fenceMeshes.push(mesh);
    }

    clearPreview() {
        this.previewMeshes.forEach(mesh => {
            this.scene.remove(mesh);
        });
        this.previewMeshes = [];
    }

    cancelDrawing() {
        this.isDrawing = false;
        this.startPos = null;
        this.clearPreview();
    }

    setFenceType(type) {
        if (this.fenceTypes[type]) {
            this.currentFenceType = type;
        }
    }

    getFenceTypes() {
        return this.fenceTypes;
    }
}
