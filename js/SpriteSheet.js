// SkiAvax — Sprite Sheet Utility

export class SpriteSheet {
    /**
     * @param {HTMLImageElement} image - The sprite sheet image
     * @param {number} frameWidth - Width of each frame
     * @param {number} frameHeight - Height of each frame
     * @param {number} frameCount - Total number of frames
     * @param {number} framesPerRow - Frames per row in the sheet
     */
    constructor(image, frameWidth, frameHeight, frameCount, framesPerRow) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.framesPerRow = framesPerRow || frameCount;
        this.currentFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.15; // seconds per frame
    }

    /**
     * Update animation timer
     * @param {number} dt - delta time in seconds
     */
    update(dt) {
        this.animTimer += dt;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer -= this.animSpeed;
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
        }
    }

    /**
     * Draw the current frame
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - center X on canvas
     * @param {number} y - center Y on canvas
     * @param {number} width - draw width
     * @param {number} height - draw height
     */
    draw(ctx, x, y, width, height) {
        const col = this.currentFrame % this.framesPerRow;
        const row = Math.floor(this.currentFrame / this.framesPerRow);

        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        ctx.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            x - width / 2, y - height / 2, width, height
        );
    }

    /**
     * Draw a specific frame (not animated)
     */
    drawFrame(ctx, frameIndex, x, y, width, height) {
        const col = frameIndex % this.framesPerRow;
        const row = Math.floor(frameIndex / this.framesPerRow);

        const sx = col * this.frameWidth;
        const sy = row * this.frameHeight;

        ctx.drawImage(
            this.image,
            sx, sy, this.frameWidth, this.frameHeight,
            x - width / 2, y - height / 2, width, height
        );
    }

    /**
     * Reset animation to first frame
     */
    reset() {
        this.currentFrame = 0;
        this.animTimer = 0;
    }
}
