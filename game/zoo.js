// Zoo Management System
class Zoo {
    constructor() {
        this.money = 50000;
        this.guestCount = 0;
        this.zooRating = 0;
        this.date = { month: 0, year: 2024 };
        this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        this.animals = [];
        this.buildings = [];
        this.exhibits = [];

        this.entrance = null; // Park entrance
        this.expansion = new ZooExpansion(); // Zoo expansion system

        this.expenses = {
            animalMaintenance: 0,
            staffSalaries: 0,
            utilities: 0
        };

        this.income = {
            admissions: 0,
            concessions: 0,
            donations: 0
        };

        this.isPaused = false;
        this.gameSpeed = 1; // 1, 2, 3
        this.tickCounter = 0;
    }

    update() {
        if (this.isPaused) return;

        this.tickCounter++;

        // Update selon la vitesse du jeu
        const ticksPerUpdate = Math.floor(60 / this.gameSpeed);

        if (this.tickCounter >= ticksPerUpdate) {
            this.tickCounter = 0;
            this.monthlyUpdate();
        }

        // Update des animaux
        this.animals.forEach(animal => animal.update());

        // Calculer le rating du zoo
        this.calculateZooRating();
    }

    monthlyUpdate() {
        // Avancer le temps
        this.date.month++;
        if (this.date.month >= 12) {
            this.date.month = 0;
            this.date.year++;
        }

        // Calculs financiers
        this.calculateIncome();
        this.calculateExpenses();

        // Appliquer les revenus et dépenses
        this.money += this.getTotalIncome() - this.getTotalExpenses();

        // Update du compteur de visiteurs
        this.updateGuestCount();
    }

    calculateIncome() {
        // Revenus des entrées - utilise le prix de ticket de l'entrée si elle existe
        if (this.entrance && this.entrance.isOpen) {
            // Simuler l'entrée de visiteurs
            for (let i = 0; i < this.guestCount; i++) {
                this.entrance.processGuest();
            }
            this.income.admissions = this.entrance.totalRevenue;
            this.entrance.totalRevenue = 0; // Reset for next month
        } else {
            const baseAdmission = 20;
            const attractivenessBonus = this.zooRating / 100;
            this.income.admissions = Math.floor(
                this.guestCount * baseAdmission * (1 + attractivenessBonus)
            );
        }

        // Revenus des concessions
        const foodStands = this.buildings.filter(b => b.type === 'food').length;
        const giftShops = this.buildings.filter(b => b.type === 'gift').length;
        this.income.concessions = Math.floor(
            this.guestCount * (foodStands * 5 + giftShops * 8)
        );

        // Donations basées sur la satisfaction
        this.income.donations = Math.floor(this.zooRating * 10);
    }

    calculateExpenses() {
        // Coûts de maintenance des animaux
        this.expenses.animalMaintenance = this.animals.reduce(
            (sum, animal) => sum + animal.maintenanceCost, 0
        );

        // Salaires du staff
        this.expenses.staffSalaries = this.animals.length * 100 + this.buildings.length * 50;

        // Utilities
        this.expenses.utilities = this.buildings.length * 30;
    }

    getTotalIncome() {
        return Object.values(this.income).reduce((sum, val) => sum + val, 0);
    }

    getTotalExpenses() {
        return Object.values(this.expenses).reduce((sum, val) => sum + val, 0);
    }

    updateGuestCount() {
        // Nombre de visiteurs basé sur les attractions
        const animalAttraction = this.animals.reduce(
            (sum, animal) => sum + animal.attractiveness, 0
        );
        const facilityBonus = this.buildings.filter(b =>
            ['food', 'drink', 'restroom', 'gift'].includes(b.type)
        ).length * 50;

        const baseGuests = 100;
        const seasonalFactor = 1 + Math.sin(this.date.month * Math.PI / 6) * 0.3;

        this.guestCount = Math.floor(
            (baseGuests + animalAttraction + facilityBonus) *
            (this.zooRating / 100) *
            seasonalFactor
        );
    }

    calculateZooRating() {
        if (this.animals.length === 0) {
            this.zooRating = 0;
            return;
        }

        // Rating basé sur le bonheur des animaux
        const animalHappiness = this.animals.reduce(
            (sum, animal) => sum + animal.happiness, 0
        ) / this.animals.length;

        // Rating basé sur les installations
        const facilityRating = Math.min(100, this.buildings.length * 5);

        // Rating global
        this.zooRating = Math.floor((animalHappiness * 0.7 + facilityRating * 0.3));
    }

    addAnimal(animal) {
        this.animals.push(animal);
    }

    removeAnimal(animal) {
        const index = this.animals.indexOf(animal);
        if (index > -1) {
            this.animals.splice(index, 1);
        }
    }

    addBuilding(building) {
        this.buildings.push(building);
    }

    removeBuilding(building) {
        const index = this.buildings.indexOf(building);
        if (index > -1) {
            this.buildings.splice(index, 1);
        }
    }

    canAfford(cost) {
        return this.money >= cost;
    }

    spend(amount) {
        if (this.canAfford(amount)) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    earn(amount) {
        this.money += amount;
    }

    getDateString() {
        return `${this.monthNames[this.date.month]} ${this.date.year}`;
    }

    setGameSpeed(speed) {
        this.gameSpeed = Math.max(1, Math.min(3, speed));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
    }
}
