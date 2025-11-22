// Système d'environnement (météo et cycle jour/nuit)
class EnvironmentManager {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.time = 12; // Heure (0-24)
        this.timeSpeed = 0.001; // Vitesse du temps
        this.weather = 'sunny'; // sunny, cloudy, rainy
        this.weatherChangeTimer = 0;

        this.sun = null;
        this.ambientLight = null;
        this.directionalLight = null;
        this.rainParticles = null;
        this.clouds = [];

        this.init();
    }

    init() {
        // Créer le soleil
        const sunGeometry = new THREE.SphereGeometry(5, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);

        // Récupérer les lumières existantes
        this.ambientLight = this.scene.children.find(child => child instanceof THREE.AmbientLight);
        this.directionalLight = this.scene.children.find(child =>
            child instanceof THREE.DirectionalLight
        );

        // Créer des nuages
        this.createClouds();
    }

    createClouds() {
        const cloudGeometry = new THREE.SphereGeometry(3, 8, 8);
        const cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.7
        });

        for (let i = 0; i < 10; i++) {
            const cloud = new THREE.Group();

            // Plusieurs sphères pour former un nuage
            for (let j = 0; j < 3; j++) {
                const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloudPart.position.set(
                    (Math.random() - 0.5) * 6,
                    0,
                    (Math.random() - 0.5) * 6
                );
                cloudPart.scale.set(
                    0.5 + Math.random() * 0.5,
                    0.3 + Math.random() * 0.3,
                    0.5 + Math.random() * 0.5
                );
                cloud.add(cloudPart);
            }

            cloud.position.set(
                (Math.random() - 0.5) * 100,
                20 + Math.random() * 10,
                (Math.random() - 0.5) * 100
            );

            cloud.userData = {
                speedX: (Math.random() - 0.5) * 0.02,
                speedZ: (Math.random() - 0.5) * 0.02
            };

            this.clouds.push(cloud);
            this.scene.add(cloud);
        }
    }

    createRain() {
        if (this.rainParticles) return;

        const particleCount = 1000;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = Math.random() * 50;
            positions[i + 2] = (Math.random() - 0.5) * 100;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x4A90E2,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.rainParticles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.rainParticles);
    }

    removeRain() {
        if (this.rainParticles) {
            this.scene.remove(this.rainParticles);
            this.rainParticles = null;
        }
    }

    update() {
        // Cycle jour/nuit
        this.time += this.timeSpeed;
        if (this.time >= 24) this.time = 0;

        // Position du soleil
        const sunAngle = (this.time / 24) * Math.PI * 2 - Math.PI / 2;
        this.sun.position.x = Math.cos(sunAngle) * 50;
        this.sun.position.y = Math.sin(sunAngle) * 50 + 20;
        this.sun.position.z = 0;

        // Couleur du soleil selon l'heure
        if (this.time < 6 || this.time > 20) {
            // Nuit - lune
            this.sun.material.color.setHex(0xCCCCCC);
        } else if (this.time < 8 || this.time > 18) {
            // Aube/crépuscule
            this.sun.material.color.setHex(0xFFAA00);
        } else {
            // Jour
            this.sun.material.color.setHex(0xFFFF00);
        }

        // Intensité de la lumière selon l'heure
        const dayIntensity = Math.max(0.3, Math.sin((this.time / 24) * Math.PI * 2) + 0.5);
        if (this.ambientLight) {
            this.ambientLight.intensity = 0.4 + dayIntensity * 0.4;
        }
        if (this.directionalLight) {
            this.directionalLight.intensity = 0.3 + dayIntensity * 0.7;
            this.directionalLight.position.copy(this.sun.position);
        }

        // Couleur du ciel selon l'heure
        let skyColor;
        if (this.time < 6 || this.time > 20) {
            skyColor = 0x000033; // Nuit
        } else if (this.time < 8 || this.time > 18) {
            skyColor = 0xFF6B4A; // Aube/crépuscule
        } else {
            skyColor = 0x87CEEB; // Jour
        }
        this.scene.background = new THREE.Color(skyColor);
        if (this.scene.fog) {
            this.scene.fog.color = new THREE.Color(skyColor);
        }

        // Météo
        this.weatherChangeTimer++;
        if (this.weatherChangeTimer > 2000) {
            this.changeWeather();
            this.weatherChangeTimer = 0;
        }

        // Animation des nuages
        this.clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.speedX;
            cloud.position.z += cloud.userData.speedZ;

            // Repositionner les nuages qui sortent de la zone
            if (cloud.position.x > 60) cloud.position.x = -60;
            if (cloud.position.x < -60) cloud.position.x = 60;
            if (cloud.position.z > 60) cloud.position.z = -60;
            if (cloud.position.z < -60) cloud.position.z = 60;

            // Opacité selon la météo
            const targetOpacity = this.weather === 'cloudy' ? 0.9 :
                                 this.weather === 'rainy' ? 1.0 : 0.3;
            cloud.children.forEach(part => {
                part.material.opacity += (targetOpacity - part.material.opacity) * 0.01;
            });
        });

        // Animation de la pluie
        if (this.rainParticles) {
            const positions = this.rainParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 0.5; // Vitesse de chute
                if (positions[i + 1] < 0) {
                    positions[i + 1] = 50;
                }
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
        }
    }

    changeWeather() {
        const weathers = ['sunny', 'cloudy', 'rainy'];
        const newWeather = weathers[Math.floor(Math.random() * weathers.length)];

        if (newWeather !== this.weather) {
            this.weather = newWeather;

            if (this.weather === 'rainy') {
                this.createRain();
            } else {
                this.removeRain();
            }
        }
    }

    getWeatherIcon() {
        const icons = {
            sunny: '☀️',
            cloudy: '☁️',
            rainy: '🌧️'
        };
        return icons[this.weather] || '☀️';
    }

    getTimeString() {
        const hours = Math.floor(this.time);
        const minutes = Math.floor((this.time - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}
