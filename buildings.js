function createEnclosure(x, z, animalType) {
    const group = new THREE.Group();

    // Sol de l'enclos
    const floorGeometry = new THREE.PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9);
    const floorColors = {
        lion: 0xD2691E,
        elephant: 0x8B7355,
        giraffe: 0xF4A460,
        zebra: 0xDEB887
    };
    const floorMaterial = new THREE.MeshLambertMaterial({
        color: floorColors[animalType] || 0xD2691E
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    floor.receiveShadow = true;
    group.add(floor);

    // Clôtures
    const fenceHeight = 2;
    const fenceMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

    const positions = [
        { x: 0, z: CELL_SIZE * 0.45, rx: 0, w: CELL_SIZE * 0.9 },
        { x: 0, z: -CELL_SIZE * 0.45, rx: 0, w: CELL_SIZE * 0.9 },
        { x: CELL_SIZE * 0.45, z: 0, rx: Math.PI / 2, w: CELL_SIZE * 0.9 },
        { x: -CELL_SIZE * 0.45, z: 0, rx: Math.PI / 2, w: CELL_SIZE * 0.9 }
    ];

    positions.forEach(pos => {
        const fenceGeometry = new THREE.BoxGeometry(pos.w, fenceHeight, 0.1);
        const fence = new THREE.Mesh(fenceGeometry, fenceMaterial);
        fence.position.set(pos.x, fenceHeight / 2, pos.z);
        fence.rotation.y = pos.rx;
        fence.castShadow = true;
        group.add(fence);
    });

    // Point d'eau (bassin)
    const waterGeometry = new THREE.CylinderGeometry(0.6, 0.5, 0.3, 12);
    const waterMaterial = new THREE.MeshLambertMaterial({
        color: 0x4A90E2,
        transparent: true,
        opacity: 0.7
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(-CELL_SIZE * 0.3, 0.15, CELL_SIZE * 0.3);
    water.castShadow = true;
    group.add(water);

    // Ajouter de l'eau animée (surface)
    const waterSurfaceGeometry = new THREE.CircleGeometry(0.6, 16);
    const waterSurfaceMaterial = new THREE.MeshLambertMaterial({
        color: 0x6AB7FF,
        transparent: true,
        opacity: 0.5
    });
    const waterSurface = new THREE.Mesh(waterSurfaceGeometry, waterSurfaceMaterial);
    waterSurface.rotation.x = -Math.PI / 2;
    waterSurface.position.set(-CELL_SIZE * 0.3, 0.3, CELL_SIZE * 0.3);
    group.add(waterSurface);

    // Mangeoire
    const feederBaseGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.8);
    const feederBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const feederBase = new THREE.Mesh(feederBaseGeometry, feederBaseMaterial);
    feederBase.position.set(CELL_SIZE * 0.3, 0.2, CELL_SIZE * 0.3);
    feederBase.castShadow = true;
    group.add(feederBase);

    // Nourriture dans la mangeoire
    const foodGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const foodMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    for (let i = 0; i < 5; i++) {
        const food = new THREE.Mesh(foodGeometry, foodMaterial);
        food.position.set(
            CELL_SIZE * 0.3 + (Math.random() - 0.5) * 0.5,
            0.5 + Math.random() * 0.2,
            CELL_SIZE * 0.3 + (Math.random() - 0.5) * 0.5
        );
        food.castShadow = true;
        group.add(food);
    }

    // Rocher décoratif
    const rockGeometry = new THREE.DodecahedronGeometry(0.4, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(-CELL_SIZE * 0.2, 0.2, -CELL_SIZE * 0.2);
    rock.castShadow = true;
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    group.add(rock);

    // Plante décorative
    const plantTrunkGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.8, 8);
    const plantTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const plantTrunk = new THREE.Mesh(plantTrunkGeometry, plantTrunkMaterial);
    plantTrunk.position.set(0, 0.4, -CELL_SIZE * 0.3);
    group.add(plantTrunk);

    const plantLeavesGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    const plantLeavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const plantLeaves = new THREE.Mesh(plantLeavesGeometry, plantLeavesMaterial);
    plantLeaves.position.set(0, 1, -CELL_SIZE * 0.3);
    group.add(plantLeaves);

    group.position.set(x, 0, z);

    // Stocker les positions des ressources pour les animaux
    group.userData = {
        waterSource: { x: x - CELL_SIZE * 0.3, z: z + CELL_SIZE * 0.3 },
        foodSource: { x: x + CELL_SIZE * 0.3, z: z + CELL_SIZE * 0.3 }
    };

    return group;
}

function createPath(x, z) {
    const geometry = new THREE.PlaneGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95);
    const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const path = new THREE.Mesh(geometry, material);
    path.rotation.x = -Math.PI / 2;
    path.position.set(x, 0.02, z);
    path.receiveShadow = true;
    return path;
}

function createShop(x, z) {
    const group = new THREE.Group();

    // Base
    const baseGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.8, 2, CELL_SIZE * 0.8);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1;
    base.castShadow = true;
    group.add(base);

    // Fenêtre
    const windowGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.05);
    const windowMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(0, 1.2, CELL_SIZE * 0.41);
    group.add(window1);

    // Porte
    const doorGeometry = new THREE.BoxGeometry(0.5, 1, 0.05);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, 0.5, CELL_SIZE * 0.41);
    group.add(door);

    // Toit
    const roofGeometry = new THREE.ConeGeometry(CELL_SIZE * 0.6, 1, 4);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Enseigne
    const signGeometry = new THREE.BoxGeometry(1, 0.3, 0.05);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 2.2, CELL_SIZE * 0.42);
    group.add(sign);

    group.position.set(x, 0, z);
    return group;
}

function createRestaurant(x, z) {
    const group = new THREE.Group();

    // Base du restaurant (plus grande)
    const baseGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.9, 2.5, CELL_SIZE * 0.9);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.25;
    base.castShadow = true;
    group.add(base);

    // Toit plat
    const roofGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.95, 0.2, CELL_SIZE * 0.95);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.6;
    roof.castShadow = true;
    group.add(roof);

    // Tables extérieures
    const tableGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8);
    const tableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);

    for (let i = 0; i < 2; i++) {
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(-0.5 + i, 0.6, CELL_SIZE * 0.5);
        group.add(table);

        const leg = new THREE.Mesh(legGeometry, tableMaterial);
        leg.position.set(-0.5 + i, 0.3, CELL_SIZE * 0.5);
        group.add(leg);
    }

    group.position.set(x, 0, z);
    return group;
}

function createAttraction(x, z) {
    const group = new THREE.Group();

    // Base circulaire
    const baseGeometry = new THREE.CylinderGeometry(CELL_SIZE * 0.4, CELL_SIZE * 0.4, 0.5, 16);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xFF1493 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.25;
    base.castShadow = true;
    group.add(base);

    // Carrousel (structure centrale)
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 2;
    group.add(pole);

    // Toit du carrousel
    const roofGeometry = new THREE.ConeGeometry(CELL_SIZE * 0.5, 1, 16);
    const roofMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 3.5;
    group.add(roof);

    // Sièges du carrousel
    const seatGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(
            Math.cos(angle) * 0.6,
            1,
            Math.sin(angle) * 0.6
        );
        group.add(seat);
    }

    group.position.set(x, 0, z);
    group.userData.rotating = true; // Pour animation
    return group;
}

function createToilet(x, z) {
    const group = new THREE.Group();

    // Base
    const baseGeometry = new THREE.BoxGeometry(CELL_SIZE * 0.7, 1.5, CELL_SIZE * 0.7);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 0.75;
    base.castShadow = true;
    group.add(base);

    // Panneau
    const signGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.1);
    const signMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 1.8, CELL_SIZE * 0.36);
    sign.castShadow = true;
    group.add(sign);

    group.position.set(x, 0, z);
    return group;
}