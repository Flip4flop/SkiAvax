// SkiAvax — Base Entity Class

export class Entity {
    constructor(x = 0, y = 0, width = 32, height = 32) {
        this.worldX = x;
        this.worldY = y;
        this.width = width;
        this.height = height;
        this.isActive = true;
        this.isCollidable = true;
        this.sprite = null; // Image reference or null for placeholder
        this.type = 'entity';
    }

    /**
     * Initialize/reset the entity (for object pooling)
     */
    init(x, y, width, height) {
        this.worldX = x;
        this.worldY = y;
        if (width !== undefined) this.width = width;
        if (height !== undefined) this.height = height;
        this.isActive = true;
        this.isCollidable = true;
    }

    /**
     * Update entity state
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
        // Override in subclasses
    }

    /**
     * Render entity to canvas
     * @param {CanvasRenderingContext2D} ctx
     * @param {Camera} camera
     */
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
            this.renderPlaceholder(ctx, screen.x, screen.y);
        }
    }

    /**
     * Render a colored placeholder rectangle
     */
    renderPlaceholder(ctx, screenX, screenY) {
        ctx.fillStyle = '#888888';
        ctx.fillRect(
            screenX - this.width / 2,
            screenY - this.height / 2,
            this.width,
            this.height
        );
    }

    /**
     * Get bounding box for collision detection
     */
    getBounds() {
        return {
            x: this.worldX,
            y: this.worldY,
            width: this.width,
            height: this.height,
        };
    }
}
