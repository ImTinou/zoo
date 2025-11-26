// Park Entrance System
class ParkEntrance {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.ticketPrice = 20;
        this.guestsEntered = 0;
        this.totalRevenue = 0;
        this.isOpen = true;
        this.upgradeLevel = 1; // 1-3
    }

    setTicketPrice(price) {
        this.ticketPrice = Math.max(5, Math.min(100, price));
    }

    upgrade(zoo) {
        const upgradeCosts = {
            2: 5000,  // Entrée améliorée
            3: 15000  // Entrée de luxe
        };

        const nextLevel = this.upgradeLevel + 1;
        if (nextLevel > 3) return false;

        const cost = upgradeCosts[nextLevel];
        if (zoo.spend(cost)) {
            this.upgradeLevel = nextLevel;
            return true;
        }
        return false;
    }

    processGuest() {
        if (!this.isOpen) return 0;
        this.guestsEntered++;
        this.totalRevenue += this.ticketPrice;
        return this.ticketPrice;
    }

    create3DMesh(gridWidth, gridHeight) {
        const group = new THREE.Group();

        // Arche d'entrée
        const archHeight = 5;
        const archWidth = 6;

        // Piliers gauche et droite
        const pillarGeom = new THREE.BoxGeometry(1, archHeight, 1);
        const pillarMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
        leftPillar.position.set(-archWidth/2, archHeight/2, 0);
        leftPillar.castShadow = true;
        group.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeom, pillarMat);
        rightPillar.position.set(archWidth/2, archHeight/2, 0);
        rightPillar.castShadow = true;
        group.add(rightPillar);

        // Linteau supérieur
        const lintelGeom = new THREE.BoxGeometry(archWidth + 1, 0.8, 1);
        const lintelMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        const lintel = new THREE.Mesh(lintelGeom, lintelMat);
        lintel.position.set(0, archHeight, 0);
        lintel.castShadow = true;
        group.add(lintel);

        // Enseigne "ZOO"
        const signGeom = new THREE.BoxGeometry(3, 1, 0.2);
        const signMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(0, archHeight + 1, 0);
        group.add(sign);

        // Guichets selon le niveau
        const boothCount = this.upgradeLevel;
        for (let i = 0; i < boothCount; i++) {
            const boothGeom = new THREE.BoxGeometry(1.5, 2, 1);
            const boothMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
            const booth = new THREE.Mesh(boothGeom, boothMat);
            booth.position.set(-2 + i * 2, 1, -3);
            booth.castShadow = true;
            group.add(booth);

            // Toit du guichet
            const roofGeom = new THREE.BoxGeometry(1.7, 0.3, 1.2);
            const roofMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
            const roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(-2 + i * 2, 2.3, -3);
            roof.castShadow = true;
            group.add(roof);
        }

        // Barrières de file d'attente
        for (let i = 0; i < 4; i++) {
            const barrierGeom = new THREE.BoxGeometry(0.1, 0.8, 2);
            const barrierMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
            const barrier = new THREE.Mesh(barrierGeom, barrierMat);
            barrier.position.set(-3 + i * 1.5, 0.4, -5);
            barrier.castShadow = true;
            group.add(barrier);
        }

        // Panneau de prix
        const priceSignGeom = new THREE.BoxGeometry(1, 1.5, 0.1);
        const priceSignMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        const priceSign = new THREE.Mesh(priceSignGeom, priceSignMat);
        priceSign.position.set(-4, 1.5, -4);
        group.add(priceSign);

        group.position.set(this.x * 2 - gridWidth, 0, this.y * 2 - gridHeight);
        group.userData.entrance = this;

        return group;
    }
}

// Expansion System - Agrandissement du zoo
class ZooExpansion {
    constructor() {
        this.currentSize = 40; // Taille initiale de la grille
        this.maxSize = 100;
        this.expansionCost = 10000;
        this.expansionIncrement = 10; // Ajouter 10x10 à chaque fois
    }

    canExpand() {
        return this.currentSize < this.maxSize;
    }

    getExpansionCost() {
        // Le coût augmente avec chaque expansion
        const expansionCount = (this.currentSize - 40) / this.expansionIncrement;
        return this.expansionCost * Math.pow(1.5, expansionCount);
    }

    expand(zoo, game) {
        if (!this.canExpand()) return false;

        const cost = this.getExpansionCost();
        if (!zoo.spend(cost)) return false;

        // Sauvegarder l'ancienne taille
        const oldSize = this.currentSize;

        // Augmenter la taille de la grille
        this.currentSize += this.expansionIncrement;

        // Recréer la grille avec la nouvelle taille
        const oldGrid = game.grid;
        game.grid = new Grid(this.currentSize, this.currentSize, 2);

        // Copier les données de l'ancienne grille
        for (let y = 0; y < oldGrid.height; y++) {
            for (let x = 0; x < oldGrid.width; x++) {
                const oldTile = oldGrid.getTile(x, y);
                const newTile = game.grid.getTile(x, y);
                if (newTile && oldTile) {
                    Object.assign(newTile, oldTile);
                }
            }
        }

        // Recréer le terrain avec la nouvelle taille
        game.renderer3d.grid = game.grid;
        game.renderer3d.createTerrain();

        // Recréer tous les objets sur la scène avec les nouvelles positions
        this.updateAllObjectPositions(game, oldSize);

        return true;
    }

    updateAllObjectPositions(game, oldSize) {
        const newSize = this.currentSize;
        const scene = game.renderer3d.getScene();

        // Mettre à jour les chemins et bâtiments
        game.renderer3d.objects.forEach((mesh, key) => {
            scene.remove(mesh);
        });
        game.renderer3d.objects.clear();

        // Recréer les chemins
        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                const tile = game.grid.getTile(x, y);
                if (tile && tile.path) {
                    game.renderer3d.addPath(x, y, tile.path.material);
                }
                if (tile && tile.building) {
                    game.renderer3d.addBuilding(tile.building);
                }
            }
        }

        // Mettre à jour l'entrée
        if (game.entranceMesh && game.zoo.entrance) {
            scene.remove(game.entranceMesh);
            game.entranceMesh = game.zoo.entrance.create3DMesh(newSize, newSize);
            scene.add(game.entranceMesh);
        }

        // Mettre à jour les enrichissements
        game.enrichmentMeshes.forEach(mesh => {
            const enrichment = mesh.userData.enrichment;
            if (enrichment) {
                const worldX = enrichment.x * 2 - newSize;
                const worldZ = enrichment.y * 2 - newSize;
                mesh.position.set(worldX, mesh.position.y, worldZ);
            }
        });

        // Recréer les clôtures des exhibits
        game.zoo.exhibits.forEach(exhibit => {
            // Supprimer les anciennes clôtures
            if (exhibit.fenceMeshes) {
                exhibit.fenceMeshes.forEach(mesh => scene.remove(mesh));
            }
            exhibit.fenceMeshes = [];

            // Recréer les clôtures avec les nouvelles positions
            const fenceSpec = game.fenceBuilder.fenceTypes[exhibit.fenceType];
            if (fenceSpec) {
                // Tracer le périmètre de l'exhibit
                for (let x = exhibit.x; x < exhibit.x + exhibit.width; x++) {
                    // Haut et bas
                    const topMesh = game.fenceBuilder.createFenceMesh(x, exhibit.y, 'horizontal', fenceSpec, false);
                    const bottomMesh = game.fenceBuilder.createFenceMesh(x, exhibit.y + exhibit.height - 1, 'horizontal', fenceSpec, false);
                    scene.add(topMesh);
                    scene.add(bottomMesh);
                    exhibit.fenceMeshes.push(topMesh, bottomMesh);
                }
                for (let y = exhibit.y + 1; y < exhibit.y + exhibit.height - 1; y++) {
                    // Gauche et droite
                    const leftMesh = game.fenceBuilder.createFenceMesh(exhibit.x, y, 'vertical', fenceSpec, false);
                    const rightMesh = game.fenceBuilder.createFenceMesh(exhibit.x + exhibit.width - 1, y, 'vertical', fenceSpec, false);
                    scene.add(leftMesh);
                    scene.add(rightMesh);
                    exhibit.fenceMeshes.push(leftMesh, rightMesh);
                }
            }
        });
    }
}
