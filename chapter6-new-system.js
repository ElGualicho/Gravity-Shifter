/**
 * chapter6-new-system.js
 * Ajout isolé du chapitre 6 : nouveau système de blocs monochromes de test.
 * Le moteur principal reste inchangé : on réutilise les collisions rectangulaires existantes.
 */

const CHAPTER_6_LEVEL_ID = 6;
const CHAPTER_6_THEME = 'steel';
const CHAPTER_6_BLOCK_STYLE = {
    fill: 'rgba(218, 222, 230, 0.94)',
    stroke: 'rgba(33, 38, 52, 0.95)',
    highlight: 'rgba(255, 255, 255, 0.22)',
    shadow: 'rgba(0, 0, 0, 0.16)'
};

if (typeof levelThemes !== 'undefined') {
    levelThemes[CHAPTER_6_LEVEL_ID] = CHAPTER_6_THEME;
}

function makeChapter6Block(x, y, w, h, role = 'solid') {
    return {
        x,
        y,
        w,
        h,
        role,
        renderMode: 'chapter6-test-block'
    };
}

function buildLevel6NewSystem(W, H, floorY, CEIL_Y) {
    const thinH = 34;
    const blockH = 72;

    const startShelfX = W * 0.10 | 0;
    const upperShelfX = W * 0.24 | 0;
    const gateX = W * 0.43 | 0;
    const lowerShelfX = W * 0.54 | 0;
    const finalCeilX = W * 0.70 | 0;
    const finalStopX = W * 0.82 | 0;

    const upperY = H * 0.18 | 0;
    const midY = H * 0.43 | 0;
    const lowY = H * 0.66 | 0;

    platforms = [
        makeFloor(W, floorY),

        // Séquence pensée en puzzle : sol → bloc bas → plafond → bloc haut → sol → plafond → sortie.
        makeChapter6Block(startShelfX, lowY, 210, thinH, 'thin-platform'),
        makeChapter6Block(upperShelfX, CEIL_Y, 260, thinH, 'ceiling-platform'),
        makeChapter6Block(gateX, midY, 92, blockH * 2, 'vertical-stop'),
        makeChapter6Block(gateX + 92, upperY, 260, thinH, 'upper-platform'),
        makeChapter6Block(lowerShelfX, lowY, 240, thinH, 'lower-platform'),
        makeChapter6Block(finalCeilX, CEIL_Y, 230, thinH, 'ceiling-platform'),
        makeChapter6Block(finalStopX, midY, 130, blockH, 'final-stop')
    ];

    hazards = [
        { x: startShelfX + 40, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: upperShelfX + 70, y: CEIL_Y + thinH,     w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'    },
        { x: gateX - 30,       y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: lowerShelfX + 70, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        { x: finalCeilX + 45,  y: CEIL_Y + thinH,     w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top'    }
    ];

    goal.x = Math.min(finalStopX + 155, W - goal.w - 45);
    goal.y = floorY - 110;
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
    gravityDirection = 1;
    currentLevel = lv;
    player.x = 100;

    const W = canvas.width;
    const H = canvas.height;
    const floorH = getTheme(lv).floorHeight;
    const floorY = H - floorH;
    const CEIL_Y = 40;

    player.y = floorY - PLAYER_H - 2;
    buildLevel6NewSystem(W, H, floorY, CEIL_Y);
};

function drawChapter6Block(block) {
    ctx.save();
    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.shadow;
    ctx.fillRect(block.x + 5, block.y + 6, block.w, block.h);

    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.fill;
    ctx.strokeStyle = CHAPTER_6_BLOCK_STYLE.stroke;
    ctx.lineWidth = 2;
    ctx.fillRect(block.x, block.y, block.w, block.h);
    ctx.strokeRect(block.x, block.y, block.w, block.h);

    ctx.fillStyle = CHAPTER_6_BLOCK_STYLE.highlight;
    ctx.fillRect(block.x + 2, block.y + 2, Math.max(0, block.w - 4), Math.min(8, block.h - 4));
    ctx.restore();
}

const originalDraw = draw;
draw = function patchedDraw() {
    if (currentLevel !== CHAPTER_6_LEVEL_ID || gameState === 'MENU') {
        originalDraw();
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const theme = getTheme();
    const bgImg = theme.background;
    const picsImg = theme.pics;
    const flagImg = theme.flag;

    if (bgImg && bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'GAME_OVER'
            ? 'blur(5px) brightness(0.45)'
            : 'blur(4px) brightness(0.65)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    drawStaticFloor();

    platforms.forEach(p => {
        if (p.isFloor) return;
        if (p.renderMode === 'chapter6-test-block') drawChapter6Block(p);
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
};
