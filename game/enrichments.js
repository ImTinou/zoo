// Enrichments - Objets à placer dans les enclos
class Enrichment {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        const spec = EnrichmentTypes[type];
        this.name = spec.name;
        this.cost = spec.cost;
        this.effect = spec.effect;
    }
}

const EnrichmentTypes = {
    // Eau
    waterPond: {
        name: 'Water Pond',
        cost: 200,
        effect: { water: true, happiness: 15 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Bassin
            const pondGeom = new THREE.CylinderGeometry(1.2, 1, 0.3, 16);
            const pondMat = new THREE.MeshLambertMaterial({
                color: 0x4A90E2,
                transparent: true,
                opacity: 0.8
            });
            const pond = new THREE.Mesh(pondGeom, pondMat);
            pond.position.y = 0.15;
            pond.receiveShadow = true;
            group.add(pond);

            // Surface de l'eau
            const waterGeom = new THREE.CircleGeometry(1.2, 16);
            const waterMat = new THREE.MeshLambertMaterial({
                color: 0x6AB7FF,
                transparent: true,
                opacity: 0.6
            });
            const water = new THREE.Mesh(waterGeom, waterMat);
            water.rotation.x = -Math.PI / 2;
            water.position.y = 0.3;
            group.add(water);

            // Bordure rocheuse
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const rockGeom = new THREE.DodecahedronGeometry(0.2, 0);
                const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const rock = new THREE.Mesh(rockGeom, rockMat);
                rock.position.set(
                    Math.cos(angle) * 1.3,
                    0.1,
                    Math.sin(angle) * 1.3
                );
                rock.castShadow = true;
                group.add(rock);
            }

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    // Arbres
    tree: {
        name: 'Tree',
        cost: 100,
        effect: { shade: true, happiness: 10 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Tronc
            const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 2.5, 8);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.y = 1.25;
            trunk.castShadow = true;
            group.add(trunk);

            // Feuillage
            const leavesGeom = new THREE.SphereGeometry(1.2, 8, 8);
            const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const leaves = new THREE.Mesh(leavesGeom, leavesMat);
            leaves.position.y = 3;
            leaves.castShadow = true;
            group.add(leaves);

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    palmTree: {
        name: 'Palm Tree',
        cost: 150,
        effect: { shade: true, happiness: 12 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Tronc courbé
            const trunkGeom = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
            const trunkMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.y = 1.5;
            trunk.rotation.x = 0.2;
            trunk.castShadow = true;
            group.add(trunk);

            // Palmes
            const palmGeom = new THREE.ConeGeometry(0.8, 1.5, 4);
            const palmMat = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
            for (let i = 0; i < 6; i++) {
                const palm = new THREE.Mesh(palmGeom, palmMat);
                palm.position.set(
                    Math.cos(i * Math.PI / 3) * 0.5,
                    3.2,
                    Math.sin(i * Math.PI / 3) * 0.5
                );
                palm.rotation.z = Math.PI / 4;
                palm.rotation.y = i * Math.PI / 3;
                palm.castShadow = true;
                group.add(palm);
            }

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    // Rochers
    rock: {
        name: 'Rock',
        cost: 75,
        effect: { climbing: true, happiness: 8 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Grand rocher principal
            const rockGeom = new THREE.DodecahedronGeometry(0.8, 0);
            const rockMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const rock = new THREE.Mesh(rockGeom, rockMat);
            rock.position.y = 0.5;
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            group.add(rock);

            // Petits rochers autour
            for (let i = 0; i < 3; i++) {
                const smallRockGeom = new THREE.DodecahedronGeometry(0.3, 0);
                const smallRock = new THREE.Mesh(smallRockGeom, rockMat);
                smallRock.position.set(
                    (Math.random() - 0.5) * 1.5,
                    0.15,
                    (Math.random() - 0.5) * 1.5
                );
                smallRock.rotation.set(Math.random(), Math.random(), Math.random());
                smallRock.castShadow = true;
                group.add(smallRock);
            }

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    rockPile: {
        name: 'Rock Pile',
        cost: 120,
        effect: { climbing: true, shade: true, happiness: 12 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            const rockMat = new THREE.MeshLambertMaterial({ color: 0x696969 });

            // Pile de rochers
            for (let i = 0; i < 5; i++) {
                const size = 0.4 + Math.random() * 0.4;
                const rockGeom = new THREE.DodecahedronGeometry(size, 0);
                const rock = new THREE.Mesh(rockGeom, rockMat);
                rock.position.set(
                    (Math.random() - 0.5) * 1.2,
                    0.3 + i * 0.4,
                    (Math.random() - 0.5) * 1.2
                );
                rock.rotation.set(Math.random(), Math.random(), Math.random());
                rock.castShadow = true;
                group.add(rock);
            }

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    // Abri
    shelter: {
        name: 'Animal Shelter',
        cost: 300,
        effect: { shelter: true, happiness: 20 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Base de l'abri
            const baseGeom = new THREE.BoxGeometry(2, 1.5, 1.5);
            const baseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const base = new THREE.Mesh(baseGeom, baseMat);
            base.position.y = 0.75;
            base.castShadow = true;
            group.add(base);

            // Toit
            const roofGeom = new THREE.CylinderGeometry(0, 1.5, 1, 4);
            const roofMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
            const roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.y = 2;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);

            // Ouverture
            const openingGeom = new THREE.BoxGeometry(1, 1, 0.2);
            const openingMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const opening = new THREE.Mesh(openingGeom, openingMat);
            opening.position.set(0, 0.5, 0.8);
            group.add(opening);

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    // Nourriture
    feeder: {
        name: 'Food Dispenser',
        cost: 150,
        effect: { food: true, happiness: 10 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            // Base du distributeur
            const baseGeom = new THREE.BoxGeometry(0.8, 0.5, 0.8);
            const baseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const base = new THREE.Mesh(baseGeom, baseMat);
            base.position.y = 0.25;
            base.castShadow = true;
            group.add(base);

            // Nourriture visible
            for (let i = 0; i < 4; i++) {
                const foodGeom = new THREE.SphereGeometry(0.1, 6, 6);
                const foodMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                const food = new THREE.Mesh(foodGeom, foodMat);
                food.position.set(
                    (Math.random() - 0.5) * 0.6,
                    0.55,
                    (Math.random() - 0.5) * 0.6
                );
                food.castShadow = true;
                group.add(food);
            }

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    },

    // Jouets
    ball: {
        name: 'Play Ball',
        cost: 80,
        effect: { play: true, happiness: 10 },
        create3DMesh: function(x, y, gridWidth, gridHeight) {
            const group = new THREE.Group();

            const ballGeom = new THREE.SphereGeometry(0.5, 16, 16);
            const ballMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
            const ball = new THREE.Mesh(ballGeom, ballMat);
            ball.position.y = 0.5;
            ball.castShadow = true;
            group.add(ball);

            group.position.set(x * 2 - gridWidth, 0, y * 2 - gridHeight);
            return group;
        }
    }
};
