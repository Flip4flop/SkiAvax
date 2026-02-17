#!/usr/bin/env python3
"""SkiAvax — Generate all game sprites using Python stdlib only (no PIL).
Run from the project root: python3 generate_sprites.py
"""
import struct, zlib, os, math

BASE    = os.path.dirname(os.path.abspath(__file__))
SPRITES = os.path.join(BASE, 'assets', 'sprites')

# ── Palette ──────────────────────────────────────────────────────────────────
T    = (0,0,0,0)           # transparent
W    = (255,255,255,255)    # white
BLK  = (15,15,25,255)      # near-black
RED  = (232,65,66,255)     # AVAX red
DRED = (160,28,28,255)     # dark red
GLD  = (255,210,0,255)     # gold
DGLD = (180,145,0,255)     # dark gold
SKN  = (255,195,145,255)   # skin
BLUE = (30,110,225,255)    # pharaoh blue
DBLU = (10,55,140,255)     # dark blue
SKI  = (30,30,50,255)      # ski / pole dark
PUR  = (120,45,225,255)    # purple
DPUR = (65,12,148,255)     # dark purple
LPUR = (190,140,255,255)   # light purple
GRN  = (45,185,65,255)     # green
DGRN = (18,110,32,255)     # dark green
ORG  = (255,135,0,255)     # orange
DORG = (195,90,0,255)      # dark orange
CYN  = (0,200,220,255)     # cyan
DCYN = (0,130,155,255)     # dark cyan
PNK  = (235,80,138,255)    # pink
DPNK = (165,35,85,255)     # dark pink
BRN  = (160,100,45,255)    # brown
DBRN = (100,60,18,255)     # dark brown
TEAL = (0,170,170,255)     # teal
DTEAL= (0,105,105,255)     # dark teal
SNOW = (228,242,252,255)   # snow white
GRY  = (150,162,178,255)   # grey
LGRY = (200,210,225,255)   # light grey
YLW  = (255,240,0,255)     # yellow
PINK2= (255,180,200,255)   # light pink

# ── PNG writer ───────────────────────────────────────────────────────────────
def make_png(w, h, buf):
    def ck(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            raw += bytes(buf[y * w + x])
    return (b'\x89PNG\r\n\x1a\n'
            + ck(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
            + ck(b'IDAT', zlib.compress(raw, 9))
            + ck(b'IEND', b''))

# ── Canvas helpers ───────────────────────────────────────────────────────────
def cv(w, h):
    return [T] * (w * h)

def sp(b, w, x, y, c):
    if 0 <= x < w and 0 <= y < len(b) // w:
        b[y * w + x] = c

def rect(b, w, x, y, rw, rh, c):
    for dy in range(rh):
        for dx in range(rw):
            sp(b, w, x + dx, y + dy, c)

def circ(b, w, cx, cy, r, c):
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                sp(b, w, cx + dx, cy + dy, c)

def ring(b, w, cx, cy, r1, r2, c):
    for dy in range(-r2, r2 + 1):
        for dx in range(-r2, r2 + 1):
            d2 = dx * dx + dy * dy
            if r1 * r1 <= d2 <= r2 * r2:
                sp(b, w, cx + dx, cy + dy, c)

def line(b, w, x0, y0, x1, y1, c, t=1):
    dx, dy = abs(x1 - x0), abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx - dy
    while True:
        for dt in range(t):
            sp(b, w, x0 + dt, y0, c)
            sp(b, w, x0, y0 + dt, c)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 > -dy:
            err -= dy; x0 += sx
        if e2 < dx:
            err += dx; y0 += sy

def tri(b, w, pts, c):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    miny = max(0, min(ys)); maxy = min(len(b) // w - 1, max(ys))
    n = len(pts)
    for y in range(miny, maxy + 1):
        xs_cross = []
        for i in range(n):
            x0, y0 = pts[i]; x1, y1 = pts[(i + 1) % n]
            if (y0 <= y < y1) or (y1 <= y < y0):
                xs_cross.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs_cross.sort()
        for i in range(0, len(xs_cross) - 1, 2):
            for x in range(int(xs_cross[i]), int(xs_cross[i + 1]) + 1):
                sp(b, w, x, y, c)

def save(b, w, h, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(make_png(w, h, b))
    print(f'  ✓ {os.path.relpath(path, BASE)}')

def mirror_x(b, w, h):
    """Return a horizontally mirrored copy of the buffer."""
    m = list(b)
    for y in range(h):
        for x in range(w // 2):
            a = y * w + x
            z = y * w + (w - 1 - x)
            m[a], m[z] = b[z], b[a]
    return m

# ── Player: Pharaoh skier ─────────────────────────────────────────────────────
W48 = 48

def pharaoh_base(b, cx=24, head_y=4):
    """Draw pharaoh head + body (no skis/poles)."""
    # Nemes headdress (blue crown)
    rect(b, W48, cx - 10, head_y,     20, 8, BLUE)   # main crown block
    rect(b, W48, cx - 10, head_y,     20, 2, GLD)    # gold top band
    rect(b, W48, cx - 10, head_y + 5, 20, 1, GLD)    # gold stripe
    # Side nemes strips (hang down beside face)
    rect(b, W48, cx - 14, head_y + 5, 5, 12, BLUE)
    rect(b, W48, cx + 9,  head_y + 5, 5, 12, BLUE)
    rect(b, W48, cx - 14, head_y + 7, 5, 1,  GLD)
    rect(b, W48, cx + 9,  head_y + 7, 5, 1,  GLD)
    # Face
    circ(b, W48, cx, head_y + 16, 7, SKN)
    # Eyes
    sp(b, W48, cx - 3, head_y + 14, BLK)
    sp(b, W48, cx + 3, head_y + 14, BLK)
    # Kohl (eye liner — pharaoh style)
    sp(b, W48, cx - 4, head_y + 14, BLK)
    sp(b, W48, cx + 4, head_y + 14, BLK)
    # Mouth
    rect(b, W48, cx - 2, head_y + 19, 5, 1, DRED)
    # Beard (pharaoh goatee)
    rect(b, W48, cx - 1, head_y + 22, 3, 3, GLD)
    # Body / ski suit
    rect(b, W48, cx - 8,  head_y + 27, 16, 14, W)
    rect(b, W48, cx - 8,  head_y + 34, 16, 2,  BLUE)   # belt
    rect(b, W48, cx - 3,  head_y + 28, 6,  5,  BLUE)   # chest logo area
    sp(b, W48, cx,       head_y + 30, RED)              # AVAX red dot

def make_player_dir(ski_dx_l, ski_dy_l, ski_dx_r, ski_dy_r, lean=0):
    """Draw player facing down with parameterised ski/pole direction."""
    b = cv(W48, W48)
    pharaoh_base(b, cx=24 + lean)
    cx = 24 + lean
    # Poles (line from hand to ground)
    px_l, py_l = cx - 9, 31   # left hand
    px_r, py_r = cx + 9, 31   # right hand
    line(b, W48, px_l, py_l, px_l + ski_dx_l - 8, py_l + 12, SKI, 1)
    line(b, W48, px_r, py_r, px_r - ski_dx_r + 8, py_r + 12, SKI, 1)
    # Skis
    lx = 24 + lean + ski_dx_l; rx = 24 + lean + ski_dx_r
    ly = 40 + ski_dy_l;         ry = 40 + ski_dy_r
    rect(b, W48, lx - 8, ly, 15, 3, SKI)   # left ski
    rect(b, W48, rx - 7, ry, 15, 3, SKI)   # right ski
    return b

def gen_players():
    out = os.path.join(SPRITES, 'player')
    # dir_3: straight down
    b = make_player_dir(-6, 0, 6, 0, 0)
    save(b, W48, W48, os.path.join(out, 'player_down.png'))

    # dir_2: left slight
    b = make_player_dir(-10, -2, 2, 2, -1)
    save(b, W48, W48, os.path.join(out, 'player_left_slight.png'))

    # dir_1: left
    b = make_player_dir(-13, -4, -1, 4, -2)
    save(b, W48, W48, os.path.join(out, 'player_left.png'))

    # dir_0: left fast (deeper lean)
    b = make_player_dir(-15, -6, -3, 6, -4)
    save(b, W48, W48, os.path.join(out, 'player_left_fast.png'))

    # dir_4,5,6: mirror right variants
    for src, dst in [('player_left_slight.png', 'player_right_slight.png'),
                     ('player_left.png',        'player_right.png'),
                     ('player_left_fast.png',   'player_right_fast.png')]:
        src_path = os.path.join(out, src)
        # Re-read the buffer we just wrote by regenerating a mirrored version
    b2 = make_player_dir(-10, -2, 2, 2, -1); save(mirror_x(b2, W48, W48), W48, W48, os.path.join(out, 'player_right_slight.png'))
    b3 = make_player_dir(-13, -4, -1, 4, -2); save(mirror_x(b3, W48, W48), W48, W48, os.path.join(out, 'player_right.png'))
    b4 = make_player_dir(-15, -6, -3, 6, -4); save(mirror_x(b4, W48, W48), W48, W48, os.path.join(out, 'player_right_fast.png'))

    # Jump: arms spread, skis angled up
    bj = cv(W48, W48)
    pharaoh_base(bj, cx=24, head_y=2)
    # Arms spread wide
    line(bj, W48, 16, 29, 6,  25, SKI)
    line(bj, W48, 32, 29, 42, 25, SKI)
    # Skis angled up (airborne)
    rect(bj, W48, 4,  36, 15, 3, SKI)
    rect(bj, W48, 29, 36, 15, 3, SKI)
    save(bj, W48, W48, os.path.join(out, 'player_jump.png'))

    # Crash: figure lying on side, skis scattered
    bc = cv(W48, W48)
    pharaoh_base(bc, cx=24, head_y=20)  # head now low (lying)
    # Crossed skis
    line(bc, W48, 5, 14, 40, 20, SKI, 2)
    line(bc, W48, 5, 20, 40, 14, SKI, 2)
    # Stars/dashes around head to indicate crash
    for angle in range(0, 360, 60):
        sx = int(24 + 12 * math.cos(math.radians(angle)))
        sy = int(28 + 12 * math.sin(math.radians(angle)))
        sp(bc, W48, sx, sy, YLW)
        sp(bc, W48, sx + 1, sy, YLW)
    save(bc, W48, W48, os.path.join(out, 'player_crash.png'))

    # Caught: arms flung up, purple glow around
    bca = cv(W48, W48)
    ring(bca, W48, 24, 24, 18, 22, PUR)    # purple aura
    pharaoh_base(bca, cx=24, head_y=4)
    # Arms flung straight up
    line(bca, W48, 16, 31, 10, 18, SKI)
    line(bca, W48, 32, 31, 38, 18, SKI)
    # Legs dangling
    line(bca, W48, 20, 41, 14, 47, SKI)
    line(bca, W48, 28, 41, 34, 47, SKI)
    save(bca, W48, W48, os.path.join(out, 'player_caught.png'))

# ── Obstacles ─────────────────────────────────────────────────────────────────
def gen_obstacles():
    out = os.path.join(SPRITES, 'obstacles')

    # ── AVAX Tree (36×44): pine tree with AVAX-red top, dark trunk
    b = cv(36, 44)
    # Trunk
    rect(b, 36, 14, 34, 8, 10, DBRN)
    rect(b, 36, 15, 34, 6, 10, BRN)
    # Three tiers of pine, bottom to top, AVAX red
    tiers = [
        (18, 36, 16),   # (tip_x, tip_y, half_width)
        (18, 29, 13),
        (18, 22, 10),
        (18, 16, 7),
    ]
    for tx, ty, hw in tiers:
        tri(b, 36, [(tx, ty - 10), (tx - hw, ty), (tx + hw, ty)], RED)
        tri(b, 36, [(tx, ty - 10), (tx - hw, ty), (tx + hw, ty)], RED)
    # Snow on tips
    for tx, ty, hw in tiers:
        tri(b, 36, [(tx, ty - 10), (tx - 3, ty - 7), (tx + 3, ty - 7)], SNOW)
    save(b, 36, 44, os.path.join(out, 'avax_tree.png'))

    # ── Blackhole (40×40): dark swirling vortex
    b = cv(40, 40)
    circ(b, 40, 20, 20, 18, DPUR)
    circ(b, 40, 20, 20, 14, PUR)
    circ(b, 40, 20, 20, 10, (50, 0, 100, 255))
    circ(b, 40, 20, 20, 6,  (20, 0, 50, 255))
    circ(b, 40, 20, 20, 3,  BLK)
    # Swirl lines
    for angle in range(0, 360, 45):
        for r in range(8, 16):
            a = math.radians(angle + r * 4)
            sx = int(20 + r * math.cos(a))
            sy = int(20 + r * math.sin(a))
            sp(b, 40, sx, sy, LPUR)
    save(b, 40, 40, os.path.join(out, 'blackhole.png'))

    # ── Snowbank (48×32): white snow mound
    b = cv(48, 32)
    # Main mound (ellipse)
    for y in range(32):
        for x in range(48):
            dx, dy = x - 24, y - 28
            if (dx / 22) ** 2 + (dy / 12) ** 2 <= 1:
                b[y * 48 + x] = SNOW
    # Shading
    for y in range(32):
        for x in range(48):
            dx, dy = x - 24, y - 28
            if (dx / 22) ** 2 + (dy / 12) ** 2 <= 1 and dy < -4:
                b[y * 48 + x] = W
            if (dx / 22) ** 2 + (dy / 12) ** 2 <= 1 and dx > 8:
                b[y * 48 + x] = LGRY
    save(b, 48, 32, os.path.join(out, 'snowbank.png'))

    # ── Gate flag (8×28): triangular flag on pole
    b = cv(8, 28)
    # Pole
    rect(b, 8, 3, 0, 2, 28, GRY)
    # Flag (triangle)
    tri(b, 8, [(4, 2), (4, 14), (7, 8)], RED)
    save(b, 8, 28, os.path.join(out, 'gate_flag.png'))

    # ── Ramp (52×20): already exists but regenerate clean version
    b = cv(52, 20)
    for y in range(20):
        for x in range(52):
            if x >= (51) - (y * 51 // 19):
                b[y * 52 + x] = BRN if x > (51) - (y * 51 // 19) + 1 else DBRN
    save(b, 52, 20, os.path.join(out, 'ramp.png'))

# ── Collectibles ──────────────────────────────────────────────────────────────
def gen_collectibles():
    out = os.path.join(SPRITES, 'collectibles')

    # ── AVAX Token (28×28): red circle with white AVAX triangle
    b = cv(28, 28)
    circ(b, 28, 14, 14, 13, RED)
    circ(b, 28, 14, 14, 11, DRED)
    # White AVAX "A" triangle (with notch at base)
    tri(b, 28, [(14, 4), (4, 22), (24, 22)], W)
    # Notch (remove middle of base)
    tri(b, 28, [(14, 16), (9, 22), (19, 22)], DRED)
    # Shine
    circ(b, 28, 10, 9, 2, (255, 180, 180, 180))
    save(b, 28, 28, os.path.join(out, 'avax_token.png'))

    # ── PHAR Token (28×28): gold coin with pharaoh crown symbol
    b = cv(28, 28)
    circ(b, 28, 14, 14, 13, DGLD)
    circ(b, 28, 14, 14, 11, GLD)
    # Crown shape (simple: rect + three peaks)
    rect(b, 28, 8, 14, 12, 5, DORG)   # crown band
    tri(b, 28, [(9, 9), (8, 14), (10, 14)],  DORG)   # left point
    tri(b, 28, [(14, 7), (12, 14), (16, 14)], DORG)  # center point
    tri(b, 28, [(19, 9), (18, 14), (20, 14)], DORG)  # right point
    # Shine
    circ(b, 28, 10, 9, 2, (255, 245, 180, 180))
    save(b, 28, 28, os.path.join(out, 'phar_token.png'))

# ── NPCs ──────────────────────────────────────────────────────────────────────
def npc_base(color, dark, shape='round'):
    """Draw a simple 40×40 NPC character with given color scheme."""
    b = cv(40, 40)
    if shape == 'round':
        circ(b, 40, 20, 22, 14, dark)
        circ(b, 40, 20, 22, 12, color)
    elif shape == 'square':
        rect(b, 40, 7, 9, 26, 26, dark)
        rect(b, 40, 9, 11, 22, 22, color)
    elif shape == 'tall':
        rect(b, 40, 10, 5, 20, 30, dark)
        rect(b, 40, 12, 7, 16, 26, color)
    elif shape == 'wide':
        rect(b, 40, 4, 14, 32, 20, dark)
        rect(b, 40, 6, 16, 28, 16, color)
    # Eyes
    circ(b, 40, 15, 19, 3, W)
    circ(b, 40, 25, 19, 3, W)
    sp(b, 40, 15, 19, BLK)
    sp(b, 40, 25, 19, BLK)
    # Smile
    for dx in range(-3, 4):
        dy = 1 if abs(dx) > 1 else 0
        sp(b, 40, 20 + dx, 26 + dy, dark)
    # Skis
    rect(b, 40, 4, 35, 13, 3, SKI)
    rect(b, 40, 23, 35, 13, 3, SKI)
    return b

def gen_npcs():
    out = os.path.join(SPRITES, 'npcs')

    # benqi — teal/blue water-themed
    b = npc_base(TEAL, DTEAL, 'round')
    rect(b, 40, 16, 6, 8, 6, CYN)   # fin/wave on head
    save(b, 40, 40, os.path.join(out, 'benqi.png'))

    # salvor — orange, boxy
    b = npc_base(ORG, DORG, 'square')
    # Hard hat
    rect(b, 40, 8, 7, 24, 5, DORG)
    rect(b, 40, 10, 4, 20, 4, ORG)
    save(b, 40, 40, os.path.join(out, 'salvor.png'))

    # blaze — red/orange flame shape
    b = npc_base(ORG, RED, 'round')
    # Flame tips on head
    tri(b, 40, [(14, 2), (10, 12), (18, 12)], RED)
    tri(b, 40, [(20, 0), (16, 10), (24, 10)], ORG)
    tri(b, 40, [(26, 3), (22, 11), (30, 11)], DRED)
    save(b, 40, 40, os.path.join(out, 'blaze.png'))

    # arena — purple, gladiator helmet
    b = npc_base(PUR, DPUR, 'round')
    rect(b, 40, 10, 6, 20, 8, DPUR)   # helmet dome
    rect(b, 40, 8,  13, 24, 3, GLD)   # gold band
    tri(b, 40, [(20, 0), (16, 7), (24, 7)], PUR)  # crest
    save(b, 40, 40, os.path.join(out, 'arena.png'))

    # yieldyak — green yak-like, two horns
    b = npc_base(GRN, DGRN, 'round')
    # Horns
    tri(b, 40, [(13, 1), (10, 10), (16, 10)], DGRN)
    tri(b, 40, [(27, 1), (24, 10), (30, 10)], DGRN)
    save(b, 40, 40, os.path.join(out, 'yieldyak.png'))

    # dokyo — pink, round with bow on top
    b = npc_base(PNK, DPNK, 'round')
    # Bow tie on head
    tri(b, 40, [(20, 4), (12, 8), (20, 8)], RED)
    tri(b, 40, [(20, 4), (28, 8), (20, 8)], DRED)
    circ(b, 40, 20, 6, 2, GLD)
    save(b, 40, 40, os.path.join(out, 'dokyo.png'))

    # dexalot — cyan robot, antenna
    b = npc_base(CYN, DCYN, 'square')
    # Antenna
    rect(b, 40, 19, 3, 2, 7, GRY)
    circ(b, 40, 20, 3, 2, YLW)
    # Robot grid eyes (override)
    rect(b, 40, 12, 17, 6, 4, (0, 220, 240, 255))
    rect(b, 40, 22, 17, 6, 4, (0, 220, 240, 255))
    save(b, 40, 40, os.path.join(out, 'dexalot.png'))

    # pangolin — brown, armour scales
    b = npc_base(BRN, DBRN, 'round')
    # Scale pattern
    for row in range(3):
        for col in range(3):
            rect(b, 40, 10 + col * 7, 14 + row * 5, 5, 3, DBRN)
    save(b, 40, 40, os.path.join(out, 'pangolin.png'))

# ── Boss: LFJ Joe ─────────────────────────────────────────────────────────────
def gen_boss():
    out = os.path.join(SPRITES, 'boss')
    b = cv(80, 80)

    # Glowing aura
    ring(b, 80, 40, 42, 34, 38, (80, 0, 160, 120))

    # Body (large dark purple blob)
    circ(b, 80, 40, 44, 30, DPUR)
    circ(b, 80, 40, 42, 26, PUR)

    # Head lump
    circ(b, 80, 40, 22, 18, DPUR)
    circ(b, 80, 40, 20, 15, PUR)

    # Glowing red eyes
    circ(b, 80, 30, 18, 5, RED)
    circ(b, 80, 50, 18, 5, RED)
    circ(b, 80, 30, 18, 3, (255, 200, 100, 255))
    circ(b, 80, 50, 18, 3, (255, 200, 100, 255))
    sp(b, 80, 30, 18, W)
    sp(b, 80, 50, 18, W)

    # Fangs
    tri(b, 80, [(34, 32), (30, 40), (38, 40)], W)
    tri(b, 80, [(46, 32), (42, 40), (50, 40)], W)

    # Claws (left)
    for i, (cx2, cy2) in enumerate([(8, 50), (4, 58), (10, 63)]):
        tri(b, 80, [(cx2, cy2), (cx2 + 6, cy2 - 10), (cx2 + 10, cy2 + 4)], DPUR)
        tri(b, 80, [(cx2, cy2), (cx2 + 6, cy2 - 10), (cx2 + 10, cy2 + 4)], PUR)

    # Claws (right)
    for i, (cx2, cy2) in enumerate([(62, 50), (66, 58), (60, 63)]):
        tri(b, 80, [(cx2, cy2), (cx2 - 6, cy2 - 10), (cx2 - 10, cy2 + 4)], DPUR)
        tri(b, 80, [(cx2, cy2), (cx2 - 6, cy2 - 10), (cx2 - 10, cy2 + 4)], PUR)

    # "LFJ" letters on chest (simple pixel text)
    chest_colors = [GLD, GLD, GLD]
    # L
    rect(b, 80, 26, 48, 2, 10, GLD)
    rect(b, 80, 26, 56, 6, 2,  GLD)
    # F
    rect(b, 80, 34, 48, 2, 10, GLD)
    rect(b, 80, 34, 48, 6, 2,  GLD)
    rect(b, 80, 34, 52, 4, 2,  GLD)
    # J
    rect(b, 80, 44, 48, 6, 2,  GLD)
    rect(b, 80, 47, 48, 2, 8,  GLD)
    rect(b, 80, 44, 56, 4, 2,  GLD)
    rect(b, 80, 44, 54, 2, 2,  GLD)

    save(b, 80, 80, os.path.join(out, 'lfj_joe.png'))

# ── UI ────────────────────────────────────────────────────────────────────────
def gen_ui():
    out = os.path.join(SPRITES, 'ui')
    # Logo (128×48): "SKIAVAX" with AVAX triangle
    b = cv(128, 48)
    # Red background bar
    rect(b, 128, 0, 0, 128, 48, RED)
    # White "SKI" block
    rect(b, 128, 2, 2, 44, 44, DRED)
    rect(b, 128, 4, 4, 40, 40, RED)
    # White triangle (AVAX A)
    tri(b, 128, [(24, 8), (6, 40), (42, 40)], W)
    tri(b, 128, [(24, 28), (16, 40), (32, 40)], RED)
    # "AVAX" text area
    rect(b, 128, 48, 2, 76, 44, (180, 30, 30, 255))
    save(b, 128, 48, os.path.join(out, 'skiavax_logo.png'))

# ── Main ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print('SkiAvax — Generating sprites...')
    print('\nPlayer:')
    gen_players()
    print('\nObstacles:')
    gen_obstacles()
    print('\nCollectibles:')
    gen_collectibles()
    print('\nNPCs:')
    gen_npcs()
    print('\nBoss:')
    gen_boss()
    print('\nUI:')
    gen_ui()
    print(f'\nDone! All sprites written to assets/sprites/')
