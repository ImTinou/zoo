// Types de terrain pour les enclos
const TerrainTypes = {
    grass: {
        name: 'Grass',
        emoji: '🌱',
        cost: 0, // Gratuit (par défaut)
        color: 0x5A9E3F,
        biomes: ['savanna', 'temperate'],
        description: 'Natural grass terrain'
    },
    dirt: {
        name: 'Dirt',
        emoji: '🟫',
        cost: 50,
        color: 0x8B7355,
        biomes: ['savanna', 'temperate', 'desert'],
        description: 'Dry dirt terrain'
    },
    sand: {
        name: 'Sand',
        emoji: '🏜️',
        cost: 100,
        color: 0xF4A460,
        biomes: ['desert'],
        description: 'Sandy desert terrain'
    },
    snow: {
        name: 'Snow',
        emoji: '❄️',
        cost: 150,
        color: 0xF0F8FF,
        biomes: ['arctic'],
        description: 'Snowy icy terrain'
    },
    jungle: {
        name: 'Jungle Floor',
        emoji: '🌿',
        cost: 120,
        color: 0x228B22,
        biomes: ['jungle'],
        description: 'Dense jungle vegetation'
    },
    water: {
        name: 'Water',
        emoji: '💧',
        cost: 200,
        color: 0x4A90E2,
        biomes: ['aquatic'],
        description: 'Water pool for aquatic animals',
        isWater: true
    },
    rock: {
        name: 'Rocky',
        emoji: '🪨',
        cost: 80,
        color: 0x808080,
        biomes: ['arctic', 'desert'],
        description: 'Rocky mountainous terrain'
    },
    mud: {
        name: 'Mud',
        emoji: '🟤',
        cost: 60,
        color: 0x654321,
        biomes: ['jungle', 'temperate'],
        description: 'Muddy wet terrain'
    }
};

// Terrain Manager - Gérer le terrain des enclos
class TerrainManager {
    constructor(renderer3d) {
        this.renderer3d = renderer3d;
        this.scene = renderer3d.getScene();
        this.terrainMeshes = new Map(); // key: "exhibitId_x_y", value: mesh
        this.decorationMeshes = new Map(); // key: "exhibitId_decor_index", value: mesh
    }

    applyTerrainToExhibit(exhibit, terrainType) {
        if (!TerrainTypes[terrainType]) return false;

        const spec = TerrainTypes[terrainType];
        exhibit.terrain = terrainType;

        // Si c'est de l'eau, activer hasWater
        if (spec.isWater) {
            exhibit.hasWater = true;
        }

        // Recréer les meshes de terrain pour l'enclos
        this.updateExhibitTerrain(exhibit);

        // Ajouter des décorations automatiques basées sur le terrain
        this.addTerrainDecorations(exhibit, terrainType);

        return true;
    }

    addTerrainDecorations(exhibit, terrainType) {
        // Supprimer les anciennes décorations
        this.removeExhibitDecorations(exhibit);

        const decorations = this.getDecorationsForTerrain(terrainType);
        if (decorations.length === 0) return;

        const area = (exhibit.width - 2) * (exhibit.height - 2);
        const numDecorations = Math.max(1, Math.floor(area / 6)); // Une décoration tous les 6 tiles

        for (let i = 0; i < numDecorations; i++) {
            const decorType = decorations[Math.floor(Math.random() * decorations.length)];

            // Position aléatoire dans l'enclos (pas sur les bords)
            const x = exhibit.x + 1 + Math.floor(Math.random() * (exhibit.width - 2));
            const y = exhibit.y + 1 + Math.floor(Math.random() * (exhibit.height - 2));

            const mesh = this.createDecorationMesh(decorType, x, y);
            if (mesh) {
                const key = `${exhibit.id}_decor_${i}`;
                this.decorationMeshes.set(key, mesh);
                mesh.userData.isAutoDecoration = true;
                mesh.userData.exhibit = exhibit;
                this.scene.add(mesh);
            }
        }
    }

    getDecorationsForTerrain(terrainType) {
        const decorationMap = {
            grass: ['tree', 'bush', 'rock'],
            dirt: ['bush', 'rock'],
            sand: ['cactus', 'rock', 'dryBush'],
            snow: ['snowPile', 'iceFormation', 'rock'],
            jungle: ['tree', 'bush', 'vine'],
            water: ['lily', 'reed'],
            rock: ['rock', 'boulder', 'stone'],
            mud: ['bush', 'puddle', 'rock']
        };

        return decorationMap[terrainType] || [];
    }

    createDecorationMesh(decorType, x, y) {
        const group = new THREE.Group();
        const gridWidth = this.renderer3d.grid.width;
        const gridHeight = this.renderer3d.grid.height;

        switch (decorType) {
            case 'tree':
                // Arbre simple
                const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 2, 8);
                const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeom, trunkMat);
                trunk.position.y = 1;
                trunk.castShadow = true;
                group.add(trunk);

                const foliageGeom = new THREE.SphereGeometry(0.8, 8, 8);
                const foliageMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const foliage = new THREE.Mesh(foliageGeom, foliageMat);
                foliage.position.y = 2.3;
                foliage.castShadow = true;
                group.add(foliage);
                break;

            case 'bush':
                const bushGeom = new THREE.SphereGeometry(0.4, 8, 6);
                const bushMat = new THREE.MeshLambertMaterial({ color: 0x3A5F0B });
                const bush = new THREE.Mesh(bushGeom, bushMat);
                bush.position.y = 0.3;
                bush.scale.set(1, 0.7, 1);
                bush.castShadow = true;
                group.add(bush);
                break;

            case 'rock':
                const rockGeom = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2, 0);
                const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const rock = new THREE.Mesh(rockGeom, rockMat);
                rock.position.y = 0.2;
                rock.rotation.set(Math.random(), Math.random(), Math.random());
                rock.castShadow = true;
                group.add(rock);
                break;

            case 'cactus':
                const cactusGeom = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
                const cactusMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
                const cactus = new THREE.Mesh(cactusGeom, cactusMat);
                cactus.position.y = 0.75;
                cactus.castShadow = true;
                group.add(cactus);

                // Bras du cactus
                const armGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.6, 6);
                const arm = new THREE.Mesh(armGeom, cactusMat);
                arm.position.set(0.15, 0.6, 0);
                arm.rotation.z = Math.PI / 4;
                arm.castShadow = true;
                group.add(arm);
                break;

            case 'dryBush':
                const dryBushGeom = new THREE.SphereGeometry(0.35, 8, 6);
                const dryBushMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
                const dryBush = new THREE.Mesh(dryBushGeom, dryBushMat);
                dryBush.position.y = 0.25;
                dryBush.scale.set(1, 0.6, 1);
                dryBush.castShadow = true;
                group.add(dryBush);
                break;

            case 'snowPile':
                const snowGeom = new THREE.SphereGeometry(0.5, 8, 6);
                const snowMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
                const snowPile = new THREE.Mesh(snowGeom, snowMat);
                snowPile.position.y = 0.2;
                snowPile.scale.set(1, 0.5, 1);
                snowPile.receiveShadow = true;
                group.add(snowPile);
                break;

            case 'iceFormation':
                const iceGeom = new THREE.ConeGeometry(0.3, 1.2, 6);
                const iceMat = new THREE.MeshLambertMaterial({
                    color: 0xB0E0E6,
                    transparent: true,
                    opacity: 0.8
                });
                const ice = new THREE.Mesh(iceGeom, iceMat);
                ice.position.y = 0.6;
                ice.castShadow = true;
                group.add(ice);
                break;

            case 'vine':
                // Liane simple
                const vineGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
                const vineMat = new THREE.MeshLambertMaterial({ color: 0x355E3B });
                const vine = new THREE.Mesh(vineGeom, vineMat);
                vine.position.y = 0.75;
                vine.rotation.x = Math.PI / 8;
                vine.castShadow = true;
                group.add(vine);
                break;

            case 'lily':
                // Nénuphar
                const lilyGeom = new THREE.CircleGeometry(0.3, 8);
                const lilyMat = new THREE.MeshLambertMaterial({ color: 0x90EE90 });
                const lily = new THREE.Mesh(lilyGeom, lilyMat);
                lily.rotation.x = -Math.PI / 2;
                lily.position.y = 0.01;
                group.add(lily);
                break;

            case 'reed':
                // Roseau
                const reedGeom = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
                const reedMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
                for (let i = 0; i < 3; i++) {
                    const reed = new THREE.Mesh(reedGeom, reedMat);
                    reed.position.set((i - 1) * 0.1, 0.5, 0);
                    reed.castShadow = true;
                    group.add(reed);
                }
                break;

            case 'boulder':
                const boulderGeom = new THREE.DodecahedronGeometry(0.6, 0);
                const boulderMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
                const boulder = new THREE.Mesh(boulderGeom, boulderMat);
                boulder.position.y = 0.4;
                boulder.rotation.set(Math.random(), Math.random(), Math.random());
                boulder.castShadow = true;
                group.add(boulder);
                break;

            case 'stone':
                const stoneGeom = new THREE.BoxGeometry(0.4, 0.3, 0.4);
                const stoneMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
                const stone = new THREE.Mesh(stoneGeom, stoneMat);
                stone.position.y = 0.15;
                stone.rotation.y = Math.random() * Math.PI;
                stone.castShadow = true;
                group.add(stone);
                break;

            case 'puddle':
                const puddleGeom = new THREE.CircleGeometry(0.4, 8);
                const puddleMat = new THREE.MeshLambertMaterial({
                    color: 0x4A90E2,
                    transparent: true,
                    opacity: 0.6
                });
                const puddle = new THREE.Mesh(puddleGeom, puddleMat);
                puddle.rotation.x = -Math.PI / 2;
                puddle.position.y = 0.01;
                group.add(puddle);
                break;

            default:
                return null;
        }

        group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
        return group;
    }

    removeExhibitDecorations(exhibit) {
        const keysToDelete = [];
        this.decorationMeshes.forEach((mesh, key) => {
            if (key.startsWith(`${exhibit.id}_decor_`)) {
                this.scene.remove(mesh);
                keysToDelete.push(key);
            }
        });
        keysToDelete.forEach(key => this.decorationMeshes.delete(key));
    }

    updateExhibitTerrain(exhibit) {
        // Retirer les anciens meshes de terrain pour cet enclos
        this.terrainMeshes.forEach((mesh, key) => {
            if (key.startsWith(`${exhibit.id}_`)) {
                this.scene.remove(mesh);
                this.terrainMeshes.delete(key);
            }
        });

        // Créer de nouveaux meshes
        const spec = TerrainTypes[exhibit.terrain] || TerrainTypes.grass;

        for (let y = exhibit.y; y < exhibit.y + exhibit.height; y++) {
            for (let x = exhibit.x; x < exhibit.x + exhibit.width; x++) {
                // Seulement l'intérieur de l'enclos
                if (x > exhibit.x && x < exhibit.x + exhibit.width - 1 &&
                    y > exhibit.y && y < exhibit.y + exhibit.height - 1) {

                    const mesh = this.createTerrainMesh(x, y, spec, exhibit);
                    if (mesh) {
                        const key = `${exhibit.id}_${x}_${y}`;
                        this.terrainMeshes.set(key, mesh);
                        this.scene.add(mesh);
                    }
                }
            }
        }
    }

    createTerrainMesh(x, y, spec, exhibit) {
        const geometry = new THREE.PlaneGeometry(1.95, 1.95);
        const material = new THREE.MeshLambertMaterial({
            color: spec.color,
            transparent: spec.isWater,
            opacity: spec.isWater ? 0.7 : 1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
            x * 2 - this.renderer3d.grid.width,
            spec.isWater ? -0.2 : 0.01, // Eau légèrement plus basse
            y * 2 - this.renderer3d.grid.height
        );
        mesh.receiveShadow = true;
        mesh.userData.terrain = exhibit.terrain;
        mesh.userData.exhibit = exhibit;

        // Animation de l'eau
        if (spec.isWater) {
            mesh.userData.waterAnimation = {
                time: Math.random() * Math.PI * 2,
                speed: 0.02
            };
        }

        return mesh;
    }

    updateWaterAnimation() {
        // Animer les surfaces d'eau
        this.terrainMeshes.forEach(mesh => {
            if (mesh.userData.waterAnimation) {
                mesh.userData.waterAnimation.time += mesh.userData.waterAnimation.speed;
                mesh.position.y = -0.2 + Math.sin(mesh.userData.waterAnimation.time) * 0.05;
            }
        });
    }

    removeExhibitTerrain(exhibit) {
        this.terrainMeshes.forEach((mesh, key) => {
            if (key.startsWith(`${exhibit.id}_`)) {
                this.scene.remove(mesh);
                this.terrainMeshes.delete(key);
            }
        });

        // Supprimer aussi les décorations
        this.removeExhibitDecorations(exhibit);
    }

    getCostToChange(exhibit, newTerrainType) {
        const spec = TerrainTypes[newTerrainType];
        if (!spec) return 0;

        const area = (exhibit.width - 2) * (exhibit.height - 2); // Seulement l'intérieur
        return spec.cost * area;
    }
}
