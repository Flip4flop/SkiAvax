// SkiAvax — Camera System

import { CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_SCREEN_Y } from './utils/constants.js';

export class Camera {
    constructor() {
        this.x = 0; // World X position (center of camera)
        this.y = 0; // World Y position (top of camera)
        this.width = CANVAS_WIDTH;
        this.height = CANVAS_HEIGHT;
    }

    /**
     * Update camera to follow player
     */
    follow(player) {
        // Camera X follows player horizontally (centered)
        this.x = player.worldX - this.width / 2;

        // Camera Y follows player, keeping player at PLAYER_SCREEN_Y from top
        this.y = player.worldY - this.height * PLAYER_SCREEN_Y;
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y,
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y,
        };
    }

    /**
     * Check if a world position is visible on screen
     */
    isVisible(worldX, worldY, width = 0, height = 0) {
        const margin = 50;
        return (
            worldX + width / 2 > this.x - margin &&
            worldX - width / 2 < this.x + this.width + margin &&
            worldY + height / 2 > this.y - margin &&
            worldY - height / 2 < this.y + this.height + margin
        );
    }

    /**
     * Get the world Y coordinate at the bottom edge of the camera + margin
     * Used for terrain generation: spawn things ahead of this line
     */
    get bottomEdge() {
        return this.y + this.height;
    }

    /**
     * Get the world Y coordinate at the top edge of the camera - margin
     * Used for despawning: remove things above this line
     */
    get topEdge() {
        return this.y;
    }
}
