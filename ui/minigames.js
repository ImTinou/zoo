// Mini-games UI Manager
class MinigameUI {
    constructor(zoo) {
        this.zoo = zoo;
        this.currentGame = null;
        this.currentAnimalKey = null;
        this.modal = null;
        this.createModal();
    }

    createModal() {
        // Créer le modal pour les mini-jeux
        const modal = document.createElement('div');
        modal.id = 'minigameModal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        `;

        modal.innerHTML = `
            <div style="background: #1c1c1e; border-radius: 20px; padding: 30px; max-width: 600px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 id="minigameTitle" style="color: #fff; margin: 0;"></h2>
                    <button id="closeMinigame" style="background: #ff453a; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">×</button>
                </div>
                <p id="minigameDescription" style="color: #8e8ea0; margin-bottom: 20px;"></p>
                <div id="minigameContent" style="min-height: 400px;"></div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // Close button
        modal.querySelector('#closeMinigame').addEventListener('click', () => {
            this.closeMinigame();
        });
    }

    showResearchOptions() {
        const options = [];
        for (const [key, animal] of Object.entries(RareAnimals)) {
            const isUnlocked = this.zoo.unlockedAnimals && this.zoo.unlockedAnimals.includes(key);
            options.push({
                key,
                animal,
                unlocked: isUnlocked
            });
        }

        const content = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                ${options.map(opt => `
                    <div class="${opt.unlocked ? 'research-card unlocked' : 'research-card'}"
                         data-animal-key="${opt.key}"
                         style="background: ${opt.unlocked ? '#2c2c2e' : '#3a3a3c'};
                                padding: 15px;
                                border-radius: 10px;
                                cursor: ${opt.unlocked ? 'not-allowed' : 'pointer'};
                                border: 2px solid ${opt.unlocked ? '#30d158' : 'transparent'};
                                opacity: ${opt.unlocked ? '0.6' : '1'};">
                        <div style="font-size: 48px; text-align: center; margin-bottom: 10px;">${opt.animal.emoji}</div>
                        <h3 style="color: #fff; text-align: center; margin: 0 0 8px 0; font-size: 16px;">${opt.animal.name}</h3>
                        <p style="color: #8e8ea0; font-size: 12px; text-align: center; margin: 0 0 10px 0;">${opt.animal.description}</p>
                        <div style="text-align: center; color: #30d158; font-size: 14px; margin-bottom: 5px;">
                            ${opt.unlocked ? '✅ Unlocked' : '🎮 ' + opt.animal.minigame.toUpperCase()}
                        </div>
                        <div style="text-align: center; color: #ffd60a; font-size: 12px;">
                            Attractiveness: ${opt.animal.attractiveness}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.modal.querySelector('#minigameTitle').textContent = 'Research Center 🔬';
        this.modal.querySelector('#minigameDescription').textContent = 'Play mini-games to unlock rare animals!';
        this.modal.querySelector('#minigameContent').innerHTML = content;
        this.modal.style.display = 'flex';

        // Add click handlers
        this.modal.querySelectorAll('.research-card:not(.unlocked)').forEach(card => {
            card.addEventListener('click', () => {
                const animalKey = card.dataset.animalKey;
                this.startMinigame(animalKey);
            });
        });
    }

    startMinigame(animalKey) {
        this.currentAnimalKey = animalKey;
        const animal = RareAnimals[animalKey];

        switch (animal.minigame) {
            case 'memory':
                this.startMemoryGame(animal);
                break;
            case 'puzzle':
                this.startPuzzleGame(animal);
                break;
            case 'sequence':
                this.startSequenceGame(animal);
                break;
            default:
                this.startMemoryGame(animal);
        }
    }

    startMemoryGame(animal) {
        this.currentGame = new MemoryMinigame((success) => {
            if (success) {
                this.unlockAnimal(this.currentAnimalKey);
            }
        });
        this.currentGame.init();

        this.modal.querySelector('#minigameTitle').textContent = `Memory Game - ${animal.name}`;
        this.modal.querySelector('#minigameDescription').textContent = 'Match all pairs to unlock this animal!';

        this.renderMemoryGame();
    }

    renderMemoryGame() {
        const state = this.currentGame.getState();
        const gridSize = 4;

        let html = `
            <div style="margin-bottom: 15px; text-align: center; color: #fff;">
                Matched: ${state.matched}/${state.total}
            </div>
            <div style="display: grid; grid-template-columns: repeat(${gridSize}, 1fr); gap: 10px; max-width: 400px; margin: 0 auto;">
        `;

        state.cards.forEach((card, index) => {
            const isFlipped = state.flipped.includes(index) || card.matched;
            html += `
                <div class="memory-card" data-index="${index}"
                     style="background: ${isFlipped ? '#30d158' : '#3a3a3c'};
                            aspect-ratio: 1;
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            cursor: ${isFlipped ? 'default' : 'pointer'};
                            transition: all 0.3s;">
                    ${isFlipped ? card.symbol : '❓'}
                </div>
            `;
        });

        html += '</div>';
        this.modal.querySelector('#minigameContent').innerHTML = html;

        // Add click handlers
        this.modal.querySelectorAll('.memory-card').forEach(card => {
            card.addEventListener('click', () => {
                const index = parseInt(card.dataset.index);
                if (this.currentGame.flipCard(index)) {
                    this.renderMemoryGame();
                }
            });
        });
    }

    startPuzzleGame(animal) {
        this.currentGame = new PuzzleMinigame((success) => {
            if (success) {
                this.unlockAnimal(this.currentAnimalKey);
            }
        });
        this.currentGame.init();

        this.modal.querySelector('#minigameTitle').textContent = `Puzzle Slider - ${animal.name}`;
        this.modal.querySelector('#minigameDescription').textContent = 'Arrange the tiles in order!';

        this.renderPuzzleGame();
    }

    renderPuzzleGame() {
        const state = this.currentGame.getState();

        let html = `
            <div style="margin-bottom: 15px; text-align: center; color: #fff;">
                Moves: ${state.moves}
            </div>
            <div style="display: grid; grid-template-columns: repeat(${state.gridSize}, 1fr); gap: 8px; max-width: 350px; margin: 0 auto;">
        `;

        for (let y = 0; y < state.gridSize; y++) {
            for (let x = 0; x < state.gridSize; x++) {
                const tile = state.tiles.find(t => t.x === x && t.y === y);
                const isEmpty = (x === state.emptyPos.x && y === state.emptyPos.y);

                html += `
                    <div class="puzzle-tile" data-x="${x}" data-y="${y}"
                         style="background: ${isEmpty ? 'transparent' : '#30d158'};
                                aspect-ratio: 1;
                                border-radius: 8px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 36px;
                                font-weight: bold;
                                color: white;
                                cursor: ${isEmpty ? 'default' : 'pointer'};
                                transition: all 0.2s;">
                        ${tile ? tile.value + 1 : ''}
                    </div>
                `;
            }
        }

        html += '</div>';
        this.modal.querySelector('#minigameContent').innerHTML = html;

        // Add click handlers
        this.modal.querySelectorAll('.puzzle-tile').forEach(tile => {
            tile.addEventListener('click', () => {
                const x = parseInt(tile.dataset.x);
                const y = parseInt(tile.dataset.y);
                if (this.currentGame.moveTile(x, y)) {
                    this.renderPuzzleGame();
                }
            });
        });
    }

    startSequenceGame(animal) {
        this.currentGame = new SequenceMinigame((success) => {
            if (success) {
                this.unlockAnimal(this.currentAnimalKey);
            } else {
                // Restart
                setTimeout(() => {
                    this.currentGame.init();
                    this.renderSequenceGame();
                }, 1000);
            }
        });
        this.currentGame.init();

        this.modal.querySelector('#minigameTitle').textContent = `Sequence Memory - ${animal.name}`;
        this.modal.querySelector('#minigameDescription').textContent = 'Memorize and repeat the sequence!';

        this.renderSequenceGame();
    }

    renderSequenceGame() {
        const state = this.currentGame.getState();

        let html = `
            <div style="margin-bottom: 15px; text-align: center; color: #fff;">
                Level: ${state.level}/${state.maxLevel} | Progress: ${state.playerProgress}
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 300px; margin: 0 auto;">
        `;

        for (let i = 0; i < 9; i++) {
            const isHighlighted = state.isShowingSequence && state.sequence[state.sequence.length - 1] === i;
            html += `
                <div class="sequence-button" data-index="${i}"
                     style="background: ${isHighlighted ? '#ffd60a' : '#3a3a3c'};
                            aspect-ratio: 1;
                            border-radius: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            cursor: pointer;
                            transition: all 0.2s;
                            border: 3px solid ${isHighlighted ? '#fff' : 'transparent'};">
                    ${i + 1}
                </div>
            `;
        }

        html += '</div>';
        this.modal.querySelector('#minigameContent').innerHTML = html;

        // Show sequence animation
        if (state.isShowingSequence) {
            state.sequence.forEach((buttonIndex, i) => {
                setTimeout(() => {
                    const buttons = this.modal.querySelectorAll('.sequence-button');
                    buttons.forEach(btn => btn.style.background = '#3a3a3c');
                    buttons[buttonIndex].style.background = '#ffd60a';
                    buttons[buttonIndex].style.borderColor = '#fff';

                    setTimeout(() => {
                        buttons[buttonIndex].style.background = '#3a3a3c';
                        buttons[buttonIndex].style.borderColor = 'transparent';
                    }, 400);
                }, i * 600);
            });
        }

        // Add click handlers
        this.modal.querySelectorAll('.sequence-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                if (this.currentGame.pressButton(index)) {
                    btn.style.background = '#30d158';
                    setTimeout(() => {
                        btn.style.background = '#3a3a3c';
                    }, 200);
                } else if (!state.isShowingSequence) {
                    btn.style.background = '#ff453a';
                    setTimeout(() => {
                        btn.style.background = '#3a3a3c';
                    }, 200);
                }
            });
        });
    }

    unlockAnimal(animalKey) {
        if (!this.zoo.unlockedAnimals) {
            this.zoo.unlockedAnimals = [];
        }
        this.zoo.unlockedAnimals.push(animalKey);

        const animal = RareAnimals[animalKey];

        // Success message
        this.modal.querySelector('#minigameContent').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 80px; margin-bottom: 20px;">${animal.emoji}</div>
                <h2 style="color: #30d158; margin-bottom: 15px;">🎉 Unlocked! 🎉</h2>
                <h3 style="color: #fff; margin-bottom: 10px;">${animal.name}</h3>
                <p style="color: #8e8ea0; margin-bottom: 20px;">${animal.description}</p>
                <button id="backToResearch" style="background: #30d158; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Back to Research
                </button>
            </div>
        `;

        this.modal.querySelector('#backToResearch').addEventListener('click', () => {
            this.showResearchOptions();
        });

        // Sauvegarder
        if (window.game && window.game.saveSystem) {
            window.game.saveSystem.saveGame(window.game);
        }
    }

    closeMinigame() {
        this.modal.style.display = 'none';
        this.currentGame = null;
        this.currentAnimalKey = null;
    }
}
