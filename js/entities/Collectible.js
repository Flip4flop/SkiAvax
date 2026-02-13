// SkiAvax — Collectible Entity

import { Entity } from './Entity.js';
import { COLLECTIBLE_SIZE, COLLECTIBLE_TYPES, COLORS } from '../utils/constants.js';

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);
        this.type = 'collectible';
        this.collectibleType = COLLECTIBLE_TYPES.AVAX;
        this.collected = false;
        this.animTimer = Math.random() * Math.PI * 2; // random start phase
        this.collectAnim = 0;
    }

    init(x, y, collectibleType) {
        super.init(x, y, COLLECTIBLE_SIZE, COLLECTIBLE_SIZE);
        this.collectibleType = collectibleType || COLLECTIBLE_TYPES.AVAX;
        this.collected = false;
        this.collectAnim = 0;
        this.animTimer = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.animTimer += dt * 3;

        if (this.collected) {
            this.collectAnim += dt * 4;
            if (this.collectAnim > 1) {
                this.isActive = false;
            }
        }
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        this.isCollidable = false;
        this.collectAnim = 0;
    }

    render(ctx, camera) {
        if (!this.isActive) return;

        const screen = camera.worldToScreen(this.worldX, this.worldY);

        if (this.collected) {
            // Collect animation: float up and fade
            const alpha = 1 - this.collectAnim;
            const yOffset = this.collectAnim * -30;
            ctx.save();
            ctx.globalAlpha = alpha;
            this._renderGlow(ctx, screen.x, screen.y + yOffset);
            ctx.restore();
            return;
        }

        // Hover animation
        const hover = Math.sin(this.animTimer) * 3;

        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                screen.x - this.width / 2,
                screen.y - this.height / 2 + hover,
                this.width,
                this.height
            );
        } else {
            this.renderPlaceholder(ctx, screen.x, screen.y + hover);
        }
    }

    renderPlaceholder(ctx, x, y) {
        if (this.collectibleType === COLLECTIBLE_TYPES.AVAX) {
            this._renderAvaxToken(ctx, x, y);
        } else {
            this._renderPharToken(ctx, x, y);
        }
    }

    _renderAvaxToken(ctx, x, y) {
        const r = this.width / 2;

        // Glow
        ctx.fillStyle = 'rgba(232, 65, 66, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, r + 4, 0, Math.PI * 2);
        ctx.fill();

        // Coin body
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r - 3, 0, Math.PI * 2);
        ctx.stroke();

        // "A" letter
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.font = `bold ${Math.floor(r)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('A', x, y);
    }

    _renderPharToken(ctx, x, y) {
        const r = this.width / 2;

        // Glow
        ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.fill();

        // Coin body
        ctx.fillStyle = COLORS.PHARAOH_GOLD;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();

        // Inner ring
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, r - 3, 0, Math.PI * 2);
        ctx.stroke();

        // "P" letter
        ctx.fillStyle = '#8B4513';
        ctx.font = `bold ${Math.floor(r)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', x, y + 1);
    }

    _renderGlow(ctx, x, y) {
        const r = this.width / 2 + 5;
        const color = this.collectibleType === COLLECTIBLE_TYPES.AVAX ? COLORS.AVAX_RED : COLORS.PHARAOH_GOLD;
        ctx.fillStyle = color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', x, y);
    }
}
