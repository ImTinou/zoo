let cameraControls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    rotateLeft: false,
    rotateRight: false,
    mouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
    rotation: 0,
    tilt: Math.PI / 6
};

function initCameraControls() {
    // Clavier
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case 'z': cameraControls.forward = true; break;
            case 's': cameraControls.backward = true; break;
            case 'q': cameraControls.left = true; break;
            case 'd': cameraControls.right = true; break;
            case 'a': cameraControls.rotateLeft = true; break;
            case 'e': cameraControls.rotateRight = true; break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key.toLowerCase()) {
            case 'z': cameraControls.forward = false; break;
            case 's': cameraControls.backward = false; break;
            case 'q': cameraControls.left = false; break;
            case 'd': cameraControls.right = false; break;
            case 'a': cameraControls.rotateLeft = false; break;
            case 'e': cameraControls.rotateRight = false; break;
        }
    });

    // Souris pour rotation (clic droit)
    renderer.domElement.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            cameraControls.mouseDown = true;
            cameraControls.lastMouseX = e.clientX;
            cameraControls.lastMouseY = e.clientY;
            e.preventDefault();
        }
    });

    renderer.domElement.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            cameraControls.mouseDown = false;
        }
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (cameraControls.mouseDown) {
            const deltaX = e.clientX - cameraControls.lastMouseX;
            const deltaY = e.clientY - cameraControls.lastMouseY;
            
            cameraControls.rotation -= deltaX * 0.005;
            cameraControls.tilt = Math.max(0.1, Math.min(Math.PI / 2.5, cameraControls.tilt + deltaY * 0.005));
            
            cameraControls.lastMouseX = e.clientX;
            cameraControls.lastMouseY = e.clientY;
        }
    });

    // Désactiver le menu contextuel
    renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Zoom avec la molette
    renderer.domElement.addEventListener('wheel', (e) => {
        const zoomSpeed = 2;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        if (e.deltaY < 0) {
            camera.position.addScaledVector(direction, zoomSpeed);
        } else {
            camera.position.addScaledVector(direction, -zoomSpeed);
        }
        
        e.preventDefault();
    });
}

function updateCameraControls() {
    const moveSpeed = 0.5;
    const rotateSpeed = 0.03;

    // Rotation
    if (cameraControls.rotateLeft) cameraControls.rotation += rotateSpeed;
    if (cameraControls.rotateRight) cameraControls.rotation -= rotateSpeed;

    // Calculer la direction basée sur la rotation
    const forward = new THREE.Vector3(
        Math.sin(cameraControls.rotation),
        0,
        Math.cos(cameraControls.rotation)
    );
    const right = new THREE.Vector3(
        Math.cos(cameraControls.rotation),
        0,
        -Math.sin(cameraControls.rotation)
    );

    // Déplacement
    if (cameraControls.forward) {
        camera.position.addScaledVector(forward, moveSpeed);
    }
    if (cameraControls.backward) {
        camera.position.addScaledVector(forward, -moveSpeed);
    }
    if (cameraControls.left) {
        camera.position.addScaledVector(right, -moveSpeed);
    }
    if (cameraControls.right) {
        camera.position.addScaledVector(right, moveSpeed);
    }

    // Limites de la caméra
    const maxDist = GRID_SIZE * CELL_SIZE / 2 - 5;
    camera.position.x = Math.max(-maxDist, Math.min(maxDist, camera.position.x));
    camera.position.z = Math.max(-maxDist, Math.min(maxDist, camera.position.z));
    camera.position.y = Math.max(5, Math.min(50, camera.position.y));

    // Mise à jour de la direction de la caméra
    const distance = 30;
    const targetX = camera.position.x + Math.sin(cameraControls.rotation) * distance * Math.cos(cameraControls.tilt);
    const targetY = camera.position.y - distance * Math.sin(cameraControls.tilt);
    const targetZ = camera.position.z + Math.cos(cameraControls.rotation) * distance * Math.cos(cameraControls.tilt);
    
    camera.lookAt(targetX, targetY, targetZ);
}