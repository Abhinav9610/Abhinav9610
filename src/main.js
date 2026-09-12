import * as THREE from 'three';
import { UIManager } from './ui.js';
import { Game } from './game.js';

class App {
    constructor() {
        this.initThree();
        this.uiManager = new UIManager();
        this.game = new Game(this.scene, this.camera, this.uiManager);

        this.bindEvents();
        this.loadSaveData();

        this.clock = new THREE.Clock();
        this.isRunning = false;
        this.isPaused = false;

        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        // Container
        const container = document.getElementById('game-container');

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a14);
        this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);

        // Camera
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, -10);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0x00f3ff, 0.5); // Neon blue moon/city light
        dirLight.position.set(-10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 20;
        dirLight.shadow.camera.bottom = -20;
        dirLight.shadow.camera.left = -20;
        dirLight.shadow.camera.right = 20;
        dirLight.shadow.camera.near = 0.1;
        dirLight.shadow.camera.far = 50;
        this.scene.add(dirLight);

        // Handle Resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    bindEvents() {
        // UI Buttons
        document.getElementById('play-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('home-btn').addEventListener('click', () => this.quitGame());

        // Touch Input Variables
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 30; // Minimum distance to register a swipe

        // Touch Event Listeners
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.handleSwipe();
        }, { passive: false });

        // Keyboard Input for testing
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning || this.isPaused || this.game.isGameOver) return;
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.game.moveLeft();
                    break;
                case 'ArrowRight':
                case 'd':
                    this.game.moveRight();
                    break;
                case 'ArrowUp':
                case 'w':
                    this.game.jump();
                    break;
                case 'ArrowDown':
                case 's':
                    this.game.slide();
                    break;
            }
        });
    }

    handleSwipe() {
        if (!this.isRunning || this.isPaused || this.game.isGameOver) return;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Check if swipe is significant
        if (Math.abs(deltaX) > this.minSwipeDistance || Math.abs(deltaY) > this.minSwipeDistance) {
            // Determine swipe direction
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal Swipe
                if (deltaX > 0) {
                    this.game.moveRight();
                } else {
                    this.game.moveLeft();
                }
            } else {
                // Vertical Swipe
                if (deltaY > 0) {
                    this.game.slide(); // Down
                } else {
                    this.game.jump(); // Up
                }
            }
        }
    }

    loadSaveData() {
        this.highScore = parseFloat(localStorage.getItem('neonMonsoon_highScore')) || 0;
        this.totalEnergy = parseInt(localStorage.getItem('neonMonsoon_energy')) || 0;

        // Basic Mission System State
        this.missions = JSON.parse(localStorage.getItem('neonMonsoon_missions')) || [
            { id: 1, desc: "Run 1000m in one go", target: 1000, progress: 0, completed: false },
            { id: 2, desc: "Collect 50 Energy in one run", target: 50, progress: 0, completed: false }
        ];

        this.uiManager.updateMenuStats(this.highScore, this.totalEnergy);
    }

    saveData() {
        localStorage.setItem('neonMonsoon_highScore', this.highScore);
        localStorage.setItem('neonMonsoon_energy', this.totalEnergy);
        localStorage.setItem('neonMonsoon_missions', JSON.stringify(this.missions));
    }

    checkMissions() {
        let updated = false;
        if (!this.missions[0].completed && this.game.score >= this.missions[0].target) {
            this.missions[0].completed = true;
            this.totalEnergy += 100; // Reward
            updated = true;
            this.uiManager.showTutorial("MISSION 1 COMPLETE!\n+100 Energy", 3000);
        }
        if (!this.missions[1].completed && this.game.energyCollected >= this.missions[1].target) {
            this.missions[1].completed = true;
            this.totalEnergy += 50; // Reward
            updated = true;
            this.uiManager.showTutorial("MISSION 2 COMPLETE!\n+50 Energy", 3000);
        }
        if (updated) this.saveData();
    }

    startGame() {
        this.uiManager.showScreen('hud');
        this.game.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.clock.start();

        // Show tutorial briefly
        this.uiManager.showTutorial("SWIPE TO MOVE\nUP TO JUMP\nDOWN TO SLIDE", 3000);
    }

    pauseGame() {
        if (!this.isRunning || this.game.isGameOver) return;
        this.isPaused = true;
        this.uiManager.showScreen('pause');
    }

    resumeGame() {
        if (!this.isRunning || this.game.isGameOver) return;
        this.isPaused = false;
        this.clock.getDelta(); // Clear accumulated time
        this.uiManager.showScreen('hud');
    }

    quitGame() {
        this.isRunning = false;
        this.isPaused = false;
        this.game.cleanup();
        this.loadSaveData(); // Refresh menu stats
        this.uiManager.showScreen('mainMenu');
    }

    gameOver() {
        this.isRunning = false;

        this.checkMissions();

        // Update save data
        if (this.game.score > this.highScore) {
            this.highScore = this.game.score;
        }
        this.totalEnergy += this.game.energyCollected;
        this.saveData();

        this.uiManager.showGameOver(this.game.score, this.highScore, this.game.energyCollected);
    }

    animate() {
        requestAnimationFrame(this.animate);

        const dt = this.clock.getDelta();

        if (this.isRunning && !this.isPaused) {
            this.game.update(dt);
            if (this.game.isGameOver) {
                this.gameOver();
            }
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
