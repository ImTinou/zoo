// Visitor System with Pathfinding
class Visitor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.path = [];
        this.speed = 0.05;

        // Besoins des visiteurs
        this.hunger = 100;
        this.thirst = 100;
        this.bladder = 100;
        this.happiness = 70;
        this.energy = 100;

        // État
        this.currentThought = null;
        this.isWalking = false;
        this.visitedExhibits = new Set();
        this.ticketPaid = 0;

        // Apparence
        this.color = this.randomVisitorColor();
    }

    randomVisitorColor() {
        const colors = [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0xFFA07A,
            0x98D8C8, 0xF7DC6F, 0xBB8FCE, 0x85C1E2
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update(grid, zoo) {
        // Décrémenter les besoins
        this.hunger = Math.max(0, this.hunger - 0.05);
        this.thirst = Math.max(0, this.thirst - 0.08);
        this.bladder = Math.max(0, this.bladder - 0.06);
        this.energy = Math.max(0, this.energy - 0.03);

        // Update happiness basé sur les besoins
        this.updateHappiness();

        // Si pas de chemin, en trouver un nouveau
        if (this.path.length === 0 && Math.random() < 0.01) {
            this.findNewDestination(grid, zoo);
        }

        // Suivre le chemin
        this.followPath();

        // Update pensées
        this.updateThoughts();
    }

    updateHappiness() {
        let happiness = 50;

        // Besoins critiques réduisent le bonheur
        if (this.hunger < 30) happiness -= 20;
        if (this.thirst < 30) happiness -= 20;
        if (this.bladder < 30) happiness -= 25;
        if (this.energy < 30) happiness -= 15;

        // Bonus pour besoins satisfaits
        if (this.hunger > 70) happiness += 10;
        if (this.thirst > 70) happiness += 10;

        // Nombre d'enclos visités
        happiness += Math.min(30, this.visitedExhibits.size * 5);

        this.happiness = Math.max(0, Math.min(100, happiness));
    }

    updateThoughts() {
        // Priorité aux besoins critiques
        if (this.hunger < 20) {
            this.currentThought = { text: "I'm starving!", emoji: "🍔", priority: 3 };
        } else if (this.thirst < 20) {
            this.currentThought = { text: "So thirsty...", emoji: "🥤", priority: 3 };
        } else if (this.bladder < 20) {
            this.currentThought = { text: "Need restroom!", emoji: "🚻", priority: 4 };
        } else if (this.energy < 20) {
            this.currentThought = { text: "Need to rest", emoji: "😴", priority: 2 };
        } else if (this.happiness > 80) {
            this.currentThought = { text: "Amazing zoo!", emoji: "😊", priority: 1 };
        } else if (this.happiness < 30) {
            this.currentThought = { text: "Not enjoying this", emoji: "😞", priority: 2 };
        } else if (Math.random() < 0.3) {
            const thoughts = [
                { text: "Cool animals!", emoji: "🦁", priority: 1 },
                { text: "Nice exhibits", emoji: "👍", priority: 1 },
                { text: "What's next?", emoji: "🤔", priority: 1 }
            ];
            this.currentThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        }
    }

    findNewDestination(grid, zoo) {
        const destinations = [];

        // Chercher des attractions selon les besoins
        if (this.hunger < 50) {
            const foodStands = zoo.buildings.filter(b => b.type === 'food');
            destinations.push(...foodStands.map(b => ({ x: b.x, y: b.y, type: 'food' })));
        }

        if (this.thirst < 50) {
            const drinkStands = zoo.buildings.filter(b => b.type === 'drink');
            destinations.push(...drinkStands.map(b => ({ x: b.x, y: b.y, type: 'drink' })));
        }

        if (this.bladder < 50) {
            const restrooms = zoo.buildings.filter(b => b.type === 'restroom');
            destinations.push(...restrooms.map(b => ({ x: b.x, y: b.y, type: 'restroom' })));
        }

        // Chercher des enclos non visités
        zoo.exhibits.forEach((exhibit, index) => {
            if (!this.visitedExhibits.has(index) && exhibit.animals.length > 0) {
                const centerX = Math.floor(exhibit.x + exhibit.width / 2);
                const centerY = Math.floor(exhibit.y + exhibit.height / 2);
                destinations.push({ x: centerX, y: centerY, type: 'exhibit', index });
            }
        });

        // Destination aléatoire sur un chemin
        if (destinations.length === 0 || Math.random() < 0.3) {
            const paths = this.findAllPaths(grid);
            if (paths.length > 0) {
                const randomPath = paths[Math.floor(Math.random() * paths.length)];
                destinations.push({ x: randomPath.x, y: randomPath.y, type: 'wander' });
            }
        }

        if (destinations.length > 0) {
            const dest = destinations[Math.floor(Math.random() * destinations.length)];
            this.path = this.findPath(grid, Math.floor(this.x), Math.floor(this.y), dest.x, dest.y);

            if (dest.type === 'exhibit') {
                this.visitedExhibits.add(dest.index);
            }
        }
    }

    findAllPaths(grid) {
        const paths = [];
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                if (tile && tile.path) {
                    paths.push({ x, y });
                }
            }
        }
        return paths;
    }

    followPath() {
        if (this.path.length === 0) {
            this.isWalking = false;
            return;
        }

        const target = this.path[0];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 0.1) {
            this.path.shift();
            if (this.path.length > 0) {
                this.followPath();
            }
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.isWalking = true;
        }
    }

    // A* Pathfinding
    findPath(grid, startX, startY, endX, endY) {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${startX},${startY}`;
        const endKey = `${endX},${endY}`;

        openSet.push({ x: startX, y: startY, key: startKey });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, endX, endY));

        while (openSet.length > 0) {
            // Trouver le noeud avec le plus petit fScore
            openSet.sort((a, b) => fScore.get(a.key) - fScore.get(b.key));
            const current = openSet.shift();

            if (current.x === endX && current.y === endY) {
                return this.reconstructPath(cameFrom, current.key);
            }

            closedSet.add(current.key);

            // Vérifier les voisins
            const neighbors = [
                { x: current.x + 1, y: current.y },
                { x: current.x - 1, y: current.y },
                { x: current.x, y: current.y + 1 },
                { x: current.x, y: current.y - 1 }
            ];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(key)) continue;

                const tile = grid.getTile(neighbor.x, neighbor.y);
                if (!tile || !tile.path) continue; // Seulement marcher sur les chemins

                const tentativeGScore = gScore.get(current.key) + 1;

                if (!gScore.has(key) || tentativeGScore < gScore.get(key)) {
                    cameFrom.set(key, current.key);
                    gScore.set(key, tentativeGScore);
                    fScore.set(key, tentativeGScore + this.heuristic(neighbor.x, neighbor.y, endX, endY));

                    if (!openSet.find(n => n.key === key)) {
                        openSet.push({ x: neighbor.x, y: neighbor.y, key });
                    }
                }
            }
        }

        return []; // Pas de chemin trouvé
    }

    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    reconstructPath(cameFrom, currentKey) {
        const path = [];
        let current = currentKey;

        while (cameFrom.has(current)) {
            const coords = current.split(',');
            path.unshift({ x: parseFloat(coords[0]) + 0.5, y: parseFloat(coords[1]) + 0.5 });
            current = cameFrom.get(current);
        }

        return path;
    }

    getInfo() {
        return {
            hunger: Math.floor(this.hunger),
            thirst: Math.floor(this.thirst),
            bladder: Math.floor(this.bladder),
            happiness: Math.floor(this.happiness),
            energy: Math.floor(this.energy),
            thought: this.currentThought,
            exhibitsVisited: this.visitedExhibits.size
        };
    }
}

// Visitor Manager
class VisitorManager {
    constructor(zoo, grid) {
        this.zoo = zoo;
        this.grid = grid;
        this.visitors = [];
        this.spawnRate = 60; // frames entre chaque spawn
        this.spawnCounter = 0;
        this.maxVisitors = 100;
    }

    update() {
        // Spawn nouveaux visiteurs
        this.spawnCounter++;
        if (this.spawnCounter >= this.spawnRate && this.visitors.length < this.maxVisitors) {
            this.spawnVisitor();
            this.spawnCounter = 0;
        }

        // Update visiteurs existants
        this.visitors.forEach((visitor, index) => {
            visitor.update(this.grid, this.zoo);

            // Retirer les visiteurs très malheureux ou qui ont tout vu
            if (visitor.happiness < 10 || visitor.energy < 5) {
                this.visitors.splice(index, 1);
            }
        });

        // Update guest count du zoo
        this.zoo.guestCount = this.visitors.length;
    }

    spawnVisitor() {
        // Spawn à l'entrée si elle existe
        if (this.zoo.entrance) {
            const entrance = this.zoo.entrance;
            const visitor = new Visitor(entrance.x + 0.5, entrance.y + 0.5);
            visitor.ticketPaid = this.zoo.entrance.ticketPrice;
            this.visitors.push(visitor);
        } else {
            // Spawn sur un chemin aléatoire
            const paths = this.findAllPaths();
            if (paths.length > 0) {
                const randomPath = paths[Math.floor(Math.random() * paths.length)];
                const visitor = new Visitor(randomPath.x + 0.5, randomPath.y + 0.5);
                this.visitors.push(visitor);
            }
        }
    }

    findAllPaths() {
        const paths = [];
        for (let y = 0; y < this.grid.height; y++) {
            for (let x = 0; x < this.grid.width; x++) {
                const tile = this.grid.getTile(x, y);
                if (tile && tile.path) {
                    paths.push({ x, y });
                }
            }
        }
        return paths;
    }

    getVisitors() {
        return this.visitors;
    }
}
