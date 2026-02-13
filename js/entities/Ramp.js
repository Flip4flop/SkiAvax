// SkiAvax — Ramp Entity

import { Entity } from './Entity.js';
import { RAMP_WIDTH, RAMP_HEIGHT, COLORS } from '../utils/constants.js';

export class Ramp extends Entity {
    constructor(x, y) {
        super(x, y, RAMP_WIDTH, RAMP_HEIGHT);
        this.type = 'ramp';
        this.isCollidable = true;
    }

    init(x, y) {
        super.init(x, y, RAMP_WIDTH, RAMP_HEIGHT);
    }

    renderPlaceholder(ctx, screenX, screenY) {
        const w = this.width;
        const h = this.height;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + h / 2 + 3, w / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ramp body (AVAX red triangle lying on its side)
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.moveTo(screenX - w / 2, screenY + h / 2);     // bottom left
        ctx.lineTo(screenX + w / 2, screenY + h / 2);     // bottom right
        ctx.lineTo(screenX + w / 2, screenY - h / 2);     // top right (peak)
        ctx.closePath();
        ctx.fill();

        // Snow on top edge
        ctx.strokeStyle = COLORS.AVAX_WHITE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX - w / 2, screenY + h / 2);
        ctx.lineTo(screenX + w / 2, screenY - h / 2);
        ctx.stroke();

        // Arrow indicator
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↑', screenX + 5, screenY);
    }
}
