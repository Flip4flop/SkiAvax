// SkiAvax — Player Entity

import { Entity } from './Entity.js';
import {
    PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_BASE_SPEED, PLAYER_MAX_SPEED,
    PLAYER_BOOST_SPEED, PLAYER_ACCELERATION, PLAYER_HORIZONTAL_SPEED,
    PLAYER_JUMP_VELOCITY, PLAYER_GRAVITY, PLAYER_CRASH_DURATION,
    PLAYER_INVINCIBLE_DURATION, PLAYER_STATE, DIRECTION, DIRECTION_ANGLES,
    COLORS, RAMP_LAUNCH_VELOCITY,
} from '../utils/constants.js';
import { clamp, lerp } from '../utils/helpers.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
        this.type = 'player';
        this.reset(x, y);
    }

    reset(x, y) {
        this.worldX = x;
        this.worldY = y;
        this.velocityX = 0;
        this.velocityY = PLAYER_BASE_SPEED;
        this.speed = PLAYER_BASE_SPEED;
        this.direction = DIRECTION.DOWN;
        this.state = PLAYER_STATE.SKIING;

        // Jump / air
        this.airHeight = 0; // visual height off ground (for shadow + rendering)
        this.airVelocity = 0;
        this.isOnGround = true;

        // Tricks
        this.trickRotation = 0; // accumulated rotation in air
        this.trickFlips = 0;
        this.trickSpins = 0;
        this.pendingTrickPoints = 0;

        // Crash
        this.crashTimer = 0;
        this.invincibleTimer = 0;

        // Boost
        this.isBoosting = false;

        // Trail effect
        this.trailPositions = [];

        // Sprites per direction (will be set by AssetManager)
        this.sprites = {};
    }

    update(dt, input) {
        switch (this.state) {
            case PLAYER_STATE.SKIING:
                this._updateSkiing(dt, input);
                break;
            case PLAYER_STATE.JUMPING:
                this._updateJumping(dt, input);
                break;
            case PLAYER_STATE.CRASHING:
                this._updateCrashing(dt);
                break;
            case PLAYER_STATE.CAUGHT:
                // No update — game over animation handled externally
                break;
        }

        // Update invincibility
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
        }

        // Store trail positions
        this.trailPositions.push({ x: this.worldX, y: this.worldY });
        if (this.trailPositions.length > 20) {
            this.trailPositions.shift();
        }
    }

    _updateSkiing(dt, input) {
        // Boost
        this.isBoosting = input.boost;
        const targetSpeed = this.isBoosting ? PLAYER_BOOST_SPEED : PLAYER_BASE_SPEED;
        this.speed = lerp(this.speed, targetSpeed, dt * 3);

        // Direction from input
        const touchDir = input.getTouchDirection();

        if (input.left || touchDir === 'left') {
            if (this.direction > DIRECTION.LEFT_FAST) {
                this.direction--;
            }
        } else if (input.right || touchDir === 'right') {
            if (this.direction < DIRECTION.RIGHT_FAST) {
                this.direction++;
            }
        } else {
            // Drift back toward straight down
            if (this.direction < DIRECTION.DOWN) {
                this.direction++;
            } else if (this.direction > DIRECTION.DOWN) {
                this.direction--;
            }
        }

        // Calculate velocity from direction
        const angle = DIRECTION_ANGLES[this.direction];
        this.velocityX = Math.sin(angle) * this.speed;
        this.velocityY = Math.cos(angle) * this.speed;

        // For extreme left/right, reduce downhill speed
        if (this.direction === DIRECTION.LEFT_FAST || this.direction === DIRECTION.RIGHT_FAST) {
            this.velocityY *= 0.15;
            this.velocityX = Math.sign(this.velocityX) * this.speed * 0.9;
        }

        // Move player
        this.worldX += this.velocityX * dt;
        this.worldY += this.velocityY * dt;

        // Jump
        if (input.jump) {
            this.startJump(PLAYER_JUMP_VELOCITY);
        }
    }

    _updateJumping(dt, input) {
        // Air physics
        this.airVelocity += PLAYER_GRAVITY * dt;
        this.airHeight += this.airVelocity * dt;

        // Trick input in air
        if (input.up || input.down) {
            this.trickRotation += 360 * dt * 1.5; // flip speed
        }
        if (input.left || input.right) {
            this.trickRotation += 360 * dt * 1.2; // spin speed
        }

        // Count completed tricks
        const newFlips = Math.floor(this.trickRotation / 360);
        if (newFlips > this.trickFlips) {
            this.trickFlips = newFlips;
        }

        // Continue horizontal/vertical movement (reduced control in air)
        this.worldX += this.velocityX * dt * 0.7;
        this.worldY += this.velocityY * dt;

        // Landing
        if (this.airHeight >= 0 && this.airVelocity > 0) {
            this.airHeight = 0;
            this.airVelocity = 0;
            this.isOnGround = true;
            this.state = PLAYER_STATE.SKIING;

            // Calculate trick points
            this.pendingTrickPoints = this.trickFlips * 200 + this.trickSpins * 150;
            this.trickRotation = 0;
            this.trickFlips = 0;
            this.trickSpins = 0;
        }
    }

    _updateCrashing(dt) {
        this.crashTimer -= dt;
        this.velocityX = 0;
        this.velocityY = lerp(this.velocityY, 0, dt * 5);

        // Slide to a stop
        this.worldY += this.velocityY * dt * 0.3;

        if (this.crashTimer <= 0) {
            this.state = PLAYER_STATE.SKIING;
            this.invincibleTimer = PLAYER_INVINCIBLE_DURATION;
            this.speed = PLAYER_BASE_SPEED * 0.5; // start slow after crash
        }
    }

    /**
     * Start a jump (from spacebar or ramp)
     */
    startJump(velocity) {
        if (!this.isOnGround) return;
        this.state = PLAYER_STATE.JUMPING;
        this.isOnGround = false;
        this.airVelocity = velocity || PLAYER_JUMP_VELOCITY;
        this.airHeight = -1; // small initial offset
        this.trickRotation = 0;
        this.trickFlips = 0;
        this.trickSpins = 0;
    }

    /**
     * Crash into an obstacle
     */
    crash() {
        if (this.invincibleTimer > 0 || this.state === PLAYER_STATE.CRASHING) return false;
        if (this.state === PLAYER_STATE.JUMPING) return false; // can't crash while airborne

        this.state = PLAYER_STATE.CRASHING;
        this.crashTimer = PLAYER_CRASH_DURATION;
        this.pendingTrickPoints = 0;
        return true;
    }

    /**
     * Get caught by the boss
     */
    getCaught() {
        this.state = PLAYER_STATE.CAUGHT;
        this.velocityX = 0;
        this.velocityY = 0;
    }

    /**
     * Collect pending trick points and reset
     */
    collectTrickPoints() {
        const points = this.pendingTrickPoints;
        this.pendingTrickPoints = 0;
        return points;
    }

    /**
     * Render player with direction-specific appearance
     */
    render(ctx, camera) {
        if (!this.isActive) return;

        const screen = camera.worldToScreen(this.worldX, this.worldY);
        const drawY = screen.y - this.airHeight;

        // Draw shadow when airborne
        if (!this.isOnGround) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(screen.x, screen.y + this.height / 3, this.width / 2.5, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Invincibility blink
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            return; // skip render for blink effect
        }

        // Determine which sprite to use based on player state
        let spriteKey;
        if (this.state === PLAYER_STATE.JUMPING) {
            spriteKey = 'player_jump';
        } else if (this.state === PLAYER_STATE.CRASHING) {
            spriteKey = 'player_crash';
        } else if (this.state === PLAYER_STATE.CAUGHT) {
            spriteKey = 'player_caught';
        } else {
            spriteKey = `player_dir_${this.direction}`;
        }

        if (this.sprites[spriteKey]) {
            ctx.drawImage(
                this.sprites[spriteKey],
                screen.x - this.width / 2,
                drawY - this.height / 2,
                this.width,
                this.height
            );
        } else {
            this._renderPlaceholder(ctx, screen.x, drawY);
        }
    }

    /**
     * Render placeholder skier graphic
     */
    _renderPlaceholder(ctx, screenX, screenY) {
        ctx.save();
        ctx.translate(screenX, screenY);

        // Body color based on state
        let bodyColor = COLORS.PHARAOH_RED;
        if (this.state === PLAYER_STATE.CRASHING) bodyColor = '#FF6600';
        if (this.state === PLAYER_STATE.CAUGHT) bodyColor = '#666666';
        if (this.isBoosting) bodyColor = COLORS.PHARAOH_GOLD;

        // Rotation for tricks in air
        if (this.state === PLAYER_STATE.JUMPING) {
            ctx.rotate((this.trickRotation * Math.PI) / 180);
        }

        // Body (oval)
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, -4, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = COLORS.PHARAOH_GOLD;
        ctx.beginPath();
        ctx.arc(0, -20, 8, 0, Math.PI * 2);
        ctx.fill();

        // Skis based on direction
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        const angle = DIRECTION_ANGLES[this.direction];
        const skiLength = 22;

        // Left ski
        ctx.beginPath();
        ctx.moveTo(-6, 14);
        ctx.lineTo(-6 + Math.sin(angle) * skiLength, 14 + Math.cos(angle) * 6);
        ctx.stroke();

        // Right ski
        ctx.beginPath();
        ctx.moveTo(6, 14);
        ctx.lineTo(6 + Math.sin(angle) * skiLength, 14 + Math.cos(angle) * 6);
        ctx.stroke();

        // Boost particles
        if (this.isBoosting) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(255, 215, 0, ${0.6 - i * 0.2})`;
                ctx.beginPath();
                ctx.arc(
                    (Math.random() - 0.5) * 16,
                    -28 - Math.random() * 12,
                    3 - i,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        }

        ctx.restore();
    }

    /**
     * Get distance traveled in meters
     */
    get distanceMeters() {
        return this.worldY / 10; // PIXELS_PER_METER = 10
    }
}
