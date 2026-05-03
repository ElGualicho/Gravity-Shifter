/**
 * chapter6-new-system.js
 * Chapitre 6 : nouveau système de puzzle à blocs.
 *
 * Le fichier remplace uniquement le comportement du chapitre 6.
 * Les anciens chapitres continuent d'utiliser game.js.
 *
 * Règles :
 * - Espace ou bouton central inverse la gravité uniquement si le joueur touche une surface.
 * - Les blocs fixes servent de murs/sols/plafonds selon la gravité.
 * - Les blocs mobiles tombent dans le nouveau sens de gravité après chaque inversion.
 * - Les pics tuent dans tous les cas.
 * - Le drapeau termine le niveau.
 */

const CHAPTER_6_LEVEL_ID = 6;
const CHAPTER_6_THEME = 'steel';
const CH6_CELL = 64;
const CH6_TOP_FLOOR_H = FLOOR_H;
const CH6_BUTTON_SIZE = 76;
const CH6_SETTLE_GAP = 1;

const CH6_STYLE = {
    fixedFill: 'rgba(48, 70, 84, 0.96)',
    fixedStroke: 'rgba(201, 232, 240, 0.56)',
    movableFill: 'rgba(0, 158, 190, 0.96)',
    movableStroke: 'rgba(235, 252, 255, 0.88)',
    hazardFill: 'rgba(255, 88, 88, 0.96)',
    hazardStroke: 'rgba(83, 14, 22, 0.92)',
    buttonBg: 'rgba(246, 238, 218, 0.96)',
    buttonActiveBg: 'rgba(255, 221, 137, 0.98)',
    buttonBorder: 'rgba(74, 49, 29, 0.95)',
    buttonIcon: 'rgba(0, 145, 178, 0.98)',
    panel: 'rgba(3, 17, 24, 0.56)',
    text: 'rgba(244, 252, 255, 0.96)'
};

let ch6FixedBlocks = [];
let ch6MovableBlocks = [];
let ch6Hazards = [];
let ch6ButtonRect = { x: 0, y: 0, w: CH6_BUTTON_SIZE, h: CH6_BUTTON_SIZE };
let ch6Origin = { x: 0, y: 0, rows: 0, cols: 0, bottomY: 0 };
let ch6FlipCount = 0;

if (typeof levelThemes !== 'undefined') {
    levelThemes[CHAPTER_6_LEVEL_ID] = CHAPTER_6_THEME;
}

function ch6Rect(x, y, w, h, extra = {}) {
    return { x, y, w, h, ...extra };
}

function ch6Floor(x, y, w, h, role) {
    return ch6Rect(x, y, w, h, { role, type: 'floor', renderMode: 'ch6-floor' });
}

function ch6Block(col, row, type) {
    return ch6Rect(
        ch6Origin.x + col * CH6_CELL,
        ch6Origin.y + row * CH6_CELL,
        CH6_CELL,
        CH6_CELL,
        { col, row, type, renderMode: type === 'movable' ? 'ch6-movable' : 'ch6-fixed' }
    );
}

function ch6Hazard(col, row, side) {
    return ch6Rect(
        ch6Origin.x + col * CH6_CELL + 7,
        ch6Origin.y + row * CH6_CELL + 8,
        CH6_CELL - 14,
        CH6_CELL - 8,
        { col, row, side, type: 'hazard' }
    );
}

function ch6Overlap(a, b, margin = 0) {
    return a.x + margin < b.x + b.w &&
        a.x + a.w - margin > b.x &&
        a.y + margin < b.y + b.h &&
        a.y + a.h - margin > b.y;
}

function ch6HorizontalOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x;
}

function ch6CurrentFloors() {
    const W = canvas.width;
    const floorH = getTheme(CHAPTER_6_LEVEL_ID).floorHeight;
    return [
        ch6Floor(0, ch6Origin.bottomY, W, floorH, 'bottom-floor'),
        ch6Floor(0, 0, W, CH6_TOP_FLOOR_H, 'top-floor')
    ];
}

function ch6ObstaclesFor(block) {
    return [
        ...ch6CurrentFloors(),
        ...ch6FixedBlocks,
        ...ch6MovableBlocks.filter(other => other !== block)
    ].filter(obstacle => ch6HorizontalOverlap(block, obstacle));
}

function ch6RestY(block, dir) {
    const obstacles = ch6ObstaclesFor(block);

    if (dir === 1) {
        let target = ch6Origin.bottomY - block.h;
        for (const obstacle of obstacles) {
            if (obstacle.y >= block.y + block.h - 0.1) {
                target = Math.min(target, obstacle.y - block.h - CH6_SETTLE_GAP);
            }
        }
        return target;
    }

    let target = CH6_TOP_FLOOR_H + CH6_SETTLE_GAP;
    for (const obstacle of obstacles) {
        if (obstacle.y + obstacle.h <= block.y + 0.1) {
            target = Math.max(target, obstacle.y + obstacle.h + CH6_SETTLE_GAP);
        }
    }
    return target;
}

function ch6ResolveMovableBlocks() {
    const sorted = [...ch6MovableBlocks].sort((a, b) => gravityDirection === 1 ? b.y - a.y : a.y - b.y);
    for (const block of sorted) {
        block.y = ch6RestY(block, gravityDirection);
    }
}

function ch6SyncWorld() {
    platforms = [
        ...ch6CurrentFloors(),
        ...ch6FixedBlocks,
        ...ch6MovableBlocks
    ];
    hazards = ch6Hazards;
}

function ch6BuildLevel(W, H) {
    const floorH = getTheme(CHAPTER_6_LEVEL_ID).floorHeight;
    const bottomY = H - floorH;
    const usableH = bottomY - CH6_TOP_FLOOR_H;
    const rows = Math.max(6, Math.floor(usableH / CH6_CELL));
    const cols = Math.max(12, Math.floor((W - 220) / CH6_CELL));

    ch6Origin = {
        x: Math.max(104, Math.round((W - cols * CH6_CELL) / 2)),
        y: CH6_TOP_FLOOR_H + Math.max(8, Math.round((usableH - rows * CH6_CELL) / 2)),
        rows,
        cols,
        bottomY
    };

    ch6FlipCount = 0;
    gravityDirection = 1;

    player.x = Math.max(42, ch6Origin.x - 84);
    player.y = bottomY - PLAYER_H - 2;
    player.velX = 0;
    player.velY = 0;
    player.onSurface = false;
    player.facingRight = true;

    const r = rows;
    const fixedCells = [
        [3, r - 2], [4, r - 2], [5, r - 2], [5, r - 3],
        [7, r - 4], [8, r - 4],
        [10, r - 2], [10, r - 3],
        [12, r - 5], [13, r - 5],
        [15, r - 3], [16, r - 3],
        [18, r - 2], [18, r - 3], [18, r - 4],
        [20, r - 5], [21, r - 5]
    ].filter(([c, row]) => c >= 0 && c < cols && row >= 0 && row < rows);

    const movableCells = [
        [6, r - 5],
        [9, r - 6],
        [14, r - 2],
        [17, r - 6]
    ].filter(([c, row]) => c >= 0 && c < cols && row >= 0 && row < rows);

    const hazardCells = [
        [4, r - 1, 'bottom'],
        [8, r - 1, 'bottom'],
        [11, r - 1, 'bottom'],
        [15, r - 1, 'bottom'],
        [19, r - 1, 'bottom'],
        [13, 0, 'top'],
        [17, 0, 'top']
    ].filter(([c, row]) => c >= 0 && c < cols && row >= 0 && row < rows);

    ch6FixedBlocks = fixedCells.map(([c, row]) => ch6Block(c, row, 'fixed'));
    ch6MovableBlocks = movableCells.map(([c, row]) => ch6Block(c, row, 'movable'));
    ch6Hazards = hazardCells.map(([c, row, side]) => ch6Hazard(c, row, side));

    ch6ResolveMovableBlocks();
    ch6SyncWorld();

    goal = {
        x: Math.min(W - 128, ch6Origin.x + (cols - 2) * CH6_CELL),
        y: bottomY - 112,
        w: 100,
        h: 110
    };

    ch6ButtonRect = {
        x: Math.round(W / 2 - CH6_BUTTON_SIZE / 2),
        y: Math.round(H - CH6_BUTTON_SIZE - 22),
        w: CH6_BUTTON_SIZE,
        h: CH6_BUTTON_SIZE
    };
}

function ch6ResolvePlayerIfEmbedded() {
    const pBox = ch6Rect(player.x, player.y, player.width, player.height);
    for (const obstacle of platforms) {
        if (!ch6Overlap(pBox, obstacle, 2)) continue;
        player.y = gravityDirection === 1
            ? obstacle.y - player.height - 1
            : obstacle.y + obstacle.h + 1;
        player.velY = 0;
        return;
    }
}

function ch6FlipGravity() {
    if (gameState !== 'PLAYING' || currentLevel !== CHAPTER_6_LEVEL_ID || !player.onSurface) return;

    gravityDirection *= -1;
    ch6FlipCount += 1;
    ch6ResolveMovableBlocks();
    ch6SyncWorld();
    ch6ResolvePlayerIfEmbedded();

    player.onSurface = false;
    player.velX *= 0.45;
    player.velY = gravityDirection * GRAVITY;
    player.y += gravityDirection * FLIP_OFFSET;
}

const ch6OriginalLoadLevel = loadLevel;
loadLevel = function patchedChapter6LoadLevel(lv) {
    if (lv !== CHAPTER_6_LEVEL_ID) {
        ch6OriginalLoadLevel(lv);
        return;
    }

    keys = {};
    currentLevel = lv;
    player.currentFrame = 0;
    player.isMoving = false;
    ch6BuildLevel(canvas.width, canvas.height);
};

function ch6DrawFloor(p) {
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

    ctx.fillStyle = 'rgba(64, 67, 78, 0.96)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
}

function ch6DrawBlock(block) {
    const movable = block.type === 'movable';

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    ctx.fillRect(block.x + 5, block.y + 6, block.w, block.h);

    ctx.fillStyle = movable ? CH6_STYLE.movableFill : CH6_STYLE.fixedFill;
    ctx.strokeStyle = movable ? CH6_STYLE.movableStroke : CH6_STYLE.fixedStroke;
    ctx.lineWidth = movable ? 3 : 2;
    ctx.beginPath();
    ctx.roundRect(block.x, block.y, block.w, block.h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(block.x + 7, block.y + 7, block.w - 14, 8);

    ctx.strokeStyle = movable ? 'rgba(255,255,255,0.58)' : 'rgba(255,255,255,0.24)';
    ctx.lineWidth = movable ? 4 : 3;
    ctx.beginPath();
    if (movable) {
        ctx.moveTo(block.x + block.w * 0.5, block.y + block.h * 0.22);
        ctx.lineTo(block.x + block.w * 0.5, block.y + block.h * 0.78);
        ctx.moveTo(block.x + block.w * 0.28, block.y + block.h * 0.5);
        ctx.lineTo(block.x + block.w * 0.72, block.y + block.h * 0.5);
    } else {
        ctx.moveTo(block.x + block.w * 0.34, block.y + block.h * 0.34);
        ctx.lineTo(block.x + block.w * 0.66, block.y + block.h * 0.66);
        ctx.moveTo(block.x + block.w * 0.66, block.y + block.h * 0.34);
        ctx.lineTo(block.x + block.w * 0.34, block.y + block.h * 0.66);
    }
    ctx.stroke();
    ctx.restore();
}

function ch6DrawHazard(h) {
    const count = Math.max(1, Math.floor(h.w / 22));
    const spikeW = h.w / count;

    ctx.save();
    ctx.fillStyle = CH6_STYLE.hazardFill;
    ctx.strokeStyle = CH6_STYLE.hazardStroke;
    ctx.lineWidth = 2;

    for (let i = 0; i < count; i++) {
        const x = h.x + i * spikeW;
        ctx.beginPath();
        if (h.side === 'top') {
            ctx.moveTo(x, h.y);
            ctx.lineTo(x + spikeW / 2, h.y + h.h);
            ctx.lineTo(x + spikeW, h.y);
        } else {
            ctx.moveTo(x, h.y + h.h);
            ctx.lineTo(x + spikeW / 2, h.y);
            ctx.lineTo(x + spikeW, h.y + h.h);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

function ch6DrawButton() {
    const b = ch6ButtonRect;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;

    ctx.save();
    ctx.fillStyle = gravityDirection === -1 ? CH6_STYLE.buttonActiveBg : CH6_STYLE.buttonBg;
    ctx.strokeStyle = CH6_STYLE.buttonBorder;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = CH6_STYLE.buttonIcon;
    ctx.fillRect(cx - 14, cy - 10, 28, 28);

    ctx.strokeStyle = CH6_STYLE.buttonIcon;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (gravityDirection === 1) {
        ctx.moveTo(cx, cy - 28);
        ctx.lineTo(cx, cy - 44);
        ctx.moveTo(cx, cy - 44);
        ctx.lineTo(cx - 10, cy - 34);
        ctx.moveTo(cx, cy - 44);
        ctx.lineTo(cx + 10, cy - 34);
    } else {
        ctx.moveTo(cx, cy + 34);
        ctx.lineTo(cx, cy + 48);
        ctx.moveTo(cx, cy + 48);
        ctx.lineTo(cx - 10, cy + 38);
        ctx.moveTo(cx, cy + 48);
        ctx.lineTo(cx + 10, cy + 38);
    }
    ctx.stroke();
    ctx.restore();
}

function ch6DrawHud() {
    ctx.save();
    ctx.fillStyle = CH6_STYLE.panel;
    ctx.beginPath();
    ctx.roundRect(22, 22, 348, 76, 16);
    ctx.fill();
    ctx.fillStyle = CH6_STYLE.text;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText('Chapitre 6 — Système de blocs', 42, 51);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`Gravité : ${gravityDirection === 1 ? 'bas' : 'haut'} · blocs cyan mobiles`, 42, 75);
    ctx.restore();
}

function ch6DrawPlayer() {
    const frame = getCurrentWalkFrame();
    if (!frame?.complete) return;

    const attachOffset = gravityDirection === -1 && typeof INVERTED_PLAYER_ATTACH_OFFSET !== 'undefined'
        ? INVERTED_PLAYER_ATTACH_OFFSET
        : 0;
    const visualOffset = typeof PLAYER_VISUAL_Y_OFFSET !== 'undefined' ? PLAYER_VISUAL_Y_OFFSET : 0;

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2 + visualOffset - attachOffset);
    ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
    ctx.drawImage(frame, -player.width / 2, -player.height / 2, player.width, player.height);
    ctx.restore();
}

const ch6OriginalDraw = draw;
draw = function patchedChapter6Draw() {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState === 'MENU') {
        ch6OriginalDraw();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme = getTheme(CHAPTER_6_LEVEL_ID);
    const bgImg = theme.background;
    const flagImg = theme.flag;

    if (bgImg && bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'GAME_OVER' ? 'blur(5px) brightness(0.45)' : 'blur(4px) brightness(0.68)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    platforms.forEach(p => {
        if (p.renderMode === 'ch6-floor') ch6DrawFloor(p);
    });
    ch6FixedBlocks.forEach(ch6DrawBlock);
    ch6MovableBlocks.forEach(ch6DrawBlock);
    ch6Hazards.forEach(ch6DrawHazard);

    if (flagImg && flagImg.complete) {
        const offset = typeof FLAG_VISUAL_Y_OFFSET !== 'undefined' ? FLAG_VISUAL_Y_OFFSET : 0;
        ctx.drawImage(flagImg, goal.x, goal.y + offset, goal.w, goal.h);
    }

    ch6DrawButton();
    ch6DrawHud();
    ch6DrawPlayer();
};

function ch6PointInButton(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const b = ch6ButtonRect;
    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

function ch6HandlePointer(clientX, clientY, event) {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState !== 'PLAYING') return;
    if (!ch6PointInButton(clientX, clientY)) return;
    event.preventDefault();
    ch6FlipGravity();
}

canvas.addEventListener('click', event => ch6HandlePointer(event.clientX, event.clientY, event));
canvas.addEventListener('touchstart', event => {
    const touch = event.touches && event.touches[0];
    if (touch) ch6HandlePointer(touch.clientX, touch.clientY, event);
}, { passive: false });

window.addEventListener('keydown', event => {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState !== 'PLAYING') return;
    if (event.code !== 'Space') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    ch6FlipGravity();
}, true);
