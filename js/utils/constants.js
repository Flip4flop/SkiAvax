// SkiAvax — Game Constants

// Canvas
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Player
export const PLAYER_WIDTH = 48;
export const PLAYER_HEIGHT = 48;
export const PLAYER_SCREEN_Y = 0.30; // Player stays at 30% from top of screen
export const PLAYER_BASE_SPEED = 200; // pixels per second
export const PLAYER_MAX_SPEED = 350;
export const PLAYER_BOOST_SPEED = 500; // F-key boost
export const PLAYER_ACCELERATION = 400;
export const PLAYER_HORIZONTAL_SPEED = 250;
export const PLAYER_JUMP_VELOCITY = -350;
export const PLAYER_GRAVITY = 600;
export const PLAYER_CRASH_DURATION = 1.0; // seconds
export const PLAYER_INVINCIBLE_DURATION = 1.5; // seconds after crash

// Directions (8 directions including stationary)
export const DIRECTION = {
    LEFT_FAST: 0,
    LEFT: 1,
    LEFT_SLIGHT: 2,
    DOWN: 3,
    RIGHT_SLIGHT: 4,
    RIGHT: 5,
    RIGHT_FAST: 6,
};

// Direction angles (radians from straight down)
export const DIRECTION_ANGLES = {
    [DIRECTION.LEFT_FAST]: -Math.PI / 2,
    [DIRECTION.LEFT]: -Math.PI / 3,
    [DIRECTION.LEFT_SLIGHT]: -Math.PI / 6,
    [DIRECTION.DOWN]: 0,
    [DIRECTION.RIGHT_SLIGHT]: Math.PI / 6,
    [DIRECTION.RIGHT]: Math.PI / 3,
    [DIRECTION.RIGHT_FAST]: Math.PI / 2,
};

// Player states
export const PLAYER_STATE = {
    SKIING: 'skiing',
    JUMPING: 'jumping',
    CRASHING: 'crashing',
    CAUGHT: 'caught',
};

// Obstacles
export const OBSTACLE_TYPES = {
    AVAX_TREE: 'avax_tree',
    BLACKHOLE: 'blackhole',
    SNOWBANK: 'snowbank',
};

export const OBSTACLE_SIZES = {
    [OBSTACLE_TYPES.AVAX_TREE]: { width: 36, height: 44 },
    [OBSTACLE_TYPES.BLACKHOLE]: { width: 40, height: 40 },
    [OBSTACLE_TYPES.SNOWBANK]: { width: 48, height: 32 },
};

// NPCs
export const NPC_TYPES = [
    'benqi', 'salvor', 'blaze', 'arena',
    'yieldyak', 'dokyo', 'dexalot', 'pangolin'
];
export const NPC_SIZE = 40;
export const NPC_SPEED_MIN = 80;
export const NPC_SPEED_MAX = 160;

// Collectibles
export const COLLECTIBLE_TYPES = {
    AVAX: 'avax',
    PHAR: 'phar',
};
export const COLLECTIBLE_SIZE = 28;
export const COLLECTIBLE_POINTS = {
    [COLLECTIBLE_TYPES.AVAX]: 100,
    [COLLECTIBLE_TYPES.PHAR]: 500,
};

// Ramps
export const RAMP_WIDTH = 52;
export const RAMP_HEIGHT = 20;
export const RAMP_LAUNCH_VELOCITY = -450;

// Boss
export const BOSS_TRIGGER_DISTANCE = 2000; // meters
export const BOSS_WIDTH = 80;
export const BOSS_HEIGHT = 80;
export const BOSS_SPEED = 300; // 1.5x player base speed
export const BOSS_ESCAPE_DISTANCE = 2000; // meters past boss to loop

// Scoring
export const SCORE = {
    DISTANCE_PER_METER: 1,
    AVAX_TOKEN: 100,
    PHAR_TOKEN: 500,
    TRICK_FLIP: 200,
    TRICK_SPIN: 150,
    CRASH_PENALTY: -50,
    BOSS_ESCAPE_BONUS: 5000,
    MAX_COMBO: 5,
};

// Terrain generation
export const TERRAIN = {
    SPAWN_BAND_HEIGHT: 100, // generate obstacles in bands this tall
    OBSTACLE_DENSITY: 0.03, // probability per pixel-area unit
    COLLECTIBLE_DENSITY: 0.008,
    NPC_DENSITY: 0.003,
    RAMP_DENSITY: 0.002,
    MIN_SPAWN_DISTANCE: 60, // minimum distance between spawned entities
    DESPAWN_MARGIN: 200, // pixels above camera to despawn
};

// Slalom
export const SLALOM = {
    GATE_COUNT: 20,
    GATE_WIDTH: 120, // distance between left and right flags
    GATE_SPACING: 200, // vertical distance between gates
    MISS_PENALTY: 5, // seconds
    CLEAN_RUN_BONUS: 0.10, // 10% time reduction
};

// Colors (AVAX theme)
export const COLORS = {
    AVAX_RED: '#E84142',
    AVAX_WHITE: '#FFFFFF',
    AVAX_DARK: '#1A1A2E',
    PHARAOH_GOLD: '#FFD700',
    PHARAOH_RED: '#CC0000',
    LFJ_PURPLE: '#7B3FE4',
    SNOW_WHITE: '#F0F4F8',
    SNOW_SHADOW: '#D4DDE6',
    HUD_BG: 'rgba(26, 26, 46, 0.85)',
    HUD_TEXT: '#FFFFFF',
    COMBO_COLORS: ['#FFFFFF', '#00FF88', '#00CCFF', '#FFD700', '#FF4444'],
};

// Game states
export const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEADERBOARD: 'leaderboard',
};

// Pixels per meter (for distance display)
export const PIXELS_PER_METER = 10;
