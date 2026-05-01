// Patch de rendu du sol hiver.
// L'asset floor_winter.png est beaucoup plus haut que l'ancien sol de 65px.
// On croppe la partie basse de l'image et on l'affiche plus haut pour qu'elle soit visible.

const ORIGINAL_DRAW_STATIC_FLOOR = drawStaticFloor;

function drawStaticFloor(img) {
    if (!img.complete || !img.naturalWidth) return;

    const isWinterFloor = img.src.includes('floor_winter.png');

    if (!isWinterFloor) {
        ORIGINAL_DRAW_STATIC_FLOOR(img);
        return;
    }

    const sourceHeight = Math.min(280, img.naturalHeight);
    const sourceY = img.naturalHeight - sourceHeight;
    const drawHeight = 135;
    const drawY = canvas.height - drawHeight;
    const tileWidth = img.naturalWidth;

    for (let x = 0; x < canvas.width; x += tileWidth) {
        ctx.drawImage(
            img,
            0,
            sourceY,
            img.naturalWidth,
            sourceHeight,
            x,
            drawY,
            tileWidth,
            drawHeight
        );
    }
}
