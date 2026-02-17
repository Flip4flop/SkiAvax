// SkiAvax — Main Game Class

import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { AssetManager } from './AssetManager.js';
import { LeaderboardManager } from './LeaderboardManager.js';
import { MenuState } from './states/MenuState.js';
import { PlayState } from './states/PlayState.js';
import { PauseState } from './states/PauseState.js';
import { GameOverState } from './states/GameOverState.js';
import { LeaderboardState } from './states/LeaderboardState.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_STATE } from './utils/constants.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = new Camera();
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.leaderboard = new LeaderboardManager();

        // Set canvas size
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;

        // Game states
        this.states = {
            [GAME_STATE.MENU]: new MenuState(this),
            [GAME_STATE.PLAYING]: new PlayState(this),
            [GAME_STATE.PAUSED]: new PauseState(this),
            [GAME_STATE.GAME_OVER]: new GameOverState(this),
            [GAME_STATE.LEADERBOARD]: new LeaderboardState(this),
        };

        this.currentState = GAME_STATE.MENU;
        this.currentMode = 'freerun';
        this.playState = this.states[GAME_STATE.PLAYING]; // quick reference

        // Timing
        this.lastTime = 0;
        this.running = false;
        this.maxDeltaTime = 0.05; // cap at 50ms to prevent physics spiral

        // Handle resize
        this._handleResize();
        window.addEventListener('resize', () => this._handleResize());

        // Handle tab visibility change (rAF pauses in background tabs)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.running) {
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this._loop(t));
            }
        });
    }

    /**
     * Start the game loop
     */
    async start() {
        // Load assets (gracefully — game works with placeholders if assets are missing)
        await this.assets.loadManifest('assets/manifest.json');

        this.running = true;
        this.states[this.currentState].enter();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    /**
     * Main game loop
     */
    _loop(timestamp) {
        if (!this.running) return;

        try {
            // Calculate delta time in seconds
            let dt = (timestamp - this.lastTime) / 1000;
            this.lastTime = timestamp;

            // Cap delta time
            if (dt > this.maxDeltaTime) dt = this.maxDeltaTime;
            if (dt < 0) dt = 0;

            // Update current state
            this.states[this.currentState].update(dt, this.input);

            // Render current state
            this._render();

            // Clear per-frame input state
            this.input.endFrame();
        } catch (err) {
            console.error('SkiAvax game loop error:', err);
        }

        // Next frame (always schedule, even after error)
        requestAnimationFrame((t) => this._loop(t));
    }

    /**
     * Render the current state
     */
    _render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // If playing or paused, render play state underneath
        if (this.currentState === GAME_STATE.PAUSED) {
            this.states[GAME_STATE.PLAYING].render(this.ctx);
        }

        // Render current state
        this.states[this.currentState].render(this.ctx);
    }

    /**
     * Start a new game
     */
    startGame(mode = 'freerun') {
        this.currentMode = mode;
        this.currentState = GAME_STATE.PLAYING;
        this.states[GAME_STATE.PLAYING].enter(mode);
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.currentState === GAME_STATE.PLAYING) {
            this.currentState = GAME_STATE.PAUSED;
            this.states[GAME_STATE.PAUSED].enter();
        }
    }

    /**
     * Resume from pause
     */
    resumeGame() {
        if (this.currentState === GAME_STATE.PAUSED) {
            this.currentState = GAME_STATE.PLAYING;
        }
    }

    /**
     * Transition to game over
     */
    gameOver(score, distance, scoreManager, mode) {
        this.currentState = GAME_STATE.GAME_OVER;
        this.states[GAME_STATE.GAME_OVER].enter(score, distance, scoreManager, mode);
    }

    /**
     * Return to main menu
     */
    returnToMenu() {
        this.currentState = GAME_STATE.MENU;
        this.states[GAME_STATE.MENU].enter();
    }

    /**
     * Open the global leaderboard
     */
    showLeaderboard(highlightName = null) {
        this.currentState = GAME_STATE.LEADERBOARD;
        this.states[GAME_STATE.LEADERBOARD].enter(highlightName);
    }

    /**
     * Restart with same mode
     */
    restartGame() {
        this.startGame(this.currentMode);
    }

    /**
     * Handle canvas resize for responsive display
     */
    _handleResize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerW = container.clientWidth;
        const containerH = container.clientHeight;
        const aspect = CANVAS_WIDTH / CANVAS_HEIGHT;

        let displayW, displayH;

        if (containerW / containerH > aspect) {
            displayH = containerH;
            displayW = displayH * aspect;
        } else {
            displayW = containerW;
            displayH = displayW / aspect;
        }

        this.canvas.style.width = `${displayW}px`;
        this.canvas.style.height = `${displayH}px`;
    }
}
