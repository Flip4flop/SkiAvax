// SkiAvax — NPC Entity (Other Skiers)

import { Entity } from './Entity.js';
import { NPC_SIZE, NPC_SPEED_MIN, NPC_SPEED_MAX, NPC_TYPES, COLORS } from '../utils/constants.js';
import { randomRange, randomChoice } from '../utils/helpers.js';

// Color palette for NPC placeholder rendering
const NPC_COLORS = {
    benqi: '#00D2FF',
    salvor: '#FF6B35',
    blaze: '#FF4444',
    arena: '#8B5CF6',
    yieldyak: '#4ADE80',
    dokyo: '#EC4899',
    dexalot: '#3B82F6',
    pangolin: '#F59E0B',
};

export class NPC extends Entity {
    constructor(x, y) {
        super(x, y, NPC_SIZE, NPC_SIZE);
        this.type = 'npc';
        this.npcType = randomChoice(NPC_TYPES);
        this.speed = randomRange(NPC_SPEED_MIN, NPC_SPEED_MAX);
        this.wobbleTimer = Math.random() * Math.PI * 2;
        this.wobbleAmount = randomRange(20, 60);
        this.baseX = x;
    }

    init(x, y, npcType) {
        super.init(x, y, NPC_SIZE, NPC_SIZE);
        this.npcType = npcType || randomChoice(NPC_TYPES);
        this.speed = randomRange(NPC_SPEED_MIN, NPC_SPEED_MAX);
        this.wobbleTimer = Math.random() * Math.PI * 2;
        this.wobbleAmount = randomRange(20, 60);
        this.baseX = x;
    }

    update(dt) {
        // Move downhill
        this.worldY += this.speed * dt;

        // Wobble left-right
        this.wobbleTimer += dt * 2;
        this.worldX = this.baseX + Math.sin(this.wobbleTimer) * this.wobbleAmount;
    }

    renderPlaceholder(ctx, screenX, screenY) {
        const color = NPC_COLORS[this.npcType] || '#888888';

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + this.height / 3, this.width / 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY - 2, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#FFE0BD';
        ctx.beginPath();
        ctx.arc(screenX, screenY - 16, 6, 0, Math.PI * 2);
        ctx.fill();

        // Skis
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screenX - 5, screenY + 12);
        ctx.lineTo(screenX - 5, screenY + 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 5, screenY + 12);
        ctx.lineTo(screenX + 5, screenY + 20);
        ctx.stroke();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(this.npcType.toUpperCase(), screenX, screenY - 24);
    }
}
