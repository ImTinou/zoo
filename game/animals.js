// Animal System
class Animal {
    constructor(species, x, y) {
        this.species = species;
        this.x = x;
        this.y = y;
        this.name = this.generateName();

        // Stats de l'animal - supporter les animaux normaux ET rares
        const specs = AnimalSpecies[species] || RareAnimals[species];
        if (!specs) {
            console.error(`Unknown species: ${species}`);
            return;
        }

        this.happiness = 50;
        this.health = 100;
        this.hunger = 50;

        this.attractiveness = specs.attractiveness;
        this.maintenanceCost = specs.cost * 0.1;
        this.habitatNeeds = specs.habitatNeeds;

        this.age = 0;
        this.maxAge = specs.lifespan;

        // Comportement
        this.targetX = x;
        this.targetY = y;
        this.speed = 0.5;
        this.emoji = specs.emoji;

        // Référence à l'enclos
        this.exhibit = null;
    }

    generateName() {
        const names = ['Max', 'Luna', 'Charlie', 'Bella', 'Rocky', 'Daisy',
                       'Simba', 'Nala', 'Duke', 'Sophie', 'Leo', 'Zara'];
        return names[Math.floor(Math.random() * names.length)];
    }

    update() {
        // Vieillissement
        this.age += 0.001;

        // Besoins basiques
        this.hunger = Math.max(0, this.hunger - 0.1);
        this.health = Math.max(0, Math.min(100, this.health + (this.hunger > 30 ? 0.05 : -0.1)));

        // Bonheur basé sur l'habitat
        this.updateHappiness();

        // Mouvement aléatoire dans l'enclos
        if (this.exhibit && Math.random() < 0.01) {
            const bounds = this.exhibit.getBounds();
            this.targetX = bounds.x + Math.random() * bounds.width;
            this.targetY = bounds.y + Math.random() * bounds.height;
        }

        // Déplacement vers la cible
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    updateHappiness() {
        let happiness = 50;

        // Bonheur basé sur la faim
        if (this.hunger > 70) happiness += 20;
        else if (this.hunger < 30) happiness -= 30;

        // Bonheur basé sur la santé
        if (this.health > 80) happiness += 10;
        else if (this.health < 50) happiness -= 20;

        // Bonheur basé sur l'habitat
        if (this.exhibit) {
            const habitatQuality = this.exhibit.checkHabitatQuality(this);
            happiness += habitatQuality * 0.4;
        } else {
            happiness -= 50; // Pas d'enclos = très malheureux
        }

        this.happiness = Math.max(0, Math.min(100, happiness));
    }

    feed() {
        this.hunger = Math.min(100, this.hunger + 50);
    }

    getInfo() {
        return {
            name: this.name,
            species: this.species,
            happiness: Math.floor(this.happiness),
            health: Math.floor(this.health),
            hunger: Math.floor(this.hunger),
            age: Math.floor(this.age)
        };
    }
}

// Biomes disponibles
const Biomes = {
    SAVANNA: 'savanna',
    ARCTIC: 'arctic',
    JUNGLE: 'jungle',
    DESERT: 'desert',
    TEMPERATE: 'temperate',
    AQUATIC: 'aquatic'
};

// Définitions des espèces
const AnimalSpecies = {
    // SAVANNA BIOME
    lion: {
        name: 'Lion',
        emoji: '🦁',
        cost: 2000,
        attractiveness: 150,
        lifespan: 15,
        biome: Biomes.SAVANNA,
        habitatNeeds: {
            minSize: 9,
            terrain: 'grass',
            shelterRequired: true,
            waterRequired: true
        }
    },
    elephant: {
        name: 'Elephant',
        emoji: '🐘',
        cost: 3500,
        attractiveness: 200,
        lifespan: 50,
        biome: Biomes.SAVANNA,
        habitatNeeds: {
            minSize: 16,
            terrain: 'grass',
            shelterRequired: true,
            waterRequired: true
        }
    },
    giraffe: {
        name: 'Giraffe',
        emoji: '🦒',
        cost: 2800,
        attractiveness: 180,
        lifespan: 25,
        biome: Biomes.SAVANNA,
        habitatNeeds: {
            minSize: 12,
            terrain: 'grass',
            shelterRequired: true,
            waterRequired: true
        }
    },
    zebra: {
        name: 'Zebra',
        emoji: '🦓',
        cost: 1500,
        attractiveness: 120,
        lifespan: 20,
        biome: Biomes.SAVANNA,
        habitatNeeds: {
            minSize: 9,
            terrain: 'grass',
            shelterRequired: false,
            waterRequired: true
        }
    },
    rhinoceros: {
        name: 'Rhinoceros',
        emoji: '🦏',
        cost: 3200,
        attractiveness: 170,
        lifespan: 45,
        biome: Biomes.SAVANNA,
        habitatNeeds: {
            minSize: 14,
            terrain: 'grass',
            shelterRequired: true,
            waterRequired: true
        }
    },

    // ARCTIC BIOME
    polarBear: {
        name: 'Polar Bear',
        emoji: '🐻‍❄️',
        cost: 4500,
        attractiveness: 250,
        lifespan: 25,
        biome: Biomes.ARCTIC,
        habitatNeeds: {
            minSize: 16,
            terrain: 'snow',
            shelterRequired: true,
            waterRequired: true
        }
    },
    penguin: {
        name: 'Penguin',
        emoji: '🐧',
        cost: 1800,
        attractiveness: 180,
        lifespan: 20,
        biome: Biomes.ARCTIC,
        habitatNeeds: {
            minSize: 9,
            terrain: 'snow',
            shelterRequired: false,
            waterRequired: true
        }
    },
    arcticFox: {
        name: 'Arctic Fox',
        emoji: '🦊',
        cost: 2200,
        attractiveness: 140,
        lifespan: 10,
        biome: Biomes.ARCTIC,
        habitatNeeds: {
            minSize: 8,
            terrain: 'snow',
            shelterRequired: true,
            waterRequired: false
        }
    },
    walrus: {
        name: 'Walrus',
        emoji: '🦭',
        cost: 3000,
        attractiveness: 160,
        lifespan: 40,
        biome: Biomes.ARCTIC,
        habitatNeeds: {
            minSize: 12,
            terrain: 'snow',
            shelterRequired: false,
            waterRequired: true
        }
    },

    // JUNGLE BIOME
    panda: {
        name: 'Giant Panda',
        emoji: '🐼',
        cost: 5000,
        attractiveness: 280,
        lifespan: 20,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 12,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: true
        }
    },
    tiger: {
        name: 'Tiger',
        emoji: '🐅',
        cost: 4200,
        attractiveness: 240,
        lifespan: 15,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 14,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: true
        }
    },
    gorilla: {
        name: 'Gorilla',
        emoji: '🦍',
        cost: 4800,
        attractiveness: 260,
        lifespan: 35,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 16,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: true
        }
    },
    parrot: {
        name: 'Parrot',
        emoji: '🦜',
        cost: 800,
        attractiveness: 90,
        lifespan: 50,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 6,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: false
        }
    },
    sloth: {
        name: 'Sloth',
        emoji: '🦥',
        cost: 1500,
        attractiveness: 130,
        lifespan: 20,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 8,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: false
        }
    },

    // DESERT BIOME
    camel: {
        name: 'Camel',
        emoji: '🐪',
        cost: 1800,
        attractiveness: 110,
        lifespan: 40,
        biome: Biomes.DESERT,
        habitatNeeds: {
            minSize: 10,
            terrain: 'sand',
            shelterRequired: false,
            waterRequired: false
        }
    },
    meerkat: {
        name: 'Meerkat',
        emoji: '🦦',
        cost: 1200,
        attractiveness: 100,
        lifespan: 12,
        biome: Biomes.DESERT,
        habitatNeeds: {
            minSize: 6,
            terrain: 'sand',
            shelterRequired: true,
            waterRequired: false
        }
    },
    rattlesnake: {
        name: 'Rattlesnake',
        emoji: '🐍',
        cost: 900,
        attractiveness: 80,
        lifespan: 15,
        biome: Biomes.DESERT,
        habitatNeeds: {
            minSize: 4,
            terrain: 'sand',
            shelterRequired: true,
            waterRequired: false
        }
    },
    scorpion: {
        name: 'Scorpion',
        emoji: '🦂',
        cost: 600,
        attractiveness: 70,
        lifespan: 8,
        biome: Biomes.DESERT,
        habitatNeeds: {
            minSize: 4,
            terrain: 'sand',
            shelterRequired: true,
            waterRequired: false
        }
    },

    // AQUATIC/TEMPERATE
    seal: {
        name: 'Seal',
        emoji: '🦭',
        cost: 2500,
        attractiveness: 150,
        lifespan: 30,
        biome: Biomes.AQUATIC,
        habitatNeeds: {
            minSize: 12,
            terrain: 'water',
            shelterRequired: false,
            waterRequired: true
        }
    },
    otter: {
        name: 'Otter',
        emoji: '🦦',
        cost: 1600,
        attractiveness: 140,
        lifespan: 15,
        biome: Biomes.AQUATIC,
        habitatNeeds: {
            minSize: 8,
            terrain: 'water',
            shelterRequired: true,
            waterRequired: true
        }
    },
    crocodile: {
        name: 'Crocodile',
        emoji: '🐊',
        cost: 3200,
        attractiveness: 190,
        lifespan: 70,
        biome: Biomes.JUNGLE,
        habitatNeeds: {
            minSize: 14,
            terrain: 'water',
            shelterRequired: true,
            waterRequired: true
        }
    },
    turtle: {
        name: 'Sea Turtle',
        emoji: '🐢',
        cost: 1400,
        attractiveness: 120,
        lifespan: 80,
        biome: Biomes.AQUATIC,
        habitatNeeds: {
            minSize: 10,
            terrain: 'water',
            shelterRequired: false,
            waterRequired: true
        }
    }
};

// Exhibit (Enclos)
class Exhibit {
    constructor(x, y, width, height) {
        this.id = `exhibit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.animals = [];
        this.terrain = 'grass';
        this.hasShelter = false;
        this.hasWater = false;
        this.fenceType = 'basic';
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    addAnimal(animal) {
        this.animals.push(animal);
        animal.exhibit = this;
    }

    removeAnimal(animal) {
        const index = this.animals.indexOf(animal);
        if (index > -1) {
            this.animals.splice(index, 1);
            animal.exhibit = null;
        }
    }

    getSize() {
        return this.width * this.height;
    }

    checkHabitatQuality(animal) {
        let quality = 0;
        const needs = animal.habitatNeeds;

        // Vérifier la taille
        const sizePerAnimal = this.getSize() / Math.max(1, this.animals.length);
        if (sizePerAnimal >= needs.minSize) {
            quality += 40;
        } else {
            quality -= 30;
        }

        // Vérifier le terrain
        if (this.terrain === needs.terrain) {
            quality += 30;
        }

        // Vérifier l'abri
        if (needs.shelterRequired && this.hasShelter) {
            quality += 15;
        } else if (needs.shelterRequired && !this.hasShelter) {
            quality -= 20;
        }

        // Vérifier l'eau
        if (needs.waterRequired && this.hasWater) {
            quality += 15;
        } else if (needs.waterRequired && !this.hasWater) {
            quality -= 20;
        }

        return Math.max(0, Math.min(100, quality));
    }
}
