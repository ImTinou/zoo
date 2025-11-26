// Save System - Firebase Cloud Only
class SaveSystem {
    constructor() {
        this.autoSaveInterval = 30000; // Sauvegarde auto toutes les 30 secondes
        this.autoSaveTimer = null;
        this.firebaseService = null;
        this.saveStatusUI = null;
    }

    setFirebaseService(firebaseService) {
        this.firebaseService = firebaseService;
    }

    setSaveStatusUI(saveStatusUI) {
        this.saveStatusUI = saveStatusUI;
    }

    startAutoSave(game) {
        this.autoSaveTimer = setInterval(async () => {
            // Only auto-save if authenticated
            if (this.firebaseService && this.firebaseService.isAuthenticated()) {
                await this.saveGame(game);
                console.log('🔄 Auto-save completed');
            }
        }, this.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }

    async saveGame(game, isPublic = false) {
        // Require authentication
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('⚠️ Cannot save: User not authenticated');
            if (this.saveStatusUI) {
                this.saveStatusUI.showError('Not authenticated');
            }
            return false;
        }

        // Show saving status
        if (this.saveStatusUI) {
            this.saveStatusUI.showSaving();
        }

        try {
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                zoo: {
                    money: game.zoo.money || 0,
                    date: game.zoo.date || { month: 1, year: 2024 },
                    zooRating: game.zoo.zooRating || 0,
                    guestCount: game.zoo.guestCount || 0
                },
                grid: {
                    width: game.grid.width || 40,
                    height: game.grid.height || 40,
                    tiles: this.serializeGrid(game.grid)
                },
                exhibits: game.zoo.exhibits.map(exhibit => ({
                    x: exhibit.x || 0,
                    y: exhibit.y || 0,
                    width: exhibit.width || 1,
                    height: exhibit.height || 1,
                    id: exhibit.id || '',
                    fenceType: exhibit.fenceType || 'wood',
                    terrain: exhibit.terrain || 'grass',
                    hasShelter: exhibit.hasShelter || false,
                    hasWater: exhibit.hasWater || false
                })),
                animals: game.zoo.animals.map(animal => ({
                    species: animal.species || 'lion',
                    x: animal.x || 0,
                    y: animal.y || 0,
                    name: animal.name || 'Unknown',
                    happiness: animal.happiness || 50,
                    health: animal.health || 100,
                    hunger: animal.hunger || 50,
                    age: animal.age || 0,
                    exhibitId: animal.exhibit ? animal.exhibit.id : ''
                })),
                buildings: game.zoo.buildings.map(building => ({
                    type: building.type || 'unknown',
                    x: building.x || 0,
                    y: building.y || 0
                })),
                entrance: game.zoo.entrance ? {
                    x: game.zoo.entrance.x || 0,
                    y: game.zoo.entrance.y || 0,
                    ticketPrice: game.zoo.entrance.ticketPrice || 20,
                    upgradeLevel: game.zoo.entrance.upgradeLevel || 1,
                    guestsEntered: game.zoo.entrance.guestsEntered || 0
                } : null,
                expansion: {
                    currentSize: game.zoo.expansion.currentSize || 40
                },
                satisfaction: {
                    history: game.visitorManager.satisfactionHistory || [],
                    average: game.visitorManager.averageSatisfaction || 0
                },
                unlockedAnimals: game.zoo.unlockedAnimals || []
            };

            // Save to Firebase only
            await this.firebaseService.saveZoo(saveData, isPublic);

            // Show success status
            if (this.saveStatusUI) {
                this.saveStatusUI.showSaved();
            }

            return true;
        } catch (error) {
            console.error('❌ Failed to save game:', error);

            // Show error status
            if (this.saveStatusUI) {
                this.saveStatusUI.showError('Save failed');
            }

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

    async loadGame() {
        // Require authentication
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('⚠️ Cannot load: User not authenticated');
            return null;
        }

        try {
            const result = await this.firebaseService.loadZoo();

            if (result.success) {
                return result.data;
            } else {
                console.log('ℹ️ No saved game found');
                return null;
            }
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            return null;
        }
    }

    async hasSave() {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            return false;
        }

        const data = await this.loadGame();
        return data !== null;
    }

    async deleteSave() {
        if (!this.firebaseService || !this.firebaseService.isAuthenticated()) {
            console.warn('⚠️ Cannot delete: User not authenticated');
            return false;
        }

        try {
            const result = await this.firebaseService.deleteZoo();
            return result.success;
        } catch (error) {
            console.error('❌ Failed to delete save:', error);
            return false;
        }
    }

    applyLoadedData(game, saveData) {
        // Clear existing data
        game.zoo.animals = [];
        game.zoo.exhibits = [];
        game.zoo.buildings = [];
        game.animalMeshes = [];
        game.enrichmentMeshes = [];

        // Clear scene meshes (animals, enrichments, etc.)
        const scene = game.renderer3d.getScene();
        const objectsToRemove = [];
        scene.children.forEach(child => {
            if (child.userData && (child.userData.animal || child.userData.enrichment || child.userData.fence || child.userData.exhibit)) {
                objectsToRemove.push(child);
            }
        });
        objectsToRemove.forEach(obj => scene.remove(obj));

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

        // Restore exhibits first
        const exhibitMap = new Map(); // id -> exhibit
        if (saveData.exhibits) {
            saveData.exhibits.forEach(exhibitData => {
                const exhibit = new Exhibit(
                    exhibitData.x,
                    exhibitData.y,
                    exhibitData.width,
                    exhibitData.height
                );
                exhibit.id = exhibitData.id;
                exhibit.fenceType = exhibitData.fenceType;
                exhibit.terrain = exhibitData.terrain || 'grass';
                exhibit.hasShelter = exhibitData.hasShelter || false;
                exhibit.hasWater = exhibitData.hasWater || false;

                // Rebuild fences
                const spec = game.fenceBuilder.getFenceTypes()[exhibitData.fenceType];
                const minX = exhibitData.x;
                const maxX = exhibitData.x + exhibitData.width - 1;
                const minY = exhibitData.y;
                const maxY = exhibitData.y + exhibitData.height - 1;

                // Horizontal fences
                for (let x = minX; x <= maxX; x++) {
                    game.fenceBuilder.placeFence(x, minY, 'horizontal', spec, exhibit);
                    if (minY !== maxY) {
                        game.fenceBuilder.placeFence(x, maxY, 'horizontal', spec, exhibit);
                    }
                }

                // Vertical fences
                for (let y = minY + 1; y < maxY; y++) {
                    game.fenceBuilder.placeFence(minX, y, 'vertical', spec, exhibit);
                    if (minX !== maxX) {
                        game.fenceBuilder.placeFence(maxX, y, 'vertical', spec, exhibit);
                    }
                }

                // Mark tiles as part of exhibit
                for (let y = minY; y <= maxY; y++) {
                    for (let x = minX; x <= maxX; x++) {
                        const tile = game.grid.getTile(x, y);
                        if (tile) {
                            tile.exhibit = exhibit;
                        }
                    }
                }

                // Apply terrain
                game.terrainManager.applyTerrainToExhibit(exhibit, exhibit.terrain);

                game.zoo.exhibits.push(exhibit);
                exhibitMap.set(exhibit.id, exhibit);
            });
        }

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

            // Restore exhibit assignment
            if (animalData.exhibitId && exhibitMap.has(animalData.exhibitId)) {
                const exhibit = exhibitMap.get(animalData.exhibitId);
                exhibit.addAnimal(animal);
            }

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
