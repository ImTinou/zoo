// Advanced 3D Animal Models - Procedural Generation
class AnimalModelFactory {
    constructor() {
        this.materials = this.createMaterials();
    }

    createMaterials() {
        return {
            // Savanna colors
            lionBody: new THREE.MeshLambertMaterial({ color: 0xC19A6B }),
            lionMane: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
            elephant: new THREE.MeshLambertMaterial({ color: 0x696969 }),
            giraffe: new THREE.MeshLambertMaterial({ color: 0xDAA520 }),
            zebra: new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
            rhino: new THREE.MeshLambertMaterial({ color: 0x696969 }),

            // Arctic colors
            polarBear: new THREE.MeshLambertMaterial({ color: 0xFFFAFA }),
            penguin: new THREE.MeshLambertMaterial({ color: 0x000000 }),
            penguinBelly: new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
            arcticFox: new THREE.MeshLambertMaterial({ color: 0xF5F5F5 }),
            walrus: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),

            // Jungle colors
            panda: new THREE.MeshLambertMaterial({ color: 0xFFFFFF }),
            pandaBlack: new THREE.MeshLambertMaterial({ color: 0x000000 }),
            tiger: new THREE.MeshLambertMaterial({ color: 0xFF8C00 }),
            tigerStripes: new THREE.MeshLambertMaterial({ color: 0x000000 }),
            gorilla: new THREE.MeshLambertMaterial({ color: 0x2F4F4F }),
            parrot: new THREE.MeshLambertMaterial({ color: 0xFF0000 }),
            sloth: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
            crocodile: new THREE.MeshLambertMaterial({ color: 0x228B22 }),

            // Desert colors
            camel: new THREE.MeshLambertMaterial({ color: 0xD2B48C }),
            meerkat: new THREE.MeshLambertMaterial({ color: 0xC19A6B }),
            snake: new THREE.MeshLambertMaterial({ color: 0x8B7355 }),
            scorpion: new THREE.MeshLambertMaterial({ color: 0x654321 }),

            // Aquatic colors
            seal: new THREE.MeshLambertMaterial({ color: 0x708090 }),
            otter: new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
            turtle: new THREE.MeshLambertMaterial({ color: 0x2E8B57 }),
            turtleShell: new THREE.MeshLambertMaterial({ color: 0x556B2F }),

            // Common parts
            eye: new THREE.MeshLambertMaterial({ color: 0x000000 }),
            nose: new THREE.MeshLambertMaterial({ color: 0x000000 }),
            white: new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        };
    }

    // SAVANNA ANIMALS
    createLion() {
        const group = new THREE.Group();

        // Body
        const bodyGeom = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8);
        const body = new THREE.Mesh(bodyGeom, this.materials.lionBody);
        body.position.y = 0.6;
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.35, 8, 8);
        const head = new THREE.Mesh(headGeom, this.materials.lionBody);
        head.position.set(0.6, 0.7, 0);
        head.castShadow = true;
        group.add(head);

        // Mane
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const maneGeom = new THREE.SphereGeometry(0.15, 6, 6);
            const manePart = new THREE.Mesh(maneGeom, this.materials.lionMane);
            manePart.position.set(
                0.6 + Math.cos(angle) * 0.35,
                0.7 + Math.sin(angle) * 0.2,
                Math.sin(angle) * 0.35
            );
            manePart.castShadow = true;
            group.add(manePart);
        }

        // Snout
        const snoutGeom = new THREE.BoxGeometry(0.25, 0.15, 0.15);
        const snout = new THREE.Mesh(snoutGeom, this.materials.lionBody);
        snout.position.set(0.85, 0.65, 0);
        snout.castShadow = true;
        group.add(snout);

        // Eyes
        [0.15, -0.15].forEach(z => {
            const eyeGeom = new THREE.SphereGeometry(0.05, 6, 6);
            const eye = new THREE.Mesh(eyeGeom, this.materials.eye);
            eye.position.set(0.75, 0.78, z);
            group.add(eye);
        });

        // Legs
        const legPositions = [
            [0.3, 0, 0.25], [0.3, 0, -0.25],
            [-0.2, 0, 0.25], [-0.2, 0, -0.25]
        ];
        legPositions.forEach(pos => {
            const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
            const leg = new THREE.Mesh(legGeom, this.materials.lionBody);
            leg.position.set(pos[0], pos[1] + 0.3, pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });

        // Tail
        const tailGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.7, 6);
        const tail = new THREE.Mesh(tailGeom, this.materials.lionBody);
        tail.position.set(-0.5, 0.5, 0);
        tail.rotation.z = Math.PI / 4;
        tail.castShadow = true;
        group.add(tail);

        // Tail tip
        const tailTipGeom = new THREE.SphereGeometry(0.1, 6, 6);
        const tailTip = new THREE.Mesh(tailTipGeom, this.materials.lionMane);
        tailTip.position.set(-0.85, 0.3, 0);
        tailTip.castShadow = true;
        group.add(tailTip);

        return group;
    }

    createElephant() {
        const group = new THREE.Group();

        // Body - large barrel
        const bodyGeom = new THREE.CylinderGeometry(0.7, 0.8, 1.2, 8);
        const body = new THREE.Mesh(bodyGeom, this.materials.elephant);
        body.position.y = 1.0;
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.6, 8, 8);
        const head = new THREE.Mesh(headGeom, this.materials.elephant);
        head.position.set(0.9, 1.3, 0);
        head.scale.set(1, 0.9, 0.8);
        head.castShadow = true;
        group.add(head);

        // Trunk - segmented
        for (let i = 0; i < 8; i++) {
            const trunkGeom = new THREE.CylinderGeometry(
                0.15 - i * 0.015,
                0.15 - (i + 1) * 0.015,
                0.2, 8
            );
            const trunkSeg = new THREE.Mesh(trunkGeom, this.materials.elephant);
            trunkSeg.position.set(
                1.3 + i * 0.1,
                1.1 - i * 0.15,
                0
            );
            trunkSeg.rotation.z = -Math.PI / 6 - i * 0.1;
            trunkSeg.castShadow = true;
            group.add(trunkSeg);
        }

        // Ears - large flat discs
        [-0.5, 0.5].forEach(z => {
            const earGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 8);
            const ear = new THREE.Mesh(earGeom, this.materials.elephant);
            ear.position.set(0.6, 1.5, z);
            ear.rotation.z = Math.PI / 2;
            ear.rotation.y = z > 0 ? Math.PI / 6 : -Math.PI / 6;
            ear.castShadow = true;
            group.add(ear);
        });

        // Tusks
        [-0.2, 0.2].forEach(z => {
            const tuskGeom = new THREE.CylinderGeometry(0.04, 0.06, 0.6, 6);
            const tusk = new THREE.Mesh(tuskGeom, this.materials.white);
            tusk.position.set(1.3, 1.0, z);
            tusk.rotation.z = -Math.PI / 3;
            tusk.rotation.x = z * Math.PI / 6;
            tusk.castShadow = true;
            group.add(tusk);
        });

        // Legs - thick pillars
        const legPositions = [
            [0.4, 0, 0.4], [0.4, 0, -0.4],
            [-0.3, 0, 0.4], [-0.3, 0, -0.4]
        ];
        legPositions.forEach(pos => {
            const legGeom = new THREE.CylinderGeometry(0.18, 0.2, 1.0, 8);
            const leg = new THREE.Mesh(legGeom, this.materials.elephant);
            leg.position.set(pos[0], pos[1] + 0.5, pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });

        // Tail
        const tailGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.8, 6);
        const tail = new THREE.Mesh(tailGeom, this.materials.elephant);
        tail.position.set(-0.8, 0.8, 0);
        tail.rotation.z = Math.PI / 6;
        tail.castShadow = true;
        group.add(tail);

        return group;
    }

    createPenguin() {
        const group = new THREE.Group();

        // Body - black oval
        const bodyGeom = new THREE.SphereGeometry(0.25, 8, 8);
        const body = new THREE.Mesh(bodyGeom, this.materials.penguin);
        body.position.y = 0.35;
        body.scale.set(1, 1.3, 0.9);
        body.castShadow = true;
        group.add(body);

        // Belly - white oval
        const bellyGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const belly = new THREE.Mesh(bellyGeom, this.materials.penguinBelly);
        belly.position.set(0.15, 0.35, 0);
        belly.scale.set(0.8, 1.2, 0.85);
        group.add(belly);

        // Head
        const headGeom = new THREE.SphereGeometry(0.15, 8, 8);
        const head = new THREE.Mesh(headGeom, this.materials.penguin);
        head.position.set(0, 0.65, 0);
        head.castShadow = true;
        group.add(head);

        // Beak
        const beakGeom = new THREE.ConeGeometry(0.05, 0.12, 4);
        const beak = new THREE.Mesh(beakGeom, new THREE.MeshLambertMaterial({ color: 0xFFA500 }));
        beak.position.set(0.12, 0.65, 0);
        beak.rotation.z = -Math.PI / 2;
        group.add(beak);

        // Eyes
        [-0.06, 0.06].forEach(z => {
            const eyeGeom = new THREE.SphereGeometry(0.03, 6, 6);
            const eye = new THREE.Mesh(eyeGeom, this.materials.white);
            eye.position.set(0.08, 0.7, z);
            group.add(eye);

            const pupilGeom = new THREE.SphereGeometry(0.015, 6, 6);
            const pupil = new THREE.Mesh(pupilGeom, this.materials.eye);
            pupil.position.set(0.1, 0.7, z);
            group.add(pupil);
        });

        // Flippers
        [-0.2, 0.2].forEach(z => {
            const flipperGeom = new THREE.BoxGeometry(0.08, 0.35, 0.05);
            const flipper = new THREE.Mesh(flipperGeom, this.materials.penguin);
            flipper.position.set(0, 0.35, z);
            flipper.rotation.x = Math.PI / 6;
            flipper.castShadow = true;
            group.add(flipper);
        });

        // Feet
        [-0.1, 0.1].forEach(z => {
            const footGeom = new THREE.BoxGeometry(0.12, 0.02, 0.15);
            const foot = new THREE.Mesh(footGeom, new THREE.MeshLambertMaterial({ color: 0xFFA500 }));
            foot.position.set(0.08, 0.01, z);
            group.add(foot);
        });

        return group;
    }

    createPanda() {
        const group = new THREE.Group();

        // Body - white with black patches
        const bodyGeom = new THREE.SphereGeometry(0.4, 8, 8);
        const body = new THREE.Mesh(bodyGeom, this.materials.panda);
        body.position.y = 0.5;
        body.scale.set(1.2, 1, 1);
        body.castShadow = true;
        group.add(body);

        // Head
        const headGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const head = new THREE.Mesh(headGeom, this.materials.panda);
        head.position.set(0, 0.85, 0);
        head.castShadow = true;
        group.add(head);

        // Black ears
        [-0.2, 0.2].forEach(z => {
            const earGeom = new THREE.SphereGeometry(0.12, 6, 6);
            const ear = new THREE.Mesh(earGeom, this.materials.pandaBlack);
            ear.position.set(-0.05, 1.05, z);
            ear.castShadow = true;
            group.add(ear);
        });

        // Eye patches
        [-0.12, 0.12].forEach(z => {
            const patchGeom = new THREE.SphereGeometry(0.1, 8, 8);
            const patch = new THREE.Mesh(patchGeom, this.materials.pandaBlack);
            patch.position.set(0.15, 0.9, z);
            patch.scale.set(1, 0.8, 0.7);
            group.add(patch);

            // White eyes in patches
            const eyeGeom = new THREE.SphereGeometry(0.04, 6, 6);
            const eye = new THREE.Mesh(eyeGeom, this.materials.white);
            eye.position.set(0.2, 0.9, z);
            group.add(eye);

            // Pupils
            const pupilGeom = new THREE.SphereGeometry(0.02, 4, 4);
            const pupil = new THREE.Mesh(pupilGeom, this.materials.eye);
            pupil.position.set(0.22, 0.9, z);
            group.add(pupil);
        });

        // Snout
        const snoutGeom = new THREE.SphereGeometry(0.12, 8, 8);
        const snout = new THREE.Mesh(snoutGeom, this.materials.panda);
        snout.position.set(0.25, 0.8, 0);
        snout.scale.set(0.8, 0.6, 0.8);
        group.add(snout);

        // Nose
        const noseGeom = new THREE.SphereGeometry(0.04, 6, 6);
        const nose = new THREE.Mesh(noseGeom, this.materials.pandaBlack);
        nose.position.set(0.32, 0.8, 0);
        group.add(nose);

        // Legs - black
        const legPositions = [
            [0.25, 0, 0.25], [0.25, 0, -0.25],
            [-0.15, 0, 0.25], [-0.15, 0, -0.25]
        ];
        legPositions.forEach(pos => {
            const legGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 6);
            const leg = new THREE.Mesh(legGeom, this.materials.pandaBlack);
            leg.position.set(pos[0], pos[1] + 0.25, pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });

        return group;
    }

    createTiger() {
        const group = new THREE.Group();

        // Body
        const bodyGeom = new THREE.CylinderGeometry(0.45, 0.5, 0.9, 8);
        const body = new THREE.Mesh(bodyGeom, this.materials.tiger);
        body.position.y = 0.65;
        body.rotation.z = Math.PI / 2;
        body.castShadow = true;
        group.add(body);

        // Stripes on body
        for (let i = 0; i < 6; i++) {
            const stripeGeom = new THREE.BoxGeometry(0.05, 0.6, 0.9);
            const stripe = new THREE.Mesh(stripeGeom, this.materials.tigerStripes);
            stripe.position.set(-0.3 + i * 0.15, 0.65, 0);
            stripe.rotation.y = Math.sin(i) * 0.2;
            group.add(stripe);
        }

        // Head
        const headGeom = new THREE.BoxGeometry(0.35, 0.3, 0.35);
        const head = new THREE.Mesh(headGeom, this.materials.tiger);
        head.position.set(0.65, 0.75, 0);
        head.castShadow = true;
        group.add(head);

        // Ears
        [-0.15, 0.15].forEach(z => {
            const earGeom = new THREE.ConeGeometry(0.08, 0.15, 4);
            const ear = new THREE.Mesh(earGeom, this.materials.tiger);
            ear.position.set(0.55, 0.95, z);
            ear.castShadow = true;
            group.add(ear);
        });

        // Eyes
        [-0.1, 0.1].forEach(z => {
            const eyeGeom = new THREE.SphereGeometry(0.05, 6, 6);
            const eye = new THREE.Mesh(eyeGeom, this.materials.eye);
            eye.position.set(0.82, 0.8, z);
            group.add(eye);
        });

        // Snout
        const snoutGeom = new THREE.BoxGeometry(0.18, 0.12, 0.2);
        const snout = new THREE.Mesh(snoutGeom, this.materials.tiger);
        snout.position.set(0.88, 0.68, 0);
        group.add(snout);

        // Whiskers
        [-0.12, 0, 0.12].forEach(z => {
            [-1, 1].forEach(side => {
                const whiskerGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.25, 4);
                const whisker = new THREE.Mesh(whiskerGeom, this.materials.eye);
                whisker.position.set(0.95, 0.68, z * side);
                whisker.rotation.z = Math.PI / 2;
                whisker.rotation.y = side * Math.PI / 6;
                group.add(whisker);
            });
        });

        // Legs
        const legPositions = [
            [0.35, 0, 0.28], [0.35, 0, -0.28],
            [-0.25, 0, 0.28], [-0.25, 0, -0.28]
        ];
        legPositions.forEach(pos => {
            const legGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.65, 6);
            const leg = new THREE.Mesh(legGeom, this.materials.tiger);
            leg.position.set(pos[0], pos[1] + 0.325, pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });

        // Tail - long and striped
        for (let i = 0; i < 6; i++) {
            const tailGeom = new THREE.CylinderGeometry(0.06 - i * 0.008, 0.06 - (i + 1) * 0.008, 0.2, 6);
            const tailSeg = new THREE.Mesh(tailSeg, i % 2 === 0 ? this.materials.tiger : this.materials.tigerStripes);
            tailSeg.position.set(-0.6 - i * 0.15, 0.5 + i * 0.05, 0);
            tailSeg.rotation.z = Math.PI / 8 + i * 0.1;
            tailSeg.castShadow = true;
            group.add(tailSeg);
        }

        return group;
    }

    // Method to create any animal by species name
    createAnimal(species) {
        const creators = {
            lion: () => this.createLion(),
            elephant: () => this.createElephant(),
            penguin: () => this.createPenguin(),
            panda: () => this.createPanda(),
            tiger: () => this.createTiger(),
            // Add more as needed - for now, fallback to simple models
        };

        return creators[species] ? creators[species]() : this.createSimpleAnimal(species);
    }

    // Fallback for animals without detailed models yet
    createSimpleAnimal(species) {
        const group = new THREE.Group();
        const spec = AnimalSpecies[species];

        // Get size from renderer3d sizes
        const sizes = {
            giraffe: { body: 0.7, height: 2.0 },
            zebra: { body: 0.8, height: 0.7 },
            rhinoceros: { body: 1.0, height: 0.8 },
            polarBear: { body: 1.0, height: 0.8 },
            arcticFox: { body: 0.5, height: 0.4 },
            walrus: { body: 1.1, height: 0.6 },
            gorilla: { body: 0.8, height: 1.2 },
            parrot: { body: 0.2, height: 0.3 },
            sloth: { body: 0.4, height: 0.3 },
            crocodile: { body: 1.2, height: 0.3 },
            camel: { body: 0.9, height: 1.0 },
            meerkat: { body: 0.3, height: 0.4 },
            rattlesnake: { body: 0.8, height: 0.1 },
            scorpion: { body: 0.2, height: 0.1 },
            seal: { body: 0.8, height: 0.4 },
            otter: { body: 0.5, height: 0.3 },
            turtle: { body: 0.6, height: 0.3 }
        };

        const size = sizes[species] || { body: 0.5, height: 0.5 };
        const color = this.getColorForSpecies(species);
        const mat = new THREE.MeshLambertMaterial({ color });

        // Simple body
        const bodyGeom = new THREE.BoxGeometry(size.body, size.height, size.body * 1.2);
        const body = new THREE.Mesh(bodyGeom, mat);
        body.position.y = size.height / 2;
        body.castShadow = true;
        group.add(body);

        // Simple head
        const headGeom = new THREE.SphereGeometry(size.body * 0.4, 8, 8);
        const head = new THREE.Mesh(headGeom, mat);
        head.position.set(size.body * 0.7, size.height * 0.8, 0);
        head.castShadow = true;
        group.add(head);

        return group;
    }

    getColorForSpecies(species) {
        const colors = {
            giraffe: 0xDAA520,
            zebra: 0xFFFFFF,
            rhinoceros: 0x696969,
            polarBear: 0xF0F8FF,
            arcticFox: 0xFFFFFF,
            walrus: 0x8B7355,
            gorilla: 0x2F2F2F,
            parrot: 0xFF0000,
            sloth: 0x8B7355,
            crocodile: 0x228B22,
            camel: 0xD2B48C,
            meerkat: 0xC19A6B,
            rattlesnake: 0x8B7355,
            scorpion: 0x654321,
            seal: 0x708090,
            otter: 0x8B4513,
            turtle: 0x2E8B57
        };
        return colors[species] || 0x8B4513;
    }
}
