// SkiAvax — Input Manager (keyboard, mouse, touch)

export class InputManager {
    constructor() {
        this.keys = {};
        this.keysJustPressed = {};
        this.mouse = { x: 0, y: 0, clicked: false, justClicked: false };
        this.touch = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };

        this._setupKeyboard();
        this._setupMouse();
        this._setupTouch();
    }

    _setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.code]) {
                this.keysJustPressed[e.code] = true;
            }
            this.keys[e.code] = true;

            // Prevent default for game keys
            const gameKeys = [
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Space', 'KeyF', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
                'Escape', 'KeyP', 'Enter',
            ];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    _setupMouse(canvas) {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.clicked = true;
                this.mouse.justClicked = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.clicked = false;
            }
        });
    }

    _setupTouch() {
        window.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this.touch.active = true;
            this.touch.startX = t.clientX;
            this.touch.startY = t.clientY;
            this.touch.currentX = t.clientX;
            this.touch.currentY = t.clientY;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            this.touch.currentX = t.clientX;
            this.touch.currentY = t.clientY;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            this.touch.active = false;
            e.preventDefault();
        }, { passive: false });
    }

    /**
     * Check if a key is currently held down
     */
    isKeyDown(code) {
        return !!this.keys[code];
    }

    /**
     * Check if a key was just pressed this frame
     */
    isKeyJustPressed(code) {
        return !!this.keysJustPressed[code];
    }

    /**
     * Check if left direction is pressed (arrow or WASD)
     */
    get left() {
        return this.isKeyDown('ArrowLeft') || this.isKeyDown('KeyA');
    }

    /**
     * Check if right direction is pressed
     */
    get right() {
        return this.isKeyDown('ArrowRight') || this.isKeyDown('KeyD');
    }

    /**
     * Check if up direction is pressed
     */
    get up() {
        return this.isKeyDown('ArrowUp') || this.isKeyDown('KeyW');
    }

    /**
     * Check if down direction is pressed
     */
    get down() {
        return this.isKeyDown('ArrowDown') || this.isKeyDown('KeyS');
    }

    /**
     * Check if jump is pressed
     */
    get jump() {
        return this.isKeyJustPressed('Space') || this.isKeyJustPressed('Insert');
    }

    /**
     * Check if boost is active (F key held)
     */
    get boost() {
        return this.isKeyDown('KeyF');
    }

    /**
     * Check if pause is pressed
     */
    get pause() {
        return this.isKeyJustPressed('Escape') || this.isKeyJustPressed('KeyP');
    }

    /**
     * Check if enter/confirm is pressed
     */
    get confirm() {
        return this.isKeyJustPressed('Enter') || this.isKeyJustPressed('Space');
    }

    /**
     * Get touch swipe direction
     */
    getTouchDirection() {
        if (!this.touch.active) return null;
        const dx = this.touch.currentX - this.touch.startX;
        const dy = this.touch.currentY - this.touch.startY;
        const deadzone = 20;

        if (Math.abs(dx) < deadzone && Math.abs(dy) < deadzone) return null;

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left';
        } else {
            return dy > 0 ? 'down' : 'up';
        }
    }

    /**
     * Clear per-frame state (call at end of each frame)
     */
    endFrame() {
        this.keysJustPressed = {};
        this.mouse.justClicked = false;
    }
}
