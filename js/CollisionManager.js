// SkiAvax — Collision Manager

import { fairCollision } from './utils/helpers.js';

export class CollisionManager {
    constructor() {
        // Collision scale: 75% of sprite size for fairness
        this.collisionScale = 0.75;
    }

    /**
     * Check collision between two entities
     */
    check(entityA, entityB) {
        if (!entityA.isActive || !entityB.isActive) return false;
        if (!entityA.isCollidable || !entityB.isCollidable) return false;

        return fairCollision(
            entityA.getBounds(),
            entityB.getBounds(),
            this.collisionScale
        );
    }
}
