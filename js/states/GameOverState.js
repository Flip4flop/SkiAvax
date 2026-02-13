// SkiAvax — Game Over State

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants.js';
import { formatScore, formatTime } from '../utils/helpers.js';

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
    }

    enter(score, distance, scoreManager, mode) {
        this.score = score;
        this.distance = Math.floor(distance);
        this.scoreManager = scoreManager;
        this.mode = mode;
        this.animTimer = 0;

        // Check and save high score
        this.highScores = this._loadHighScores();
        if (this.mode === 'freerun') {
            this.isNewHighScore = this.highScores.length === 0 || score > this.highScores[0].score;
            this._saveHighScore(score, this.distance);
        } else {
            this.isNewHighScore = this.highScores.length === 0 || score < this.highScores[0].score;
            this._saveHighScore(score, this.distance);
        }
    }

    update(dt, input) {
        this.animTimer += dt;

        // Wait a bit before accepting input
        if (this.animTimer < 0.5) return;

        if (input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
            this.game.returnToMenu();
        }

        if (input.isKeyJustPressed('KeyR')) {
            this.game.restartGame();
        }

        if (input.isKeyJustPressed('KeyT')) {
            this._shareScore();
        }
    }

    render(ctx) {
        // Dark background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#0d0d2b');
        grad.addColorStop(1, '#1a1a3e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        const titleY = 80;
        ctx.font = 'bold 40px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = this.mode === 'freerun' ? COLORS.AVAX_RED : COLORS.PHARAOH_GOLD;
        ctx.fillText(this.mode === 'freerun' ? 'GAME OVER' : 'RACE COMPLETE', CANVAS_WIDTH / 2, titleY);

        // New high score flash
        if (this.isNewHighScore) {
            const flashAlpha = 0.5 + Math.sin(this.animTimer * 6) * 0.5;
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
            ctx.fillText('★ NEW HIGH SCORE! ★', CANVAS_WIDTH / 2, titleY + 35);
        }

        // Score card
        const cardY = 170;
        const cardH = this.mode === 'freerun' ? 180 : 140;

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
            // Score
            ctx.font = 'bold 48px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.fillText(formatScore(this.score), CANVAS_WIDTH / 2, cardY + 45);

            ctx.font = '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('TOTAL SCORE', CANVAS_WIDTH / 2, cardY + 75);

            // Stats row
            const statsY = cardY + 115;
            ctx.font = '14px "Segoe UI", monospace';

            // Distance
            ctx.fillStyle = COLORS.AVAX_WHITE;
            ctx.fillText(`📏 ${this.distance}m`, CANVAS_WIDTH / 2 - 120, statsY);

            // Tokens collected
            if (this.scoreManager) {
                ctx.fillText(`🔺 ${this.scoreManager.tokensCollected}`, CANVAS_WIDTH / 2, statsY);
                ctx.fillText(`🏆 Best Combo: x${this.scoreManager.bestCombo}`, CANVAS_WIDTH / 2 + 120, statsY);
            }

            // Trick points
            if (this.scoreManager && this.scoreManager.trickScore > 0) {
                ctx.fillStyle = '#00FF88';
                ctx.fillText(`🎿 Tricks: +${this.scoreManager.trickScore}`, CANVAS_WIDTH / 2, statsY + 28);
            }
        } else {
            // Slalom time
            ctx.font = 'bold 48px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.PHARAOH_GOLD;
            ctx.fillText(formatTime(this.score), CANVAS_WIDTH / 2, cardY + 45);

            ctx.font = '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('TOTAL TIME', CANVAS_WIDTH / 2, cardY + 75);

            // Gate stats
            ctx.font = '14px "Segoe UI", monospace';
            ctx.fillStyle = COLORS.AVAX_WHITE;
            ctx.fillText(`Gates Hit: ${this.scoreManager ? this.scoreManager.tokensCollected : 0}`, CANVAS_WIDTH / 2, cardY + 110);
        }

        // High scores
        const hsY = cardY + cardH + 30;
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('HIGH SCORES', CANVAS_WIDTH / 2, hsY);

        const topScores = this.highScores.slice(0, 5);
        for (let i = 0; i < topScores.length; i++) {
            const y = hsY + 30 + i * 22;
            ctx.font = '13px "Segoe UI", monospace';
            ctx.fillStyle = i === 0 ? COLORS.PHARAOH_GOLD : 'rgba(255,255,255,0.6)';
            const scoreText = this.mode === 'freerun'
                ? `${i + 1}. ${formatScore(topScores[i].score)} — ${topScores[i].distance}m`
                : `${i + 1}. ${formatTime(topScores[i].score)} — ${topScores[i].distance}m`;
            ctx.fillText(scoreText, CANVAS_WIDTH / 2, y);
        }

        // Actions
        const actY = CANVAS_HEIGHT - 90;
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('[Enter] Menu  •  [R] Restart  •  [T] Share on X', CANVAS_WIDTH / 2, actY);

        // Share button visual
        ctx.fillStyle = COLORS.AVAX_RED;
        ctx.beginPath();
        ctx.roundRect(CANVAS_WIDTH / 2 - 80, actY + 20, 160, 36, 6);
        ctx.fill();
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.AVAX_WHITE;
        ctx.fillText('🔺 Share Score on X', CANVAS_WIDTH / 2, actY + 38);

        // Credits
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('SkiAvax — Powered by Avalanche', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    }

    _shareScore() {
        const text = this.mode === 'freerun'
            ? `I scored ${formatScore(this.score)} points on SkiAvax and survived ${this.distance}m before getting REKT! 🔺⛷️\n\nCan you beat me? #AVAX #SkiAvax`
            : `I completed the SkiAvax Slalom in ${formatTime(this.score)}! 🔺⛷️\n\nCan you beat my time? #AVAX #SkiAvax`;

        const url = encodeURIComponent(window.location.href);
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
        window.open(tweetUrl, '_blank');
    }

    _loadHighScores() {
        try {
            const key = `skiavax_highscores_${this.mode}`;
            const data = localStorage.getItem(key);
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

            // Sort: freerun = highest first, slalom = lowest first
            if (this.mode === 'freerun') {
                scores.sort((a, b) => b.score - a.score);
            } else {
                scores.sort((a, b) => a.score - b.score);
            }

            // Keep top 10
            localStorage.setItem(key, JSON.stringify(scores.slice(0, 10)));
            this.highScores = scores.slice(0, 10);
        } catch {
            // localStorage might be full or unavailable
        }
    }
}
