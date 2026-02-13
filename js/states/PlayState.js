// SkiAvax — Play State (Active Gameplay)

import { Player } from '../entities/Player.js';
import { TerrainGenerator } from '../TerrainGenerator.js';
import { CollisionManager } from '../CollisionManager.js';
import { ScoreManager } from '../ScoreManager.js';
import { Boss } from '../entities/Boss.js';
import {
    CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SCREEN_Y, COLORS,
    BOSS_TRIGGER_DISTANCE, PIXELS_PER_METER, PLAYER_STATE,
    RAMP_LAUNCH_VELOCITY, SCORE,
} from '../utils/constants.js';
import { formatScore, formatTime } from '../utils/helpers.js';

export class PlayState {
    constructor(game) {
        this.game = game;
        this.camera = game.camera;
        this.mode = 'freerun'; // or 'slalom'

        this.player = null;
        this.terrain = null;
        this.collision = null;
        this.score = null;
        this.boss = null;

        this.bossTriggered = false;
        this.gameTime = 0;
        this.comboDisplayTimer = 0;
        this.comboDisplayText = '';
        this.trickDisplayTimer = 0;
        this.trickDisplayText = '';
        this.screenShake = 0;

        // Snow particles for visual polish
        this.snowParticles = [];

        // Slalom-specific
        this.slalomTimer = 0;
        this.gatesPassed = 0;
        this.gatesMissed = 0;
        this.slalomFinished = false;
    }

    enter(mode = 'freerun') {
        this.mode = mode;
        this.gameTime = 0;
        this.bossTriggered = false;
        this.screenShake = 0;
        this.comboDisplayTimer = 0;
        this.trickDisplayTimer = 0;

        // Create player at center-top of world
        this.player = new Player(CANVAS_WIDTH / 2, 100);

        // Create terrain generator
        this.terrain = new TerrainGenerator(this.mode);

        // Create collision manager
        this.collision = new CollisionManager();

        // Create score manager
        this.score = new ScoreManager();

        // Boss (created but not active until trigger)
        this.boss = new Boss(0, 0);
        this.boss.isActive = false;

        // Camera initial position
        this.camera.follow(this.player);

        // Generate initial terrain
        this.terrain.generateInitial(this.camera);

        // Snow particles
        this.snowParticles = [];
        for (let i = 0; i < 30; i++) {
            this.snowParticles.push({
                x: Math.random() * CANVAS_WIDTH,
                y: Math.random() * CANVAS_HEIGHT,
                size: Math.random() * 2 + 0.5,
                speedY: Math.random() * 20 + 10,
                speedX: Math.random() * 10 - 5,
            });
        }

        // Slalom reset
        this.slalomTimer = 0;
        this.gatesPassed = 0;
        this.gatesMissed = 0;
        this.slalomFinished = false;
    }

    update(dt, input) {
        if (this.player.state === PLAYER_STATE.CAUGHT) {
            // Game over animation delay
            this.gameTime += dt;
            if (this.gameTime > 2.0) {
                this.game.gameOver(this.score.totalScore, this.player.distanceMeters, this.score, this.mode);
            }
            return;
        }

        if (this.slalomFinished) {
            this.game.gameOver(this.slalomTimer, this.player.distanceMeters, this.score, this.mode);
            return;
        }

        // Pause
        if (input.pause) {
            this.game.pauseGame();
            return;
        }

        this.gameTime += dt;
        if (this.mode === 'slalom') {
            this.slalomTimer += dt;
        }

        // Update player
        this.player.update(dt, input);

        // Collect trick points on landing
        const trickPts = this.player.collectTrickPoints();
        if (trickPts > 0) {
            this.score.addTrickPoints(trickPts);
            this.trickDisplayText = `+${trickPts} TRICK!`;
            this.trickDisplayTimer = 1.5;
        }

        // Update camera
        this.camera.follow(this.player);

        // Generate new terrain ahead
        this.terrain.generateAhead(this.camera);

        // Despawn behind camera
        this.terrain.despawnBehind(this.camera);

        // Collision detection
        if (this.player.state === PLAYER_STATE.SKIING) {
            this._checkCollisions();
        }

        // Update NPCs
        for (const npc of this.terrain.npcs.getActive()) {
            npc.update(dt);
        }

        // Update collectibles (animation)
        for (const col of this.terrain.collectibles.getActive()) {
            col.update(dt);
        }

        // Update score distance
        this.score.updateDistance(this.player.distanceMeters);

        // Boss trigger
        if (!this.bossTriggered && this.mode === 'freerun' && this.player.distanceMeters >= BOSS_TRIGGER_DISTANCE) {
            this._triggerBoss();
        }

        // Update boss
        if (this.boss.isActive) {
            this.boss.update(dt, this.player);

            // Boss catches player
            if (this.boss.hasCaughtPlayer(this.player)) {
                this.player.getCaught();
                this.gameTime = 0; // reset for game over delay
            }
        }

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        // Display timers
        if (this.comboDisplayTimer > 0) this.comboDisplayTimer -= dt;
        if (this.trickDisplayTimer > 0) this.trickDisplayTimer -= dt;

        // Snow particles
        for (const p of this.snowParticles) {
            p.y += p.speedY * dt;
            p.x += p.speedX * dt;
            if (p.y > CANVAS_HEIGHT) {
                p.y = -5;
                p.x = Math.random() * CANVAS_WIDTH;
            }
            if (p.x < 0) p.x = CANVAS_WIDTH;
            if (p.x > CANVAS_WIDTH) p.x = 0;
        }

        // Slalom gate checking
        if (this.mode === 'slalom') {
            this._checkSlalomGates();
        }
    }

    _checkCollisions() {
        // Obstacles
        for (const obstacle of this.terrain.obstacles.getActive()) {
            if (this.collision.check(this.player, obstacle)) {
                const crashed = this.player.crash();
                if (crashed) {
                    this.score.crashPenalty();
                    this.screenShake = 8;
                    this.comboDisplayText = 'CRASH!';
                    this.comboDisplayTimer = 1.0;
                }
                break;
            }
        }

        // Collectibles
        for (const col of this.terrain.collectibles.getActive()) {
            if (col.collected) continue;
            if (this.collision.check(this.player, col)) {
                col.collect();
                const points = this.score.collectToken(col.collectibleType);
                this.comboDisplayText = `+${points}`;
                if (this.score.combo > 1) {
                    this.comboDisplayText += ` x${this.score.combo}`;
                }
                this.comboDisplayTimer = 0.8;
            }
        }

        // Ramps
        for (const ramp of this.terrain.ramps.getActive()) {
            if (this.collision.check(this.player, ramp)) {
                this.player.startJump(RAMP_LAUNCH_VELOCITY);
                break;
            }
        }

        // NPCs (crashing into other skiers)
        for (const npc of this.terrain.npcs.getActive()) {
            if (this.collision.check(this.player, npc)) {
                const crashed = this.player.crash();
                if (crashed) {
                    this.score.crashPenalty();
                    this.screenShake = 5;
                    this.comboDisplayText = 'COLLISION!';
                    this.comboDisplayTimer = 1.0;
                }
                break;
            }
        }
    }

    _checkSlalomGates() {
        for (const gate of this.terrain.gates.getActive()) {
            if (gate.passed || gate.missed) continue;

            // Check if player has passed the gate's Y position
            if (this.player.worldY > gate.worldY + 20) {
                const inGate = Math.abs(this.player.worldX - gate.worldX) < gate.gateWidth / 2;
                if (inGate) {
                    gate.passed = true;
                    this.gatesPassed++;
                    this.comboDisplayText = `Gate ${this.gatesPassed}!`;
                    this.comboDisplayTimer = 0.6;
                } else {
                    gate.missed = true;
                    this.gatesMissed++;
                    this.slalomTimer += 5; // penalty
                    this.comboDisplayText = '+5s PENALTY';
                    this.comboDisplayTimer = 1.0;
                    this.screenShake = 4;
                }

                // Check if all gates done
                if (this.gatesPassed + this.gatesMissed >= this.terrain.totalGates) {
                    // Apply clean run bonus
                    if (this.gatesMissed === 0) {
                        this.slalomTimer *= (1 - 0.10); // 10% reduction
                    }
                    this.slalomFinished = true;
                }
            }
        }
    }

    _triggerBoss() {
        this.bossTriggered = true;
        // Spawn boss above and behind the player
        this.boss.worldX = this.player.worldX;
        this.boss.worldY = this.player.worldY - CANVAS_HEIGHT * 0.8;
        this.boss.isActive = true;
        this.boss.startChase();

        // Warning text
        this.comboDisplayText = '⚠ THE JOE IS COMING ⚠';
        this.comboDisplayTimer = 2.5;
    }

    render(ctx) {
        ctx.save();

        // Screen shake offset
        if (this.screenShake > 0) {
            ctx.translate(
                (Math.random() - 0.5) * this.screenShake * 2,
                (Math.random() - 0.5) * this.screenShake * 2
            );
        }

        // Snow background
        this._renderSnowBackground(ctx);

        // Gather all renderable entities and sort by Y (painter's algorithm)
        const entities = [];

        for (const obs of this.terrain.obstacles.getActive()) entities.push(obs);
        for (const col of this.terrain.collectibles.getActive()) entities.push(col);
        for (const ramp of this.terrain.ramps.getActive()) entities.push(ramp);
        for (const npc of this.terrain.npcs.getActive()) entities.push(npc);
        if (this.mode === 'slalom') {
            for (const gate of this.terrain.gates.getActive()) entities.push(gate);
        }

        // Add boss and player
        if (this.boss.isActive) entities.push(this.boss);
        entities.push(this.player);

        // Sort by Y position
        entities.sort((a, b) => a.worldY - b.worldY);

        // Render all
        for (const entity of entities) {
            entity.render(ctx, this.camera);
        }

        ctx.restore();

        // HUD (not affected by screen shake)
        this._renderHUD(ctx);

        // Combo/trick display
        this._renderPopupText(ctx);

        // Snow overlay particles
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (const p of this.snowParticles) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Boss warning overlay
        if (this.boss.isActive && !this.player.state === PLAYER_STATE.CAUGHT) {
            const warningAlpha = Math.abs(Math.sin(this.gameTime * 3)) * 0.1;
            ctx.fillStyle = `rgba(232, 65, 66, ${warningAlpha})`;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }

        // "REKT!" overlay when caught
        if (this.player.state === PLAYER_STATE.CAUGHT) {
            this._renderRektOverlay(ctx);
        }
    }

    _renderSnowBackground(ctx) {
        // Base snow color
        ctx.fillStyle = COLORS.SNOW_WHITE;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Subtle snow texture (random dots based on camera position for parallax)
        ctx.fillStyle = COLORS.SNOW_SHADOW;
        const seed = Math.floor(this.camera.y / 50);
        const rng = this._seededRandom(seed);
        for (let i = 0; i < 40; i++) {
            const x = rng() * CANVAS_WIDTH;
            const y = ((rng() * 800 - this.camera.y * 0.3) % CANVAS_HEIGHT + CANVAS_HEIGHT) % CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, rng() * 2 + 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ski tracks from trail positions
        if (this.player.trailPositions.length > 1) {
            ctx.strokeStyle = 'rgba(180, 200, 215, 0.4)';
            ctx.lineWidth = 2;
            for (let i = 1; i < this.player.trailPositions.length; i++) {
                const prev = this.camera.worldToScreen(
                    this.player.trailPositions[i - 1].x - 5,
                    this.player.trailPositions[i - 1].y
                );
                const curr = this.camera.worldToScreen(
                    this.player.trailPositions[i].x - 5,
                    this.player.trailPositions[i].y
                );
                ctx.beginPath();
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
                ctx.stroke();

                // Right trail
                const prev2 = this.camera.worldToScreen(
                    this.player.trailPositions[i - 1].x + 5,
                    this.player.trailPositions[i - 1].y
                );
                const curr2 = this.camera.worldToScreen(
                    this.player.trailPositions[i].x + 5,
                    this.player.trailPositions[i].y
                );
                ctx.beginPath();
                ctx.moveTo(prev2.x, prev2.y);
                ctx.lineTo(curr2.x, curr2.y);
                ctx.stroke();
            }
        }
    }

    _seededRandom(seed) {
        let s = seed;
        return function () {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    _renderHUD(ctx) {
        const padding = 15;
        const hudHeight = 40;

        // Top bar background
        ctx.fillStyle = COLORS.HUD_BG;
        ctx.fillRect(0, 0, CANVAS_WIDTH, hudHeight);

        ctx.textBaseline = 'middle';
        ctx.font = 'bold 14px "Segoe UI", monospace';

        const y = hudHeight / 2;

        // Distance
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.textAlign = 'left';
        const dist = Math.floor(this.player.distanceMeters);
        ctx.fillText(`📏 ${dist}m`, padding, y);

        // Score (free run) or Time (slalom)
        if (this.mode === 'freerun') {
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.font = 'bold 16px "Segoe UI", monospace';
            ctx.fillText(`⭐ ${formatScore(this.score.totalScore)}`, CANVAS_WIDTH / 2, y);
        } else {
            ctx.textAlign = 'center';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.font = 'bold 16px "Segoe UI", monospace';
            ctx.fillText(`⏱ ${formatTime(this.slalomTimer)}`, CANVAS_WIDTH / 2, y);

            // Gates
            ctx.fillStyle = COLORS.AVAX_WHITE;
            ctx.font = 'bold 13px "Segoe UI", monospace';
            ctx.fillText(`Gates: ${this.gatesPassed}/${this.terrain.totalGates}`, CANVAS_WIDTH / 2 + 150, y);
        }

        // Combo
        if (this.score.combo > 1 && this.mode === 'freerun') {
            ctx.textAlign = 'right';
            const comboColor = COLORS.COMBO_COLORS[Math.min(this.score.combo - 1, COLORS.COMBO_COLORS.length - 1)];
            ctx.fillStyle = comboColor;
            ctx.font = 'bold 14px "Segoe UI", monospace';
            ctx.fillText(`COMBO x${this.score.combo}`, CANVAS_WIDTH - padding - 80, y);
        }

        // Speed indicator
        ctx.textAlign = 'right';
        ctx.fillStyle = this.player.isBoosting ? COLORS.PHARAOH_GOLD : COLORS.AVAX_WHITE;
        ctx.font = '12px "Segoe UI", monospace';
        const speedLabel = this.player.isBoosting ? '🚀 BOOST' : `💨 ${Math.floor(this.player.speed)}`;
        ctx.fillText(speedLabel, CANVAS_WIDTH - padding, y);
    }

    _renderPopupText(ctx) {
        // Combo/event text popup
        if (this.comboDisplayTimer > 0) {
            const alpha = Math.min(1, this.comboDisplayTimer);
            const yOffset = (1 - this.comboDisplayTimer) * -30;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';

            // Determine color
            let color;
            if (this.comboDisplayText.includes('CRASH') || this.comboDisplayText.includes('COLLISION') || this.comboDisplayText.includes('PENALTY')) {
                color = COLORS.AVAX_RED;
            } else if (this.comboDisplayText.includes('⚠')) {
                color = COLORS.AVAX_RED;
                ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
            } else {
                color = COLORS.PHARAOH_GOLD;
            }

            ctx.fillStyle = `rgba(0,0,0,${alpha * 0.5})`;
            ctx.fillText(this.comboDisplayText, CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT * 0.45 + yOffset + 2);
            ctx.fillStyle = color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
            // For hex colors:
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillText(this.comboDisplayText, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.45 + yOffset);
            ctx.restore();
        }

        // Trick text popup
        if (this.trickDisplayTimer > 0) {
            const alpha = Math.min(1, this.trickDisplayTimer);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#00FF88';
            ctx.fillText(this.trickDisplayText, CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.35);
            ctx.restore();
        }
    }

    _renderRektOverlay(ctx) {
        // Dark overlay
        const t = Math.min(this.gameTime / 1.5, 1);
        ctx.fillStyle = `rgba(0, 0, 0, ${t * 0.7})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // REKT! text
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const scale = 1 + Math.sin(this.gameTime * 8) * 0.05;
        ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        ctx.scale(scale, scale);

        ctx.font = 'bold 80px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.fillText('REKT!', 0, 0);

        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('The Joe got you...', 0, 50);

        ctx.restore();
    }
}
