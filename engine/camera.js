// Camera System - Caméra isométrique avec rotation et zoom
class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.rotation = 0; // 0, 90, 180, 270 degrés
        this.targetRotation = 0;
        this.offsetX = 0;
        this.offsetY = 0;

        // Limites de zoom
        this.minZoom = 0.5;
        this.maxZoom = 2.0;

        // Animation de rotation
        this.isRotating = false;
        this.rotationSpeed = 5;

        // Drag de la caméra
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragStartCamX = 0;
        this.dragStartCamY = 0;

        this.setupControls();
    }

    setupControls() {
        // Drag avec le bouton du milieu ou clic droit
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) { // Middle or right click
                e.preventDefault();
                this.isDragging = true;
                this.dragStartX = e.clientX;
                this.dragStartY = e.clientY;
                this.dragStartCamX = this.x;
                this.dragStartCamY = this.y;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.dragStartX;
                const dy = e.clientY - this.dragStartY;
                this.x = this.dragStartCamX - dx / this.zoom;
                this.y = this.dragStartCamY - dy / this.zoom;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 1 || e.button === 2) {
                this.isDragging = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Zoom avec la molette
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.setZoom(this.zoom * zoomFactor);
        });

        // Désactiver le menu contextuel
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Touches clavier pour déplacement
        document.addEventListener('keydown', (e) => {
            const speed = 20 / this.zoom;
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.y -= speed;
                    break;
                case 's':
                case 'arrowdown':
                    this.y += speed;
                    break;
                case 'a':
                case 'arrowleft':
                    this.x -= speed;
                    break;
                case 'd':
                case 'arrowright':
                    this.x += speed;
                    break;
            }
        });
    }

    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
    }

    rotate(direction) {
        // Direction: 1 pour droite, -1 pour gauche
        this.targetRotation = (this.targetRotation + direction * 90) % 360;
        if (this.targetRotation < 0) this.targetRotation += 360;
        this.isRotating = true;
    }

    update() {
        // Animation de rotation fluide
        if (this.isRotating) {
            const diff = this.targetRotation - this.rotation;

            // Trouver le chemin le plus court
            let shortestDiff = diff;
            if (Math.abs(diff) > 180) {
                shortestDiff = diff > 0 ? diff - 360 : diff + 360;
            }

            if (Math.abs(shortestDiff) < this.rotationSpeed) {
                this.rotation = this.targetRotation;
                this.isRotating = false;
            } else {
                this.rotation += Math.sign(shortestDiff) * this.rotationSpeed;
            }

            // Normaliser
            if (this.rotation < 0) this.rotation += 360;
            if (this.rotation >= 360) this.rotation -= 360;
        }

        // Calculer les offsets pour le rendu
        this.offsetX = this.canvas.width / 2 - this.x * this.zoom;
        this.offsetY = this.canvas.height / 2 - this.y * this.zoom;
    }

    apply(ctx) {
        ctx.save();

        // Translation vers le centre
        ctx.translate(this.canvas.width / 2, this.canvas.height / 2);

        // Zoom
        ctx.scale(this.zoom, this.zoom);

        // Rotation
        const rad = this.rotation * Math.PI / 180;
        ctx.rotate(rad);

        // Translation de la caméra
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }

    // Obtenir les coordonnées monde depuis l'écran
    screenToWorld(screenX, screenY) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Retirer le centre
        let x = (screenX - centerX) / this.zoom;
        let y = (screenY - centerY) / this.zoom;

        // Rotation inverse
        const rad = -this.rotation * Math.PI / 180;
        const rotX = x * Math.cos(rad) - y * Math.sin(rad);
        const rotY = x * Math.sin(rad) + y * Math.cos(rad);

        // Ajouter la position de la caméra
        return {
            x: rotX + this.x,
            y: rotY + this.y
        };
    }
}
