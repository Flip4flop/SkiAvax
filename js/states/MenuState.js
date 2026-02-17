// SkiAvax — Menu State

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants.js';

export class MenuState {
    constructor(game) {
        this.game = game;
        this.selectedMode = 0; // 0 = Free Run, 1 = Slalom
        this.modes = ['Free Run', 'Slalom'];
        this.animTimer = 0;
        this.snowflakes = [];

        // Generate background snowflakes
        for (let i = 0; i < 60; i++) {
            this.snowflakes.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 30 + 15,
                wobble: Math.random() * Math.PI * 2,
            });
        }
    }

    enter() {
        this.selectedMode = 0;
        this.animTimer = 0;
    }

    update(dt, input) {
        this.animTimer += dt;

        // Update snowflakes
        for (const flake of this.snowflakes) {
            flake.y += flake.speed * dt;
            flake.x += Math.sin(flake.wobble + this.animTimer * 2) * 0.5;
            if (flake.y > CANVAS_HEIGHT) {
                flake.y = -5;
                flake.x = Math.random() * CANVAS_WIDTH;
            }
        }

        // Mode selection
        if (input.isKeyJustPressed('ArrowUp') || input.isKeyJustPressed('KeyW')) {
            this.selectedMode = (this.selectedMode - 1 + this.modes.length) % this.modes.length;
        }
        if (input.isKeyJustPressed('ArrowDown') || input.isKeyJustPressed('KeyS')) {
            this.selectedMode = (this.selectedMode + 1) % this.modes.length;
        }

        // Start game
        if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
            this.game.startGame(this.selectedMode === 0 ? 'freerun' : 'slalom');
        }

        // Also allow number keys
        if (input.isKeyJustPressed('Digit1')) {
            this.game.startGame('freerun');
        }
        if (input.isKeyJustPressed('Digit2')) {
            this.game.startGame('slalom');
        }

        // Mouse click on mode buttons
        if (input.mouse.justClicked) {
            const canvas = this.game.canvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            const mx = (input.mouse.x - rect.left) * scaleX;
            const my = (input.mouse.y - rect.top) * scaleY;

            const menuStartY = 280;
            for (let i = 0; i < this.modes.length; i++) {
                const y = menuStartY + i * 60;
                if (mx > CANVAS_WIDTH / 2 - 140 && mx < CANVAS_WIDTH / 2 + 140 &&
                    my > y - 22 && my < y + 22) {
                    this.game.startGame(i === 0 ? 'freerun' : 'slalom');
                    break;
                }
            }
        }
    }

    render(ctx) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(0.5, '#2a2a5e');
        grad.addColorStop(1, '#0d0d2b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Snowflakes
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        for (const flake of this.snowflakes) {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mountain silhouette
        ctx.fillStyle = '#16163a';
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_HEIGHT);
        ctx.lineTo(0, CANVAS_HEIGHT * 0.6);
        ctx.lineTo(CANVAS_WIDTH * 0.15, CANVAS_HEIGHT * 0.35);
        ctx.lineTo(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.5);
        ctx.lineTo(CANVAS_WIDTH * 0.5, CANVAS_HEIGHT * 0.25);
        ctx.lineTo(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.45);
        ctx.lineTo(CANVAS_WIDTH * 0.85, CANVAS_HEIGHT * 0.3);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT * 0.55);
        ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.closePath();
        ctx.fill();

        // Title
        const titleY = 120 + Math.sin(this.animTimer * 2) * 5;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';

        // Measure text widths for precise layout
        const skiWidth = ctx.measureText('SKI ').width;
        const vaxWidth = ctx.measureText('VAX').width;
        const logoSize = 66; // diameter of the AVAX circle logo — matches 72px font height
        const totalWidth = skiWidth + logoSize + 4 + vaxWidth;
        const startX = (CANVAS_WIDTH - totalWidth) / 2;

        // "SKI " in white
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('SKI ', startX, titleY);

        // AVAX circle logo as the "A" in AVAX
        const logoX = startX + skiWidth + logoSize / 2;
        const logoY = titleY;
        const logoRadius = logoSize / 2;

        // Red circle
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
        ctx.fill();

        // White triangle "A" inside the circle (AVAX branding)
        // The AVAX "A" is an upward-pointing triangle with a V-notch at the base
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.beginPath();
        // Main triangle
        const triH = logoRadius * 1.3;
        const triW = logoRadius * 1.1;
        ctx.moveTo(logoX, logoY - triH * 0.65);           // top point
        ctx.lineTo(logoX - triW * 0.55, logoY + triH * 0.45); // bottom-left
        ctx.lineTo(logoX - triW * 0.12, logoY + triH * 0.45); // inner left of notch
        ctx.lineTo(logoX, logoY + triH * 0.15);              // notch apex (the "crossbar")
        ctx.lineTo(logoX + triW * 0.12, logoY + triH * 0.45); // inner right of notch
        ctx.lineTo(logoX + triW * 0.55, logoY + triH * 0.45); // bottom-right
        ctx.closePath();
        ctx.fill();

        // "VAX" in red
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
        ctx.fillText('VAX', startX + skiWidth + logoSize + 4, titleY);

        // Subtitle — reset alignment to center for all text below the title
        ctx.textAlign = 'center';
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('A SkiFree tribute for the Avalanche community', CANVAS_WIDTH / 2, titleY + 50);

        // Mode selection
        const menuStartY = 280;
        for (let i = 0; i < this.modes.length; i++) {
            const y = menuStartY + i * 60;
            const isSelected = i === this.selectedMode;

            // Selection background
            if (isSelected) {
                const pulseAlpha = 0.15 + Math.sin(this.animTimer * 4) * 0.05;
                ctx.fillStyle = `rgba(232, 65, 66, ${pulseAlpha})`;
                ctx.beginPath();
                ctx.roundRect(CANVAS_WIDTH / 2 - 140, y - 22, 280, 44, 8);
                ctx.fill();

                ctx.strokeStyle = COLORS.AVAX_RED;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(CANVAS_WIDTH / 2 - 140, y - 22, 280, 44, 8);
                ctx.stroke();
            }

            // Mode text
            ctx.font = isSelected ? 'bold 24px "Segoe UI", Arial, sans-serif' : '22px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = isSelected ? COLORS.AVAX_WHITE : 'rgba(255,255,255,0.5)';
            ctx.fillText(this.modes[i], CANVAS_WIDTH / 2, y);

            // Mode number
            ctx.font = '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = isSelected ? COLORS.AVAX_RED : 'rgba(255,255,255,0.3)';
            ctx.fillText(`[${i + 1}]`, CANVAS_WIDTH / 2 - 100, y);
        }

        // Mode descriptions
        const descY = menuStartY + this.modes.length * 60 + 20;
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        if (this.selectedMode === 0) {
            ctx.fillText('Ski downhill, collect AVAX tokens, dodge obstacles, survive the boss!', CANVAS_WIDTH / 2, descY);
        } else {
            ctx.fillText('Race through gates against the clock. Miss a gate = +5s penalty.', CANVAS_WIDTH / 2, descY);
        }

        // Controls
        const ctrlY = CANVAS_HEIGHT - 100;
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('↑↓ Select Mode  •  Enter/Space to Start', CANVAS_WIDTH / 2, ctrlY);

        // Main controls
        ctx.fillText('Arrow Keys: Steer  •  Space: Jump  •  P: Pause', CANVAS_WIDTH / 2, ctrlY + 22);

        // Boost instruction (highlighted)
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.fillText('Hold F to BOOST — Essential for outrunning the monster!', CANVAS_WIDTH / 2, ctrlY + 44);

        // Credits
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('Powered by Avalanche  •  Pharaoh Exchange', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
    }
}
