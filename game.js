const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ÉTATS DU JEU ---
let gameState = 'MENU';
let currentLevel = 1;
let gravity = 0.5;
let gravityDirection = 1;
let keys = {};

// --- CONFIGURATION ---
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resizeCanvas(); loadLevel(currentLevel); });
resizeCanvas();

// --- ASSETS ---
let imagesLoaded = 0;

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
backgroundImg.onload = () => imagesLoaded++;

const platImg = new Image();
platImg.src = 'assets/platform1.png';
platImg.onload = () => imagesLoaded++;

const flagImg = new Image();
flagImg.src = 'assets/flag.png';
flagImg.onload = () => imagesLoaded++;

const picsImg = new Image();
picsImg.src = 'assets/pics.png';
picsImg.onload = () => imagesLoaded++;

const walkFrames = [];
['walk1.png', 'walk2.png', 'walk3.png', 'walk4.png'].forEach((name, i) => {
    const img = new Image();
    img.src = `assets/${name}`;
    img.onload = () => imagesLoaded++;
    walkFrames[i] = img;
});

// Taille du joueur
const PLAYER_W = 75;
const PLAYER_H = 95;

// Taille naturelle des cristaux (proportions d'origine)
const CRYSTAL_W = 65;
const CRYSTAL_H = 70;

const player = {
    x: 100, y: 300,
    width: PLAYER_W, height: PLAYER_H,
    speed: 10,          // Vitesse augmentée
    velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
    isMoving: false, facingRight: true
};

let platforms = [];
let hazards = [];
let goal = { x: 0, y: 0, w: 100, h: 110 };

// --- NIVEAUX ---
function loadLevel(lv) {
    keys = {};
    player.velY = 0;
    gravityDirection = 1;
    currentLevel = lv;

    const floorY = canvas.height - 65;
    const CEIL_Y  = 40;   // y des plateformes plafond
    const CEIL_H  = 55;   // hauteur des plateformes plafond

    // Plateforme sol (collision, non dessinée individuellement)
    const floorPlat = { x: 0, y: floorY, w: canvas.width * 2, h: 100, isFloor: true };

    player.x = 100;
    player.y = floorY - PLAYER_H - 2;

    if (lv === 1) {
        // ─── NIVEAU 1 : 2 flips ─────────────────────────────────────────
        // Plafond → passer zone 1 → sol → plafond → passer zone 2 → goal
        platforms = [
            floorPlat,
            { x: 210, y: CEIL_Y, w: 300, h: CEIL_H },   // Plafond 1
            { x: 640, y: CEIL_Y, w: 280, h: CEIL_H },   // Plafond 2
            { x: 1000, y: CEIL_Y, w: 260, h: CEIL_H },  // Plafond 3
        ];
        hazards = [
            { x: 255, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 670, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 1020, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
        ];
        goal.x = canvas.width - 180;
        goal.y = floorY - 110;

    } else if (lv === 2) {
        // ─── NIVEAU 2 : 4 flips + cristaux plafond ──────────────────────
        // Plafonds plus courts, obstacles au plafond entre les plateformes
        platforms = [
            floorPlat,
            { x: 170, y: CEIL_Y, w: 240, h: CEIL_H },
            { x: 530, y: CEIL_Y, w: 210, h: CEIL_H },
            { x: 840, y: CEIL_Y, w: 210, h: CEIL_H },
            { x: 1130, y: CEIL_Y, w: 210, h: CEIL_H },
        ];
        hazards = [
            // Sol
            { x: 210, y: floorY - CRYSTAL_H, w: 4 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 560, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 860, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 1150, y: floorY - CRYSTAL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            // Plafond : entre les plateformes, force à redescendre
            { x: 410, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
            { x: 750, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
            { x: 1060, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
        ];
        goal.x = canvas.width - 180;
        goal.y = floorY - 110;

    } else {
        // ─── NIVEAU 3 : 5 flips, obstacles denses ───────────────────────
        platforms = [
            floorPlat,
            { x: 140, y: CEIL_Y, w: 210, h: CEIL_H },
            { x: 450, y: CEIL_Y, w: 190, h: CEIL_H },
            { x: 750, y: CEIL_Y, w: 190, h: CEIL_H },
            { x: 1040, y: CEIL_Y, w: 200, h: CEIL_H },
            { x: 1330, y: CEIL_Y, w: 180, h: CEIL_H },
        ];
        hazards = [
            // Sol (dense)
            { x: 185, y: floorY - CRYSTAL_H, w: 4 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 485, y: floorY - CRYSTAL_H, w: 4 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 785, y: floorY - CRYSTAL_H, w: 4 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 1080, y: floorY - CRYSTAL_H, w: 4 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            { x: 1360, y: floorY - CRYSTAL_H, w: 3 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' },
            // Plafond (dense)
            { x: 350, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
            { x: 640, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
            { x: 940, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
            { x: 1230, y: CEIL_Y + CEIL_H, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'top' },
        ];
        goal.x = canvas.width - 160;
        goal.y = floorY - 110;
    }
}

// --- SOL EN TILING ---
function drawStaticFloor() {
    if (!platImg.complete || platImg.naturalWidth === 0) return;
    const tileW = platImg.naturalWidth;
    const tileH = 65;
    const yPos  = canvas.height - tileH;
    for (let x = 0; x < canvas.width; x += tileW) {
        ctx.drawImage(platImg, x, yPos, tileW, tileH);
    }
}

// --- MENU ---
function showMenu() {
    gameState = 'MENU';
    document.getElementById('gameMenu').style.display = 'block';
}

function startGame(lv) {
    document.getElementById('gameMenu').style.display = 'none';
    gameState = 'PLAYING';
    loadLevel(lv);
}

function resetGame(msg) {
    if (msg) alert(msg);
    loadLevel(currentLevel);
}

// --- BOUCLE PRINCIPALE ---
function update() {
    if (gameState !== 'PLAYING') { draw(); requestAnimationFrame(update); return; }

    let nextX = player.x;
    player.isMoving = false;
    if (keys['ArrowRight']) { nextX += player.speed; player.isMoving = true; player.facingRight = true; }
    if (keys['ArrowLeft'])  { nextX -= player.speed; player.isMoving = true; player.facingRight = false; }

    // Collision horizontale
    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x + p.w && nextX + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) canMoveX = false;
    });
    if (canMoveX) player.x = nextX;

    // Animation
    if (player.isMoving && player.onSurface) {
        player.currentFrame = (player.currentFrame + player.animationSpeed) % walkFrames.length;
    } else {
        player.currentFrame = 0;
    }

    // Bornes
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Gravité + collision verticale
    player.velY += gravity * gravityDirection;
    player.y += player.velY;
    player.onSurface = false;

    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY >= 0) { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y + p.h;          player.velY = 0; }
            } else {
                if (player.velY <= 0) { player.y = p.y + p.h;          player.velY = 0; player.onSurface = true; }
                else                  { player.y = p.y - player.height; player.velY = 0; }
            }
        }
    });

    // Piques
    hazards.forEach(h => {
        if (player.x < h.x + h.w && player.x + player.width > h.x &&
            player.y < h.y + h.h && player.y + player.height > h.y) {
            resetGame("Le Néant vous a rattrapé...");
        }
    });

    // Sortie écran
    if (player.y < -200 || player.y > canvas.height + 200) {
        resetGame("Perdu dans l'éther...");
    }

    // Objectif
    if (player.x < goal.x + goal.w && player.x + player.width > goal.x &&
        player.y < goal.y + goal.h && player.y + player.height > goal.y) {
        if (currentLevel < 3) {
            alert(`Niveau ${currentLevel} réussi !`);
            loadLevel(currentLevel + 1);
        } else {
            alert("Incroyable ! Vous êtes le Maître de la Gravité !");
            showMenu();
        }
    }

    draw();
    requestAnimationFrame(update);
}

// --- RENDU ---
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

    // Plateformes (hors sol)
    platforms.forEach(p => {
        if (p.isFloor) return;
        if (platImg.complete) ctx.drawImage(platImg, p.x, p.y, p.w, p.h);
    });

    // Cristaux — toujours à leur taille naturelle (CRYSTAL_W x CRYSTAL_H)
    hazards.forEach(h => {
        if (!picsImg.complete) return;
        const count = Math.ceil(h.w / CRYSTAL_W);
        for (let i = 0; i < count; i++) {
            const drawX = h.x + i * CRYSTAL_W;
            ctx.save();
            if (h.side === 'top') {
                // Accroché au plafond : retourné verticalement
                ctx.translate(drawX + CRYSTAL_W / 2, h.y + CRYSTAL_H / 2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -CRYSTAL_W / 2, -CRYSTAL_H / 2, CRYSTAL_W, CRYSTAL_H);
            } else {
                // Posé au sol : sens normal
                ctx.drawImage(picsImg, drawX, h.y, CRYSTAL_W, CRYSTAL_H);
            }
            ctx.restore();
        }
    });

    // Drapeau
    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    // Joueur
    if (walkFrames[0] && walkFrames[0].complete) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        ctx.drawImage(walkFrames[Math.floor(player.currentFrame)],
            -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "italic 22px 'Palatino Linotype', serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 8; ctx.shadowColor = "black";
    ctx.fillText(`Chapitre ${currentLevel}  •  Espace pour défier les lois`, canvas.width / 2, canvas.height - 20);
    ctx.shadowBlur = 0;
}

// --- CONTRÔLES ---
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

// --- MENU ---
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
