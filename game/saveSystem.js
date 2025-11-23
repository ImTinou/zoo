// Save System - LocalStorage
class SaveSystem {
    constructor() {
        this.saveKey = 'zooTycoon3D_save';
        this.autoSaveInterval = 30000; // Sauvegarde auto toutes les 30 secondes
        this.autoSaveTimer = null;
    }

    startAutoSave(game) {
        this.autoSaveTimer = setInterval(() => {
            this.saveGame(game);
            console.log('🔄 Auto-save completed');
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }

    saveGame(game) {
        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                zoo: {
                    money: game.zoo.money,
                    date: game.zoo.date,
                    zooRating: game.zoo.zooRating,
                    guestCount: game.zoo.guestCount
                },
                grid: {
                    width: game.grid.width,
                    height: game.grid.height,
                    tiles: this.serializeGrid(game.grid)
                },
                animals: game.zoo.animals.map(animal => ({
                    species: animal.species,
                    x: animal.x,
                    y: animal.y,
                    name: animal.name,
                    happiness: animal.happiness,
                    health: animal.health,
                    hunger: animal.hunger,
                    age: animal.age
                })),
                buildings: game.zoo.buildings.map(building => ({
                    type: building.type,
                    x: building.x,
                    y: building.y
                })),
                entrance: game.zoo.entrance ? {
                    x: game.zoo.entrance.x,
                    y: game.zoo.entrance.y,
                    ticketPrice: game.zoo.entrance.ticketPrice,
                    upgradeLevel: game.zoo.entrance.upgradeLevel,
                    guestsEntered: game.zoo.entrance.guestsEntered
                } : null,
                expansion: {
                    currentSize: game.zoo.expansion.currentSize
                },
                satisfaction: {
                    history: game.visitorManager.satisfactionHistory,
                    average: game.visitorManager.averageSatisfaction
                },
                unlockedAnimals: game.zoo.unlockedAnimals || []
            };

            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    serializeGrid(grid) {
        const tiles = [];
        for (let y = 0; y < grid.height; y++) {
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                if (tile && (tile.path || tile.building || tile.exhibit)) {
                    tiles.push({
                        x,
                        y,
                        path: tile.path ? { material: tile.path.material } : null,
                        building: tile.building ? { type: tile.building.type } : null,
                        exhibit: tile.exhibit ? {
                            x: tile.exhibit.x,
                            y: tile.exhibit.y,
                            width: tile.exhibit.width,
                            height: tile.exhibit.height,
                            fenceType: tile.exhibit.fenceType,
                            terrain: tile.exhibit.terrain
                        } : null
                    });
                }
            }
        }
        return tiles;
    }

    loadGame() {
        try {
            const saveDataString = localStorage.getItem(this.saveKey);
            if (!saveDataString) {
                return null;
            }

            const saveData = JSON.parse(saveDataString);
            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    deleteSave() {
        localStorage.removeItem(this.saveKey);
    }

    applyLoadedData(game, saveData) {
        // Restore zoo data
        game.zoo.money = saveData.zoo.money;
        game.zoo.date = saveData.zoo.date;
        game.zoo.zooRating = saveData.zoo.zooRating;

        // Restore expansion
        if (saveData.expansion && saveData.expansion.currentSize !== game.grid.width) {
            game.zoo.expansion.currentSize = saveData.expansion.currentSize;
            game.grid = new Grid(saveData.expansion.currentSize, saveData.expansion.currentSize, 2);
            game.renderer3d.grid = game.grid;
            game.renderer3d.createTerrain();
            game.renderer3d.createGridHelper();
        }

        // Restore grid tiles
        saveData.grid.tiles.forEach(tileData => {
            if (tileData.path) {
                game.grid.placePath(tileData.x, tileData.y, tileData.path.material);
                game.renderer3d.addPath(tileData.x, tileData.y, tileData.path.material);
            }
        });

        // Restore buildings
        saveData.buildings.forEach(buildingData => {
            const building = new Building(buildingData.type, buildingData.x, buildingData.y);
            game.grid.placeBuilding(buildingData.x, buildingData.y, building);
            game.renderer3d.addBuilding(building);
            game.zoo.addBuilding(building);
        });

        // Restore entrance
        if (saveData.entrance) {
            const entrance = new ParkEntrance(saveData.entrance.x, saveData.entrance.y);
            entrance.ticketPrice = saveData.entrance.ticketPrice;
            entrance.upgradeLevel = saveData.entrance.upgradeLevel;
            entrance.guestsEntered = saveData.entrance.guestsEntered;
            game.zoo.entrance = entrance;

            if (game.entranceMesh) {
                game.renderer3d.getScene().remove(game.entranceMesh);
            }
            game.entranceMesh = entrance.create3DMesh(game.grid.width, game.grid.height);
            game.renderer3d.getScene().add(game.entranceMesh);
        }

        // Restore animals
        saveData.animals.forEach(animalData => {
            const animal = new Animal(animalData.species, animalData.x, animalData.y);
            animal.name = animalData.name;
            animal.happiness = animalData.happiness;
            animal.health = animalData.health;
            animal.hunger = animalData.hunger;
            animal.age = animalData.age;

            game.zoo.addAnimal(animal);

            const animalMesh = game.animalFactory.createAnimal(animalData.species);
            animalMesh.userData.animal = animal;
            game.renderer3d.getScene().add(animalMesh);
            game.animalMeshes.push({ animal, mesh: animalMesh });
        });

        // Restore satisfaction
        if (saveData.satisfaction) {
            game.visitorManager.satisfactionHistory = saveData.satisfaction.history || [];
            game.visitorManager.averageSatisfaction = saveData.satisfaction.average || 0;
        }

        // Restore unlocked animals
        if (saveData.unlockedAnimals) {
            game.zoo.unlockedAnimals = saveData.unlockedAnimals;
        }

        // Update UI
        game.ui.updateStats();
        game.ui.updateEntranceUI();
        game.ui.updateExpansionUI();
    }
}
