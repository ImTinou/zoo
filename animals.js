function addAnimalToEnclosure(x, z, animalType) {
    const animal = createAnimal(x, z, animalType);
    scene.add(animal.mesh);
    gameState.animals.push(animal);
}

function createAnimal(x, z, type) {
    const colors = {
        lion: 0xFFD700,
        elephant: 0x808080,
        giraffe: 0xFFD700,
        zebra: 0xFFFFFF
    };

    const sizes = {
        lion: { body: [1, 0.8, 1.5], head: 0.5 },
        elephant: { body: [1.5, 1.5, 2], head: 0.8 },
        giraffe: { body: [0.8, 2, 1], head: 0.4 },
        zebra: { body: [1, 1, 1.5], head: 0.4 }
    };

    const size = sizes[type] || sizes.lion;
    const group = new THREE.Group();

    // Corps
    const bodyGeometry = new THREE.BoxGeometry(...size.body);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: colors[type] });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = size.body[1] / 2;
    body.castShadow = true;
    group.add(body);

    // Tête
    const headGeometry = new THREE.SphereGeometry(size.head, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.set(0, size.body[1] + size.head / 2, size.body[2] / 2 + size.head / 2);
    head.castShadow = true;
    group.add(head);

    // Pattes avec animation
    const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, size.body[1], 8);
    const legPositions = [
        [size.body[0] / 3, 0, size.body[2] / 3],
        [-size.body[0] / 3, 0, size.body[2] / 3],
        [size.body[0] / 3, 0, -size.body[2] / 3],
        [-size.body[0] / 3, 0, -size.body[2] / 3]
    ];

    const legs = [];
    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, bodyMaterial);
        leg.position.set(...pos);
        leg.castShadow = true;
        group.add(leg);
        legs.push(leg);
    });

    // Rayures pour le zèbre
    if (type === 'zebra') {
        for (let i = 0; i < 5; i++) {
            const stripeGeometry = new THREE.BoxGeometry(size.body[0] + 0.1, 0.2, 0.1);
            const stripeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0, size.body[1] / 2, -size.body[2] / 2 + i * 0.3);
            group.add(stripe);
        }
    }

    // Queue pour les animaux
    const tailGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.set(0, size.body[1] / 2, -size.body[2] / 2 - 0.3);
    tail.rotation.x = Math.PI / 4;
    tail.castShadow = true;
    group.add(tail);

    // Oreilles
    const earGeometry = new THREE.SphereGeometry(0.15, 6, 6);
    const leftEar = new THREE.Mesh(earGeometry, bodyMaterial);
    leftEar.position.set(-size.head * 0.6, size.body[1] + size.head, size.body[2] / 2 + size.head / 2);
    leftEar.scale.set(1, 0.5, 0.3);
    group.add(leftEar);

    const rightEar = new THREE.Mesh(earGeometry, bodyMaterial);
    rightEar.position.set(size.head * 0.6, size.body[1] + size.head, size.body[2] / 2 + size.head / 2);
    rightEar.scale.set(1, 0.5, 0.3);
    group.add(rightEar);

    group.position.set(x, 0, z);

    return {
        mesh: group,
        type: type,
        name: generateAnimalName(type),
        enclosureX: Math.floor((x + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE),
        enclosureZ: Math.floor((z + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE),
        targetX: x + (Math.random() - 0.5) * 3,
        targetZ: z + (Math.random() - 0.5) * 3,
        speed: 0.02 + Math.random() * 0.02,
        // Nouveaux besoins
        hunger: 100,
        thirst: 100,
        happiness: 100,
        health: 100,
        energy: 100,
        // État comportemental
        state: 'wandering', // wandering, eating, drinking, sleeping, playing
        stateTimer: 0,
        waterSource: null,
        foodSource: null,
        // Animation
        legs: legs,
        tail: tail,
        animationTime: Math.random() * Math.PI * 2
    };
}

function generateAnimalName(type) {
    const names = {
        lion: ['Simba', 'Nala', 'Mufasa', 'Sarabi', 'Leo'],
        elephant: ['Dumbo', 'Jumbo', 'Ella', 'Trunky', 'Babar'],
        giraffe: ['Geoffrey', 'Melman', 'Stretch', 'Sophie', 'Zarafa'],
        zebra: ['Marty', 'Stripes', 'Ziggy', 'Zara', 'Zulu']
    };
    const typeNames = names[type] || names.lion;
    return typeNames[Math.floor(Math.random() * typeNames.length)];
}

function animateAnimals() {
    gameState.animals.forEach(animal => {
        animal.stateTimer++;
        animal.animationTime += 0.1;

        // Diminuer les besoins au fil du temps
        animal.hunger = Math.max(0, animal.hunger - 0.02);
        animal.thirst = Math.max(0, animal.thirst - 0.03);
        animal.energy = Math.max(0, animal.energy - 0.01);

        // Gestion des états
        if (animal.hunger < 30 && animal.foodSource && animal.state !== 'eating') {
            animal.state = 'eating';
            animal.targetX = animal.foodSource.x;
            animal.targetZ = animal.foodSource.z;
        } else if (animal.thirst < 30 && animal.waterSource && animal.state !== 'drinking') {
            animal.state = 'drinking';
            animal.targetX = animal.waterSource.x;
            animal.targetZ = animal.waterSource.z;
        } else if (animal.energy < 20 && animal.state !== 'sleeping') {
            animal.state = 'sleeping';
            animal.stateTimer = 0;
        } else if (animal.stateTimer > 300 && animal.state === 'wandering') {
            // Changer d'activité aléatoirement
            const activities = ['wandering', 'playing'];
            animal.state = activities[Math.floor(Math.random() * activities.length)];
            animal.stateTimer = 0;
        }

        // Comportement selon l'état
        if (animal.state === 'sleeping') {
            // Animation de sommeil (corps baissé)
            animal.mesh.position.y = Math.sin(animal.animationTime * 0.5) * 0.1;
            animal.energy = Math.min(100, animal.energy + 0.1);
            if (animal.energy > 80) {
                animal.state = 'wandering';
                animal.mesh.position.y = 0;
            }
        } else if (animal.state === 'eating') {
            // Animation de manger
            if (animal.tail) {
                animal.tail.rotation.z = Math.sin(animal.animationTime) * 0.3;
            }
            animal.hunger = Math.min(100, animal.hunger + 0.5);
            if (animal.hunger > 90) {
                animal.state = 'wandering';
                animal.stateTimer = 0;
            }
        } else if (animal.state === 'drinking') {
            animal.thirst = Math.min(100, animal.thirst + 0.5);
            if (animal.thirst > 90) {
                animal.state = 'wandering';
                animal.stateTimer = 0;
            }
        } else if (animal.state === 'playing') {
            // Animation de jeu (sauts)
            animal.mesh.position.y = Math.abs(Math.sin(animal.animationTime * 0.5)) * 0.3;
            animal.happiness = Math.min(100, animal.happiness + 0.1);
            if (animal.stateTimer > 150) {
                animal.state = 'wandering';
                animal.mesh.position.y = 0;
                animal.stateTimer = 0;
            }
        }

        // Déplacement
        const dx = animal.targetX - animal.mesh.position.x;
        const dz = animal.targetZ - animal.mesh.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            // Nouvelle cible aléatoire dans l'enclos
            const enclosureWorldX = (animal.enclosureX - GRID_SIZE / 2) * CELL_SIZE;
            const enclosureWorldZ = (animal.enclosureZ - GRID_SIZE / 2) * CELL_SIZE;
            animal.targetX = enclosureWorldX + (Math.random() - 0.5) * (CELL_SIZE * 0.8);
            animal.targetZ = enclosureWorldZ + (Math.random() - 0.5) * (CELL_SIZE * 0.8);
        } else if (animal.state !== 'sleeping') {
            // Déplacement vers la cible
            animal.mesh.position.x += (dx / distance) * animal.speed;
            animal.mesh.position.z += (dz / distance) * animal.speed;

            // Rotation vers la direction
            animal.mesh.rotation.y = Math.atan2(dx, dz);

            // Animation des pattes pendant la marche
            if (animal.legs) {
                animal.legs.forEach((leg, i) => {
                    const offset = i % 2 === 0 ? 0 : Math.PI;
                    leg.rotation.x = Math.sin(animal.animationTime + offset) * 0.3;
                });
            }

            // Animation de la queue
            if (animal.tail) {
                animal.tail.rotation.z = Math.sin(animal.animationTime * 2) * 0.2;
            }
        }

        // Calculer la santé globale
        animal.health = (animal.hunger + animal.thirst + animal.energy) / 3;
        animal.happiness = Math.max(0, Math.min(100,
            (animal.health + animal.happiness) / 2 - (animal.stateTimer > 500 ? 20 : 0)
        ));
    });
}