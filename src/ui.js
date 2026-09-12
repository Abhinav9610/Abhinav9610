export class UIManager {
    constructor() {
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            hud: document.getElementById('hud'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('game-over-screen'),
            tutorial: document.getElementById('tutorial-overlay')
        };

        this.elements = {
            menuHighScore: document.getElementById('menu-high-score'),
            menuNeonEnergy: document.getElementById('menu-neon-energy'),

            hudScore: document.getElementById('hud-score'),
            hudEnergy: document.getElementById('hud-energy'),

            resultScore: document.getElementById('result-score'),
            resultHighScore: document.getElementById('result-high-score'),
            resultEnergy: document.getElementById('result-energy'),

            powerupIndicator: document.getElementById('powerup-indicator'),
            powerupName: document.getElementById('powerup-name'),
            powerupBar: document.getElementById('powerup-bar'),

            chaseWarning: document.getElementById('chase-warning'),
            tutorialText: document.getElementById('tutorial-text')
        };

        // Hide all screens except main menu initially
        this.showScreen('mainMenu');
    }

    showScreen(screenName) {
        for (const key in this.screens) {
            if (this.screens[key]) {
                if (key === screenName) {
                    this.screens[key].classList.remove('hidden');
                } else {
                    this.screens[key].classList.add('hidden');
                }
            }
        }
    }

    updateMenuStats(highScore, energy) {
        if(this.elements.menuHighScore) this.elements.menuHighScore.textContent = Math.floor(highScore);
        if(this.elements.menuNeonEnergy) this.elements.menuNeonEnergy.textContent = Math.floor(energy);
    }

    updateHUD(score, energy) {
        if(this.elements.hudScore) this.elements.hudScore.textContent = Math.floor(score);
        if(this.elements.hudEnergy) this.elements.hudEnergy.textContent = Math.floor(energy);
    }

    showGameOver(score, highScore, sessionEnergy) {
        this.showScreen('gameOver');
        if(this.elements.resultScore) this.elements.resultScore.textContent = Math.floor(score);
        if(this.elements.resultHighScore) this.elements.resultHighScore.textContent = Math.floor(highScore);
        if(this.elements.resultEnergy) this.elements.resultEnergy.textContent = Math.floor(sessionEnergy);
    }

    showPowerup(name, duration) {
        if (!this.elements.powerupIndicator) return;
        this.elements.powerupIndicator.classList.remove('hidden');
        this.elements.powerupName.textContent = name;

        // Reset animation
        this.elements.powerupBar.style.transition = 'none';
        this.elements.powerupBar.style.width = '100%';

        // Trigger reflow
        void this.elements.powerupBar.offsetWidth;

        // Start animation
        this.elements.powerupBar.style.transition = `width ${duration}s linear`;
        this.elements.powerupBar.style.width = '0%';

        if (this.powerupTimeout) clearTimeout(this.powerupTimeout);
        this.powerupTimeout = setTimeout(() => {
            this.elements.powerupIndicator.classList.add('hidden');
        }, duration * 1000);
    }

    hidePowerup() {
        if (this.elements.powerupIndicator) {
            this.elements.powerupIndicator.classList.add('hidden');
            if (this.powerupTimeout) clearTimeout(this.powerupTimeout);
        }
    }

    showChaseWarning() {
        if (this.elements.chaseWarning) {
            this.elements.chaseWarning.classList.remove('hidden');
            setTimeout(() => {
                this.elements.chaseWarning.classList.add('hidden');
            }, 3000);
        }
    }

    showTutorial(text, duration = 2000) {
        if (!this.screens.tutorial) return;
        this.elements.tutorialText.textContent = text;
        this.screens.tutorial.classList.remove('hidden');

        if (this.tutorialTimeout) clearTimeout(this.tutorialTimeout);
        this.tutorialTimeout = setTimeout(() => {
            this.screens.tutorial.classList.add('hidden');
        }, duration);
    }
}
