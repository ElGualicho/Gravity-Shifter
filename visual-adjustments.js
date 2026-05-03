// visual-adjustments.js
// Ajustements visuels fins (offsets sprites).
// La physique, les hitbox et les vitesses restent inchangées dans game.js.

const PLAYER_VISUAL_Y_OFFSET       = 10;
const PICS_VISUAL_Y_OFFSET         = 9;
const FLAG_VISUAL_Y_OFFSET         = 15;
const INVERTED_PLAYER_ATTACH_OFFSET = 26;
const INVERTED_PICS_ATTACH_OFFSET   = 22;

// Remplace la draw() définie dans game.js par une version avec offsets visuels.
const _gameJsDraw = draw;
draw = function drawWithVisualAdjustments() {
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
            const dx           = h.x + i * CRYSTAL_W;
            const attachOffset = h.side === 'top' ? INVERTED_PICS_ATTACH_OFFSET : 0;
            const dy           = h.y + PICS_VISUAL_Y_OFFSET - attachOffset;
            ctx.save();
            if (h.side === 'top') {
                ctx.translate(dx + CRYSTAL_W / 2, dy + CRYSTAL_H / 2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -CRYSTAL_W / 2, -CRYSTAL_H / 2, CRYSTAL_W, CRYSTAL_H);
            } else {
                ctx.drawImage(picsImg, dx, dy, CRYSTAL_W, CRYSTAL_H);
            }
            ctx.restore();
        }
    });

    if (flagImg && flagImg.complete)
        ctx.drawImage(flagImg, goal.x, goal.y + FLAG_VISUAL_Y_OFFSET, goal.w, goal.h);

    const playerFrame = getCurrentWalkFrame();
    if (playerFrame && playerFrame.complete) {
        const attachOffset = gravityDirection === -1 ? INVERTED_PLAYER_ATTACH_OFFSET : 0;
        ctx.save();
        ctx.translate(
            player.x + player.width  / 2,
            player.y + player.height / 2 + PLAYER_VISUAL_Y_OFFSET - attachOffset
        );
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(playerFrame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
};
