// Système de visiteurs avec pathfinding
class Visitor {
    constructor(scene, gridSize, cellSize) {
        this.mesh = this.createVisitorMesh();
        this.position = { x: 0, z: 0 };
        this.target = null;
        this.path = [];
        this.speed = 0.05 + Math.random() * 0.03;
        this.needs = {
            hunger: 100,
            bathroom: 100,
            entertainment: 100
        };
        this.money = 50 + Math.random() * 100;
        this.satisfaction = 100;
        this.visitedEnclosures = new Set();
        this.state = 'exploring'; // exploring, eating, bathroom, leaving
        this.stateTimer = 0;

        scene.add(this.mesh);
    }

    createVisitorMesh() {
        const group = new THREE.Group();

        // Corps
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 8);
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A, 0x98D8C8];
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: colors[Math.floor(Math.random() * colors.length)]
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        group.add(body);

        // Tête
        const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.2;
        head.castShadow = true;
        group.add(head);

        // Chapeau aléatoire
        if (Math.random() > 0.5) {
            const hatGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.3, 8);
            const hatMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const hat = new THREE.Mesh(hatGeometry, hatMaterial);
            hat.position.y = 1.5;
            group.add(hat);
        }

        return group;
    }

    update(gameState, grid, GRID_SIZE, CELL_SIZE) {
        this.stateTimer++;

        // Diminuer les besoins
        this.needs.hunger = Math.max(0, this.needs.hunger - 0.05);
        this.needs.bathroom = Math.max(0, this.needs.bathroom - 0.03);
        this.needs.entertainment = Math.max(0, this.needs.entertainment - 0.02);

        // Décider de l'action selon les besoins
        if (this.needs.hunger < 30 && this.state !== 'eating') {
            this.findNearestBuilding(grid, GRID_SIZE, CELL_SIZE, 'shop');
            this.state = 'eating';
        } else if (this.needs.bathroom < 20 && this.state !== 'bathroom') {
            this.findNearestBuilding(grid, GRID_SIZE, CELL_SIZE, 'toilet');
            this.state = 'bathroom';
        } else if (this.state === 'exploring' && this.stateTimer > 200) {
            this.findRandomEnclosure(grid, GRID_SIZE, CELL_SIZE);
            this.stateTimer = 0;
        }

        // Suivre le chemin
        if (this.path.length > 0) {
            const nextPoint = this.path[0];
            const dx = nextPoint.x - this.mesh.position.x;
            const dz = nextPoint.z - this.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 0.3) {
                this.path.shift();
                if (this.path.length === 0) {
                    this.onReachDestination(gameState);
                }
            } else {
                this.mesh.position.x += (dx / distance) * this.speed;
                this.mesh.position.z += (dz / distance) * this.speed;
                this.mesh.rotation.y = Math.atan2(dx, dz);
            }
        }

        // Calculer satisfaction
        this.satisfaction = (this.needs.hunger + this.needs.bathroom + this.needs.entertainment) / 3;

        // Partir si insatisfait
        if (this.satisfaction < 20 || this.money < 0) {
            this.state = 'leaving';
            return false;
        }

        return true;
    }

    findNearestBuilding(grid, GRID_SIZE, CELL_SIZE, buildingType) {
        let nearest = null;
        let minDist = Infinity;

        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if (grid[x][z].type === buildingType) {
                    const worldX = (x - GRID_SIZE / 2) * CELL_SIZE;
                    const worldZ = (z - GRID_SIZE / 2) * CELL_SIZE;
                    const dist = Math.sqrt(
                        Math.pow(worldX - this.mesh.position.x, 2) +
                        Math.pow(worldZ - this.mesh.position.z, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = { x: worldX, z: worldZ };
                    }
                }
            }
        }

        if (nearest) {
            this.path = [nearest];
        }
    }

    findRandomEnclosure(grid, GRID_SIZE, CELL_SIZE) {
        const enclosures = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                if (grid[x][z].type === 'enclosure') {
                    enclosures.push({ x, z });
                }
            }
        }

        if (enclosures.length > 0) {
            const randomEnclosure = enclosures[Math.floor(Math.random() * enclosures.length)];
            const worldX = (randomEnclosure.x - GRID_SIZE / 2) * CELL_SIZE;
            const worldZ = (randomEnclosure.z - GRID_SIZE / 2) * CELL_SIZE;
            this.path = [{ x: worldX, z: worldZ }];
        }
    }

    onReachDestination(gameState) {
        if (this.state === 'eating') {
            this.needs.hunger = 100;
            this.money -= 10;
            gameState.money += 10;
            this.state = 'exploring';
            this.stateTimer = 0;
        } else if (this.state === 'bathroom') {
            this.needs.bathroom = 100;
            this.money -= 2;
            gameState.money += 2;
            this.state = 'exploring';
            this.stateTimer = 0;
        } else if (this.state === 'exploring') {
            this.needs.entertainment += 20;
            this.money -= 5;
            gameState.money += 5;
        }
    }

    remove(scene) {
        scene.remove(this.mesh);
    }
}

// Gestionnaire de visiteurs
class VisitorManager {
    constructor(scene, grid, GRID_SIZE, CELL_SIZE) {
        this.scene = scene;
        this.grid = grid;
        this.GRID_SIZE = GRID_SIZE;
        this.CELL_SIZE = CELL_SIZE;
        this.visitors = [];
        this.spawnTimer = 0;
        this.maxVisitors = 50;
    }

    update(gameState) {
        this.spawnTimer++;

        // Générer de nouveaux visiteurs
        if (this.spawnTimer > 100 && this.visitors.length < this.maxVisitors) {
            const attractiveness = gameState.animals.length * 5 +
                                 gameState.buildings.filter(b => b.type === 'shop').length * 10;

            if (Math.random() * 100 < attractiveness) {
                const visitor = new Visitor(this.scene, this.GRID_SIZE, this.CELL_SIZE);
                // Spawn à l'entrée (centre)
                visitor.mesh.position.set(0, 0, -this.GRID_SIZE * this.CELL_SIZE / 2 + 5);
                visitor.position = { x: 0, z: -this.GRID_SIZE * this.CELL_SIZE / 2 + 5 };
                this.visitors.push(visitor);
                this.spawnTimer = 0;
            }
        }

        // Mettre à jour les visiteurs
        this.visitors = this.visitors.filter(visitor => {
            const shouldStay = visitor.update(gameState, this.grid, this.GRID_SIZE, this.CELL_SIZE);
            if (!shouldStay) {
                visitor.remove(this.scene);
            }
            return shouldStay;
        });

        // Mettre à jour le compteur de visiteurs
        gameState.visitors = this.visitors.length;
    }

    getAverageSatisfaction() {
        if (this.visitors.length === 0) return 100;
        const total = this.visitors.reduce((sum, v) => sum + v.satisfaction, 0);
        return Math.round(total / this.visitors.length);
    }
}
