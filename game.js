const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const menuEl = document.getElementById('gameMenu');
const gameOverEl = document.getElementById('gameOver');
const gameOverText = document.getElementById('gameOverText');

let gameState = 'MENU';
let currentLevel = 1;
let gravityDirection = 1;
let keys = {};

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => {
    resizeCanvas();
    loadLevel(currentLevel);
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

const backgroundImg = loadImage('assets/background.png');
const bgSummerImg = loadImage('assets/background_summer.png');
const bgWinterImg = loadImage('assets/background_winter.png');
const bgSteelImg = loadImage('assets/background_steel.png');

const floorGrassImg = loadImage('assets/floor_grass.png');
const floorClayImg = loadImage('assets/floor_clay.png');
const floorStoneImg = loadImage('assets/floor_stone.png');
const floorWinterImg = loadImage('assets/floor_winter.png');
const floorSteelImg = loadImage('assets/floor_steel.png');

const platImg = loadImage('assets/platform1.png');
const platImg2 = loadImage('assets/platform2.png');
const platImg4 = loadImage('assets/platform4.png');
const flagImg = loadImage('assets/flag.png');
const picsImg = loadImage('assets/pics.png');

const walkFrames = [];
['walk1.png', 'walk2.png', 'walk3.png', 'walk4.png'].forEach((name, index) => {
    walkFrames[index] = loadImage(`assets/${name}`);
});

// ─── CONSTANTES PHYSIQUE ─────────────────────────────────────────────────────
const PLAYER_W = 75;
const PLAYER_H = 95;
const CRYSTAL_W = 65;
const CRYSTAL_H = 70;
const PLAT_W = 320;
const PLAT_H = 60;
const FLOOR_H = 65;
const WINTER_FLOOR_H = 85;
const STEEL_FLOOR_H = 65;
const HBOX_MX = 20;
const HBOX_MY = 18;

const GRAVITY = 0.8;
const MAX_VY = 13;
const MAX_VX = 9;
const ACCEL = 1.3;
const FRIC = 0.78;
const FLIP_OFFSET = 12;
const MAX_LEVEL = 5;

const player = {
    x: 100,
    y: 300,
    width: PLAYER_W,
    height: PLAYER_H,
    velX: 0,
    velY: 0,
    onSurface: false,
    currentFrame: 0,
    animationSpeed: 0.2,
    isMoving: false,
    facingRight: true
};

let platforms = [];
let hazards = [];
let goal = { x: 0, y: 0, w: 100, h: 110 };

const levelThemes = {
    1: { background: backgroundImg, floor: floorGrassImg, platform: platImg, floorHeight: FLOOR_H },
    2: { background: bgSummerImg, floor: floorClayImg, platform: platImg, floorHeight: FLOOR_H },
    3: { background: backgroundImg, floor: floorStoneImg, platform: platImg, floorHeight: FLOOR_H },
    4: { background: bgWinterImg, floor: floorWinterImg, platform: platImg2, floorHeight: WINTER_FLOOR_H },
    5: { background: bgSteelImg, floor: floorSteelImg, platform: platImg4, floorHeight: STEEL_FLOOR_H }
};

function getLevelTheme(level = currentLevel) {
    return levelThemes[level] || levelThemes[1];
}

function getCurrentBackgroundImage(level = currentLevel) {
    return getLevelTheme(level).background;
}

function getCurrentPlatformImage(level = currentLevel) {
    return getLevelTheme(level).platform;
}

function getCurrentFloorImage(level = currentLevel) {
    return getLevelTheme(level).floor;
}

function getFloorHeight(level = currentLevel) {
    return getLevelTheme(level).floorHeight;
}

function buildAdvancedLevel(W, H, floorY, CEIL_Y) {
    const c1x = W * 0.09 | 0;
    const c2x = W * 0.34 | 0;
    const m1x = W * 0.49 | 0;
    const c3x = W * 0.62 | 0;
    const m1y = H * 0.47 | 0;

    platforms = [
        { x: 0, y: floorY, w: W * 2, h: 120, isFloor: true },
        { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
        { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
        { x: m1x, y: m1y, w: PLAT_W, h: PLAT_H },
        { x: c3x, y: CEIL_Y, w: PLAT_W, h: PLAT_H }
    ];

    hazards = [
        { x: c1x + 90, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c2x + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: m1x + 70, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: c3x + 100, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }
    ];

    goal.x = Math.min(c3x + PLAT_W + 90, W - goal.w - 70);
    goal.y = floorY - 110;
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

    const W = canvas.width;
    const H = canvas.height;
    const floorH = getFloorHeight(lv);
    const floorY = H - floorH;
    const CEIL_Y = 40;
    const fp = { x: 0, y: floorY, w: W * 2, h: 120, isFloor: true };
    player.y = floorY - PLAYER_H - 2;

    if (lv === 1) {
        const c1x = W * 0.08 | 0;
        const c2x = W * 0.48 | 0;
        platforms = [fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H }
        ];
        hazards = [
            { x: c1x + 80, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: c2x + 80, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }
        ];
        goal.x = c2x + PLAT_W + 150;
        goal.y = floorY - 110;
    } else if (lv === 2) {
        const c1x = W * 0.07 | 0;
        const m1x = W * 0.28 | 0;
        const m1y = H * 0.40 | 0;
        const c2x = W * 0.47 | 0;
        platforms = [fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: m1x, y: m1y, w: PLAT_W, h: PLAT_H },
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H }
        ];
        hazards = [
            { x: c1x + 80, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: m1x + 40, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: c2x + 60, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: c2x + 250, y: CEIL_Y + PLAT_H, w: CRYSTAL_W, h: CRYSTAL_H, side: 'top' }
        ];
        goal.x = c2x + PLAT_W + 150;
        goal.y = floorY - 110;
    } else if (lv === 3) {
        const c1x = W * 0.07 | 0;
        const m1x = W * 0.27 | 0;
        const m1y = H * 0.40 | 0;
        const c2x = W * 0.46 | 0;
        const m2x = W * 0.65 | 0;
        const m2y = H * 0.52 | 0;
        platforms = [fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: m1x, y: m1y, w: PLAT_W, h: PLAT_H },
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: m2x, y: m2y, w: PLAT_W, h: PLAT_H }
        ];
        hazards = [
            { x: c1x + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: m1x + 50, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: c2x + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: m2x + 50, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }
        ];
        goal.x = m2x + PLAT_W + 20;
        goal.y = floorY - 110;
    } else if (lv === 4 || lv === 5) {
        buildAdvancedLevel(W, H, floorY, CEIL_Y);
    }
}

function drawStaticFloor(img) {
    if (!img.complete || !img.naturalWidth) return;

    const floorH = getFloorHeight();
    const yPos = canvas.height - floorH;
    const tileWidth = img.naturalWidth;

    for (let x = 0; x < canvas.width; x += tileWidth) {
        ctx.drawImage(img, x, yPos, tileWidth, floorH);
    }
}

function updatePlayerAnimation() {
    const movingOnSurface = player.onSurface && Math.abs(player.velX) > 0.4;
    player.isMoving = movingOnSurface;

    if (movingOnSurface) {
        player.currentFrame = (player.currentFrame + player.animationSpeed) % walkFrames.length;
    } else {
        player.currentFrame = 0;
    }
}

function getCurrentWalkFrame() {
    const frameIndex = Math.floor(player.currentFrame) % walkFrames.length;
    const frame = walkFrames[frameIndex];
    return frame?.complete && frame.naturalWidth ? frame : walkFrames[0];
}

function setOverlayVisibility(menuVisible, gameOverVisible) {
    menuEl.classList.toggle('is-visible', menuVisible);
    gameOverEl.classList.toggle('is-visible', gameOverVisible);
}

function showMenu() {
    gameState = 'MENU';
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

function resetGame(msg) {
    showGameOver(msg);
}

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
            player.y < p.y + p.h && player.y + player.height > p.y) {
            canMoveX = false;
        }
    });

    if (canMoveX) player.x = nextX;
    else player.velX = 0;

    if (player.x < 0) { player.x = 0; player.velX = 0; }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velX = 0;
    }

    player.velY += GRAVITY * gravityDirection;
    player.velY = Math.max(-MAX_VY, Math.min(MAX_VY, player.velY));
    player.y += player.velY;
    player.onSurface = false;

    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY >= 0) {
                    player.y = p.y - player.height;
                    player.velY = 0;
                    player.onSurface = true;
                } else {
                    player.y = p.y + p.h;
                    player.velY = 0;
                }
            } else {
                if (player.velY <= 0) {
                    player.y = p.y + p.h;
                    player.velY = 0;
                    player.onSurface = true;
                } else {
                    player.y = p.y - player.height;
                    player.velY = 0;
                }
            }
        }
    });

    updatePlayerAnimation();

    for (const h of hazards) {
        const hx = h.x + HBOX_MX;
        const hw = h.w - 2 * HBOX_MX;
        const hy = h.y + HBOX_MY;
        const hh = h.h - HBOX_MY;
        const px = player.x + 8;
        const pw = player.width - 16;
        const py = player.y + 8;
        const ph = player.height - 16;

        if (px < hx + hw && px + pw > hx && py < hy + hh && py + ph > hy) {
            resetGame("Le Néant vous a rattrapé...");
            draw();
            requestAnimationFrame(update);
            return;
        }
    }

    if (player.y < -200 || player.y > canvas.height + 200) {
        resetGame("Perdu dans l'éther...");
        draw();
        requestAnimationFrame(update);
        return;
    }

    if (player.x < goal.x + goal.w && player.x + player.width > goal.x &&
        player.y < goal.y + goal.h && player.y + player.height > goal.y) {
        if (currentLevel < MAX_LEVEL) {
            loadLevel(currentLevel + 1);
        } else {
            showMenu();
        }
    }

    draw();
    requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgImg = getCurrentBackgroundImage();
    const curPlatImg = getCurrentPlatformImage();
    const curFloorImg = getCurrentFloorImage();

    if (bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'MENU'
            ? "blur(10px) brightness(0.38)"
            : gameState === 'GAME_OVER'
                ? "blur(5px) brightness(0.45)"
                : "blur(4px) brightness(0.65)";
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (gameState === 'MENU') return;

    drawStaticFloor(curFloorImg.complete && curFloorImg.naturalWidth ? curFloorImg : curPlatImg);

    platforms.forEach(p => {
        if (p.isFloor) return;
        if (curPlatImg.complete) ctx.drawImage(curPlatImg, p.x, p.y, p.w, p.h);
    });

    hazards.forEach(h => {
        if (!picsImg.complete) return;
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

    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    const playerFrame = getCurrentWalkFrame();
    if (playerFrame?.complete) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(playerFrame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
}

window.addEventListener('keydown', e => {
    keys[e.code] = true;

    if (e.code === 'Space' && player.onSurface && gameState === 'PLAYING') {
        gravityDirection *= -1;
        player.onSurface = false;
        player.velX *= 0.6;
        player.velY = gravityDirection * GRAVITY;
        player.y += gravityDirection * FLIP_OFFSET;
    }

    if (e.code === 'Escape' && gameState === 'PLAYING') showMenu();
    if (gameState === 'GAME_OVER' && (e.code === 'Enter' || e.code === 'KeyR')) retryLevel();
    if (gameState === 'GAME_OVER' && e.code === 'Escape') showMenu();
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

showMenu();
update();
