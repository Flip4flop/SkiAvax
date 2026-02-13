// SkiAvax — Pause State

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants.js';

export class PauseState {
    constructor(game) {
        this.game = game;
    }

    enter() {}

    update(dt, input) {
        if (input.pause || input.confirm) {
            this.game.resumeGame();
        }
    }

    render(ctx) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Pause text
        ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        // Instructions
        ctx.font = '18px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Press P, Esc, or Enter to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
}
