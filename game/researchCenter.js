// Research Center - Déverrouiller des animaux rares via mini-jeux
class ResearchCenter {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.level = 1;
        this.researchPoints = 0;
        this.activeResearch = null;
    }

    startResearch(animalKey) {
        const animal = RareAnimals[animalKey];
        if (!animal) return false;

        this.activeResearch = {
            animalKey,
            animal,
            progress: 0,
            minigameType: animal.minigame
        };
        return true;
    }

    completeResearch(zoo) {
        if (!this.activeResearch) return false;

        zoo.unlockedAnimals.push(this.activeResearch.animalKey);
        this.activeResearch = null;
        return true;
    }
}

// Animaux rares à débloquer
const RareAnimals = {
    // Animaux légendaires
    whiteTiger: {
        name: 'White Tiger',
        emoji: '🐅',
        cost: 15000,
        attractiveness: 400,
        lifespan: 18,
        biome: 'jungle',
        minigame: 'memory',
        habitatNeeds: {
            minSize: 16,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: true
        },
        description: 'Majestic white tiger with incredible appeal'
    },
    redPanda: {
        name: 'Red Panda',
        emoji: '🦝',
        cost: 8000,
        attractiveness: 320,
        lifespan: 14,
        biome: 'jungle',
        minigame: 'puzzle',
        habitatNeeds: {
            minSize: 10,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: false
        },
        description: 'Adorable and rare red panda'
    },
    snowLeopard: {
        name: 'Snow Leopard',
        emoji: '🐆',
        cost: 12000,
        attractiveness: 380,
        lifespan: 16,
        biome: 'arctic',
        minigame: 'matching',
        habitatNeeds: {
            minSize: 14,
            terrain: 'snow',
            shelterRequired: true,
            waterRequired: false
        },
        description: 'Elusive and beautiful snow leopard'
    },
    komodoDragon: {
        name: 'Komodo Dragon',
        emoji: '🦎',
        cost: 10000,
        attractiveness: 350,
        lifespan: 30,
        biome: 'jungle',
        minigame: 'sequence',
        habitatNeeds: {
            minSize: 12,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: false
        },
        description: 'Massive and fearsome komodo dragon'
    },
    goldenMonkey: {
        name: 'Golden Monkey',
        emoji: '🐒',
        cost: 9000,
        attractiveness: 330,
        lifespan: 20,
        biome: 'jungle',
        minigame: 'memory',
        habitatNeeds: {
            minSize: 10,
            terrain: 'jungle',
            shelterRequired: true,
            waterRequired: false
        },
        description: 'Rare golden snub-nosed monkey'
    },
    arcticWolf: {
        name: 'Arctic Wolf',
        emoji: '🐺',
        cost: 11000,
        attractiveness: 360,
        lifespan: 12,
        biome: 'arctic',
        minigame: 'puzzle',
        habitatNeeds: {
            minSize: 14,
            terrain: 'snow',
            shelterRequired: true,
            waterRequired: false
        },
        description: 'Magnificent arctic wolf pack leader'
    }
};

// Mini-jeu - Memory Game
class MemoryMinigame {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.cards = [];
        this.flipped = [];
        this.matched = 0;
        this.gridSize = 4; // 4x4 = 16 cartes (8 paires)
        this.symbols = ['🦁', '🐘', '🦒', '🦓', '🐅', '🦍', '🐼', '🦊'];
        this.isActive = false;
    }

    init() {
        // Créer les paires
        this.cards = [];
        this.symbols.forEach(symbol => {
            this.cards.push({ symbol, matched: false });
            this.cards.push({ symbol, matched: false });
        });

        // Mélanger
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        this.flipped = [];
        this.matched = 0;
        this.isActive = true;
    }

    flipCard(index) {
        if (!this.isActive) return false;
        if (this.flipped.length >= 2) return false;
        if (this.flipped.includes(index)) return false;
        if (this.cards[index].matched) return false;

        this.flipped.push(index);

        if (this.flipped.length === 2) {
            setTimeout(() => this.checkMatch(), 800);
        }

        return true;
    }

    checkMatch() {
        const [i1, i2] = this.flipped;
        if (this.cards[i1].symbol === this.cards[i2].symbol) {
            this.cards[i1].matched = true;
            this.cards[i2].matched = true;
            this.matched += 2;

            if (this.matched === this.cards.length) {
                this.isActive = false;
                this.onComplete(true);
            }
        }
        this.flipped = [];
    }

    getState() {
        return {
            cards: this.cards,
            flipped: this.flipped,
            matched: this.matched,
            total: this.cards.length
        };
    }
}

// Mini-jeu - Puzzle Slider
class PuzzleMinigame {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.gridSize = 3; // 3x3
        this.tiles = [];
        this.emptyPos = { x: 2, y: 2 };
        this.moves = 0;
        this.isActive = false;
    }

    init() {
        // Créer la grille résolu
        this.tiles = [];
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const value = y * this.gridSize + x;
                this.tiles.push({ x, y, value });
            }
        }

        // Mélanger (seulement les mouvements valides pour garantir la résolution)
        for (let i = 0; i < 50; i++) {
            const moves = this.getValidMoves();
            if (moves.length > 0) {
                const move = moves[Math.floor(Math.random() * moves.length)];
                this.moveTile(move.x, move.y, false);
            }
        }

        this.moves = 0;
        this.isActive = true;
    }

    getValidMoves() {
        const moves = [];
        const { x, y } = this.emptyPos;

        if (x > 0) moves.push({ x: x - 1, y });
        if (x < this.gridSize - 1) moves.push({ x: x + 1, y });
        if (y > 0) moves.push({ x, y: y - 1 });
        if (y < this.gridSize - 1) moves.push({ x, y: y + 1 });

        return moves;
    }

    moveTile(x, y, countMove = true) {
        if (!this.isActive && countMove) return false;

        const dx = Math.abs(x - this.emptyPos.x);
        const dy = Math.abs(y - this.emptyPos.y);

        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            const tile = this.tiles.find(t => t.x === x && t.y === y);
            if (tile) {
                tile.x = this.emptyPos.x;
                tile.y = this.emptyPos.y;
                this.emptyPos = { x, y };

                if (countMove) {
                    this.moves++;
                    if (this.checkWin()) {
                        this.isActive = false;
                        this.onComplete(true);
                    }
                }
                return true;
            }
        }
        return false;
    }

    checkWin() {
        for (const tile of this.tiles) {
            const expectedX = tile.value % this.gridSize;
            const expectedY = Math.floor(tile.value / this.gridSize);
            if (tile.x !== expectedX || tile.y !== expectedY) {
                return false;
            }
        }
        return true;
    }

    getState() {
        return {
            tiles: this.tiles,
            emptyPos: this.emptyPos,
            gridSize: this.gridSize,
            moves: this.moves
        };
    }
}

// Mini-jeu - Sequence Memory
class SequenceMinigame {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.maxLevel = 8;
        this.isShowingSequence = false;
        this.isActive = false;
        this.gridButtons = 9; // 3x3 grille de boutons
    }

    init() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.isActive = true;
        this.nextRound();
    }

    nextRound() {
        // Ajouter un nouvel élément à la séquence
        this.sequence.push(Math.floor(Math.random() * this.gridButtons));
        this.playerSequence = [];
        this.showSequence();
    }

    showSequence() {
        this.isShowingSequence = true;
        // La séquence sera affichée par l'UI
        setTimeout(() => {
            this.isShowingSequence = false;
        }, this.sequence.length * 600 + 500);
    }

    pressButton(buttonIndex) {
        if (!this.isActive || this.isShowingSequence) return false;

        this.playerSequence.push(buttonIndex);

        // Vérifier si c'est correct
        const currentIndex = this.playerSequence.length - 1;
        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            // Erreur - recommencer
            this.onComplete(false);
            return false;
        }

        // Séquence complète correcte
        if (this.playerSequence.length === this.sequence.length) {
            this.level++;
            if (this.level > this.maxLevel) {
                // Gagné !
                this.isActive = false;
                this.onComplete(true);
            } else {
                setTimeout(() => this.nextRound(), 1000);
            }
        }

        return true;
    }

    getState() {
        return {
            sequence: this.isShowingSequence ? this.sequence : [],
            level: this.level,
            maxLevel: this.maxLevel,
            isShowingSequence: this.isShowingSequence,
            playerProgress: this.playerSequence.length
        };
    }
}
