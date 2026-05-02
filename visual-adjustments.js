// Ajustements visuels fins : sprites légèrement descendus et suppression du texte bas d'écran.
// Les collisions restent inchangées.

const SPRITE_VISUAL_Y_OFFSET = 7;
const FLAG_VISUAL_Y_OFFSET = 10;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgImg = currentLevel === 4 ? bgWinterImg : backgroundImg;
    const curPlatImg = currentLevel === 4 ? platImg2 : platImg;
    const curFloorImg = currentLevel === 4 ? floorWinterImg : curPlatImg;

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
            const dy = h.y + SPRITE_VISUAL_Y_OFFSET;
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
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2 + SPRITE_VISUAL_Y_OFFSET);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(playerFrame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }
}
