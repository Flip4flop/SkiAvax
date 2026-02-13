// SkiAvax — Utility Helpers

/**
 * Random number between min and max (inclusive)
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random element from an array
 */
export function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Linear interpolation
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check AABB collision between two rectangles
 * Each rect: { x, y, width, height } where x,y is center
 */
export function aabbCollision(a, b) {
    const aLeft = a.x - a.width / 2;
    const aRight = a.x + a.width / 2;
    const aTop = a.y - a.height / 2;
    const aBottom = a.y + a.height / 2;

    const bLeft = b.x - b.width / 2;
    const bRight = b.x + b.width / 2;
    const bTop = b.y - b.height / 2;
    const bBottom = b.y + b.height / 2;

    return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}

/**
 * Check collision with reduced hitboxes (for fairness)
 * @param {number} scale - hitbox scale (0.75 = 75% of sprite size)
 */
export function fairCollision(a, b, scale = 0.75) {
    const sa = {
        x: a.x,
        y: a.y,
        width: a.width * scale,
        height: a.height * scale,
    };
    const sb = {
        x: b.x,
        y: b.y,
        width: b.width * scale,
        height: b.height * scale,
    };
    return aabbCollision(sa, sb);
}

/**
 * Format score with commas
 */
export function formatScore(score) {
    return Math.floor(score).toLocaleString();
}

/**
 * Format time as MM:SS.ms
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Easing: ease out cubic
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing: ease in out quad
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
