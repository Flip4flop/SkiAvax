// SkiAvax — Game Over State

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants.js';
import { formatScore, formatTime } from '../utils/helpers.js';

const NAME_MAX = 16;
const NAME_STORAGE_KEY = 'skiavax_player_name';

export class GameOverState {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.distance = 0;
        this.scoreManager = null;
        this.mode = 'freerun';
        this.animTimer = 0;
        this.highScores = [];
        this.isNewHighScore = false;

        // Leaderboard submission state
        // 'name_input' | 'submitting' | 'submitted' | 'idle'
        this.phase = 'idle';
        this.playerName = '';
        this.globalRank = null;
        this.submitError = false;
        this._cursorBlink = 0;
        this._textHandler = null;
    }

    enter(score, distance, scoreManager, mode) {
        this.score = score;
        this.distance = Math.floor(distance);
        this.scoreManager = scoreManager;
        this.mode = mode;
        this.animTimer = 0;
        this.globalRank = null;
        this.submitError = false;

        // Save local high score
        this.highScores = this._loadHighScores();
        if (this.mode === 'freerun') {
            this.isNewHighScore = this.highScores.length === 0 || score > this.highScores[0].score;
            this._saveHighScore(score, this.distance);
        } else {
            this.isNewHighScore = this.highScores.length === 0 || score < this.highScores[0].score;
            this._saveHighScore(score, this.distance);
        }

        // Start leaderboard flow if configured
        if (this.game.leaderboard.isConfigured) {
            this.playerName = localStorage.getItem(NAME_STORAGE_KEY) || '';
            this.phase = 'name_input';
            this._registerTextHandler();
        } else {
            this.phase = 'idle';
        }
    }

    update(dt, input) {
        this.animTimer += dt;
        this._cursorBlink += dt;

        if (this.animTimer < 0.5) return;

        if (this.phase === 'name_input' || this.phase === 'submitting') return;

        // submitted or idle — normal controls
        if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
            this._cleanup();
            this.game.returnToMenu();
        }
        if (input.isKeyJustPressed('KeyR')) {
            this._cleanup();
            this.game.restartGame();
        }
        if (input.isKeyJustPressed('KeyT')) {
            this._shareScore();
        }
        if (input.isKeyJustPressed('KeyL')) {
            this._cleanup();
            this.game.showLeaderboard(this.playerName || null);
        }
    }

    render(ctx) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#0d0d2b');
        grad.addColorStop(1, '#1a1a3e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        const titleY = 75;
        ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = this.mode === 'freerun' ? COLORS.AVAX_RED : COLORS.PHARAOH_GOLD;
        ctx.fillText(this.mode === 'freerun' ? 'GAME OVER' : 'RACE COMPLETE', CANVAS_WIDTH / 2, titleY);

        // New high score flash
        if (this.isNewHighScore) {
            const flashAlpha = 0.5 + Math.sin(this.animTimer * 6) * 0.5;
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
            ctx.fillText('★ NEW HIGH SCORE! ★', CANVAS_WIDTH / 2, titleY + 34);
        }

        // Score card
        const cardY = 158;
        const cardH = this.mode === 'freerun' ? 170 : 130;

        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 200, cardY, 400, cardH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 200, cardY, 400, cardH, 12);
        ctx.stroke();

        if (this.mode === 'freerun') {
            ctx.font = 'bold 48px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.fillText(formatScore(this.score), CANVAS_WIDTH / 2, cardY + 42);

            ctx.font = '13px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('TOTAL SCORE', CANVAS_WIDTH / 2, cardY + 70);

            const statsY = cardY + 108;
            ctx.font = '13px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.AVAX_WHITE;
            ctx.fillText(`📏 ${this.distance}m`, CANVAS_WIDTH / 2 - 120, statsY);
            if (this.scoreManager) {
                ctx.fillText(`🔺 ${this.scoreManager.tokensCollected}`, CANVAS_WIDTH / 2, statsY);
                ctx.fillText(`🏆 x${this.scoreManager.bestCombo}`, CANVAS_WIDTH / 2 + 120, statsY);
            }
            if (this.scoreManager && this.scoreManager.trickScore > 0) {
                ctx.fillStyle = '#00FF88';
                ctx.fillText(`🎿 Tricks: +${this.scoreManager.trickScore}`, CANVAS_WIDTH / 2, statsY + 24);
            }
        } else {
            ctx.font = 'bold 48px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.fillText(formatTime(this.score), CANVAS_WIDTH / 2, cardY + 42);

            ctx.font = '13px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('TOTAL TIME', CANVAS_WIDTH / 2, cardY + 70);

            ctx.font = '13px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.AVAX_WHITE;
            ctx.fillText(`Gates: ${this.scoreManager ? this.scoreManager.tokensCollected : 0}`, CANVAS_WIDTH / 2, cardY + 104);
        }

        // Local high scores
        const hsY = cardY + cardH + 22;
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('LOCAL BEST', CANVAS_WIDTH / 2, hsY);

        const topScores = this.highScores.slice(0, 3);
        for (let i = 0; i < topScores.length; i++) {
            const y = hsY + 24 + i * 20;
            ctx.font = '12px "Segoe UI", monospace';
            ctx.fillStyle = i === 0 ? COLORS.PHARAOH_GOLD : 'rgba(255,255,255,0.55)';
            const txt = this.mode === 'freerun'
                ? `${i + 1}. ${formatScore(topScores[i].score)} — ${topScores[i].distance}m`
                : `${i + 1}. ${formatTime(topScores[i].score)} — ${topScores[i].distance}m`;
            ctx.fillText(txt, CANVAS_WIDTH / 2, y);
        }

        // Phase-specific overlays
        if (this.phase === 'name_input') {
            this._renderNameInput(ctx);
        } else if (this.phase === 'submitting') {
            this._renderSubmitting(ctx);
        } else {
            // submitted or idle — bottom actions
            this._renderActions(ctx);
        }
    }

    _renderNameInput(ctx) {
        const boxY = CANVAS_HEIGHT - 170;

        // Panel
        ctx.fillStyle = 'rgba(13, 13, 43, 0.95)';
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 230, boxY, 460, 148, 10);
        ctx.fill();
        ctx.strokeStyle = COLORS.AVAX_RED;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 230, boxY, 460, 148, 10);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('ENTER YOUR NAME FOR THE GLOBAL LEADERBOARD', CANVAS_WIDTH / 2, boxY + 22);

        // Text field
        const fieldX = CANVAS_WIDTH / 2 - 180;
        const fieldY = boxY + 38;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.roundRect(fieldX, fieldY, 360, 40, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(fieldX, fieldY, 360, 40, 6);
        ctx.stroke();

        // Name text + cursor
        const cursor = Math.floor(this._cursorBlink * 2) % 2 === 0 ? '|' : '';
        ctx.font = '18px "Segoe UI", monospace';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.textAlign = 'left';
        ctx.fillText(this.playerName + cursor, fieldX + 12, fieldY + 20);

        // Char count
        ctx.textAlign = 'right';
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText(`${this.playerName.length}/${NAME_MAX}`, fieldX + 354, fieldY + 20);

        // Hint
        ctx.textAlign = 'center';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('[Enter] Submit   [Esc] Skip', CANVAS_WIDTH / 2, boxY + 116);

        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('Name is saved for next time', CANVAS_WIDTH / 2, boxY + 134);
    }

    _renderSubmitting(ctx) {
        const dots = '.'.repeat((Math.floor(this.animTimer * 3) % 3) + 1);
        const actY = CANVAS_HEIGHT - 60;
        ctx.textAlign = 'center';
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(`Submitting score${dots}`, CANVAS_WIDTH / 2, actY);
    }

    _renderActions(ctx) {
        const actY = CANVAS_HEIGHT - 100;

        // Global rank badge (if submitted successfully)
        if (this.phase === 'submitted' && this.globalRank !== null) {
            const rankY = actY - 40;
            ctx.fillStyle = 'rgba(232, 65, 66, 0.15)';
            ctx.beginPath();
            ctx.roundRect(CANVAS_WIDTH / 2 - 150, rankY - 18, 300, 34, 8);
            ctx.fill();
            ctx.strokeStyle = COLORS.AVAX_RED;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(CANVAS_WIDTH / 2 - 150, rankY - 18, 300, 34, 8);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.fillText(`🌍 Global Rank: #${this.globalRank}`, CANVAS_WIDTH / 2, rankY);
        } else if (this.phase === 'submitted' && this.submitError) {
            ctx.textAlign = 'center';
            ctx.font = '12px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 80, 80, 0.8)';
            ctx.fillText('Score submission failed — check your connection', CANVAS_WIDTH / 2, actY - 30);
        }

        // Action keys
        ctx.textAlign = 'center';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';

        if (this.game.leaderboard.isConfigured) {
            ctx.fillText('[Enter] Menu  •  [R] Restart  •  [L] Leaderboard  •  [T] Share', CANVAS_WIDTH / 2, actY);
        } else {
            ctx.fillText('[Enter] Menu  •  [R] Restart  •  [T] Share on X', CANVAS_WIDTH / 2, actY);
        }

        // Share button
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 80, actY + 18, 160, 34, 6);
        ctx.fill();
        ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('🔺 Share Score on X', CANVAS_WIDTH / 2, actY + 35);

        // Credits
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('SkiAvax — Powered by Avalanche', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    }

    _registerTextHandler() {
        this._removeTextHandler();
        this._textHandler = (e) => {
            if (this.phase !== 'name_input') return;

            if (e.key === 'Enter') {
                if (this.playerName.trim().length > 0) {
                    this._submitScore();
                }
                return;
            }
            if (e.key === 'Escape') {
                this.phase = 'idle';
                this._removeTextHandler();
                return;
            }
            if (e.key === 'Backspace') {
                this.playerName = this.playerName.slice(0, -1);
                return;
            }
            // Printable single character
            if (e.key.length === 1 && this.playerName.length < NAME_MAX) {
                this.playerName += e.key;
            }
        };
        window.addEventListener('keydown', this._textHandler);
    }

    _removeTextHandler() {
        if (this._textHandler) {
            window.removeEventListener('keydown', this._textHandler);
            this._textHandler = null;
        }
    }

    async _submitScore() {
        this._removeTextHandler();
        this.phase = 'submitting';

        const name = this.playerName.trim();
        localStorage.setItem(NAME_STORAGE_KEY, name);

        const result = await this.game.leaderboard.submitScore({
            name,
            score: this.score,
            distance: this.distance,
            mode: this.mode,
            tokens: this.scoreManager ? this.scoreManager.tokensCollected : 0,
            combo: this.scoreManager ? this.scoreManager.bestCombo : 1,
        });

        if (result.success) {
            this.submitError = false;
            this.globalRank = await this.game.leaderboard.getRank(this.score, this.mode);
        } else {
            this.submitError = true;
        }

        this.phase = 'submitted';
    }

    _cleanup() {
        this._removeTextHandler();
    }

    _shareScore() {
        const text = this.mode === 'freerun'
            ? `I scored ${formatScore(this.score)} points on SkiAvax and survived ${this.distance}m before getting REKT! 🔺⛷️\n\nCan you beat me? #AVAX #SkiAvax`
            : `I completed the SkiAvax Slalom in ${formatTime(this.score)}! 🔺⛷️\n\nCan you beat my time? #AVAX #SkiAvax`;

        const url = encodeURIComponent(window.location.href);
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
    }

    _loadHighScores() {
        try {
            const data = localStorage.getItem(`skiavax_highscores_${this.mode}`);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    _saveHighScore(score, distance) {
        try {
            const key = `skiavax_highscores_${this.mode}`;
            const scores = this._loadHighScores();
            scores.push({ score, distance, date: Date.now() });
            if (this.mode === 'freerun') {
                scores.sort((a, b) => b.score - a.score);
            } else {
                scores.sort((a, b) => a.score - b.score);
            }
            localStorage.setItem(key, JSON.stringify(scores.slice(0, 10)));
            this.highScores = scores.slice(0, 10);
        } catch {
            // localStorage unavailable
        }
    }
}
