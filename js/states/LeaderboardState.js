// SkiAvax — Leaderboard State

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../utils/constants.js';
import { formatScore, formatTime } from '../utils/helpers.js';

const TABS = ['Free Run', 'Slalom'];
const ROW_H = 36;
const TABLE_TOP = 210;

export class LeaderboardState {
    constructor(game) {
        this.game = game;
        this.tab = 0;           // 0 = freerun, 1 = slalom
        this.scores = [];
        this.loading = false;
        this.error = false;
        this.animTimer = 0;
        this.highlightName = null; // name to highlight (just submitted)
        this.snowflakes = Array.from({ length: 40 }, () => ({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 25 + 10,
        }));
    }

    enter(highlightName = null) {
        this.tab = 0;
        this.highlightName = highlightName;
        this.animTimer = 0;
        this._fetch();
    }

    update(dt, input) {
        this.animTimer += dt;

        // Snowflakes
        for (const f of this.snowflakes) {
            f.y += f.speed * dt;
            if (f.y > CANVAS_HEIGHT) { f.y = -4; f.x = Math.random() * CANVAS_WIDTH; }
        }

        if (this.loading) return;

        // Tab switch
        if (input.isKeyJustPressed('ArrowLeft') || input.isKeyJustPressed('KeyA')) {
            if (this.tab !== 0) { this.tab = 0; this._fetch(); }
        }
        if (input.isKeyJustPressed('ArrowRight') || input.isKeyJustPressed('KeyD')) {
            if (this.tab !== 1) { this.tab = 1; this._fetch(); }
        }

        // Back to menu
        if (input.isKeyJustPressed('Escape') || input.isKeyJustPressed('Enter') || input.isKeyJustPressed('Space')) {
            this.game.returnToMenu();
        }

        // Tab click via mouse
        if (input.mouse.justClicked) {
            const mx = input.mouse.x * (CANVAS_WIDTH / this.game.canvas.getBoundingClientRect().width);
            const my = input.mouse.y * (CANVAS_HEIGHT / this.game.canvas.getBoundingClientRect().height);
            for (let i = 0; i < TABS.length; i++) {
                const tx = CANVAS_WIDTH / 2 - 130 + i * 140;
                if (mx > tx && mx < tx + 120 && my > 155 && my < 195) {
                    if (this.tab !== i) { this.tab = i; this._fetch(); }
                }
            }
        }
    }

    render(ctx) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        grad.addColorStop(0, '#1a1a3e');
        grad.addColorStop(1, '#0d0d2b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Snowflakes
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (const f of this.snowflakes) {
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title
        ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.PHARAOH_GOLD;
        ctx.fillText('🏆  GLOBAL LEADERBOARD', CANVAS_WIDTH / 2, 80);

        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText('Top 10 scores from players around the world', CANVAS_WIDTH / 2, 112);

        // Tabs
        for (let i = 0; i < TABS.length; i++) {
            const tx = CANVAS_WIDTH / 2 - 130 + i * 140;
            const isActive = this.tab === i;

            ctx.fillStyle = isActive ? COLORS.AVAX_RED : 'rgba(255,255,255,0.08)';
            ctx.beginPath();
            ctx.roundRect(tx, 155, 120, 36, 6);
            ctx.fill();

            if (!isActive) {
                ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(tx, 155, 120, 36, 6);
                ctx.stroke();
            }

            ctx.font = isActive ? 'bold 14px "Segoe UI", Arial, sans-serif' : '14px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = isActive ? COLORS.AVAX_WHITE : 'rgba(255,255,255,0.5)';
            ctx.fillText(TABS[i], tx + 60, 173);
        }

        // Hint
        ctx.font = '11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText('← → Switch Mode', CANVAS_WIDTH / 2 + 150, 173);

        // Table header
        const hdrY = TABLE_TOP - 10;
        ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'left';
        ctx.fillText('#', 60, hdrY);
        ctx.fillText('PLAYER', 110, hdrY);
        ctx.fillText(this.tab === 0 ? 'SCORE' : 'TIME', 380, hdrY);
        ctx.fillText('DISTANCE', 520, hdrY);
        ctx.fillText('DATE', 660, hdrY);

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, TABLE_TOP + 2);
        ctx.lineTo(CANVAS_WIDTH - 40, TABLE_TOP + 2);
        ctx.stroke();

        // Loading spinner
        if (this.loading) {
            ctx.textAlign = 'center';
            ctx.font = '15px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            const dots = '.'.repeat((Math.floor(this.animTimer * 3) % 3) + 1);
            ctx.fillText(`Loading${dots}`, CANVAS_WIDTH / 2, TABLE_TOP + 120);
            this._renderFooter(ctx);
            return;
        }

        // Error state
        if (this.error) {
            ctx.textAlign = 'center';
            ctx.font = '15px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = COLORS.AVAX_RED;
            ctx.fillText('Could not load scores. Check your connection.', CANVAS_WIDTH / 2, TABLE_TOP + 80);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px "Segoe UI", Arial, sans-serif';
            ctx.fillText('Make sure Supabase is configured in js/config.js', CANVAS_WIDTH / 2, TABLE_TOP + 108);
            this._renderFooter(ctx);
            return;
        }

        // Empty state
        if (this.scores.length === 0) {
            ctx.textAlign = 'center';
            ctx.font = '15px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillText('No scores yet — be the first!', CANVAS_WIDTH / 2, TABLE_TOP + 80);
            this._renderFooter(ctx);
            return;
        }

        // Score rows
        const medals = ['🥇', '🥈', '🥉'];
        for (let i = 0; i < this.scores.length; i++) {
            const s = this.scores[i];
            const rowY = TABLE_TOP + 16 + i * ROW_H;
            const isHighlight = this.highlightName &&
                s.player_name.toLowerCase() === this.highlightName.toLowerCase();

            // Row background
            if (isHighlight) {
                const pulse = 0.12 + Math.sin(this.animTimer * 4) * 0.06;
                ctx.fillStyle = `rgba(232, 65, 66, ${pulse})`;
                ctx.beginPath();
                ctx.roundRect(40, rowY - 14, CANVAS_WIDTH - 80, ROW_H - 4, 4);
                ctx.fill();
            } else if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.fillRect(40, rowY - 14, CANVAS_WIDTH - 80, ROW_H - 4);
            }

            // Rank
            ctx.textAlign = 'left';
            ctx.font = i < 3 ? 'bold 15px "Segoe UI", Arial' : '14px "Segoe UI", Arial';
            ctx.fillStyle = i === 0 ? COLORS.PHARAOH_GOLD : i < 3 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.6)';
            ctx.fillText(i < 3 ? medals[i] : `${i + 1}.`, 50, rowY);

            // Name
            ctx.font = isHighlight ? 'bold 14px "Segoe UI", Arial' : '14px "Segoe UI", Arial';
            ctx.fillStyle = isHighlight ? COLORS.AVAX_WHITE : (i < 3 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)');
            const nameDisplay = s.player_name.length > 18 ? s.player_name.slice(0, 16) + '…' : s.player_name;
            ctx.fillText(nameDisplay + (isHighlight ? ' ◀ YOU' : ''), 110, rowY);

            // Score / Time
            ctx.font = i < 3 ? 'bold 14px "Segoe UI", monospace' : '14px "Segoe UI", monospace';
            ctx.fillStyle = i === 0 ? COLORS.PHARAOH_GOLD : 'rgba(255,255,255,0.7)';
            const scoreStr = this.tab === 0 ? formatScore(s.score) : formatTime(s.score);
            ctx.fillText(scoreStr, 380, rowY);

            // Distance
            ctx.font = '13px "Segoe UI", Arial';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText(`${s.distance}m`, 520, rowY);

            // Date
            ctx.fillText(this._formatDate(s.created_at), 660, rowY);
        }

        this._renderFooter(ctx);
    }

    _renderFooter(ctx) {
        ctx.textAlign = 'center';
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillText('[Esc] or [Enter] — Back to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }

    _formatDate(isoString) {
        if (!isoString) return '—';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '—';
        }
    }

    async _fetch() {
        this.loading = true;
        this.error = false;
        this.scores = [];

        const mode = this.tab === 0 ? 'freerun' : 'slalom';
        const result = await this.game.leaderboard.getTopScores(mode, 10);

        this.loading = false;
        if (result.success) {
            this.scores = result.scores;
        } else {
            this.error = true;
        }
    }
}
