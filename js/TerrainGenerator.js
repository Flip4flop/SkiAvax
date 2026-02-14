// SkiAvax — Terrain Generator (Procedural world generation)

import { ObjectPool } from './utils/ObjectPool.js';
import { Obstacle } from './entities/Obstacle.js';
import { Collectible } from './entities/Collectible.js';
import { Ramp } from './entities/Ramp.js';
import { NPC } from './entities/NPC.js';
import { Gate } from './entities/Gate.js';
import {
    CANVAS_WIDTH, TERRAIN, OBSTACLE_TYPES, OBSTACLE_SIZES,
    COLLECTIBLE_TYPES, NPC_TYPES, SLALOM,
} from './utils/constants.js';
import { randomRange, randomInt, randomChoice } from './utils/helpers.js';

export class TerrainGenerator {
    constructor(mode = 'freerun') {
        this.mode = mode;
        this.lastGeneratedY = 0; // furthest Y we've generated to
        this.bandHeight = TERRAIN.SPAWN_BAND_HEIGHT;

        // Object pools
        this.obstacles = new ObjectPool(() => new Obstacle(0, 0, 36, 44), 30);
        this.collectibles = new ObjectPool(() => new Collectible(0, 0), 20);
        this.ramps = new ObjectPool(() => new Ramp(0, 0), 10);
        this.npcs = new ObjectPool(() => new NPC(0, 0), 15);
        this.gates = new ObjectPool(() => new Gate(0, 0), 25);

        // All recently placed positions (for minimum distance check)
        this.recentPositions = [];

        // Slalom gate tracking
        this.gatesGenerated = 0;
        this.totalGates = SLALOM.GATE_COUNT;

        // Difficulty scaling
        this.difficultyMultiplier = 1.0;

        // Slalom: obstacle-free zone before the first gate
        this.slalomSafeZoneEnd = 0;
    }

    /**
     * Generate initial terrain visible from the starting camera position
     */
    generateInitial(camera) {
        this.lastGeneratedY = camera.y;

        if (this.mode === 'slalom') {
            this._generateSlalomCourse(camera);
        }

        // Generate a few bands ahead
        const bandsAhead = 8;
        for (let i = 0; i < bandsAhead; i++) {
            this._generateBand(this.lastGeneratedY, this.lastGeneratedY + this.bandHeight);
            this.lastGeneratedY += this.bandHeight;
        }
    }

    /**
     * Generate new terrain ahead of the camera as needed
     */
    generateAhead(camera) {
        const generateThreshold = camera.bottomEdge + 300;

        while (this.lastGeneratedY < generateThreshold) {
            this._generateBand(this.lastGeneratedY, this.lastGeneratedY + this.bandHeight);
            this.lastGeneratedY += this.bandHeight;
        }

        // Increase difficulty over time
        const distanceMeters = camera.y / 10;
        this.difficultyMultiplier = 1.0 + (distanceMeters / 2000) * 0.5; // 50% harder at 2000m
    }

    /**
     * Remove entities that are above (behind) the camera
     */
    despawnBehind(camera) {
        const despawnY = camera.topEdge - TERRAIN.DESPAWN_MARGIN;

        this._despawnPool(this.obstacles, despawnY);
        this._despawnPool(this.collectibles, despawnY);
        this._despawnPool(this.ramps, despawnY);
        this._despawnPool(this.npcs, despawnY);
        // Don't despawn gates (need them for tracking)

        // Clean recent positions
        this.recentPositions = this.recentPositions.filter(p => p.y > despawnY);
    }

    _despawnPool(pool, despawnY) {
        const toRelease = [];
        for (const entity of pool.getActive()) {
            if (entity.worldY < despawnY) {
                toRelease.push(entity);
            }
        }
        for (const entity of toRelease) {
            pool.release(entity);
        }
    }

    /**
     * Generate a single band of terrain
     */
    _generateBand(fromY, toY) {
        const bandWidth = CANVAS_WIDTH * 2; // wider than screen for horizontal movement
        const centerX = CANVAS_WIDTH / 2;

        // In slalom mode, skip obstacles/NPCs/ramps in the safe zone before the first gate
        const inSafeZone = this.mode === 'slalom' && fromY < this.slalomSafeZoneEnd;

        // Obstacles (skip in slalom safe zone)
        if (!inSafeZone) {
            const obstacleCount = Math.floor(
                randomRange(1, 4) * this.difficultyMultiplier
            );
            for (let i = 0; i < obstacleCount; i++) {
                const x = randomRange(centerX - bandWidth / 2, centerX + bandWidth / 2);
                const y = randomRange(fromY, toY);

                if (this._isTooClose(x, y)) continue;

                const type = this._randomObstacleType();
                const size = OBSTACLE_SIZES[type];
                const obstacle = this.obstacles.acquire();
                obstacle.init(x, y, size.width, size.height, type);
                this.recentPositions.push({ x, y });
            }
        }

        // Collectibles (always allowed — even in safe zone)
        const collectChance = TERRAIN.COLLECTIBLE_DENSITY * this.bandHeight * 3;
        if (Math.random() < collectChance) {
            const x = randomRange(centerX - bandWidth / 3, centerX + bandWidth / 3);
            const y = randomRange(fromY, toY);

            if (!this._isTooClose(x, y)) {
                const type = Math.random() < 0.15 ? COLLECTIBLE_TYPES.PHAR : COLLECTIBLE_TYPES.AVAX;
                const collectible = this.collectibles.acquire();
                collectible.init(x, y, type);
                this.recentPositions.push({ x, y });
            }
        }

        // Sometimes spawn a line of collectibles
        if (Math.random() < 0.03) {
            const startX = randomRange(centerX - 200, centerX + 200);
            const startY = randomRange(fromY, toY);
            const count = randomInt(3, 6);
            const dx = randomRange(-15, 15);

            for (let i = 0; i < count; i++) {
                const cx = startX + dx * i;
                const cy = startY + i * 25;
                if (!this._isTooClose(cx, cy)) {
                    const col = this.collectibles.acquire();
                    col.init(cx, cy, COLLECTIBLE_TYPES.AVAX);
                    this.recentPositions.push({ x: cx, y: cy });
                }
            }
        }

        // Ramps (skip in slalom safe zone)
        if (!inSafeZone && Math.random() < TERRAIN.RAMP_DENSITY * this.bandHeight) {
            const x = randomRange(centerX - bandWidth / 3, centerX + bandWidth / 3);
            const y = randomRange(fromY, toY);

            if (!this._isTooClose(x, y)) {
                const ramp = this.ramps.acquire();
                ramp.init(x, y);
                this.recentPositions.push({ x, y });
            }
        }

        // NPCs (skip in slalom safe zone)
        if (!inSafeZone && Math.random() < TERRAIN.NPC_DENSITY * this.bandHeight) {
            const x = randomRange(centerX - bandWidth / 3, centerX + bandWidth / 3);
            const y = randomRange(fromY, toY);

            if (!this._isTooClose(x, y)) {
                const npcType = randomChoice(NPC_TYPES);
                const npc = this.npcs.acquire();
                npc.init(x, y, npcType);
                this.recentPositions.push({ x, y });
            }
        }
    }

    /**
     * Generate the full slalom course
     */
    _generateSlalomCourse(camera) {
        const startY = camera.y + 200;

        // Keep the area before the first gate clear of obstacles
        this.slalomSafeZoneEnd = startY + SLALOM.GATE_SPACING + 50;

        for (let i = 0; i < this.totalGates; i++) {
            const gateY = startY + (i + 1) * SLALOM.GATE_SPACING;
            // Alternate gate positions slightly left/right of center
            const offset = Math.sin(i * 0.7) * 80 + (Math.random() - 0.5) * 40;
            const gateX = CANVAS_WIDTH / 2 + offset;

            const gate = this.gates.acquire();
            gate.init(gateX, gateY, i + 1);
            this.gatesGenerated++;
        }
    }

    /**
     * Check if a position is too close to existing entities
     */
    _isTooClose(x, y) {
        const minDist = TERRAIN.MIN_SPAWN_DISTANCE;
        for (const pos of this.recentPositions) {
            const dx = x - pos.x;
            const dy = y - pos.y;
            if (dx * dx + dy * dy < minDist * minDist) {
                return true;
            }
        }
        return false;
    }

    /**
     * Random obstacle type with weighted distribution
     */
    _randomObstacleType() {
        const roll = Math.random();
        if (roll < 0.60) return OBSTACLE_TYPES.AVAX_TREE;    // 60% AVAX trees
        if (roll < 0.80) return OBSTACLE_TYPES.SNOWBANK;     // 20% snowbanks
        return OBSTACLE_TYPES.BLACKHOLE;                      // 20% blackholes
    }
}
