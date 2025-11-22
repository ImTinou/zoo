// Renderer 3D with Three.js
class Renderer3D {
    constructor(container, grid, camera3d) {
        this.container = container;
        this.grid = grid;
        this.camera3d = camera3d;

        // Three.js scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Raycaster pour la sélection
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // Lumières
        this.setupLights();

        // Grille
        this.showGrid = true;
        this.gridHelper = null;
        this.createGridHelper();

        // Terrain
        this.terrainMesh = null;
        this.createTerrain();

        // Stocker les objets 3D
        this.objects = new Map(); // key: "x,y", value: mesh

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupLights() {
        // Lumière ambiante
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // Lumière directionnelle (soleil)
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 50, 50);
        sun.castShadow = true;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);
    }

    createGridHelper() {
        if (this.gridHelper) {
            this.scene.remove(this.gridHelper);
        }

        const size = this.grid.width * 2;
        const divisions = this.grid.width;

        this.gridHelper = new THREE.GridHelper(size, divisions, 0x3498db, 0x2c3e50);
        this.gridHelper.position.y = 0.01;
        this.gridHelper.visible = this.showGrid;
        this.scene.add(this.gridHelper);
    }

    createTerrain() {
        // Créer un mesh de terrain avec variation de couleur
        const geometry = new THREE.PlaneGeometry(
            this.grid.width * 2,
            this.grid.height * 2,
            this.grid.width,
            this.grid.height
        );

        // Matériau avec texture procédurale
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Dessiner texture herbe
        for (let y = 0; y < 512; y += 32) {
            for (let x = 0; x < 512; x += 32) {
                const variation = Math.floor(Math.random() * 30);
                ctx.fillStyle = `rgb(${90 + variation}, ${158 + variation}, ${63 + variation})`;
                ctx.fillRect(x, y, 32, 32);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);

        const material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.rotation.x = -Math.PI / 2;
        this.terrainMesh.receiveShadow = true;
        this.scene.add(this.terrainMesh);
    }

    createPathMesh(x, y, material) {
        const geometry = new THREE.PlaneGeometry(1.9, 1.9);

        const colors = {
            dirt: 0x8B7355,
            asphalt: 0x555555,
            cobblestone: 0x999999
        };

        const mat = new THREE.MeshLambertMaterial({
            color: colors[material] || colors.dirt
        });

        const mesh = new THREE.Mesh(geometry, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x * 2 - this.grid.width, 0.02, y * 2 - this.grid.height);
        mesh.receiveShadow = true;

        return mesh;
    }

    createBuildingMesh(building) {
        const group = new THREE.Group();

        const colors = {
            food: 0xFF6347,
            drink: 0x4169E1,
            restroom: 0x9370DB,
            gift: 0xFF69B4
        };

        const height = 3;
        const size = 1.5;

        // Base du bâtiment
        const baseGeom = new THREE.BoxGeometry(size, height, size);
        const baseMat = new THREE.MeshLambertMaterial({
            color: colors[building.type] || 0x8B4513
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = height / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // Toit
        const roofGeom = new THREE.ConeGeometry(size * 0.8, 1, 4);
        const roofMat = new THREE.MeshLambertMaterial({
            color: 0xCD853F
        });
        const roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.y = height + 0.5;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        group.position.set(
            building.x * 2 - this.grid.width,
            0,
            building.y * 2 - this.grid.height
        );

        return group;
    }

    createAnimalMesh(animal) {
        const group = new THREE.Group();

        const sizes = {
            // Savanna
            lion: { body: 0.8, height: 0.6 },
            elephant: { body: 1.2, height: 1.5 },
            giraffe: { body: 0.7, height: 2.0 },
            zebra: { body: 0.8, height: 0.7 },
            rhinoceros: { body: 1.0, height: 0.8 },
            // Arctic
            polarBear: { body: 1.0, height: 0.8 },
            penguin: { body: 0.4, height: 0.5 },
            arcticFox: { body: 0.5, height: 0.4 },
            walrus: { body: 1.1, height: 0.6 },
            // Jungle
            panda: { body: 0.7, height: 0.6 },
            tiger: { body: 0.9, height: 0.7 },
            gorilla: { body: 0.8, height: 1.2 },
            parrot: { body: 0.2, height: 0.3 },
            sloth: { body: 0.4, height: 0.3 },
            crocodile: { body: 1.2, height: 0.3 },
            // Desert
            camel: { body: 0.9, height: 1.0 },
            meerkat: { body: 0.3, height: 0.4 },
            rattlesnake: { body: 0.8, height: 0.1 },
            scorpion: { body: 0.2, height: 0.1 },
            // Aquatic
            seal: { body: 0.8, height: 0.4 },
            otter: { body: 0.5, height: 0.3 },
            turtle: { body: 0.6, height: 0.3 }
        };

        const colors = {
            // Savanna
            lion: 0xDAA520,
            elephant: 0x808080,
            giraffe: 0xDAA520,
            zebra: 0xFFFFFF,
            rhinoceros: 0x696969,
            // Arctic
            polarBear: 0xF0F8FF,
            penguin: 0x000000,
            arcticFox: 0xFFFFFF,
            walrus: 0x8B7355,
            // Jungle
            panda: 0xFFFFFF,
            tiger: 0xFF8C00,
            gorilla: 0x2F2F2F,
            parrot: 0xFF0000,
            sloth: 0x8B7355,
            crocodile: 0x228B22,
            // Desert
            camel: 0xD2B48C,
            meerkat: 0xC19A6B,
            rattlesnake: 0x8B7355,
            scorpion: 0x654321,
            // Aquatic
            seal: 0x708090,
            otter: 0x8B4513,
            turtle: 0x2E8B57
        };

        const size = sizes[animal.species] || sizes.lion;
        const color = colors[animal.species] || 0x8B4513;

        // Corps
        const bodyGeom = new THREE.BoxGeometry(size.body, size.height, size.body * 1.2);
        const bodyMat = new THREE.MeshLambertMaterial({ color });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = size.height / 2;
        body.castShadow = true;
        group.add(body);

        // Tête
        const headGeom = new THREE.SphereGeometry(size.body * 0.4, 8, 8);
        const head = new THREE.Mesh(headGeom, bodyMat);
        head.position.set(0, size.height * 0.8, size.body * 0.7);
        head.castShadow = true;
        group.add(head);

        // Pattes
        const legGeom = new THREE.CylinderGeometry(0.1, 0.1, size.height, 6);
        const positions = [
            [size.body * 0.3, 0, size.body * 0.4],
            [-size.body * 0.3, 0, size.body * 0.4],
            [size.body * 0.3, 0, -size.body * 0.4],
            [-size.body * 0.3, 0, -size.body * 0.4]
        ];

        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeom, bodyMat);
            leg.position.set(pos[0], pos[1], pos[2]);
            leg.castShadow = true;
            group.add(leg);
        });

        // Queue
        const tailGeom = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6);
        const tail = new THREE.Mesh(tailGeom, bodyMat);
        tail.position.set(0, size.height * 0.4, -size.body * 0.6);
        tail.rotation.x = Math.PI / 4;
        tail.castShadow = true;
        group.add(tail);

        group.userData.animal = animal;

        return group;
    }

    addPath(x, y, material) {
        const key = `${x},${y}`;
        if (this.objects.has(key)) {
            this.scene.remove(this.objects.get(key));
        }

        const mesh = this.createPathMesh(x, y, material);
        this.scene.add(mesh);
        this.objects.set(key, mesh);
    }

    addBuilding(building) {
        const key = `${building.x},${building.y}`;
        if (this.objects.has(key)) {
            this.scene.remove(this.objects.get(key));
        }

        const mesh = this.createBuildingMesh(building);
        mesh.userData.building = building;
        this.scene.add(mesh);
        this.objects.set(key, mesh);
    }

    removeObject(x, y) {
        const key = `${x},${y}`;
        if (this.objects.has(key)) {
            this.scene.remove(this.objects.get(key));
            this.objects.delete(key);
        }
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        if (this.gridHelper) {
            this.gridHelper.visible = this.showGrid;
        }
    }

    getMouseIntersection(mouseX, mouseY) {
        this.mouse.x = (mouseX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(mouseY / this.renderer.domElement.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera3d.getCamera());

        // Intersect avec le terrain
        const intersects = this.raycaster.intersectObject(this.terrainMesh);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const gridX = Math.floor((point.x + this.grid.width) / 2);
            const gridZ = Math.floor((point.z + this.grid.height) / 2);

            return { x: gridX, y: gridZ, worldPoint: point };
        }

        return null;
    }

    highlightTile(gridX, gridY, color = 0x3498db) {
        // Créer un highlight temporaire
        const geometry = new THREE.PlaneGeometry(1.9, 1.9);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });

        const highlight = new THREE.Mesh(geometry, material);
        highlight.rotation.x = -Math.PI / 2;
        highlight.position.set(
            gridX * 2 - this.grid.width,
            0.05,
            gridY * 2 - this.grid.height
        );

        // Stocker pour nettoyage
        if (this.currentHighlight) {
            this.scene.remove(this.currentHighlight);
        }
        this.currentHighlight = highlight;
        this.scene.add(highlight);
    }

    render() {
        this.renderer.render(this.scene, this.camera3d.getCamera());
    }

    onResize() {
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    getScene() {
        return this.scene;
    }

    getRenderer() {
        return this.renderer;
    }
}
