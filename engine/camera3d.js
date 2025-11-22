// Camera 3D System for Three.js
class Camera3D {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Caméra orthographique pour vue isométrique
        const aspect = this.width / this.height;
        const frustumSize = 50;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            0.1,
            1000
        );

        // Position isométrique
        this.distance = 50;
        this.angle = Math.PI / 4; // 45 degrés
        this.rotation = 0; // Rotation autour du centre (0, 90, 180, 270)
        this.targetRotation = 0;
        this.isRotating = false;

        // Target (point regardé)
        this.target = new THREE.Vector3(0, 0, 0);

        // Zoom
        this.zoom = 1;
        this.minZoom = 0.3;
        this.maxZoom = 2;

        // Drag
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };

        this.updateCameraPosition();

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    updateCameraPosition() {
        const rad = this.rotation * Math.PI / 180;

        this.camera.position.x = this.target.x + Math.cos(rad) * this.distance;
        this.camera.position.z = this.target.z + Math.sin(rad) * this.distance;
        this.camera.position.y = this.target.y + this.distance * 0.7;

        this.camera.lookAt(this.target);
        this.camera.zoom = this.zoom;
        this.camera.updateProjectionMatrix();
    }

    rotate(direction) {
        // Direction: 1 pour droite, -1 pour gauche (90° increment)
        this.targetRotation = (this.targetRotation + direction * 90) % 360;
        if (this.targetRotation < 0) this.targetRotation += 360;
        this.isRotating = true;
    }

    setZoom(newZoom) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));
        this.updateCameraPosition();
    }

    pan(deltaX, deltaY) {
        // Pan basé sur la rotation actuelle
        const rad = this.rotation * Math.PI / 180;
        const panSpeed = 0.1 / this.zoom;

        this.target.x += (Math.cos(rad + Math.PI/2) * deltaX - Math.sin(rad + Math.PI/2) * deltaY) * panSpeed;
        this.target.z += (Math.sin(rad + Math.PI/2) * deltaX + Math.cos(rad + Math.PI/2) * deltaY) * panSpeed;

        this.updateCameraPosition();
    }

    update() {
        // Animation de rotation fluide
        if (this.isRotating) {
            const diff = this.targetRotation - this.rotation;
            let shortestDiff = diff;

            if (Math.abs(diff) > 180) {
                shortestDiff = diff > 0 ? diff - 360 : diff + 360;
            }

            if (Math.abs(shortestDiff) < 5) {
                this.rotation = this.targetRotation;
                this.isRotating = false;
            } else {
                this.rotation += Math.sign(shortestDiff) * 5;
            }

            if (this.rotation < 0) this.rotation += 360;
            if (this.rotation >= 360) this.rotation -= 360;

            this.updateCameraPosition();
        }
    }

    onResize() {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        const aspect = this.width / this.height;
        const frustumSize = 50;

        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;

        this.camera.updateProjectionMatrix();
    }

    getCamera() {
        return this.camera;
    }
}
