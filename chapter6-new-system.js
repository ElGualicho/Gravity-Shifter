/**
 * chapter6-new-system.js
 * Chapitre 6 : prototype du "nouveau système".
 * Objectif : tester une logique proche du puzzle observé : blocs carrés, bouton de gravité,
 * inversion verticale des blocs, flag fixe, sol + plafond et progression horizontale.
 *
 * Le fichier reste volontairement isolé pour ne pas casser les chapitres existants.
 */

const CHAPTER_6_LEVEL_ID = 6;
const CHAPTER_6_THEME = 'steel';
const CHAPTER_6_GRID = 70;
const CHAPTER_6_TOP_FLOOR_H = FLOOR_H;
const CHAPTER_6_BUTTON_SIZE = 78;

const CHAPTER_6_BLOCK_STYLE = {
    fill: 'rgba(0, 155, 190, 0.94)',
    stroke: 'rgba(2, 67, 91, 0.98)',
    highlight: 'rgba(255, 255, 255, 0.20)',
    shadow: 'rgba(0, 0, 0, 0.20)',
    cross: 'rgba(2, 67, 91, 0.35)'
};

const CHAPTER_6_BUTTON_STYLE = {
    bg: 'rgba(246, 238, 218, 0.96)',
    border: 'rgba(89, 60, 31, 0.95)',
    icon: 'rgba(0, 155, 190, 0.98)',
    activeBg: 'rgba(255, 221, 137, 0.96)'
};

let chapter6Blocks = [];
let chapter6ButtonRect = { x: 0, y: 0, w: CHAPTER_6_BUTTON_SIZE, h: CHAPTER_6_BUTTON_SIZE };
let chapter6InvertedLayout = false;

if (typeof levelThemes !== 'undefined') {
    levelThemes[CHAPTER_6_LEVEL_ID] = CHAPTER_6_THEME;
}

function makeChapter6Floor(x, y, w, h, role) {
    return {
        x,
        y,
        w,
        h,
        role,
        renderMode: 'chapter6-floor'
    };
}

function makeChapter6Block(x, y, size = CHAPTER_6_GRID, role = 'solid') {
    return {
        x,
        y,
        baseY: y,
        w: size,
        h: size,
        role,
        renderMode: 'chapter6-square-block'
    };
}

function getChapter6MirroredY(block) {
    const H = canvas.height;
    const bottomLimit = H - getTheme(CHAPTER_6_LEVEL_ID).floorHeight;
    return CHAPTER_6_TOP_FLOOR_H + (bottomLimit - (block.baseY + block.h));
}

function applyChapter6BlockLayout() {
    chapter6Blocks.forEach(block => {
        block.y = chapter6InvertedLayout ? getChapter6MirroredY(block) : block.baseY;
    });
}

function syncChapter6Platforms() {
    const W = canvas.width;
    const H = canvas.height;
    const floorH = getTheme(CHAPTER_6_LEVEL_ID).floorHeight;
    const floorY = H - floorH;

    platforms = [
        makeChapter6Floor(0, floorY, W, floorH, 'bottom-floor'),
        makeChapter6Floor(0, 0, W, CHAPTER_6_TOP_FLOOR_H, 'top-floor'),
        ...chapter6Blocks
    ];
}

function buildLevel6NewSystem(W, H) {
    const S = CHAPTER_6_GRID;
    const top = CHAPTER_6_TOP_FLOOR_H;
    const bottom = H - getTheme(CHAPTER_6_LEVEL_ID).floorHeight;
    const usableH = bottom - top;
    const startY = bottom - PLAYER_H - 2;

    chapter6InvertedLayout = false;
    player.x = 80;
    player.y = startY;

    // Grille horizontale compacte : les blocs forment un labyrinthe lisible sur un écran.
    // Ils sont tous carrés et leur position verticale est inversée par le bouton.
    const cells = [
        // Blocages bas du début, créent une première contrainte de trajectoire.
        [4, 5], [5, 5], [6, 5],
        [4, 4], [6, 4],

        // Passage central en escalier inversable.
        [8, 3], [9, 3],
        [9, 4],
        [11, 5], [12, 5], [13, 5],
        [13, 4],

        // Couloir supérieur qui devient couloir inférieur après inversion.
        [15, 2], [16, 2],
        [16, 3],
        [18, 4],
        [20, 3], [21, 3],

        // Mur final à contourner en jouant avec la gravité.
        [23, 5], [23, 4],
        [24, 5], [24, 4]
    ];

    const cellGap = 2;
    const startX = Math.max(180, W * 0.14 | 0);
    const yBase = top + Math.max(12, (usableH - (S * 6)) / 2 | 0);
    const maxRight = W - 180;
    const layoutWidth = 25 * S;
    const scaleX = Math.min(1, Math.max(0.58, (maxRight - startX) / layoutWidth));

    chapter6Blocks = cells.map(([cx, cy]) => {
        const x = startX + Math.round(cx * S * scaleX);
        const y = yBase + cy * S;
        return makeChapter6Block(x, y, S - cellGap, 'solid');
    });

    applyChapter6BlockLayout();
    syncChapter6Platforms();

    hazards = [];

    goal = {
        x: Math.min(W - 145, startX + Math.round(25 * S * scaleX)),
        y: bottom - 110,
        w: 100,
        h: 110
    };

    chapter6ButtonRect = {
        x: Math.round(W / 2 - CHAPTER_6_BUTTON_SIZE / 2),
        y: Math.round(H - CHAPTER_6_BUTTON_SIZE - 24),
        w: CHAPTER_6_BUTTON_SIZE,
        h: CHAPTER_6_BUTTON_SIZE
    };
}

function flipChapter6Gravity() {
    if (gameState !== 'PLAYING' || currentLevel !== CHAPTER_6_LEVEL_ID || !player.onSurface) return;

    chapter6InvertedLayout = !chapter6InvertedLayout;
    applyChapter6BlockLayout();
    syncChapter6Platforms();

    gravityDirection *= -1;
    player.onSurface = false;
    player.velX *= 0.6;
    player.velY = gravityDirection * GRAVITY;
    player.y += gravityDirection * FLIP_OFFSET;
}

const originalLoadLevel = loadLevel;
loadLevel = function patchedLoadLevel(lv) {
    if (lv !== CHAPTER_6_LEVEL_ID) {
        originalLoadLevel(lv);
        return;
    }

    keys = {};
    player.velX = 0;
    player.velY = 0;
    player.currentFrame = 0;
    player.isMoving = false;
    player.facingRight = true;
    gravityDirection = 1;
    currentLevel = lv;

    buildLevel6NewSystem(canvas.width, canvas.height);
};

function drawChapter6Floor(p) {
    const theme = getTheme(CHAPTER_6_LEVEL_ID);
    const img = theme.floor;

    if (img && img.complete && img.naturalWidth) {
        ctx.save();
        if (p.role === 'top-floor') {
            ctx.translate(0, p.h);
            ctx.scale(1, -1);
            for (let x = 0; x < canvas.width; x += img.naturalWidth) {
                ctx.drawImage(img, x, 0, img.naturalWidth, p.h);
            }
        } else {
            for (let x = 0; x < canvas.width; x += img.naturalWidth) {
                ctx.drawImage(img, x, p.y, img.naturalWidth, p.h);
            }
        }
        ctx.restore();
        return;
    }

    ctx.save();
    ctx.fillStyle = 'rgba(64, 67, 78, 0.96)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.restore();
}

function drawChapter6Block(block) {
    const r = Math.min(8, block.w * 0.14);

    ctx.save();
    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.shadow;
    ctx.fillRect(block.x + 5, block.y + 6, block.w, block.h);

    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.fill;
    ctx.strokeStyle = CHAPTER_6_BLOCK_STYLE.stroke;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(block.x, block.y, block.w, block.h, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.highlight;
    ctx.fillRect(block.x + 6, block.y + 6, Math.max(0, block.w - 12), 8);

    ctx.strokeStyle = CHAPTER_6_BLOCK_STYLE.cross;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(block.x + block.w * 0.35, block.y + block.h * 0.35);
    ctx.lineTo(block.x + block.w * 0.65, block.y + block.h * 0.65);
    ctx.moveTo(block.x + block.w * 0.65, block.y + block.h * 0.35);
    ctx.lineTo(block.x + block.w * 0.35, block.y + block.h * 0.65);
    ctx.stroke();

    ctx.restore();
}

function drawChapter6GravityButton() {
    const b = chapter6ButtonRect;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    ctx.save();
    ctx.fillStyle = chapter6InvertedLayout ? CHAPTER_6_BUTTON_STYLE.activeBg : CHAPTER_6_BUTTON_STYLE.bg;
    ctx.strokeStyle = CHAPTER_6_BUTTON_STYLE.border;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CHAPTER_6_BUTTON_STYLE.icon;
    ctx.fillRect(cx - 15, cy - 10, 30, 30);

    ctx.strokeStyle = CHAPTER_6_BUTTON_STYLE.icon;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (gravityDirection === 1) {
        ctx.moveTo(cx, cy - 28);
        ctx.lineTo(cx, cy - 44);
        ctx.moveTo(cx, cy - 44);
        ctx.lineTo(cx - 11, cy - 33);
        ctx.moveTo(cx, cy - 44);
        ctx.lineTo(cx + 11, cy - 33);
    } else {
        ctx.moveTo(cx, cy + 34);
        ctx.lineTo(cx, cy + 48);
        ctx.moveTo(cx, cy + 48);
        ctx.lineTo(cx - 11, cy + 37);
        ctx.moveTo(cx, cy + 48);
        ctx.lineTo(cx + 11, cy + 37);
    }
    ctx.stroke();
    ctx.restore();
}

function drawChapter6Player() {
    const frame = getCurrentWalkFrame();
    if (!frame?.complete) return;

    const attachOffset = gravityDirection === -1 && typeof INVERTED_PLAYER_ATTACH_OFFSET !== 'undefined'
        ? INVERTED_PLAYER_ATTACH_OFFSET
        : 0;
    const visualOffset = typeof PLAYER_VISUAL_Y_OFFSET !== 'undefined' ? PLAYER_VISUAL_Y_OFFSET : 0;

    ctx.save();
    ctx.translate(
        player.x + player.width / 2,
        player.y + player.height / 2 + visualOffset - attachOffset
    );
    ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
    ctx.drawImage(frame, -player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

const originalDraw = draw;
draw = function patchedDraw() {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState === 'MENU') {
        originalDraw();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme = getTheme(CHAPTER_6_LEVEL_ID);
    const bgImg = theme.background;
    const flagImg = theme.flag;

    if (bgImg && bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'GAME_OVER'
            ? 'blur(5px) brightness(0.45)'
            : 'blur(4px) brightness(0.68)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    platforms.forEach(p => {
        if (p.renderMode === 'chapter6-floor') drawChapter6Floor(p);
    });

    chapter6Blocks.forEach(drawChapter6Block);

    if (flagImg && flagImg.complete) {
        const flagOffset = typeof FLAG_VISUAL_Y_OFFSET !== 'undefined' ? FLAG_VISUAL_Y_OFFSET : 0;
        ctx.drawImage(flagImg, goal.x, goal.y + flagOffset, goal.w, goal.h);
    }

    drawChapter6GravityButton();
    drawChapter6Player();
};

function isInsideChapter6Button(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const b = chapter6ButtonRect;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function handleChapter6Pointer(clientX, clientY, event) {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState !== 'PLAYING') return;
    if (!isInsideChapter6Button(clientX, clientY)) return;
    event.preventDefault();
    flipChapter6Gravity();
}

canvas.addEventListener('click', event => {
    handleChapter6Pointer(event.clientX, event.clientY, event);
});

canvas.addEventListener('touchstart', event => {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    handleChapter6Pointer(touch.clientX, touch.clientY, event);
}, { passive: false });

window.addEventListener('keydown', event => {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState !== 'PLAYING') return;
    if (event.code !== 'Space') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    flipChapter6Gravity();
}, true);
