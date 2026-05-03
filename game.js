const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menuEl = document.getElementById('gameMenu');
const gameOverEl = document.getElementById('gameOver');
const gameOverText = document.getElementById('gameOverText');

let gameState = 'MENU';
let currentLevel = 1;
let gravityDirection = 1;
let keys = {};

// Niveau de test du mode développeur
const DEV_TEST_SLOT = -1;
let devTestLevel = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    if (gameState === 'PLAYING') loadLevel(currentLevel);
});
resizeCanvas();

// ─── ASSETS ──────────────────────────────────────────────────────────────────
let imagesLoaded = 0;

function loadImage(src) {
    const img = new Image();
    img.src = src;
    img.onload = () => imagesLoaded++;
    return img;
}

const bgNatureImg    = loadImage('assets/background_nature.png');
const bgIceImg       = loadImage('assets/background_ice.png');
const bgClayImg      = loadImage('assets/background_clay.png');
const bgSteelImg     = loadImage('assets/background_steel.png');

const floorNatureImg = loadImage('assets/floor_nature.png');
const floorIceImg    = loadImage('assets/floor_ice.png');
const floorClayImg   = loadImage('assets/floor_clay.png');
const floorSteelImg  = loadImage('assets/floor_steel.png');

const platNatureImg  = loadImage('assets/platform_nature.png');
const platIceImg     = loadImage('assets/platform_ice.png');
const platClayImg    = loadImage('assets/platform_clay.png');
const platSteelImg   = loadImage('assets/platform_steel.png');

const flagNatureImg  = loadImage('assets/flag_nature.png');
const flagIceImg     = loadImage('assets/flag_ice.png');
const flagClayImg    = loadImage('assets/flag_clay.png');
const flagSteelImg   = loadImage('assets/flag_steel.png');

const picsNatureImg  = loadImage('assets/pics_nature.png');
const picsIceImg     = loadImage('assets/pics_ice.png');
const picsClayImg    = loadImage('assets/pics_clay.png');
const picsSteelImg   = loadImage('assets/pics_steel.png');

const walkFrames = [];
['walk1.png', 'walk2.png', 'walk3.png'].forEach((name, i) => {
    walkFrames[i] = loadImage(`assets/${name}`);
});

// ─── CONSTANTES PHYSIQUE ──────────────────────────────────────────────────────
const PLAYER_W    = 75;
const PLAYER_H    = 95;
const CRYSTAL_W   = 65;
const CRYSTAL_H   = 70;
const PLAT_W      = 320;
const PLAT_H      = 60;
const FLOOR_H     = 65;
const HBOX_MX     = 20;
const HBOX_MY     = 18;

const GRAVITY     = 0.8;   // valeur d'origine
const MAX_VY      = 12;    // était 13
const MAX_VX      = 8.5;   // était 9.5
const ACCEL       = 1.2;   // était 1.35
const FRIC        = 0.78;
const FLIP_OFFSET = 8;     // était 12 — transition de gravité plus douce

const TOTAL_LEVELS = 5;

const player = {
    x: 100, y: 300,
    width: PLAYER_W, height: PLAYER_H,
    velX: 0, velY: 0,
    onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
    isMoving: false, facingRight: true
};

let platforms = [];
let hazards   = [];
let goal      = { x: 0, y: 0, w: 100, h: 110 };

// ─── THÈMES ───────────────────────────────────────────────────────────────────
const themePresets = {
    nature: { background: bgNatureImg,  floor: floorNatureImg, platform: platNatureImg, flag: flagNatureImg, pics: picsNatureImg, floorHeight: FLOOR_H },
    ice:    { background: bgIceImg,     floor: floorIceImg,    platform: platIceImg,    flag: flagIceImg,    pics: picsIceImg,    floorHeight: FLOOR_H },
    clay:   { background: bgClayImg,    floor: floorClayImg,   platform: platClayImg,   flag: flagClayImg,   pics: picsClayImg,   floorHeight: FLOOR_H },
    steel:  { background: bgSteelImg,   floor: floorSteelImg,  platform: platSteelImg,  flag: flagSteelImg,  pics: picsSteelImg,  floorHeight: FLOOR_H }
};

const levelThemes = { 1: 'nature', 2: 'ice', 3: 'clay', 4: 'steel', 5: 'steel' };

function getTheme(level) {
    const lv = level !== undefined ? level : currentLevel;
    if (lv === DEV_TEST_SLOT && devTestLevel) {
        return themePresets[devTestLevel.theme] || themePresets.nature;
    }
    return themePresets[levelThemes[lv]] || themePresets.nature;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function makeFloor(W, floorY) {
    return { x: 0, y: floorY, w: W * 2, h: 120, isFloor: true };
}
function makePlatform(x, y, w, h) {
    return { x, y, w: w || PLAT_W, h: h || PLAT_H };
}

// ─── NIVEAUX ──────────────────────────────────────────────────────────────────
function buildLevel1(W, H, floorY, CEIL_Y) {
    const c1x = W * 0.08 | 0;
    const c2x = W * 0.48 | 0;
    platforms = [
        makeFloor(W, floorY),
        makePlatform(c1x, CEIL_Y),
        makePlatform(c2x, CEIL_Y)
    ];
    hazards = [
        { x: c1x + 80, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 80, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }
    ];
    goal.x = c2x + PLAT_W + 150;
    goal.y = floorY - 110;
}

function buildLevel2(W, H, floorY, CEIL_Y) {
    const c1x = W * 0.07 | 0;
    const m1x = W * 0.28 | 0;
    const m1y = H * 0.40 | 0;
    const c2x = W * 0.47 | 0;
    platforms = [
        makeFloor(W, floorY),
        makePlatform(c1x, CEIL_Y),
        makePlatform(m1x, m1y),
        makePlatform(c2x, CEIL_Y)
    ];
    hazards = [
        { x: c1x + 80,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m1x + 40,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 60,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 250, y: CEIL_Y + PLAT_H,    w: CRYSTAL_W,     h: CRYSTAL_H, side: 'top'    }
    ];
    goal.x = c2x + PLAT_W + 150;
    goal.y = floorY - 110;
}

function buildLevel3(W, H, floorY, CEIL_Y) {
    const c1x = W * 0.07 | 0;
    const m1x = W * 0.27 | 0;
    const m1y = H * 0.40 | 0;
    const c2x = W * 0.46 | 0;
    const m2x = W * 0.65 | 0;
    const m2y = H * 0.52 | 0;
    platforms = [
        makeFloor(W, floorY),
        makePlatform(c1x, CEIL_Y),
        makePlatform(m1x, m1y),
        makePlatform(c2x, CEIL_Y),
        makePlatform(m2x, m2y)
    ];
    hazards = [
        { x: c1x + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m1x + 50, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m2x + 50, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }
    ];
    goal.x = m2x + PLAT_W + 20;
    goal.y = floorY - 110;
}

function buildLevel4(W, H, floorY, CEIL_Y) {
    const c1x = W * 0.09 | 0;
    const c2x = W * 0.34 | 0;
    const m1x = W * 0.49 | 0;
    const c3x = W * 0.62 | 0;
    const m1y = H * 0.47 | 0;
    platforms = [
        makeFloor(W, floorY),
        makePlatform(c1x, CEIL_Y),
        makePlatform(c2x, CEIL_Y),
        makePlatform(m1x, m1y),
        makePlatform(c3x, CEIL_Y)
    ];
    hazards = [
        { x: c1x + 90,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 70,  y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m1x + 70,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c3x + 100, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 80,  y: CEIL_Y + PLAT_H,    w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'   },
        { x: m1x + 80,  y: CEIL_Y + PLAT_H,    w: CRYSTAL_W,     h: CRYSTAL_H, side: 'top'   }
    ];
    goal.x = Math.min(c3x + PLAT_W + 90, W - goal.w - 70);
    goal.y = floorY - 110;
}

function buildLevel5(W, H, floorY, CEIL_Y) {
    const PW = 200;
    const c1x = W * 0.06 | 0;
    const m1x = W * 0.24 | 0;
    const m1y = H * 0.44 | 0;
    const c2x = W * 0.40 | 0;
    const m2x = W * 0.55 | 0;
    const m2y = H * 0.36 | 0;
    const c3x = W * 0.70 | 0;
    const m3x = W * 0.84 | 0;
    const m3y = H * 0.50 | 0;
    platforms = [
        makeFloor(W, floorY),
        makePlatform(c1x, CEIL_Y,  PW, PLAT_H),
        makePlatform(m1x, m1y,     PW, PLAT_H),
        makePlatform(c2x, CEIL_Y,  PW, PLAT_H),
        makePlatform(m2x, m2y,     PW, PLAT_H),
        makePlatform(c3x, CEIL_Y,  PW, PLAT_H),
        makePlatform(m3x, m3y,     PW, PLAT_H)
    ];
    hazards = [
        { x: c1x + 60,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m1x + 50,  y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 60,  y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m2x + 50,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c3x + 60,  y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m3x + 50,  y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c1x + 30,  y: CEIL_Y + PLAT_H,    w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'    },
        { x: c2x + 30,  y: CEIL_Y + PLAT_H,    w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'    },
        { x: c3x + 40,  y: CEIL_Y + PLAT_H,    w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'    },
        { x: m1x + 40,  y: m1y + PLAT_H,       w: CRYSTAL_W,     h: CRYSTAL_H, side: 'top'    },
        { x: m2x + 40,  y: m2y + PLAT_H,       w: CRYSTAL_W,     h: CRYSTAL_H, side: 'top'    },
        { x: m3x + 30,  y: m3y + PLAT_H,       w: CRYSTAL_W,     h: CRYSTAL_H, side: 'top'    }
    ];
    goal.x = Math.min(m3x + PW + 60, W - goal.w - 50);
    goal.y = floorY - 110;
}

function denormalizeRect(rect, W, H) {
    return {
        x: Math.round((rect.xRatio ?? 0) * W),
        y: Math.round((rect.yRatio ?? 0) * H),
        w: rect.w || PLAT_W,
        h: rect.h || PLAT_H,
        side: rect.side
    };
}

function buildDevLevel(levelData, W, H, floorY) {
    platforms = [makeFloor(W, floorY)];
    (levelData.platforms || []).forEach(p => {
        const r = denormalizeRect(p, W, H);
        platforms.push(makePlatform(r.x, r.y, r.w, r.h));
    });
    hazards = (levelData.hazards || []).map(h => {
        const r = denormalizeRect(h, W, H);
        return { x: r.x, y: r.y, w: r.w, h: r.h, side: h.side || 'bottom' };
    });
    const sg = levelData.goal || { xRatio: 0.82, yRatio: 0.78, w: 100, h: 110 };
    const g = denormalizeRect(sg, W, H);
    goal = { x: g.x, y: g.y, w: sg.w || 100, h: sg.h || 110 };
}

function loadLevel(lv) {
    keys = {};
    player.velX = 0;
    player.velY = 0;
    player.currentFrame = 0;
    player.isMoving = false;
    gravityDirection = 1;
    currentLevel = lv;
    player.x = 100;

    const W      = canvas.width;
    const H      = canvas.height;
    const floorH = getTheme(lv).floorHeight;
    const floorY = H - floorH;
    const CEIL_Y = 40;

    player.y = floorY - PLAYER_H - 2;

    if (lv === DEV_TEST_SLOT && devTestLevel) {
        buildDevLevel(devTestLevel, W, H, floorY);
        return;
    }

    if      (lv === 1) buildLevel1(W, H, floorY, CEIL_Y);
    else if (lv === 2) buildLevel2(W, H, floorY, CEIL_Y);
    else if (lv === 3) buildLevel3(W, H, floorY, CEIL_Y);
    else if (lv === 4) buildLevel4(W, H, floorY, CEIL_Y);
    else if (lv === 5) buildLevel5(W, H, floorY, CEIL_Y);
}

// ─── MODE DÉVELOPPEUR ────────────────────────────────────────────────────────
function startDevTest(levelData) {
    devTestLevel = levelData;
    setOverlayVisibility(false, false);
    gameState = 'PLAYING';
    loadLevel(DEV_TEST_SLOT);
}

// ─── SOL ──────────────────────────────────────────────────────────────────────
function drawStaticFloor() {
    const theme  = getTheme();
    const img    = theme.floor;
    const floorH = theme.floorHeight;
    if (!img || !img.complete || !img.naturalWidth) return;
    const yPos = canvas.height - floorH;
    for (let x = 0; x < canvas.width; x += img.naturalWidth) {
        ctx.drawImage(img, x, yPos, img.naturalWidth, floorH);
    }
}

// ─── ANIMATION ────────────────────────────────────────────────────────────────
function updatePlayerAnimation() {
    const moving = player.onSurface && Math.abs(player.velX) > 0.4;
    player.isMoving = moving;
    if (moving) player.currentFrame = (player.currentFrame + player.animationSpeed) % walkFrames.length;
    else        player.currentFrame = 0;
}

function getCurrentWalkFrame() {
    const idx   = Math.floor(player.currentFrame) % walkFrames.length;
    const frame = walkFrames[idx];
    return frame?.complete && frame.naturalWidth ? frame : walkFrames[0];
}

// ─── OVERLAYS ─────────────────────────────────────────────────────────────────
function setOverlayVisibility(menuVisible, gameOverVisible) {
    menuEl.classList.toggle('is-visible', menuVisible);
    gameOverEl.classList.toggle('is-visible', gameOverVisible);
}

function showMenu() {
    gameState = 'MENU';
    devTestLevel = null;
    keys = {};
    setOverlayVisibility(true, false);
}

function startGame(lv) {
    setOverlayVisibility(false, false);
    gameState = 'PLAYING';
    loadLevel(lv);
}

function showGameOver(msg) {
    gameState = 'GAME_OVER';
    keys = {};
    player.velX = 0;
    player.velY = 0;
    player.isMoving = false;
    gameOverText.textContent = msg || "L'équilibre magique s'est rompu.";
    setOverlayVisibility(false, true);
}

function retryLevel() {
    setOverlayVisibility(false, false);
    gameState = 'PLAYING';
    loadLevel(currentLevel);
}

function resetGame(msg) { showGameOver(msg); }

// ─── BOUCLE PRINCIPALE ────────────────────────────────────────────────────────
function update() {
    if (gameState !== 'PLAYING') {
        draw();
        requestAnimationFrame(update);
        return;
    }

    if (keys['ArrowRight']) {
        player.velX = Math.min(player.velX + ACCEL, MAX_VX);
        player.facingRight = true;
    } else if (keys['ArrowLeft']) {
        player.velX = Math.max(player.velX - ACCEL, -MAX_VX);
        player.facingRight = false;
    } else {
        player.velX *= FRIC;
        if (Math.abs(player.velX) < 0.4) player.velX = 0;
    }

    const nextX = player.x + Math.round(player.velX);
    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x + p.w && nextX + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) canMoveX = false;
    });
    if (canMoveX) player.x = nextX;
    else player.velX = 0;

    if (player.x < 0) { player.x = 0; player.velX = 0; }
    if (player.x + player.width > canvas.width) { player.x = canvas.width - player.width; player.velX = 0; }

    player.velY += GRAVITY * gravityDirection;
    player.velY  = Math.max(-MAX_VY, Math.min(MAX_VY, player.velY));
    player.y    += player.velY;
    player.onSurface = false;

    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY >= 0) { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y + p.h;           player.velY = 0; }
            } else {
                if (player.velY <= 0) { player.y = p.y + p.h;           player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y - player.height; player.velY = 0; }
            }
        }
    });

    updatePlayerAnimation();

    for (const h of hazards) {
        const hx = h.x + HBOX_MX, hw = h.w - 2 * HBOX_MX;
        const hy = h.y + HBOX_MY, hh = h.h - HBOX_MY;
        const px = player.x + 8,  pw = player.width  - 16;
        const py = player.y + 8,  ph = player.height - 16;
        if (px < hx + hw && px + pw > hx && py < hy + hh && py + ph > hy) {
            resetGame("Le Néant vous a rattrapé...");
            draw(); requestAnimationFrame(update); return;
        }
    }

    if (player.y < -200 || player.y > canvas.height + 200) {
        resetGame("Perdu dans l'éther...");
        draw(); requestAnimationFrame(update); return;
    }

    if (player.x < goal.x + goal.w && player.x + player.width > goal.x &&
        player.y < goal.y + goal.h && player.y + player.height > goal.y) {
        if (currentLevel === DEV_TEST_SLOT) {
            showMenu();
        } else if (currentLevel < TOTAL_LEVELS) {
            loadLevel(currentLevel + 1);
        } else {
            showMenu();
        }
    }

    draw();
    requestAnimationFrame(update);
}

// ─── DESSIN ───────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme   = getTheme();
    const bgImg   = theme.background;
    const platImg = theme.platform;
    const picsImg = theme.pics;
    const flagImg = theme.flag;

    if (bgImg && bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'MENU'
            ? 'blur(10px) brightness(0.38)'
            : gameState === 'GAME_OVER'
                ? 'blur(5px) brightness(0.45)'
                : 'blur(4px) brightness(0.65)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (gameState === 'MENU') return;

    drawStaticFloor();

    platforms.forEach(p => {
        if (p.isFloor) return;
        if (platImg && platImg.complete) ctx.drawImage(platImg, p.x, p.y, p.w, p.h);
    });

    hazards.forEach(h => {
        if (!picsImg || !picsImg.complete) return;
        const count = Math.ceil(h.w / CRYSTAL_W);
        for (let i = 0; i < count; i++) {
            const dx = h.x + i * CRYSTAL_W;
            ctx.save();
            if (h.side === 'top') {
                ctx.translate(dx + CRYSTAL_W / 2, h.y + CRYSTAL_H / 2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -CRYSTAL_W / 2, -CRYSTAL_H / 2, CRYSTAL_W, CRYSTAL_H);
            } else {
                ctx.drawImage(picsImg, dx, h.y, CRYSTAL_W, CRYSTAL_H);
            }
            ctx.restore();
        }
    });

    if (flagImg && flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    const frame = getCurrentWalkFrame();
    if (frame?.complete) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(frame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
}

// ─── CLAVIER ──────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && player.onSurface && gameState === 'PLAYING') {
        gravityDirection *= -1;
        player.onSurface  = false;
        player.velX      *= 0.6;
        player.velY       = gravityDirection * GRAVITY;
        player.y         += gravityDirection * FLIP_OFFSET;
    }
    if (e.code === 'Escape' && gameState === 'PLAYING') showMenu();
    if (gameState === 'GAME_OVER' && (e.code === 'Enter' || e.code === 'KeyR')) retryLevel();
    if (gameState === 'GAME_OVER' && e.code === 'Escape') showMenu();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

showMenu();
update();
