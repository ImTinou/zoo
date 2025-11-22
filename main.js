// Variables globales
let scene, camera, renderer, raycaster, mouse;
let gameState = {
    money: 10000,
    visitors: 0,
    satisfaction: 100,
    buildings: [],
    animals: []
};
let buildMode = null;
let deleteMode = false;
let grid = [];
const GRID_SIZE = 50;
const CELL_SIZE = 2;

// Gestionnaires
let visitorManager;
let employeeManager;
let environmentManager;

// Initialisation
function init() {
    // Scène
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

    // Caméra
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 30, 30);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Raycaster pour la souris
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lumières
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Sol
    createGround();

    // Grille de construction
    initGrid();

    // Contrôles caméra
    initCameraControls();

    // Gestionnaires
    visitorManager = new VisitorManager(scene, grid, GRID_SIZE, CELL_SIZE);
    employeeManager = new EmployeeManager(scene, grid, GRID_SIZE, CELL_SIZE);
    environmentManager = new EnvironmentManager(scene, renderer);

    // Events
    setupEvents();

    // Ajouter quelques animaux de départ
    createStarterAnimals();

    // Boucle de jeu
    animate();

    // Update du jeu
    setInterval(updateGame, 1000);
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ajout d'arbres décoratifs
    for (let i = 0; i < 30; i++) {
        const x = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE * 0.9;
        const z = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE * 0.9;
        createTree(x, z);
    }

    // Ajout de rochers décoratifs
    for (let i = 0; i < 15; i++) {
        const x = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE * 0.9;
        const z = (Math.random() - 0.5) * GRID_SIZE * CELL_SIZE * 0.9;
        createRock(x, z);
    }
}

function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 1.5, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const leavesGeometry = new THREE.SphereGeometry(2, 8, 8);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 4, z);
    leaves.castShadow = true;
    scene.add(leaves);
}

function createRock(x, z) {
    const rockGeometry = new THREE.DodecahedronGeometry(0.5 + Math.random() * 0.5, 0);
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
    const rock = new THREE.Mesh(rockGeometry, rockMaterial);
    rock.position.set(x, 0.3, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    scene.add(rock);
}

function initGrid() {
    for (let x = 0; x < GRID_SIZE; x++) {
        grid[x] = [];
        for (let z = 0; z < GRID_SIZE; z++) {
            grid[x][z] = { occupied: false, type: null, object: null };
        }
    }
}

function setupEvents() {
    // Boutons de construction
    document.querySelectorAll('.build-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.id === 'deleteMode') {
                deleteMode = !deleteMode;
                buildMode = null;
                btn.classList.toggle('active');
                document.querySelectorAll('.build-btn').forEach(b => {
                    if (b !== btn) b.classList.remove('active');
                });
                document.body.className = deleteMode ? 'deleting' : '';
            } else {
                deleteMode = false;
                document.getElementById('deleteMode').classList.remove('active');

                if (buildMode && buildMode.type === btn.dataset.type && buildMode.animal === btn.dataset.animal) {
                    buildMode = null;
                    btn.classList.remove('active');
                    document.body.className = '';
                } else {
                    buildMode = { ...btn.dataset };
                    document.querySelectorAll('.build-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.body.className = 'building';
                }
            }
        });
    });

    // Embauche d'employés
    document.getElementById('hireKeeper').addEventListener('click', () => {
        if (gameState.money >= 500) {
            employeeManager.hireEmployee('keeper');
            gameState.money -= 500;
            updateUI();
        } else {
            alert('Pas assez d\'argent pour embaucher un gardien !');
        }
    });

    document.getElementById('hireVet').addEventListener('click', () => {
        if (gameState.money >= 1000) {
            employeeManager.hireEmployee('vet');
            gameState.money -= 1000;
            updateUI();
        } else {
            alert('Pas assez d\'argent pour embaucher un vétérinaire !');
        }
    });

    // Fermeture du panel
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('animal-panel').classList.add('hidden');
    });

    // Clic pour construire
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
}

function onMouseClick(event) {
    if (event.button !== 0) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        const gridX = Math.floor((point.x + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);
        const gridZ = Math.floor((point.z + GRID_SIZE * CELL_SIZE / 2) / CELL_SIZE);

        if (gridX >= 0 && gridX < GRID_SIZE && gridZ >= 0 && gridZ < GRID_SIZE) {
            if (deleteMode) {
                deleteBuilding(gridX, gridZ);
            } else if (buildMode) {
                placeBuilding(gridX, gridZ, buildMode);
            } else {
                // Clic sur un animal pour afficher les infos
                checkAnimalClick(intersects[0].object);
            }
        }
    }
}

function checkAnimalClick(object) {
    // Chercher l'animal cliqué
    for (let animal of gameState.animals) {
        if (animal.mesh === object || animal.mesh.children.includes(object)) {
            showAnimalPanel(animal);
            break;
        }
    }
}

function showAnimalPanel(animal) {
    const panel = document.getElementById('animal-panel');
    const title = document.getElementById('panel-title');
    const content = document.getElementById('panel-content');

    title.textContent = `${animal.name} (${animal.type})`;

    const healthClass = animal.health > 70 ? 'high' : animal.health > 30 ? 'medium' : 'low';
    const hungerClass = animal.hunger > 70 ? 'high' : animal.hunger > 30 ? 'medium' : 'low';
    const thirstClass = animal.thirst > 70 ? 'high' : animal.thirst > 30 ? 'medium' : 'low';
    const happinessClass = animal.happiness > 70 ? 'high' : animal.happiness > 30 ? 'medium' : 'low';

    content.innerHTML = `
        <p><strong>État:</strong> ${animal.state}</p>
        <p><strong>Santé:</strong></p>
        <div class="progress-bar">
            <div class="progress-fill ${healthClass}" style="width: ${animal.health}%"></div>
        </div>
        <p><strong>Faim:</strong></p>
        <div class="progress-bar">
            <div class="progress-fill ${hungerClass}" style="width: ${animal.hunger}%"></div>
        </div>
        <p><strong>Soif:</strong></p>
        <div class="progress-bar">
            <div class="progress-fill ${thirstClass}" style="width: ${animal.thirst}%"></div>
        </div>
        <p><strong>Bonheur:</strong></p>
        <div class="progress-bar">
            <div class="progress-fill ${happinessClass}" style="width: ${animal.happiness}%"></div>
        </div>
    `;

    panel.classList.remove('hidden');
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function placeBuilding(gridX, gridZ, buildData) {
    if (grid[gridX][gridZ].occupied) {
        alert('Cet emplacement est déjà occupé !');
        return;
    }

    const cost = getBuildingCost(buildData.type, buildData.animal);
    if (gameState.money < cost) {
        alert('Pas assez d\'argent !');
        return;
    }

    const worldX = (gridX - GRID_SIZE / 2) * CELL_SIZE;
    const worldZ = (gridZ - GRID_SIZE / 2) * CELL_SIZE;

    let building;
    if (buildData.type === 'enclosure') {
        building = createEnclosure(worldX, worldZ, buildData.animal);
    } else if (buildData.type === 'path') {
        building = createPath(worldX, worldZ);
    } else if (buildData.type === 'shop') {
        building = createShop(worldX, worldZ);
    } else if (buildData.type === 'restaurant') {
        building = createRestaurant(worldX, worldZ);
    } else if (buildData.type === 'toilet') {
        building = createToilet(worldX, worldZ);
    } else if (buildData.type === 'attraction') {
        building = createAttraction(worldX, worldZ);
    }

    if (building) {
        scene.add(building);
        grid[gridX][gridZ] = {
            occupied: true,
            type: buildData.type,
            object: building,
            animal: buildData.animal
        };
        gameState.money -= cost;
        gameState.buildings.push({ gridX, gridZ, type: buildData.type, object: building });
        updateUI();

        // Ajouter un animal si c'est un enclos
        if (buildData.type === 'enclosure') {
            addAnimalToEnclosure(worldX, worldZ, buildData.animal, building);
        }
    }
}

function addAnimalToEnclosure(x, z, animalType, enclosure) {
    const animal = createAnimal(x, z, animalType);
    scene.add(animal.mesh);

    // Assigner les sources de nourriture et d'eau
    if (enclosure && enclosure.userData) {
        animal.waterSource = enclosure.userData.waterSource;
        animal.foodSource = enclosure.userData.foodSource;
    }

    gameState.animals.push(animal);
}

function deleteBuilding(gridX, gridZ) {
    if (!grid[gridX][gridZ].occupied) return;

    const cell = grid[gridX][gridZ];
    scene.remove(cell.object);

    // Supprimer les animaux de cet enclos
    gameState.animals = gameState.animals.filter(animal => {
        if (animal.enclosureX === gridX && animal.enclosureZ === gridZ) {
            scene.remove(animal.mesh);
            return false;
        }
        return true;
    });

    grid[gridX][gridZ] = { occupied: false, type: null, object: null };
    gameState.buildings = gameState.buildings.filter(b => !(b.gridX === gridX && b.gridZ === gridZ));
    gameState.money += 50;
    updateUI();
}

function getBuildingCost(type, animal) {
    const costs = {
        path: 50,
        shop: 300,
        restaurant: 500,
        toilet: 200,
        attraction: 800,
        enclosure: {
            lion: 500,
            elephant: 700,
            giraffe: 600,
            zebra: 400
        }
    };

    if (type === 'enclosure') {
        return costs.enclosure[animal] || 500;
    }
    return costs[type] || 100;
}

function createStarterAnimals() {
    // Créer un enclos de départ avec un lion
    const startX = 5, startZ = 5;
    const worldX = (startX - GRID_SIZE / 2) * CELL_SIZE;
    const worldZ = (startZ - GRID_SIZE / 2) * CELL_SIZE;

    const enclosure = createEnclosure(worldX, worldZ, 'lion');
    scene.add(enclosure);
    grid[startX][startZ] = {
        occupied: true,
        type: 'enclosure',
        object: enclosure,
        animal: 'lion'
    };
    gameState.buildings.push({ gridX: startX, gridZ: startZ, type: 'enclosure', object: enclosure });
    addAnimalToEnclosure(worldX, worldZ, 'lion', enclosure);
}

function updateGame() {
    // Calcul des visiteurs
    const attractiveness = gameState.animals.length * 10 +
                          gameState.buildings.filter(b => b.type === 'shop').length * 5 +
                          gameState.buildings.filter(b => b.type === 'restaurant').length * 8 +
                          gameState.buildings.filter(b => b.type === 'attraction').length * 15;

    const targetVisitors = Math.min(Math.floor(attractiveness + Math.random() * 20), 999);

    // Revenus des visiteurs
    const income = gameState.visitors * 2;
    gameState.money += income;

    // Coûts de maintenance
    const maintenance = gameState.animals.length * 5 + gameState.buildings.length * 2;
    gameState.money -= maintenance;

    // Salaires des employés
    const salaries = employeeManager.getTotalSalaries();
    gameState.money -= salaries;

    // Satisfaction
    const shopCount = gameState.buildings.filter(b => b.type === 'shop').length;
    const restaurantCount = gameState.buildings.filter(b => b.type === 'restaurant').length;
    const toiletCount = gameState.buildings.filter(b => b.type === 'toilet').length;
    const animalCount = gameState.animals.length;
    const avgAnimalHealth = gameState.animals.length > 0 ?
        gameState.animals.reduce((sum, a) => sum + a.happiness, 0) / gameState.animals.length : 100;

    gameState.satisfaction = Math.min(100, Math.max(0,
        30 + shopCount * 8 + restaurantCount * 10 + toiletCount * 5 +
        animalCount * 2 + avgAnimalHealth * 0.3 - Math.floor(gameState.visitors / 15)
    ));

    updateUI();
}

function updateUI() {
    document.getElementById('money').textContent = Math.floor(gameState.money);
    document.getElementById('visitors').textContent = gameState.visitors;
    document.getElementById('satisfaction').textContent = Math.floor(gameState.satisfaction);
    document.getElementById('animal-count').textContent = gameState.animals.length;
    document.getElementById('employee-count').textContent = employeeManager.employees.length;
    document.getElementById('weather-icon').textContent = environmentManager.getWeatherIcon();
    document.getElementById('time').textContent = environmentManager.getTimeString();
}

function animate() {
    requestAnimationFrame(animate);

    // Animer les animaux
    animateAnimals();

    // Mettre à jour les visiteurs
    visitorManager.update(gameState);

    // Mettre à jour les employés
    employeeManager.update(gameState);

    // Mettre à jour l'environnement
    environmentManager.update();

    // Animer les attractions
    gameState.buildings.forEach(building => {
        if (building.object.userData.rotating) {
            building.object.rotation.y += 0.01;
        }
    });

    // Update camera controls
    updateCameraControls();

    // Mettre à jour la satisfaction depuis les visiteurs
    if (visitorManager.visitors.length > 0) {
        gameState.satisfaction = visitorManager.getAverageSatisfaction();
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Démarrer le jeu
init();
