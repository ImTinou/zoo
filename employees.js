// Système d'employés
class Employee {
    constructor(scene, type, GRID_SIZE, CELL_SIZE) {
        this.type = type; // 'keeper' (gardien) ou 'vet' (vétérinaire)
        this.mesh = this.createEmployeeMesh();
        this.position = { x: 0, z: 0 };
        this.target = null;
        this.assignedTask = null;
        this.speed = 0.08;
        this.salary = type === 'vet' ? 100 : 50;
        this.GRID_SIZE = GRID_SIZE;
        this.CELL_SIZE = CELL_SIZE;

        scene.add(this.mesh);
    }

    createEmployeeMesh() {
        const group = new THREE.Group();

        // Corps
        const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 8);
        const bodyColor = this.type === 'vet' ? 0xFFFFFF : 0x4A7C59;
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Tête
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.4;
        head.castShadow = true;
        group.add(head);

        // Casquette/chapeau distinctif
        const hatGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.2, 8);
        const hatColor = this.type === 'vet' ? 0xFF0000 : 0x8B4513;
        const hatMaterial = new THREE.MeshLambertMaterial({ color: hatColor });
        const hat = new THREE.Mesh(hatGeometry, hatMaterial);
        hat.position.y = 1.75;
        group.add(hat);

        // Bras
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 6);
        const leftArm = new THREE.Mesh(armGeometry, bodyMaterial);
        leftArm.position.set(-0.35, 0.6, 0);
        leftArm.rotation.z = Math.PI / 6;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, bodyMaterial);
        rightArm.position.set(0.35, 0.6, 0);
        rightArm.rotation.z = -Math.PI / 6;
        group.add(rightArm);

        // Outil (seringue pour véto, seau pour gardien)
        if (this.type === 'vet') {
            const toolGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6);
            const toolMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
            const tool = new THREE.Mesh(toolGeometry, toolMaterial);
            tool.position.set(0.4, 0.3, 0);
            tool.rotation.z = Math.PI / 4;
            group.add(tool);
        } else {
            const bucketGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.25, 8);
            const bucketMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
            const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
            bucket.position.set(0.4, 0.2, 0);
            group.add(bucket);
        }

        return group;
    }

    update(gameState, grid) {
        // Trouver une tâche si pas de tâche assignée
        if (!this.assignedTask) {
            this.findTask(gameState, grid);
        }

        // Exécuter la tâche
        if (this.assignedTask) {
            const dx = this.assignedTask.x - this.mesh.position.x;
            const dz = this.assignedTask.z - this.mesh.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance < 0.5) {
                // Tâche accomplie
                this.performTask(this.assignedTask, gameState);
                this.assignedTask = null;
            } else {
                // Se déplacer vers la tâche
                this.mesh.position.x += (dx / distance) * this.speed;
                this.mesh.position.z += (dz / distance) * this.speed;
                this.mesh.rotation.y = Math.atan2(dx, dz);

                // Animation de marche
                this.mesh.position.y = Math.abs(Math.sin(Date.now() * 0.01)) * 0.1;
            }
        }
    }

    findTask(gameState, grid) {
        if (this.type === 'vet') {
            // Chercher les animaux malades
            const sickAnimals = gameState.animals.filter(a => a.health < 50);
            if (sickAnimals.length > 0) {
                const nearest = sickAnimals[0];
                this.assignedTask = {
                    type: 'heal',
                    x: nearest.mesh.position.x,
                    z: nearest.mesh.position.z,
                    target: nearest
                };
            }
        } else {
            // Chercher les enclos qui ont besoin d'entretien
            for (let x = 0; x < this.GRID_SIZE; x++) {
                for (let z = 0; z < this.GRID_SIZE; z++) {
                    if (grid[x][z].type === 'enclosure' && Math.random() < 0.01) {
                        const worldX = (x - this.GRID_SIZE / 2) * this.CELL_SIZE;
                        const worldZ = (z - this.GRID_SIZE / 2) * this.CELL_SIZE;
                        this.assignedTask = {
                            type: 'clean',
                            x: worldX,
                            z: worldZ,
                            gridX: x,
                            gridZ: z
                        };
                        return;
                    }
                }
            }
        }
    }

    performTask(task, gameState) {
        if (task.type === 'heal' && task.target) {
            task.target.health = Math.min(100, task.target.health + 30);
            task.target.hunger = Math.min(100, task.target.hunger + 20);
            task.target.thirst = Math.min(100, task.target.thirst + 20);
        } else if (task.type === 'clean') {
            // Améliorer la satisfaction des visiteurs
            gameState.satisfaction = Math.min(100, gameState.satisfaction + 2);
        }
    }

    remove(scene) {
        scene.remove(this.mesh);
    }
}

class EmployeeManager {
    constructor(scene, grid, GRID_SIZE, CELL_SIZE) {
        this.scene = scene;
        this.grid = grid;
        this.GRID_SIZE = GRID_SIZE;
        this.CELL_SIZE = CELL_SIZE;
        this.employees = [];
    }

    hireEmployee(type) {
        const employee = new Employee(this.scene, type, this.GRID_SIZE, this.CELL_SIZE);
        employee.mesh.position.set(0, 0, 0);
        this.employees.push(employee);
        return employee;
    }

    fireEmployee(index) {
        if (index >= 0 && index < this.employees.length) {
            this.employees[index].remove(this.scene);
            this.employees.splice(index, 1);
        }
    }

    update(gameState) {
        this.employees.forEach(employee => {
            employee.update(gameState, this.grid);
        });
    }

    getTotalSalaries() {
        return this.employees.reduce((sum, emp) => sum + emp.salary, 0);
    }
}
