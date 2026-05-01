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

// --- CHARGEMENT DES ASSETS ---
let imagesLoaded = 0;

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
backgroundImg.onload = () => imagesLoaded++;

const platImg = new Image();
platImg.src = 'assets/platform1.png';
platImg.onload = () => imagesLoaded++;

const floorImg = new Image();
floorImg.src = 'assets/platform1.png'; // Même asset pour le sol

const flagImg = new Image();
flagImg.src = 'assets/flag.png';
flagImg.onload = () => imagesLoaded++;

const picsImg = new Image();
picsImg.src = 'assets/pics.png';
picsImg.onload = () => imagesLoaded++;

const walkFrames = [];
const frameNames = ['walk1.png', 'walk2.png', 'walk3.png', 'walk4.png'];
frameNames.forEach((name, index) => {
    const img = new Image();
    img.src = `assets/${name}`;
    img.onload = () => imagesLoaded++;
    walkFrames[index] = img;
});

// Taille du joueur : plus grand et proportionné (ratio ~0.75 largeur/hauteur)
const PLAYER_W = 75;
const PLAYER_H = 95;

const player = {
    x: 100, y: 200,
    width: PLAYER_W, height: PLAYER_H,
    speed: 6, velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.18,
    isMoving: false, facingRight: true
};

let platforms = [];
let hazards = [];
let goal = { x: 0, y: 0, w: 100, h: 110 };

// --- LOGIQUE DES NIVEAUX ---
function loadLevel(lv) {
    keys = {};
    player.velY = 0;
    gravityDirection = 1;
    currentLevel = lv;

    const floorY = canvas.height - 65;
    // Le sol est une plateforme de collision invisible (le rendu est fait en tiling)
    const floorPlatform = { x: 0, y: floorY, w: canvas.width * 2, h: 100 };

    player.x = 100;

    if (lv === 1) {
        player.y = floorY - PLAYER_H - 5;
        platforms = [
            floorPlatform,
            { x: 300, y: floorY - 160, w: 220, h: 55 },
            { x: 620, y: floorY - 280, w: 200, h: 55 },
            { x: 950, y: floorY - 160, w: 220, h: 55 },
            { x: 1250, y: floorY - 300, w: 200, h: 55 },
        ];
        hazards = [
            { x: 530, y: floorY - 55, w: 90, h: 60, side: 'bottom' },
            { x: 850, y: floorY - 55, w: 100, h: 60, side: 'bottom' },
        ];
        goal.x = canvas.width - 180;
        goal.y = floorY - 110;

    } else if (lv === 2) {
        player.y = floorY - PLAYER_H - 5;
        platforms = [
            floorPlatform,
            { x: 280, y: floorY - 200, w: 180, h: 55 },
            { x: 560, y: 80, w: 160, h: 55 },           // Plat haut (nécessite gravity flip)
            { x: 820, y: floorY - 230, w: 180, h: 55 },
            { x: 1080, y: 100, w: 160, h: 55 },          // Plat haut (nécessite gravity flip)
            { x: 1340, y: floorY - 180, w: 180, h: 55 },
        ];
        hazards = [
            { x: 460, y: floorY - 55, w: 100, h: 60, side: 'bottom' },
            { x: 720, y: floorY - 55, w: 100, h: 60, side: 'bottom' },
            { x: 560, y: 135, w: 160, h: 55, side: 'top' },   // Piques sous le plat du haut
            { x: 1080, y: 155, w: 160, h: 55, side: 'top' },
        ];
        goal.x = canvas.width - 180;
        goal.y = floorY - 110;

    } else if (lv === 3) {
        // Niveau 3 : parcours complet avec allers-retours gravité, chaque section franchissable
        player.y = floorY - PLAYER_H - 5;
        platforms = [
            floorPlatform,
            // Bloc 1 : première montée
            { x: 250, y: floorY - 180, w: 170, h: 55 },
            // Bloc 2 : plateforme haute accessible par flip depuis bloc1
            { x: 480, y: 90, w: 170, h: 55 },
            // Bloc 3 : retour bas
            { x: 720, y: floorY - 200, w: 170, h: 55 },
            // Bloc 4 : plateforme haute, accès par flip depuis bloc3
            { x: 960, y: 110, w: 170, h: 55 },
            // Bloc 5 : plateforme finale basse avant le drapeau
            { x: 1200, y: floorY - 220, w: 200, h: 55 },
        ];
        hazards = [
            // Piques au sol entre blocs
            { x: 420, y: floorY - 55, w: 60, h: 60, side: 'bottom' },
            { x: 660, y: floorY - 55, w: 60, h: 60, side: 'bottom' },
            { x: 900, y: floorY - 55, w: 60, h: 60, side: 'bottom' },
            { x: 1140, y: floorY - 55, w: 60, h: 60, side: 'bottom' },
            // Piques plafond au-dessus des plateformes hautes
            { x: 480, y: 40, w: 170, h: 55, side: 'top' },
            { x: 960, y: 60, w: 170, h: 55, side: 'top' },
        ];
        goal.x = canvas.width - 160;
        goal.y = floorY - 110;
    }
}

// --- RENDU DU SOL EN TILING ---
function drawStaticFloor() {
    if (!platImg.complete || platImg.naturalWidth === 0) return;
    const tileW = platImg.naturalWidth;
    const tileH = 65;
    const yPos = canvas.height - tileH;
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

function resetGame(message) {
    if (message) alert(message);
    loadLevel(currentLevel);
}

// --- BOUCLE PRINCIPALE ---
function update() {
    if (gameState !== 'PLAYING') {
        draw();
        requestAnimationFrame(update);
        return;
    }

    let nextX = player.x;
    player.isMoving = false;
    if (keys['ArrowRight']) { nextX += player.speed; player.isMoving = true; player.facingRight = true; }
    if (keys['ArrowLeft'])  { nextX -= player.speed; player.isMoving = true; player.facingRight = false; }

    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x + p.w && nextX + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) canMoveX = false;
    });
    if (canMoveX) player.x = nextX;

    if (player.isMoving && player.onSurface) {
        player.currentFrame += player.animationSpeed;
        if (player.currentFrame >= walkFrames.length) player.currentFrame = 0;
    } else {
        player.currentFrame = 0;
    }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.velY += gravity * gravityDirection;
    player.y += player.velY;
    player.onSurface = false;

    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY > 0)  { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else if (player.velY < 0) { player.y = p.y + p.h; player.velY = 0; }
            } else {
                if (player.velY < 0)  { player.y = p.y + p.h; player.velY = 0; player.onSurface = true; }
                else if (player.velY > 0) { player.y = p.y - player.height; player.velY = 0; }
            }
        }
    });

    hazards.forEach(h => {
        if (player.x < h.x + h.w && player.x + player.width > h.x &&
            player.y < h.y + h.h && player.y + player.height > h.y) {
            resetGame("Le Néant vous a rattrapé...");
        }
    });

    if (player.y < -150 || player.y > canvas.height + 150) {
        resetGame("Perdu dans l'éther...");
    }

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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (backgroundImg.complete) {
        ctx.save();
        ctx.filter = gameState === 'MENU' ? "blur(10px) brightness(0.4)" : "blur(4px) brightness(0.65)";
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (gameState === 'MENU') return;

    // Sol en tiling
    drawStaticFloor();

    // Plateformes (toutes avec platform1)
    platforms.forEach(p => {
        if (!p.y || p.y >= canvas.height - 70) return; // skip floor platform (déjà dessinée)
        if (platImg.complete) ctx.drawImage(platImg, p.x, p.y, p.w, p.h);
    });

    // Piques (cristaux)
    hazards.forEach(h => {
        if (!picsImg.complete) return;
        const crystalW = 60;
        const count = Math.ceil(h.w / crystalW);
        for (let i = 0; i < count; i++) {
            const drawX = h.x + i * crystalW;
            const drawW = Math.min(crystalW, h.x + h.w - drawX);
            ctx.save();
            if (h.side === 'top') {
                ctx.translate(drawX + drawW / 2, h.y + h.h / 2);
                ctx.scale(1, -1);
                ctx.drawImage(picsImg, -drawW / 2, -h.h / 2, drawW, h.h);
            } else {
                ctx.drawImage(picsImg, drawX, h.y, drawW, h.h);
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
        const frame = walkFrames[Math.floor(player.currentFrame)];
        ctx.drawImage(frame, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }

    // HUD
    ctx.fillStyle = "white";
    ctx.font = "italic 22px 'Palatino Linotype', serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 8; ctx.shadowColor = "black";
    ctx.fillText(`Chapitre ${currentLevel} • Espace pour défier les lois`, canvas.width / 2, canvas.height - 20);
    ctx.shadowBlur = 0;
}

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && player.onSurface && gameState === 'PLAYING') {
        gravityDirection *= -1;
        player.onSurface = false;
        player.y += gravityDirection * 5;
    }
    if (e.code === 'Escape' && gameState === 'PLAYING') showMenu();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

// --- MENU HTML ---
const menuHTML = `
<div id="gameMenu" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;background:rgba(0,0,0,0.85);padding:50px;border-radius:20px;border:2px solid gold;box-shadow:0 0 20px gold;font-family:'Palatino Linotype',serif;z-index:100;">
    <h1 style="color:gold;margin-bottom:30px;font-size:3em;text-shadow:2px 2px black;">Gravity Wizard</h1>
    <button onclick="startGame(1)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid gold;border-radius:5px;font-size:1.2em;">✨ Nouvelle Partie</button>
    <button onclick="startGame(2)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid #aaa;border-radius:5px;font-size:1.2em;">⚡ Chapitre 2</button>
    <button onclick="startGame(3)" style="display:block;width:280px;margin:15px auto;padding:15px;cursor:pointer;background:#444;color:white;border:1px solid cyan;border-radius:5px;font-size:1.2em;">🌀 Chapitre 3</button>
</div>`;
document.body.insertAdjacentHTML('beforeend', menuHTML);

update();
