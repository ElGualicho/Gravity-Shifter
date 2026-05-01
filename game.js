const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let gameState        = 'MENU';
let currentLevel     = 1;
let gravityDirection = 1;
let keys             = {};

function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', () => { resizeCanvas(); loadLevel(currentLevel); });
resizeCanvas();

// ─── ASSETS ──────────────────────────────────────────────────────────────────
let imagesLoaded = 0;
// Niveaux 1-3 : fond naturel
const backgroundImg    = new Image(); backgroundImg.src    = 'assets/background.png';        backgroundImg.onload    = () => imagesLoaded++;
// Niveau 4 : fond hivernal
const bgWinterImg      = new Image(); bgWinterImg.src      = 'assets/background_winter.png'; bgWinterImg.onload      = () => imagesLoaded++;
// Plateformes
const platImg          = new Image(); platImg.src          = 'assets/platform1.png';         platImg.onload          = () => imagesLoaded++;
const platImg2         = new Image(); platImg2.src         = 'assets/platform2.png';         platImg2.onload         = () => imagesLoaded++;
// Autres
const flagImg          = new Image(); flagImg.src          = 'assets/flag.png';              flagImg.onload          = () => imagesLoaded++;
const picsImg          = new Image(); picsImg.src          = 'assets/pics.png';              picsImg.onload          = () => imagesLoaded++;

// Animation joueur : les 4 frames doivent rester utilisées pendant les déplacements.
const walkFrames       = [];
['walk1.png','walk2.png','walk3.png','walk4.png'].forEach((n, i) => {
    const img = new Image(); img.src = `assets/${n}`; img.onload = () => imagesLoaded++;
    walkFrames[i] = img;
});

// ─── CONSTANTES PHYSIQUE ─────────────────────────────────────────────────────
const PLAYER_W = 75;
const PLAYER_H = 95;
const CRYSTAL_W = 65;
const CRYSTAL_H = 70;
const PLAT_W    = 320;    // Taille fixe des plateformes (taille naturelle des assets)
const PLAT_H    = 60;
const HBOX_MX   = 20;     // Tolérance hitbox cristaux (horizontal)
const HBOX_MY   = 18;     // Tolérance hitbox cristaux (vertical)

// Mouvement fluide
const GRAVITY   = 0.8;    // Accélération gravitationnelle
const MAX_VY    = 13;     // Vitesse terminale verticale (évite les chutes brutales)
const MAX_VX    = 9;      // Vitesse max horizontale
const ACCEL     = 1.3;    // Accélération au démarrage
const FRIC      = 0.78;   // Friction à l'arrêt (douceur de décélération)

const player = {
    x: 100, y: 300, width: PLAYER_W, height: PLAYER_H,
    velX: 0, velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
    isMoving: false, facingRight: true
};

let platforms = [], hazards = [], goal = { x:0, y:0, w:100, h:110 };

// ─── NIVEAUX ─────────────────────────────────────────────────────────────────
//
//  Mécanique : Espace (au sol) → bascule la gravité.
//   dir= 1 → tombe BAS    → pose sur le DESSUS des plateformes
//   dir=-1 → monte HAUT   → accroche au DESSOUS des plateformes
//
//  Structure d'une section :
//   [Entrée] sol libre  → on peut basculer vers la plateforme cible
//   [Cristaux] sol mort → DOIT être en hauteur
//   [Sortie] sol libre  → atterrissage sûr après le basculement
//
//  Niveaux :
//   1 → 2 flips  | sol + plafond (apprentissage)
//   2 → 3 flips  | +1 plateforme milieu
//   3 → 4 flips  | +2 plateformes milieu à hauteurs différentes
//   4 → 5 flips  | thème acier/hiver, 3 plafonds + 1 milieu, cristaux plus denses
//
function loadLevel(lv) {
    keys = {};
    player.velX  = 0;
    player.velY  = 0;
    player.currentFrame = 0;
    player.isMoving = false;
    gravityDirection = 1;
    currentLevel = lv;
    player.x = 100;

    const W      = canvas.width;
    const H      = canvas.height;
    const floorY = H - 65;
    const CEIL_Y = 40;
    const fp     = { x:0, y:floorY, w:W*2, h:100, isFloor:true };
    player.y = floorY - PLAYER_H - 2;

    if (lv === 1) {
        // ── N1 : 2 flips ─────────────────────────────────────────────────────
        const c1x = W * 0.08 | 0,  c2x = W * 0.48 | 0;
        platforms = [ fp,
            { x:c1x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
            { x:c2x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
        ];
        hazards = [
            { x:c1x+80,  y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:c2x+80,  y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
        ];
        goal.x = c2x + PLAT_W + 150;  goal.y = floorY - 110;

    } else if (lv === 2) {
        // ── N2 : 3 flips + 1 milieu ──────────────────────────────────────────
        //  sol → plafond1 → milieu → plafond2 → sol → goal
        const c1x = W*0.07|0,  m1x = W*0.28|0, m1y = H*0.40|0,  c2x = W*0.47|0;
        platforms = [ fp,
            { x:c1x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
            { x:m1x, y:m1y,   w:PLAT_W, h:PLAT_H },
            { x:c2x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
        ];
        hazards = [
            { x:c1x+80,  y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:m1x+40,  y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:c2x+60,  y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            // Cristal plafond en fin de c2 → force un basculement au bon moment
            { x:c2x+250, y:CEIL_Y+PLAT_H,    w:CRYSTAL_W,   h:CRYSTAL_H, side:'top'    },
        ];
        goal.x = c2x + PLAT_W + 150;  goal.y = floorY - 110;

    } else if (lv === 3) {
        // ── N3 : 4 flips + 2 milieux à hauteurs différentes ──────────────────
        //  sol → c1 → milieu1 → c2 → milieu2 → sol → goal
        const c1x = W*0.07|0,
              m1x = W*0.27|0, m1y = H*0.40|0,
              c2x = W*0.46|0,
              m2x = W*0.65|0, m2y = H*0.52|0;
        platforms = [ fp,
            { x:c1x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
            { x:m1x, y:m1y,   w:PLAT_W, h:PLAT_H },
            { x:c2x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },
            { x:m2x, y:m2y,   w:PLAT_W, h:PLAT_H },
        ];
        hazards = [
            { x:c1x+70, y:floorY-CRYSTAL_H, w:3*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:m1x+50, y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:c2x+70, y:floorY-CRYSTAL_H, w:3*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            { x:m2x+50, y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
        ];
        goal.x = m2x + PLAT_W + 20;  goal.y = floorY - 110;

    } else {
        // ── N4 : 5 flips | acier + hiver ─────────────────────────────────────
        //  Thème : platform2 + background_winter
        //  Chemin : sol → c1 → sol → c2 → milieu1 → c3 → sol → goal
        //
        //  Contrainte clé : la plateforme milieu1 bloque l'accès direct à c3
        //  depuis le sol (cristaux g4 barrent le passage en bas). Le joueur
        //  DOIT utiliser c2 → milieu1 → c3 pour progresser.
        const c1x = W*0.06|0,
              c2x = W*0.34|0,
              m1x = W*0.53|0, m1y = H*0.43|0,
              c3x = W*0.65|0;
        platforms = [ fp,
            { x:c1x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },   // Plafond 1
            { x:c2x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },   // Plafond 2
            { x:m1x, y:m1y,   w:PLAT_W, h:PLAT_H },   // Milieu (entre c2 et c3)
            { x:c3x, y:CEIL_Y, w:PLAT_W, h:PLAT_H },   // Plafond 3
        ];
        hazards = [
            // Groupe 1 (sous c1)
            { x:c1x+80, y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            // Groupe 2 (sous c2, 3 cristaux)
            { x:c2x+70, y:floorY-CRYSTAL_H, w:3*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            // Groupe 3 (sol, zone milieu1 → force à l'emprunter)
            { x:m1x+50, y:floorY-CRYSTAL_H, w:2*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
            // Groupe 4 (sous c3, 3 cristaux — finale difficile)
            { x:c3x+70, y:floorY-CRYSTAL_H, w:3*CRYSTAL_W, h:CRYSTAL_H, side:'bottom' },
        ];
        goal.x = c3x + PLAT_W + 20;  goal.y = floorY - 110;
    }
}

// ─── SOL EN TILING ───────────────────────────────────────────────────────────
function drawStaticFloor(img) {
    if (!img.complete || !img.naturalWidth) return;
    const tW = img.naturalWidth, tH = 65, yPos = canvas.height - tH;
    for (let x = 0; x < canvas.width; x += tW) ctx.drawImage(img, x, yPos, tW, tH);
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

// ─── MENU ────────────────────────────────────────────────────────────────────
function showMenu()    { gameState = 'MENU'; document.getElementById('gameMenu').style.display = 'block'; }
function startGame(lv) { document.getElementById('gameMenu').style.display = 'none'; gameState = 'PLAYING'; loadLevel(lv); }
function resetGame(msg){ if (msg) alert(msg); loadLevel(currentLevel); }

// ─── BOUCLE PRINCIPALE ───────────────────────────────────────────────────────
function update() {
    if (gameState !== 'PLAYING') { draw(); requestAnimationFrame(update); return; }

    // ── Mouvement horizontal fluide (accélération + friction) ──
    if (keys['ArrowRight']) {
        player.velX    = Math.min(player.velX + ACCEL, MAX_VX);
        player.facingRight = true;
    } else if (keys['ArrowLeft']) {
        player.velX    = Math.max(player.velX - ACCEL, -MAX_VX);
        player.facingRight = false;
    } else {
        player.velX *= FRIC;
        if (Math.abs(player.velX) < 0.4) player.velX = 0;
    }

    const nextX = player.x + Math.round(player.velX);

    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x+p.w && nextX+player.width > p.x &&
            player.y < p.y+p.h && player.y+player.height > p.y)
            canMoveX = false;
    });
    if (canMoveX) {
        player.x = nextX;
    } else {
        player.velX = 0;   // stop à la collision
    }

    if (player.x < 0)                          { player.x = 0;                          player.velX = 0; }
    if (player.x + player.width > canvas.width) { player.x = canvas.width - player.width; player.velX = 0; }

    // ── Gravité avec vitesse terminale (chute douce et bornée) ──
    player.velY += GRAVITY * gravityDirection;
    player.velY  = Math.max(-MAX_VY, Math.min(MAX_VY, player.velY));
    player.y    += player.velY;
    player.onSurface = false;

    // Collisions verticales
    platforms.forEach(p => {
        if (player.x < p.x+p.w && player.x+player.width > p.x &&
            player.y < p.y+p.h && player.y+player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY >= 0) { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y + p.h;           player.velY = 0; }
            } else {
                if (player.velY <= 0) { player.y = p.y + p.h;           player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y - player.height;  player.velY = 0; }
            }
        }
    });

    // Animation joueur après collisions : on utilise walk1 → walk4 uniquement si le joueur se déplace sur une surface.
    updatePlayerAnimation();

    // Collision cristaux (hitbox réduite)
    hazards.forEach(h => {
        const hx = h.x+HBOX_MX, hw = h.w-2*HBOX_MX;
        const hy = h.y+HBOX_MY, hh = h.h-HBOX_MY;
        const px = player.x+8,  pw = player.width-16;
        const py = player.y+8,  ph = player.height-16;
        if (px < hx+hw && px+pw > hx && py < hy+hh && py+ph > hy)
            resetGame("Le Néant vous a rattrapé...");
    });

    if (player.y < -200 || player.y > canvas.height+200) resetGame("Perdu dans l'éther...");

    // Objectif
    if (player.x < goal.x+goal.w && player.x+player.width > goal.x &&
        player.y < goal.y+goal.h && player.y+player.height > goal.y) {
        if (currentLevel < 4) { alert(`Niveau ${currentLevel} réussi !`); loadLevel(currentLevel+1); }
        else { alert("Incroyable ! Vous êtes le Maître de la Gravité !"); showMenu(); }
    }

    draw();
    requestAnimationFrame(update);
}

// ─── RENDU ───────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Assets selon le niveau
    const bgImg       = currentLevel === 4 ? bgWinterImg : backgroundImg;
    const curPlatImg  = currentLevel === 4 ? platImg2    : platImg;

    if (bgImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'MENU' ? "blur(10px) brightness(0.4)" : "blur(4px) brightness(0.65)";
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (gameState === 'MENU') return;

    // Sol en tiling (image adaptée au niveau)
    drawStaticFloor(curPlatImg);

    // Plateformes flottantes
    platforms.forEach(p => {
        if (p.isFloor) return;
        if (curPlatImg.complete) ctx.drawImage(curPlatImg, p.x, p.y, p.w, p.h);
    });

    // Cristaux — taille naturelle fixe
    hazards.forEach(h => {
        if (!picsImg.complete) return;
        const count = Math.ceil(h.w / CRYSTAL_W);
        for (let i = 0; i < count; i++) {
            const dx = h.x + i * CRYSTAL_W;
            ctx.save();
            if (h.side === 'top') {
                ctx.translate(dx + CRYSTAL_W/2, h.y + CRYSTAL_H/2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -CRYSTAL_W/2, -CRYSTAL_H/2, CRYSTAL_W, CRYSTAL_H);
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
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(playerFrame,
            -player.width/2, -player.height/2, player.width, player.height);
        ctx.restore();
    }

    ctx.fillStyle = "white"; ctx.font = "italic 22px 'Palatino Linotype', serif";
    ctx.textAlign = "center"; ctx.shadowBlur = 8; ctx.shadowColor = "black";
    ctx.fillText(`Chapitre ${currentLevel}  •  Espace pour défier les lois`, canvas.width/2, canvas.height - 20);
    ctx.shadowBlur = 0;
}

// ─── CONTRÔLES ───────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && player.onSurface && gameState === 'PLAYING') {
        gravityDirection *= -1;
        player.onSurface  = false;
        player.velX      *= 0.6;  // légère réduction d'élan lors du flip
        player.y         += gravityDirection * 5;
    }
    if (e.code === 'Escape' && gameState === 'PLAYING') showMenu();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── MENU ────────────────────────────────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', `
<div id="gameMenu" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  text-align:center;background:rgba(0,0,0,0.85);padding:50px;border-radius:20px;
  border:2px solid gold;box-shadow:0 0 20px gold;font-family:'Palatino Linotype',serif;z-index:100;">
  <h1 style="color:gold;margin-bottom:30px;font-size:3em;text-shadow:2px 2px black;">Gravity Wizard</h1>
  <button onclick="startGame(1)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid gold;border-radius:5px;font-size:1.2em;">✨ Nouvelle Partie</button>
  <button onclick="startGame(2)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid #aaa;border-radius:5px;font-size:1.2em;">⚡ Chapitre 2</button>
  <button onclick="startGame(3)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid cyan;border-radius:5px;font-size:1.2em;">🌀 Chapitre 3</button>
  <button onclick="startGame(4)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#333;color:#a8d8ea;border:1px solid #a8d8ea;border-radius:5px;font-size:1.2em;">❄️ Chapitre 4</button>
</div>`);

update();
