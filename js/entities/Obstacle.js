// SkiAvax — Obstacle Entity

import { Entity } from './Entity.js';
import { COLORS, OBSTACLE_TYPES } from '../utils/constants.js';

export class Obstacle extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.type = 'obstacle';
        this.obstacleType = OBSTACLE_TYPES.AVAX_TREE;
    }

    init(x, y, width, height, obstacleType) {
        super.init(x, y, width, height);
        this.obstacleType = obstacleType || OBSTACLE_TYPES.AVAX_TREE;
    }

    renderPlaceholder(ctx, screenX, screenY) {
        switch (this.obstacleType) {
            case OBSTACLE_TYPES.AVAX_TREE:
                this._renderAvaxTree(ctx, screenX, screenY);
                break;
            case OBSTACLE_TYPES.BLACKHOLE:
                this._renderBlackhole(ctx, screenX, screenY);
                break;
            case OBSTACLE_TYPES.SNOWBANK:
                this._renderSnowbank(ctx, screenX, screenY);
                break;
            default:
                this._renderAvaxTree(ctx, screenX, screenY);
        }
    }

    // AVAX triangle "tree"
    _renderAvaxTree(ctx, x, y) {
        const w = this.width;
        const h = this.height;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(x, y + h / 2 - 2, w / 2.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Red AVAX triangle
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.moveTo(x, y - h / 2);
        ctx.lineTo(x - w / 2, y + h / 3);
        ctx.lineTo(x + w / 2, y + h / 3);
        ctx.closePath();
        ctx.fill();

        // Inner notch (AVAX logo style)
        ctx.fillStyle = COLORS.SNOW_WHITE;
        ctx.beginPath();
        ctx.moveTo(x, y - h / 6);
        ctx.lineTo(x - w / 5, y + h / 6);
        ctx.lineTo(x + w / 5, y + h / 6);
        ctx.closePath();
        ctx.fill();

        // Small trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 3, y + h / 3, 6, 8);
    }

    // Blackhole obstacle
    _renderBlackhole(ctx, x, y) {
        const r = this.width / 2;

        // Outer glow
        const glow = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.2);
        glow.addColorStop(0, 'rgba(100, 0, 200, 0.6)');
        glow.addColorStop(0.5, 'rgba(50, 0, 100, 0.3)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Dark center
        ctx.fillStyle = '#0a0015';
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Accretion ring
        ctx.strokeStyle = '#8B00FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.9, r * 0.4, 0.3, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Snowbank obstacle
    _renderSnowbank(ctx, x, y) {
        const w = this.width;
        const h = this.height;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(x, y + h / 3, w / 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Snow mound
        ctx.fillStyle = '#D4DDE6';
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#E8EFF5';
        ctx.beginPath();
        ctx.ellipse(x - w / 6, y - h / 5, w / 4, h / 4, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // "SB" text for Snowbank
        ctx.fillStyle = 'rgba(100,120,140,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SB', x, y);
    }
}
