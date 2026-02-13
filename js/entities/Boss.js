// SkiAvax — Boss Entity (LFJ Joe)

import { Entity } from './Entity.js';
import { BOSS_WIDTH, BOSS_HEIGHT, BOSS_SPEED, COLORS } from '../utils/constants.js';
import { distance, lerp } from '../utils/helpers.js';
import { fairCollision } from '../utils/helpers.js';

export class Boss extends Entity {
    constructor(x, y) {
        super(x, y, BOSS_WIDTH, BOSS_HEIGHT);
        this.type = 'boss';
        this.speed = BOSS_SPEED;
        this.state = 'dormant'; // dormant, approaching, chasing
        this.animTimer = 0;
        this.catchRadius = 35;
    }

    startChase() {
        this.state = 'approaching';
        this.isActive = true;
    }

    update(dt, player) {
        if (!this.isActive || this.state === 'dormant') return;

        this.animTimer += dt;

        // Move toward player
        const dx = player.worldX - this.worldX;
        const dy = player.worldY - this.worldY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            // Always move toward player, slightly faster in Y to be menacing
            this.worldX += moveX;
            this.worldY += moveY * 1.1;
        }

        // Transition from approaching to chasing when close enough
        if (this.state === 'approaching' && dist < 400) {
            this.state = 'chasing';
        }
    }

    /**
     * Check if boss has caught the player
     */
    hasCaughtPlayer(player) {
        if (!this.isActive || this.state === 'dormant') return false;
        return fairCollision(this.getBounds(), player.getBounds(), 0.6);
    }

    render(ctx, camera) {
        if (!this.isActive) return;

        const screen = camera.worldToScreen(this.worldX, this.worldY);

        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                screen.x - this.width / 2,
                screen.y - this.height / 2,
                this.width,
                this.height
            );
        } else {
            this._renderPlaceholder(ctx, screen.x, screen.y);
        }
    }

    _renderPlaceholder(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);

        // Menacing bobble animation
        const bob = Math.sin(this.animTimer * 5) * 3;
        ctx.translate(0, bob);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 - bob, this.width / 2.5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (dark tracksuit)
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2.5, this.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Purple accent stripe
        ctx.strokeStyle = COLORS.LFJ_PURPLE;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 4);
        ctx.lineTo(-this.width / 4, this.height / 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.width / 4, -this.height / 4);
        ctx.lineTo(this.width / 4, this.height / 4);
        ctx.stroke();

        // Head
        ctx.fillStyle = '#FFE0BD';
        ctx.beginPath();
        ctx.arc(0, -this.height / 2.8, 14, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyes
        ctx.fillStyle = '#FF0000';
        const eyeFlash = Math.sin(this.animTimer * 8) > 0 ? 1 : 0.7;
        ctx.globalAlpha = eyeFlash;
        ctx.beginPath();
        ctx.arc(-5, -this.height / 2.8 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -this.height / 2.8 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // "JOE" text
        ctx.fillStyle = COLORS.LFJ_PURPLE;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('JOE', 0, 2);

        // Aura effect
        const auraAlpha = 0.1 + Math.sin(this.animTimer * 4) * 0.05;
        ctx.strokeStyle = `rgba(123, 63, 228, ${auraAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
