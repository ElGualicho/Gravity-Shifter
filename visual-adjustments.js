// Ajustements visuels fins.
// Les collisions, hitbox, vitesses et gravité restent inchangées.

const PLAYER_VISUAL_Y_OFFSET = 10;
const PICS_VISUAL_Y_OFFSET = 9;
const FLAG_VISUAL_Y_OFFSET = 15;

// En gravité inversée, les sprites doivent visuellement coller à la plateforme du dessus.
const INVERTED_GRAVITY_ATTACH_OFFSET = 15;

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
            const attachOffset = h.side === 'top' ? INVERTED_GRAVITY_ATTACH_OFFSET : 0;
            const dy = h.y + PICS_VISUAL_Y_OFFSET - attachOffset;
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

    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y + FLAG_VISUAL_Y_OFFSET, goal.w, goal.h);

    const playerFrame = getCurrentWalkFrame();
    if (playerFrame?.complete) {
        const attachOffset = gravityDirection === -1 ? INVERTED_GRAVITY_ATTACH_OFFSET : 0;
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2 + PLAYER_VISUAL_Y_OFFSET - attachOffset);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(playerFrame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
}
