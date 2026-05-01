const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let gameState       = 'MENU';
let currentLevel    = 1;
let gravityDirection = 1;
let keys            = {};

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
['walk1.png','walk2.png','walk3.png','walk4.png'].forEach((n,i) => {
    const img = new Image(); img.src = `assets/${n}`; img.onload = () => imagesLoaded++;
    walkFrames[i] = img;
});

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const PLAYER_W    = 75;
const PLAYER_H    = 95;
const CRYSTAL_W   = 65;   // Taille naturelle d'un cristal
const CRYSTAL_H   = 70;
const GRAVITY     = 0.5;
// Marge de tolérance pour les hitbox des cristaux (rend le jeu plus juste)
const HBOX_MX     = 20;   // marge horizontale par cristal
const HBOX_MY     = 18;   // marge verticale (pointe du cristal)

const player = {
    x: 100, y: 300, width: PLAYER_W, height: PLAYER_H,
    speed: 8,              // ← vitesse corrigée
    velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
    isMoving: false, facingRight: true
};

let platforms = [], hazards = [], goal = { x:0, y:0, w:100, h:110 };

// ─── NIVEAUX ─────────────────────────────────────────────────────────────────
//
//  Mécanique centrale :
//    - Gravité normale  (dir= 1) → joueur posé sur le DESSUS des plateformes sol
//    - Gravité inversée (dir=-1) → joueur accroché au DESSOUS des plateformes plafond
//    - Espace (au sol seulement) → bascule de gravité
//
//  Design de chaque segment :
//    [ZONE ENTRÉE] sol libre → joueur peut basculer vers le plafond
//    [CRISTAUX]    sol bloqué → joueur DOIT être au plafond
//    [ZONE SORTIE] sol libre → joueur bascule en retombant sur le sol
//
function loadLevel(lv) {
    keys = {}; player.velY = 0; gravityDirection = 1; currentLevel = lv;
    player.x = 100;

    const W      = canvas.width;
    const H      = canvas.height;
    const floorY = H - 65;        // Hauteur du sol
    const CEIL_Y = 40;            // Hauteur des plateformes plafond
    const CEIL_H = 55;

    const floorPlat = { x:0, y:floorY, w:W*2, h:100, isFloor:true };
    player.y = floorY - PLAYER_H - 2;

    // ── Helpers ──────────────────────────────────────────────────────────────
    // Crée une plateforme plafond et ses cristaux sol associés.
    //   px, pw  : position et largeur de la plateforme
    //   cStart  : % du début des cristaux dans la plateforme (0..1)
    //   cCount  : nombre de cristaux
    function makeCeilPlat(px, pw) {
        return { x: px|0, y: CEIL_Y, w: pw|0, h: CEIL_H };
    }
    function makeFloorCrystals(px, pw, cOffset, cCount) {
        return { x: (px + pw*cOffset)|0, y: floorY - CRYSTAL_H, w: cCount*CRYSTAL_W, h: CRYSTAL_H, side:'bottom' };
    }
    function makeCeilCrystals(px, pw, cOffset, cCount) {
        return { x: (px + pw*cOffset)|0, y: CEIL_Y + CEIL_H, w: cCount*CRYSTAL_W, h: CRYSTAL_H, side:'top' };
    }

    if (lv === 1) {
        // ── NIVEAU 1 : 2 flips ───────────────────────────────────────────────
        //  Aucun cristal plafond. 2 zones cristaux sol.
        //  Schéma : sol → ↑ plafond → ↑ franchir cristaux → ↓ sol → ↑ plafond → ↓ goal
        const p1x = W*0.08|0, p1w = W*0.26|0;   //  8% – 34%
        const p2x = W*0.43|0, p2w = W*0.26|0;   // 43% – 69%

        platforms = [
            floorPlat,
            makeCeilPlat(p1x, p1w),   // Plafond 1
            makeCeilPlat(p2x, p2w),   // Plafond 2
        ];

        // Cristaux au CENTRE-GAUCHE de chaque plateforme (entrée=28%, cristaux=37%, sortie=35%)
        hazards = [
            makeFloorCrystals(p1x, p1w, 0.28, 2),
            makeFloorCrystals(p2x, p2w, 0.28, 2),
        ];

        goal.x = W - 190; goal.y = floorY - 110;

    } else if (lv === 2) {
        // ── NIVEAU 2 : 3 flips + 1 cristal plafond ──────────────────────────
        //  Un cristal plafond au milieu de la 2e plateforme force à basculer
        //  au bon moment (avant d'atteindre le cristal).
        const p1x = W*0.07|0, p1w = W*0.23|0;   //  7% – 30%
        const p2x = W*0.37|0, p2w = W*0.26|0;   // 37% – 63%
        const p3x = W*0.68|0, p3w = W*0.22|0;   // 68% – 90%

        platforms = [
            floorPlat,
            makeCeilPlat(p1x, p1w),
            makeCeilPlat(p2x, p2w),
            makeCeilPlat(p3x, p3w),
        ];

        hazards = [
            // Cristaux sol (légèrement plus larges qu'au niveau 1)
            makeFloorCrystals(p1x, p1w, 0.27, 2),
            makeFloorCrystals(p2x, p2w, 0.22, 2),
            makeFloorCrystals(p3x, p3w, 0.24, 2),
            // Cristal plafond sur p2 (côté droit) → force le basculement avant
            makeCeilCrystals(p2x, p2w, 0.72, 1),
        ];

        goal.x = W - 190; goal.y = floorY - 110;

    } else {
        // ── NIVEAU 3 : 4 flips + cristaux plafond sur 3 plateformes ─────────
        //  Cristaux plafond contraignent le joueur à basculer dans une fenêtre précise.
        const p1x = W*0.06|0, p1w = W*0.20|0;   //  6% – 26%
        const p2x = W*0.32|0, p2w = W*0.20|0;   // 32% – 52%
        const p3x = W*0.58|0, p3w = W*0.20|0;   // 58% – 78%
        const p4x = W*0.83|0, p4w = W*0.13|0;   // 83% – 96%

        platforms = [
            floorPlat,
            makeCeilPlat(p1x, p1w),
            makeCeilPlat(p2x, p2w),
            makeCeilPlat(p3x, p3w),
            makeCeilPlat(p4x, p4w),
        ];

        hazards = [
            // Cristaux sol (3 cristaux = plus difficile)
            makeFloorCrystals(p1x, p1w, 0.20, 2),
            makeFloorCrystals(p2x, p2w, 0.20, 3),
            makeFloorCrystals(p3x, p3w, 0.20, 3),
            makeFloorCrystals(p4x, p4w, 0.18, 2),
            // Cristaux plafond sur p1, p2, p3 (côté droit)
            makeCeilCrystals(p1x, p1w, 0.70, 1),
            makeCeilCrystals(p2x, p2w, 0.68, 1),
            makeCeilCrystals(p3x, p3w, 0.68, 1),
        ];

        goal.x = W - 180; goal.y = floorY - 110;
    }
}

// ─── SOL EN TILING ───────────────────────────────────────────────────────────
function drawStaticFloor() {
    if (!platImg.complete || !platImg.naturalWidth) return;
    const tW = platImg.naturalWidth, tH = 65, yPos = canvas.height - tH;
    for (let x = 0; x < canvas.width; x += tW) ctx.drawImage(platImg, x, yPos, tW, tH);
}

// ─── MENU ────────────────────────────────────────────────────────────────────
function showMenu()   { gameState = 'MENU'; document.getElementById('gameMenu').style.display = 'block'; }
function startGame(lv){ document.getElementById('gameMenu').style.display = 'none'; gameState = 'PLAYING'; loadLevel(lv); }
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

    // Animation marche
    player.currentFrame = (player.isMoving && player.onSurface)
        ? (player.currentFrame + player.animationSpeed) % walkFrames.length
        : 0;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Gravité
    player.velY += GRAVITY * gravityDirection;
    player.y    += player.velY;
    player.onSurface = false;

    // Collision verticale avec les plateformes
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

    // Collision cristaux — hitbox réduite (plus indulgente)
    hazards.forEach(h => {
        const hx  = h.x  + HBOX_MX,      hw = h.w - 2*HBOX_MX;
        const hy  = h.y  + HBOX_MY,      hh = h.h -   HBOX_MY;
        const px  = player.x  + 8,       pw = player.width  - 16;
        const py  = player.y  + 8,       ph = player.height - 16;
        if (px < hx+hw && px+pw > hx && py < hy+hh && py+ph > hy)
            resetGame("Le Néant vous a rattrapé...");
    });

    // Mort hors écran
    if (player.y < -200 || player.y > canvas.height + 200) resetGame("Perdu dans l'éther...");

    // Objectif atteint
    if (player.x < goal.x+goal.w && player.x+player.width > goal.x &&
        player.y < goal.y+goal.h && player.y+player.height > goal.y) {
        if (currentLevel < 3) { alert(`Niveau ${currentLevel} réussi !`); loadLevel(currentLevel+1); }
        else                  { alert("Incroyable ! Vous êtes le Maître de la Gravité !"); showMenu(); }
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

    // Plateformes plafond
    platforms.forEach(p => {
        if (p.isFloor) return;
        if (platImg.complete) ctx.drawImage(platImg, p.x, p.y, p.w, p.h);
    });

    // Cristaux — rendu à taille naturelle, jamais étirés
    hazards.forEach(h => {
        if (!picsImg.complete) return;
        const count = Math.ceil(h.w / CRYSTAL_W);
        for (let i = 0; i < count; i++) {
            const dx = h.x + i*CRYSTAL_W;
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

    // Drapeau
    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    // Joueur
    if (walkFrames[0]?.complete) {
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y + player.height/2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(walkFrames[Math.floor(player.currentFrame)],
            -player.width/2, -player.height/2, player.width, player.height);
        ctx.restore();
    }

    // HUD
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

// ─── MENU HTML ───────────────────────────────────────────────────────────────
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
