// SkiAvax — Gate Entity (Slalom)

import { Entity } from './Entity.js';
import { SLALOM, COLORS } from '../utils/constants.js';

export class Gate extends Entity {
    constructor(x, y) {
        super(x, y, SLALOM.GATE_WIDTH, 40);
        this.type = 'gate';
        this.isCollidable = false; // gates don't cause crashes
        this.gateWidth = SLALOM.GATE_WIDTH;
        this.passed = false;
        this.missed = false;
        this.gateNumber = 0;
    }

    init(x, y, gateNumber) {
        super.init(x, y, SLALOM.GATE_WIDTH, 40);
        this.passed = false;
        this.missed = false;
        this.gateNumber = gateNumber || 0;
        this.gateWidth = SLALOM.GATE_WIDTH;
    }

    render(ctx, camera) {
        if (!this.isActive) return;

        const screen = camera.worldToScreen(this.worldX, this.worldY);
        const halfW = this.gateWidth / 2;

        // Gate color based on state
        let flagColor = COLORS.AVAX_RED;
        let poleColor = '#FFFFFF';
        if (this.passed) {
            flagColor = '#00FF88';
            poleColor = '#00FF88';
        } else if (this.missed) {
            flagColor = '#888888';
            poleColor = '#888888';
        }

        // Left pole
        ctx.strokeStyle = poleColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screen.x - halfW, screen.y + 15);
        ctx.lineTo(screen.x - halfW, screen.y - 20);
        ctx.stroke();

        // Left flag
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(screen.x - halfW, screen.y - 20);
        ctx.lineTo(screen.x - halfW + 12, screen.y - 14);
        ctx.lineTo(screen.x - halfW, screen.y - 8);
        ctx.closePath();
        ctx.fill();

        // Right pole
        ctx.strokeStyle = poleColor;
        ctx.beginPath();
        ctx.moveTo(screen.x + halfW, screen.y + 15);
        ctx.lineTo(screen.x + halfW, screen.y - 20);
        ctx.stroke();

        // Right flag
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(screen.x + halfW, screen.y - 20);
        ctx.lineTo(screen.x + halfW - 12, screen.y - 14);
        ctx.lineTo(screen.x + halfW, screen.y - 8);
        ctx.closePath();
        ctx.fill();

        // Dotted line between gates (visual guide)
        if (!this.passed && !this.missed) {
            ctx.setLineDash([4, 6]);
            ctx.strokeStyle = 'rgba(232, 65, 66, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screen.x - halfW, screen.y);
            ctx.lineTo(screen.x + halfW, screen.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Gate number
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${this.gateNumber}`, screen.x, screen.y - 22);
    }
}
