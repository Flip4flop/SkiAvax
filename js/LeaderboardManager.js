// SkiAvax — Leaderboard Manager (Supabase REST API)

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export class LeaderboardManager {
    constructor() {
        this.configured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
        this._headers = this.configured ? {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        } : {};
    }

    get isConfigured() {
        return this.configured;
    }

    /**
     * Submit a score to the global leaderboard
     */
    async submitScore({ name, score, distance, mode, tokens = 0, combo = 1 }) {
        if (!this.configured) return { success: false };
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
                method: 'POST',
                headers: { ...this._headers, 'Prefer': 'return=minimal' },
                body: JSON.stringify({
                    player_name: name.trim().slice(0, 20),
                    score: Math.floor(score),
                    distance: Math.floor(distance),
                    mode,
                    tokens_collected: tokens,
                    best_combo: combo,
                }),
            });
            return { success: res.ok, status: res.status };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Fetch top scores for a given mode
     */
    async getTopScores(mode, limit = 10) {
        if (!this.configured) return { success: false, scores: [] };
        try {
            const order = mode === 'slalom' ? 'score.asc' : 'score.desc';
            const url = `${SUPABASE_URL}/rest/v1/scores` +
                `?select=player_name,score,distance,tokens_collected,best_combo,created_at` +
                `&mode=eq.${mode}&order=${order}&limit=${limit}`;
            const res = await fetch(url, { headers: this._headers });
            if (!res.ok) return { success: false, scores: [] };
            const scores = await res.json();
            return { success: true, scores };
        } catch {
            return { success: false, scores: [] };
        }
    }

    /**
     * Get a player's global rank for a given score
     * Returns 1-based rank (1 = best)
     */
    async getRank(score, mode) {
        if (!this.configured) return null;
        try {
            // Count how many players have a strictly better score
            const op = mode === 'slalom' ? `lt.${score}` : `gt.${score}`;
            const url = `${SUPABASE_URL}/rest/v1/scores?select=id&mode=eq.${mode}&score=${op}`;
            const res = await fetch(url, {
                headers: { ...this._headers, 'Prefer': 'count=exact' },
            });
            if (!res.ok) return null;
            const range = res.headers.get('content-range');
            if (range) {
                const total = parseInt(range.split('/')[1], 10);
                return isNaN(total) ? null : total + 1;
            }
            return null;
        } catch {
            return null;
        }
    }
}
