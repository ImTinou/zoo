// Building System
class Building {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        const spec = BuildingTypes[type];
        this.name = spec.name;
        this.cost = spec.cost;
        this.emoji = spec.emoji;
        this.color = spec.color;
        this.colorDark = spec.colorDark;
        this.roofColor = spec.roofColor;
        this.height = spec.height || 30;
    }
}

const BuildingTypes = {
    food: {
        name: 'Food Stand',
        cost: 800,
        emoji: '🍔',
        color: '#FF6347',
        colorDark: '#CC4A37',
        roofColor: '#FFD700',
        height: 35
    },
    drink: {
        name: 'Drink Stand',
        cost: 600,
        emoji: '🥤',
        color: '#4169E1',
        colorDark: '#2F4FB1',
        roofColor: '#87CEEB',
        height: 30
    },
    restroom: {
        name: 'Restroom',
        cost: 1000,
        emoji: '🚻',
        color: '#9370DB',
        colorDark: '#7350AB',
        roofColor: '#DDA0DD',
        height: 32
    },
    gift: {
        name: 'Gift Shop',
        cost: 1500,
        emoji: '🎁',
        color: '#FF69B4',
        colorDark: '#CC4984',
        roofColor: '#FFB6C1',
        height: 40
    },
    research: {
        name: 'Research Center',
        cost: 5000,
        emoji: '🔬',
        color: '#32CD32',
        colorDark: '#228B22',
        roofColor: '#00FA9A',
        height: 45
    }
};

// Scenery Items
class SceneryItem {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;

        const spec = SceneryTypes[type];
        this.name = spec.name;
        this.cost = spec.cost;
        this.emoji = spec.emoji;
    }
}

const SceneryTypes = {
    tree: {
        name: 'Tree',
        cost: 75,
        emoji: '🌳'
    },
    bush: {
        name: 'Bush',
        cost: 25,
        emoji: '🌿'
    },
    rock: {
        name: 'Rock',
        cost: 50,
        emoji: '🪨'
    },
    bench: {
        name: 'Bench',
        cost: 150,
        emoji: '🪑'
    }
};

// Path Costs
const PathCosts = {
    dirt: 10,
    asphalt: 25,
    cobblestone: 50
};
