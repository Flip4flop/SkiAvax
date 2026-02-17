-- SkiAvax — Supabase Leaderboard Setup
-- ─────────────────────────────────────────────────────────────────────────────
-- HOW TO USE:
-- 1. Go to https://supabase.com and create a free project
-- 2. Open the SQL Editor in your project dashboard
-- 3. Paste and run this entire file
-- 4. Go to Project Settings → API → copy your Project URL and anon/public key
-- 5. Paste them into js/config.js
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the scores table
CREATE TABLE IF NOT EXISTS scores (
    id              BIGSERIAL PRIMARY KEY,
    player_name     TEXT        NOT NULL CHECK (char_length(player_name) BETWEEN 1 AND 20),
    score           INTEGER     NOT NULL CHECK (score >= 0 AND score < 10000000),
    distance        INTEGER     NOT NULL DEFAULT 0,
    mode            TEXT        NOT NULL CHECK (mode IN ('freerun', 'slalom')),
    tokens_collected INTEGER    NOT NULL DEFAULT 0,
    best_combo      INTEGER     NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_scores_mode_score_freerun
    ON scores (mode, score DESC)
    WHERE mode = 'freerun';

CREATE INDEX IF NOT EXISTS idx_scores_mode_score_slalom
    ON scores (mode, score ASC)
    WHERE mode = 'slalom';

-- Enable Row Level Security
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores (public leaderboard)
CREATE POLICY "Public read" ON scores
    FOR SELECT USING (true);

-- Anyone can submit a score (using the anon key from the browser)
-- Basic validation is enforced by column constraints above
CREATE POLICY "Public insert" ON scores
    FOR INSERT WITH CHECK (
        char_length(player_name) BETWEEN 1 AND 20
        AND score >= 0
        AND score < 10000000
        AND mode IN ('freerun', 'slalom')
    );

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONAL: Add a view for the top 10 per mode (handy for debugging)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW top_freerun AS
    SELECT ROW_NUMBER() OVER (ORDER BY score DESC) AS rank, *
    FROM scores
    WHERE mode = 'freerun'
    ORDER BY score DESC
    LIMIT 10;

CREATE OR REPLACE VIEW top_slalom AS
    SELECT ROW_NUMBER() OVER (ORDER BY score ASC) AS rank, *
    FROM scores
    WHERE mode = 'slalom'
    ORDER BY score ASC
    LIMIT 10;
