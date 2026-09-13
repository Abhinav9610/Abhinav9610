import * as THREE from 'three';

export class Game {
    constructor(scene, camera, uiManager) {
        this.scene = scene;
        this.camera = camera;
        this.uiManager = uiManager;

        this.player = new Player(scene);

        this.score = 0;
        this.energyCollected = 0;
        this.isGameOver = true;
        this.gameSpeed = 20; // World moves towards player
        this.distanceTravelled = 0;

        // Track Management
        this.trackGroup = new THREE.Group();
        this.scene.add(this.trackGroup);
        this.activeSegments = [];
        this.segmentLength = 40;
        this.visibleSegments = 5;
        this.currentSegmentIndex = 0;

        this.initMaterials();
    }

    createObstacle(type) {
        const obj = new THREE.Group();
        let mesh;
        let hitboxGeom;

        switch(type) {
            case 0: // Electric barrier (Slide under)
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), new THREE.MeshBasicMaterial({color: 0x00f3ff}));
                mesh.position.y = 1.5;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                break;
            case 1: // Moving traffic (Car)
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), new THREE.MeshLambertMaterial({color: 0xff0000}));
                mesh.position.y = 0.5;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                obj.userData = { isMoving: true, speed: 10 }; // Moves towards player
                break;
            case 2: // Falling signs
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 0.5), new THREE.MeshLambertMaterial({color: 0xffff00}));
                mesh.position.y = 4;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                obj.userData = { isFalling: true, fallSpeed: 0, gravity: -20 };
                break;
            case 3: // Water-filled construction (Jump over)
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 3), new THREE.MeshLambertMaterial({color: 0x0000ff}));
                mesh.position.y = 0.1;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                break;
            case 4: // Security drones
                mesh = new THREE.Mesh(new THREE.SphereGeometry(0.8), new THREE.MeshBasicMaterial({color: 0xff00ff}));
                mesh.position.y = 1;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                obj.userData = { isHovering: true, time: Math.random() * 100 };
                break;
            case 5: // Broken bridge piece
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 2.5), new THREE.MeshLambertMaterial({color: 0x555555}));
                mesh.position.y = 0.5;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                break;
            case 6: // Rotating energy barrier
                mesh = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 0.2), new THREE.MeshBasicMaterial({color: 0x39ff14}));
                mesh.position.y = 1;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                obj.userData = { isRotating: true, rotSpeed: 5 };
                break;
            case 7: // Storm debris
                mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8), new THREE.MeshLambertMaterial({color: 0x888888}));
                mesh.position.y = 0.8;
                hitboxGeom = new THREE.Box3().setFromObject(mesh);
                break;
        }

        obj.add(mesh);
        obj.userData.type = type;
        obj.userData.hitbox = new THREE.Box3();
        // Base hitbox relative to group
        obj.userData.baseHitbox = hitboxGeom;

        return obj;
    }

    createStormGuardian() {
        if (this.guardianMesh) {
            this.guardianMesh.visible = false;
            return;
        }

        this.guardianMesh = new THREE.Group();

        // Body (Dark cloud-like sphere)
        const bodyGeom = new THREE.DodecahedronGeometry(3, 1);
        const bodyMat = new THREE.MeshLambertMaterial({
            color: 0x111122,
            transparent: true,
            opacity: 0.8
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);

        // Glowing core/eyes
        const coreGeom = new THREE.SphereGeometry(1.5, 8, 8);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
        this.guardianCore = new THREE.Mesh(coreGeom, coreMat);

        this.guardianMesh.add(body);
        this.guardianMesh.add(this.guardianCore);

        // Position behind player
        this.guardianMesh.position.set(0, 4, 15);
        this.guardianMesh.visible = false;

        this.scene.add(this.guardianMesh);

        // Add a pulsing light for the storm
        this.stormLight = new THREE.PointLight(0x00f3ff, 0, 50);
        this.stormLight.position.set(0, 5, 10);
        this.scene.add(this.stormLight);
    }

    createPowerUp(type) {
        const obj = new THREE.Group();
        const geom = new THREE.IcosahedronGeometry(0.5);
        let color, name;

        switch(type) {
            case 0: color = 0xff0000; name = "Neon Magnet"; break;
            case 1: color = 0x00ff00; name = "Storm Shield"; break;
            case 2: color = 0x0000ff; name = "Energy Boost"; break;
            case 3: color = 0xffff00; name = "Lightning Dash"; break;
            case 4: color = 0xff00ff; name = "Double Score"; break;
            case 5: color = 0x00ffff; name = "Temporary Flight"; break;
        }

        const mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.y = 1;
        obj.add(mesh);

        obj.userData = {
            isPowerUp: true,
            type: type,
            name: name,
            hitbox: new THREE.Box3(),
            baseHitbox: new THREE.Box3().setFromObject(mesh),
            collected: false
        };

        return obj;
    }

    createNeonEnergy() {
        const obj = new THREE.Group();
        // Octahedron shape for energy
        const mesh = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.3),
            new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true })
        );
        const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.15),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        mesh.add(core);
        mesh.position.y = 1;

        obj.add(mesh);
        obj.userData = {
            isEnergy: true,
            hitbox: new THREE.Box3(),
            baseHitbox: new THREE.Box3().setFromObject(mesh),
            collected: false
        };

        return obj;
    }

    initMaterials() {
        this.roadMat = new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.2, // Wet look
            metalness: 0.8
        });
        this.buildingMat = new THREE.MeshLambertMaterial({ color: 0x0a0a14 });
        this.neonMats = [
            new THREE.MeshBasicMaterial({ color: 0x00f3ff }),
            new THREE.MeshBasicMaterial({ color: 0xff00ff }),
            new THREE.MeshBasicMaterial({ color: 0x39ff14 }),
            new THREE.MeshBasicMaterial({ color: 0xfdf500 })
        ];
    }

    createTrackSegment(zPos) {
        const segment = new THREE.Group();
        segment.position.z = zPos;

        // Road
        const roadGeom = new THREE.PlaneGeometry(10, this.segmentLength);
        const road = new THREE.Mesh(roadGeom, this.roadMat);
        road.rotation.x = -Math.PI / 2;
        road.receiveShadow = true;
        segment.add(road);

        // Lane markers
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 5; j++) {
                const markerGeom = new THREE.PlaneGeometry(0.1, 2);
                const markerMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
                const marker = new THREE.Mesh(markerGeom, markerMat);
                marker.rotation.x = -Math.PI / 2;
                marker.position.set(i === 0 ? -1.25 : 1.25, 0.01, -this.segmentLength/2 + j * 8 + 4);
                segment.add(marker);
            }
        }

        // Obstacles array for this segment
        segment.userData = { items: [] };

        // Don't spawn obstacles on the very first segments
        if (this.currentSegmentIndex > 2) {
            // Spawn 1 to 3 obstacles per segment
            const numObstacles = Math.floor(Math.random() * 3) + 1;
            for(let i=0; i<numObstacles; i++) {
                // Random lane: -1, 0, 1
                const lane = Math.floor(Math.random() * 3) - 1;
                // Random Z pos within segment
                const zOffset = -this.segmentLength/2 + (Math.random() * (this.segmentLength - 10)) + 5;

                // Ensure we don't spawn exactly on top of another obstacle
                let canSpawn = true;
                for(let item of segment.userData.items) {
                    if(item.userData.lane === lane && Math.abs(item.position.z - zOffset) < 5) {
                        canSpawn = false; break;
                    }
                }

                if (canSpawn) {
                    const type = Math.floor(Math.random() * 8);
                    const obs = this.createObstacle(type);
                    obs.position.set(lane * 2.5, 0, zOffset);
                    obs.userData.lane = lane;
                    obs.userData.isObstacle = true;
                    segment.add(obs);
                    segment.userData.items.push(obs);
                }
            }

            // Spawn Power-up occasionally (10% chance per segment)
            if (Math.random() < 0.1) {
                const type = Math.floor(Math.random() * 6);
                const pu = this.createPowerUp(type);
                const lane = Math.floor(Math.random() * 3) - 1;
                const zOffset = -this.segmentLength/2 + (Math.random() * this.segmentLength);
                pu.position.set(lane * 2.5, 0.5, zOffset);
                segment.add(pu);
                segment.userData.items.push(pu);
            }

            // Spawn Neon Energy (1 to 5 per segment)
            const numEnergy = Math.floor(Math.random() * 5) + 1;
            for(let i=0; i<numEnergy; i++) {
                const lane = Math.floor(Math.random() * 3) - 1;
                const zOffset = -this.segmentLength/2 + (Math.random() * this.segmentLength);

                // Jump arc sometimes
                const isArc = Math.random() > 0.7;

                if (isArc) {
                    for(let j=0; j<3; j++) {
                        const en = this.createNeonEnergy();
                        en.position.set(lane * 2.5, 1 + Math.sin((j/2)*Math.PI) * 2, zOffset + j*2);
                        en.userData.lane = lane;
                        segment.add(en);
                        segment.userData.items.push(en);
                    }
                } else {
                    const en = this.createNeonEnergy();
                    en.position.set(lane * 2.5, 0, zOffset);
                    en.userData.lane = lane;
                    segment.add(en);
                    segment.userData.items.push(en);
                }
            }
        }

        // Buildings / Scenery (Indian Cyberpunk Vibe)
        for(let side of [-1, 1]) {
            for(let i=0; i<3; i++) {
                const h = 5 + Math.random() * 15;
                const bldgGeom = new THREE.BoxGeometry(4, h, 8);
                const bldg = new THREE.Mesh(bldgGeom, this.buildingMat);
                bldg.position.set(side * 8, h/2, -this.segmentLength/2 + i * 13 + 6);

                // Add neon sign
                if (Math.random() > 0.3) {
                    const signGeom = new THREE.PlaneGeometry(1, 3);
                    const signMat = this.neonMats[Math.floor(Math.random() * this.neonMats.length)];
                    const sign = new THREE.Mesh(signGeom, signMat);
                    sign.position.set(side * 5.9, h * 0.7, bldg.position.z);
                    sign.rotation.y = side === 1 ? -Math.PI/2 : Math.PI/2;
                    segment.add(sign);
                }

                segment.add(bldg);
            }
        }

        return segment;
    }

    reset() {
        this.score = 0;
        this.energyCollected = 0;
        this.isGameOver = false;
        this.gameSpeed = 20;
        this.distanceTravelled = 0;
        this.currentSegmentIndex = 0;

        // Power-up States
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.scoreMultiplier = 1;
        this.baseGameSpeed = 20;
        this.hasShield = false;

        // Storm Guardian Chase Sequence
        this.isChaseActive = false;
        this.chaseTimer = 0;
        this.createStormGuardian();

        // Clear old track
        while(this.activeSegments.length > 0) {
            const seg = this.activeSegments.pop();
            this.trackGroup.remove(seg);
        }

        // Spawn initial track
        for(let i=0; i<this.visibleSegments; i++) {
            this.spawnSegment();
        }

        this.player.reset();
        this.uiManager.updateHUD(this.score, this.energyCollected);
    }

    spawnSegment() {
        const zPos = -this.currentSegmentIndex * this.segmentLength;
        const segment = this.createTrackSegment(zPos);
        this.trackGroup.add(segment);
        this.activeSegments.push(segment);
        this.currentSegmentIndex++;
    }

    update(dt) {
        if (this.isGameOver) return;

        // Move world (Simulated by increasing distance)
        const moveDist = this.gameSpeed * dt;
        this.distanceTravelled += moveDist;

        // Update Track position to simulate movement
        this.trackGroup.position.z = this.distanceTravelled;

        // Track Generation Loop
        if (this.activeSegments.length > 0) {
            const firstSeg = this.activeSegments[0];
            // If the first segment is behind the camera (plus some buffer)
            if (firstSeg.position.z + this.distanceTravelled > this.segmentLength) {
                this.trackGroup.remove(firstSeg);
                this.activeSegments.shift();
                this.spawnSegment();
            }
        }

        // Update Player
        this.player.update(dt);

        // Handle Interactions (Obstacles & Items)
        this.checkCollisions(dt);

        // Power-up Timer Update
        if (this.powerUpTimer > 0) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }

        // Magnet effect
        if (this.activePowerUp === 0) {
            this.applyMagnetEffect(dt);
        }

        // Update Chase Sequence
        this.updateChase(dt);

        // Score based on distance
        this.score += moveDist * 0.1 * this.scoreMultiplier;
        this.uiManager.updateHUD(this.score, this.energyCollected);
    }

    updateChase(dt) {
        // Randomly trigger chase (if not active, every ~60 seconds on average, starting after 30 sec)
        if (!this.isChaseActive && this.distanceTravelled > 600 && Math.random() < (0.0005 * dt)) {
            this.startChase();
        }

        if (this.isChaseActive) {
            this.chaseTimer -= dt;

            // Animate Guardian
            this.guardianMesh.position.x = this.player.mesh.position.x * 0.5 + Math.sin(this.distanceTravelled * 0.1) * 2;
            this.guardianCore.rotation.y += 5 * dt;
            this.guardianCore.rotation.x += 3 * dt;

            // Pulsing Light
            this.stormLight.intensity = 2 + Math.sin(this.distanceTravelled * 0.5) * 2;

            // Camera shake effect
            this.camera.position.x = (Math.random() - 0.5) * 0.2;
            this.camera.position.y = 5 + (Math.random() - 0.5) * 0.2;

            // Lightning strikes randomly
            if (Math.random() < 0.05) {
                this.stormLight.intensity = 10;
                this.scene.background.setHex(0xffffff); // Flash white
            } else {
                this.scene.background.lerp(new THREE.Color(0x0a0a14), 0.1);
            }

            if (this.chaseTimer <= 0) {
                this.endChase();
            }
        } else {
            // Restore camera and background smoothly
            this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, 0, 5 * dt);
            this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, 5, 5 * dt);
            this.scene.background.lerp(new THREE.Color(0x0a0a14), 0.1);
        }
    }

    startChase() {
        if (this.isChaseActive) return;
        this.isChaseActive = true;
        this.chaseTimer = 15; // 15 seconds chase
        this.guardianMesh.visible = true;
        this.uiManager.showChaseWarning();

        // Increase speed drastically
        this.baseGameSpeed += 10;
        if (!this.activePowerUp) this.gameSpeed = this.baseGameSpeed;

        // Dynamic camera change
        this.camera.fov = 80; // Widen FOV for cinematic feel
        this.camera.updateProjectionMatrix();
    }

    endChase() {
        this.isChaseActive = false;
        this.guardianMesh.visible = false;
        this.stormLight.intensity = 0;

        // Reset speed
        this.baseGameSpeed -= 10;
        if (!this.activePowerUp) this.gameSpeed = this.baseGameSpeed;

        this.camera.fov = 60;
        this.camera.updateProjectionMatrix();
        this.scene.background.setHex(0x0a0a14);
    }

    applyMagnetEffect(dt) {
        // Pull energy towards player
        const playerPos = new THREE.Vector3();
        this.player.mesh.getWorldPosition(playerPos);

        for (let segment of this.activeSegments) {
            if (!segment.userData.items) continue;
            for (let item of segment.userData.items) {
                if (item.userData.isEnergy && !item.userData.collected) {
                    const itemPos = new THREE.Vector3();
                    item.getWorldPosition(itemPos);
                    if (itemPos.distanceTo(playerPos) < 15) {
                        // Move item towards player relative to its local space
                        // Simplified: move it directly in local space towards zeroed out relative coords
                        item.position.x += (this.player.mesh.position.x - item.position.x) * 5 * dt;
                        item.position.y += (this.player.mesh.position.y - item.position.y) * 5 * dt;
                    }
                }
            }
        }
    }

    activatePowerUp(type, name) {
        this.deactivatePowerUp(); // Clear previous

        this.activePowerUp = type;
        this.powerUpTimer = 10; // 10 seconds default

        this.uiManager.showPowerup(name, 10);

        switch(type) {
            case 0: // Magnet
                break;
            case 1: // Shield
                this.hasShield = true;
                this.player.mesh.add(new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true, transparent: true, opacity: 0.5})));
                break;
            case 2: // Energy Boost
                this.energyCollected += 50;
                this.powerUpTimer = 0; // Instant
                break;
            case 3: // Lightning Dash
                this.gameSpeed = this.baseGameSpeed * 2;
                break;
            case 4: // Double Score
                this.scoreMultiplier = 2;
                break;
            case 5: // Flight
                this.player.mesh.position.y = 5;
                this.player.gravity = 0;
                this.player.velocity.y = 0;
                break;
        }
    }

    deactivatePowerUp() {
        if (this.activePowerUp === null) return;

        switch(this.activePowerUp) {
            case 1: // Shield
                this.hasShield = false;
                // Remove shield mesh (last child if added)
                if (this.player.mesh.children.length > 3) {
                    this.player.mesh.remove(this.player.mesh.children[this.player.mesh.children.length - 1]);
                }
                break;
            case 3: // Dash
                this.gameSpeed = this.baseGameSpeed;
                break;
            case 4: // Double Score
                this.scoreMultiplier = 1;
                break;
            case 5: // Flight
                this.player.gravity = -35;
                break;
        }

        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.uiManager.hidePowerup();
    }

    checkCollisions(dt) {
        // Player's world-space hitbox
        const playerBox = this.player.hitbox;

        for (let segment of this.activeSegments) {
            if (!segment.userData.items) continue;

            for (let item of segment.userData.items) {
                if (item.userData.collected) continue;

                // Update specific obstacle logic (animations/movement)
                if (item.userData.isObstacle) {
                    if (item.userData.isMoving) {
                        item.position.z += item.userData.speed * dt;
                    }
                    if (item.userData.isRotating) {
                        item.children[0].rotation.y += item.userData.rotSpeed * dt;
                    }

                    // Calculate item's absolute world Z position
                    const itemWorldZ = segment.position.z + item.position.z;
                    if (item.userData.isFalling && itemWorldZ < 15) {
                        // Drop when item is 15 units ahead of the origin (where player is)
                        item.userData.fallSpeed += item.userData.gravity * dt;
                        item.position.y += item.userData.fallSpeed * dt;
                        if (item.position.y < 0) item.position.y = 0;
                    }
                    if (item.userData.isHovering) {
                        item.userData.time += dt * 5;
                        item.position.y = 1 + Math.sin(item.userData.time) * 0.5;
                    }
                } else if (item.userData.isEnergy) {
                    item.children[0].rotation.y += 2 * dt; // Rotate energy
                }

                // Calculate item's world-space hitbox
                const itemBox = item.userData.hitbox;
                itemBox.copy(item.userData.baseHitbox);

                // Apply world transformation to hitbox
                const worldPos = new THREE.Vector3();
                item.getWorldPosition(worldPos);

                const offset = worldPos.clone().sub(item.position); // difference caused by parent
                itemBox.translate(worldPos); // Move box to world pos

                // Check Intersection
                if (playerBox.intersectsBox(itemBox)) {
                    if (item.userData.isObstacle) {
                        this.handleCrash();
                    } else if (item.userData.isEnergy) {
                        item.userData.collected = true;
                        item.visible = false; // Hide on collect
                        this.energyCollected++;
                        this.uiManager.updateHUD(this.score, this.energyCollected);
                    } else if (item.userData.isPowerUp) {
                        item.userData.collected = true;
                        item.visible = false;
                        this.activatePowerUp(item.userData.type, item.userData.name);
                    }
                }
            }
        }
    }

    handleCrash() {
        if (this.hasShield) {
            this.deactivatePowerUp();
            // Optional: Give temporary invincibility or push player forward a bit
        } else {
            this.isGameOver = true;
        }
    }

    // Input Pass-through
    moveLeft() { this.player.moveLeft(); }
    moveRight() { this.player.moveRight(); }
    jump() { this.player.jump(); }
    slide() { this.player.slide(); }

    cleanup() {
        this.player.cleanup();
    }
}

export class Player {
    constructor(scene) {
        this.scene = scene;

        // Settings
        this.laneWidth = 2.5;
        this.currentLane = 0; // -1 (Left), 0 (Middle), 1 (Right)

        this.jumpVelocity = 15;
        this.gravity = -35;
        this.isJumping = false;

        this.isSliding = false;
        this.slideDuration = 0.8;
        this.slideTimer = 0;

        this.speed = 15;
        this.velocity = new THREE.Vector3(0, 0, -this.speed);

        this.createMesh();
    }

    createMesh() {
        // Player group
        this.mesh = new THREE.Group();

        // Torso (Rain-resistant jacket)
        const torsoGeometry = new THREE.BoxGeometry(0.8, 1, 0.5);
        const torsoMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        this.torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        this.torso.position.y = 1;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8d5524 });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.head.position.y = 1.8;
        this.head.castShadow = true;
        this.mesh.add(this.head);

        // Glowing Energy Wristband
        const wristbandGeom = new THREE.BoxGeometry(0.2, 0.1, 0.2);
        const wristbandMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        this.wristband = new THREE.Mesh(wristbandGeom, wristbandMat);
        this.wristband.position.set(0.5, 1, 0);
        this.mesh.add(this.wristband);

        // Hitbox for collision
        this.hitbox = new THREE.Box3();

        this.mesh.position.set(0, 0, 0);
        this.scene.add(this.mesh);
    }

    update(dt) {
        // Handle lateral movement (lerp to lane)
        const targetX = this.currentLane * this.laneWidth;
        this.mesh.position.x += (targetX - this.mesh.position.x) * 10 * dt;

        // Handle jumping/gravity/falling
        if (this.isJumping || this.mesh.position.y > 0 || this.velocity.y !== 0) {
            this.mesh.position.y += this.velocity.y * dt;
            this.velocity.y += this.gravity * dt;

            if (this.mesh.position.y <= 0) {
                this.mesh.position.y = 0;
                this.isJumping = false;
                this.velocity.y = 0;
            }
        }

        // Handle sliding
        if (this.isSliding) {
            this.slideTimer -= dt;
            if (this.slideTimer <= 0) {
                this.isSliding = false;
                // Restore scale
                this.torso.scale.y = 1;
                this.head.position.y = 1.8;
            }
        }

        // Update Hitbox
        this.hitbox.setFromObject(this.mesh);

        // If sliding, manually reduce hitbox height
        if (this.isSliding) {
             this.hitbox.max.y = this.mesh.position.y + 1; // Lower max height
        }
    }

    moveLeft() {
        if (this.currentLane > -1) {
            this.currentLane--;
        }
    }

    moveRight() {
        if (this.currentLane < 1) {
            this.currentLane++;
        }
    }

    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocity.y = this.jumpVelocity;

            // Cancel slide if jumping
            if (this.isSliding) {
                this.isSliding = false;
                this.torso.scale.y = 1;
                this.head.position.y = 1.8;
            }
        }
    }

    slide() {
        if (!this.isJumping && !this.isSliding) {
            this.isSliding = true;
            this.slideTimer = this.slideDuration;

            // Visually squash the player
            this.torso.scale.y = 0.5;
            this.head.position.y = 1.0; // Lower head
        }
    }

    reset() {
        this.currentLane = 0;
        this.mesh.position.set(0, 0, 0);
        this.isJumping = false;
        this.isSliding = false;
        this.velocity.set(0, 0, -this.speed);
        this.torso.scale.y = 1;
        this.head.position.y = 1.8;
    }

    cleanup() {
        this.scene.remove(this.mesh);
    }
}
