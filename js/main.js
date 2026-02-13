// SkiAvax — Entry Point

import { Game } from './Game.js';

// Wait for DOM to be ready
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('SkiAvax: Canvas element not found!');
        return;
    }

    // Create and start the game
    const game = new Game(canvas);
    game.start();

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
        setTimeout(() => loading.style.display = 'none', 600);
    }

    // Expose game instance for debugging
    window.skiAvaxGame = game;

    console.log('🔺 SkiAvax loaded! Press Enter or Space to start.');
});
