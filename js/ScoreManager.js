// SkiAvax — Score Manager

import { SCORE, COLLECTIBLE_TYPES, COLLECTIBLE_POINTS } from './utils/constants.js';

export class ScoreManager {
    constructor() {
        this.distanceScore = 0;
        this.tokenScore = 0;
        this.trickScore = 0;
        this.combo = 1;
        this.bestCombo = 1;
        this.tokensCollected = 0;
        this.lastDistance = 0;
    }

    /**
     * Update distance-based score
     */
    updateDistance(distanceMeters) {
        const delta = distanceMeters - this.lastDistance;
        if (delta > 0) {
            this.distanceScore += delta * SCORE.DISTANCE_PER_METER;
        }
        this.lastDistance = distanceMeters;
    }

    /**
     * Collect a token — returns points earned (with combo)
     */
    collectToken(type) {
        const basePoints = COLLECTIBLE_POINTS[type] || SCORE.AVAX_TOKEN;
        const points = basePoints * this.combo;
        this.tokenScore += points;
        this.tokensCollected++;

        // Increase combo
        if (this.combo < SCORE.MAX_COMBO) {
            this.combo++;
        }
        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }

        return points;
    }

    /**
     * Add trick points
     */
    addTrickPoints(points) {
        this.trickScore += points;
    }

    /**
     * Crash penalty — reset combo
     */
    crashPenalty() {
        this.combo = 1;
        this.tokenScore = Math.max(0, this.tokenScore + SCORE.CRASH_PENALTY);
    }

    /**
     * Boss escape bonus
     */
    bossEscapeBonus() {
        this.tokenScore += SCORE.BOSS_ESCAPE_BONUS;
    }

    /**
     * Total score
     */
    get totalScore() {
        return Math.floor(this.distanceScore + this.tokenScore + this.trickScore);
    }
}
