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
const backgroundImg = new Image(); backgroundImg.src = 'assets/background.png'; backgroundImg.onload = () => imagesLoaded++;
const platImg       = new Image(); platImg.src       = 'assets/platform1.png';  platImg.onload       = () => imagesLoaded++;
const flagImg       = new Image(); flagImg.src       = 'assets/flag.png';       flagImg.onload       = () => imagesLoaded++;
const picsImg       = new Image(); picsImg.src       = 'assets/pics.png';       picsImg.onload       = () => imagesLoaded++;
const walkFrames    = [];
['walk1.png','walk2.png','walk3.png','walk4.png'].forEach((n, i) => {
    const img = new Image(); img.src = `assets/${n}`; img.onload = () => imagesLoaded++;
    walkFrames[i] = img;
});

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const PLAYER_W  = 75;
const PLAYER_H  = 95;
const CRYSTAL_W = 65;     // Taille naturelle d'un cristal
const CRYSTAL_H = 70;
const GRAVITY   = 0.8;    // ← chute plus rapide / dynamique
const PLAT_W    = 320;    // Taille d'origine de platform1.png (fixe, jamais étiré)
const PLAT_H    = 60;
const HBOX_MX   = 20;     // Marge hitbox cristaux (horizontal)
const HBOX_MY   = 18;     // Marge hitbox cristaux (vertical – pointe)

const player = {
    x: 100, y: 300, width: PLAYER_W, height: PLAYER_H,
    speed: 9,
    velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
    isMoving: false, facingRight: true
};

let platforms = [], hazards = [], goal = { x:0, y:0, w:100, h:110 };

// ─── NIVEAUX ─────────────────────────────────────────────────────────────────
//
//  Mécanique : Espace (au sol) bascule la gravité.
//   dir= 1 → joueur tombe vers le BAS  → posé sur le DESSUS des plateformes
//   dir=-1 → joueur monte vers le HAUT → accroché au DESSOUS des plateformes
//
//  Chaque section est structurée :
//   [Entrée] sol libre → joueur peut basculer vers la plateforme cible
//   [Cristaux] sol bloqué → joueur DOIT être en hauteur
//   [Sortie] sol libre → joueur bascule vers le bas et atterrit sans danger
//
//  Niveaux :
//   1 → 2 flips, sol + plafond seulement (apprentissage)
//   2 → 3 flips, +1 plateforme milieu (nouvel outil)
//   3 → 4 flips, +2 plateformes milieu à hauteurs différentes (maîtrise)
//
function loadLevel(lv) {
    keys = {};
    player.velY = 0;
    gravityDirection = 1;
    currentLevel = lv;
    player.x = 100;

    const W      = canvas.width;
    const H      = canvas.height;
    const floorY = H - 65;
    const CEIL_Y = 40;

    const fp = { x:0, y:floorY, w:W*2, h:100, isFloor:true };
    player.y = floorY - PLAYER_H - 2;

    if (lv === 1) {
        // ── NIVEAU 1 : 2 flips, pas de plateforme milieu ─────────────────────
        const c1x = W * 0.08 | 0;
        const c2x = W * 0.48 | 0;

        platforms = [
            fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },  // Plafond 1
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },  // Plafond 2
        ];

        // Cristaux à ~25% dans chaque plat → large zone d'entrée ET de sortie
        hazards = [
            { x: c1x + 80, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: c2x + 80, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
        ];

        goal.x = c2x + PLAT_W + 150;
        goal.y = floorY - 110;

    } else if (lv === 2) {
        // ── NIVEAU 2 : 3 flips + 1 plateforme milieu ─────────────────────────
        //  Schéma : sol → plafond1 → MILIEU → plafond2 → sol → goal
        //  Un cristal plafond en fin de plafond2 oblige à basculer au bon moment.
        const c1x = W * 0.07 | 0;
        const m1x = W * 0.28 | 0;  const m1y = H * 0.40 | 0;
        const c2x = W * 0.47 | 0;

        platforms = [
            fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },   // Plafond 1
            { x: m1x, y: m1y,   w: PLAT_W, h: PLAT_H },   // Milieu 1
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },   // Plafond 2
        ];

        hazards = [
            // Cristaux sol
            { x: c1x + 80, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: m1x + 40, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: c2x + 60, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            // Cristal plafond (fin de c2) → force un basculement vers le sol AVANT la fin
            { x: c2x + 250, y: CEIL_Y + PLAT_H, w: CRYSTAL_W, h: CRYSTAL_H, side:'top' },
        ];

        goal.x = c2x + PLAT_W + 150;
        goal.y = floorY - 110;

    } else {
        // ── NIVEAU 3 : 4 flips + 2 plateformes milieu ────────────────────────
        //  Schéma : sol → plafond1 → milieu1 → plafond2 → milieu2 → sol → goal
        //  Milieu1 et milieu2 sont à des hauteurs différentes pour varier la navigation.
        const c1x = W * 0.07 | 0;
        const m1x = W * 0.27 | 0;  const m1y = H * 0.40 | 0;   // ~40% hauteur écran
        const c2x = W * 0.46 | 0;
        const m2x = W * 0.65 | 0;  const m2y = H * 0.52 | 0;   // ~52% hauteur écran (plus bas)

        platforms = [
            fp,
            { x: c1x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: m1x, y: m1y,   w: PLAT_W, h: PLAT_H },
            { x: c2x, y: CEIL_Y, w: PLAT_W, h: PLAT_H },
            { x: m2x, y: m2y,   w: PLAT_W, h: PLAT_H },
        ];

        hazards = [
            // Cristaux sol (groupes de 3 = plus difficile)
            { x: c1x + 70, y: floorY - CRYSTAL_H, w: 3*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: m1x + 50, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: c2x + 70, y: floorY - CRYSTAL_H, w: 3*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
            { x: m2x + 50, y: floorY - CRYSTAL_H, w: 2*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' },
        ];

        // Goal juste après la fin de m2 (joueur tombe de m2 → atterrit → goal)
        goal.x = m2x + PLAT_W + 20;
        goal.y = floorY - 110;
    }
}

// ─── SOL EN TILING (taille naturelle, jamais étiré) ──────────────────────────
function drawStaticFloor() {
    if (!platImg.complete || !platImg.naturalWidth) return;
    const tW = platImg.naturalWidth, tH = 65, yPos = canvas.height - tH;
    for (let x = 0; x < canvas.width; x += tW) ctx.drawImage(platImg, x, yPos, tW, tH);
}

// ─── MENU ────────────────────────────────────────────────────────────────────
function showMenu()    { gameState = 'MENU'; document.getElementById('gameMenu').style.display = 'block'; }
function startGame(lv) { document.getElementById('gameMenu').style.display = 'none'; gameState = 'PLAYING'; loadLevel(lv); }
function resetGame(msg){ if (msg) alert(msg); loadLevel(currentLevel); }

// ─── BOUCLE PRINCIPALE ───────────────────────────────────────────────────────
function update() {
    if (gameState !== 'PLAYING') { draw(); requestAnimationFrame(update); return; }

    // Déplacement horizontal
    let nextX = player.x;
    player.isMoving = false;
    if (keys['ArrowRight']) { nextX += player.speed; player.isMoving = true; player.facingRight = true;  }
    if (keys['ArrowLeft'])  { nextX -= player.speed; player.isMoving = true; player.facingRight = false; }

    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x+p.w && nextX+player.width > p.x && player.y < p.y+p.h && player.y+player.height > p.y)
            canMoveX = false;
    });
    if (canMoveX) player.x = nextX;

    // Animation
    player.currentFrame = (player.isMoving && player.onSurface)
        ? (player.currentFrame + player.animationSpeed) % walkFrames.length
        : 0;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Gravité
    player.velY += GRAVITY * gravityDirection;
    player.y    += player.velY;
    player.onSurface = false;

    // Collisions verticales
    platforms.forEach(p => {
        if (player.x < p.x+p.w && player.x+player.width > p.x && player.y < p.y+p.h && player.y+player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY >= 0) { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y + p.h;           player.velY = 0; }
            } else {
                if (player.velY <= 0) { player.y = p.y + p.h;           player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y - player.height;  player.velY = 0; }
            }
        }
    });

    // Collision cristaux (hitbox réduite = plus indulgente)
    hazards.forEach(h => {
        const hx = h.x + HBOX_MX,      hw = h.w - 2*HBOX_MX;
        const hy = h.y + HBOX_MY,      hh = h.h -   HBOX_MY;
        const px = player.x  + 8,      pw = player.width  - 16;
        const py = player.y  + 8,      ph = player.height - 16;
        if (px < hx+hw && px+pw > hx && py < hy+hh && py+ph > hy)
            resetGame("Le Néant vous a rattrapé...");
    });

    // Mort hors écran
    if (player.y < -200 || player.y > canvas.height + 200) resetGame("Perdu dans l'éther...");

    // Objectif
    if (player.x < goal.x+goal.w && player.x+player.width > goal.x &&
        player.y < goal.y+goal.h && player.y+player.height > goal.y) {
        if (currentLevel < 3) { alert(`Niveau ${currentLevel} réussi !`); loadLevel(currentLevel+1); }
        else { alert("Incroyable ! Vous êtes le Maître de la Gravité !"); showMenu(); }
    }

    draw();
    requestAnimationFrame(update);
}

// ─── RENDU ───────────────────────────────────────────────────────────────────
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'MENU' ? "blur(10px) brightness(0.4)" : "blur(4px) brightness(0.65)";
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (gameState === 'MENU') return;

    drawStaticFloor();

    // Plateformes (plafond + milieu) — taille fixe PLAT_W × PLAT_H
    platforms.forEach(p => {
        if (p.isFloor) return;
        if (platImg.complete) ctx.drawImage(platImg, p.x, p.y, p.w, p.h);
    });

    // Cristaux — toujours à leur taille naturelle (CRYSTAL_W × CRYSTAL_H), jamais étirés
    hazards.forEach(h => {
        if (!picsImg.complete) return;
        const count = Math.ceil(h.w / CRYSTAL_W);
        for (let i = 0; i < count; i++) {
            const dx = h.x + i * CRYSTAL_W;
            ctx.save();
            if (h.side === 'top') {
                // Cristal plafond : retourné verticalement
                ctx.translate(dx + CRYSTAL_W/2, h.y + CRYSTAL_H/2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -CRYSTAL_W/2, -CRYSTAL_H/2, CRYSTAL_W, CRYSTAL_H);
            } else {
                // Cristal sol : sens normal
                ctx.drawImage(picsImg, dx, h.y, CRYSTAL_W, CRYSTAL_H);
            }
            ctx.restore();
        }
    });

    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    if (walkFrames[0]?.complete) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(walkFrames[Math.floor(player.currentFrame)],
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
        player.onSurface = false;
        player.y += gravityDirection * 5;
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
</div>`);

update();
