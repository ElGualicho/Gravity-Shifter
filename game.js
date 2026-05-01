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
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- CHARGEMENT DES ASSETS ---
let imagesLoaded = 0;
const totalImages = 15;

const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';
backgroundImg.onload = () => imagesLoaded++;

const platImgs = {};
for (let i = 1; i <= 8; i++) {
    const img = new Image();
    img.src = `assets/platform${i}.png`;
    img.onload = () => imagesLoaded++;
    platImgs[i] = img;
}

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

const player = {
    x: 100, y: 200, width: 50, height: 50,
    speed: 6, velY: 0, onSurface: false,
    currentFrame: 0, animationSpeed: 0.2,
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

    const floorY = canvas.height - 60;
    const floorPlatform = { x: 0, y: floorY, w: canvas.width * 2, h: 100, type: 8 };

    if (lv === 'CUSTOM') {
        const savedData = localStorage.getItem('customLevelData');
        if (!savedData) {
            alert("Aucun niveau personnalisé trouvé !");
            showMenu();
            return;
        }
        const data = JSON.parse(savedData);
        player.x = 80;
        player.y = canvas.height / 2;
        platforms = [floorPlatform, ...data.platforms];
        hazards = data.hazards;
        goal = data.goal;
    } else {
        player.x = 80;
        if (lv === 1) {
            player.y = 200;
            platforms = [
                floorPlatform,
                { x: 350, y: 400, w: 250, h: 80, type: 2 },
                { x: 700, y: 200, w: 200, h: 70, type: 4 },
                { x: 1000, y: 450, w: 150, h: 60, type: 5 },
                { x: 200, y: 150, w: 120, h: 60, type: 7 },
                { x: 1250, y: 300, w: 180, h: 70, type: 6 }
            ];
            hazards = [
                { x: 600, y: floorY - 50, w: 120, h: 60, side: 'bottom' },
                { x: 450, y: 45, w: 120, h: 60, side: 'top' }
            ];
        } else if (lv === 2) {
            player.y = canvas.height - 150;
            platforms = [
                floorPlatform,
                { x: 300, y: canvas.height - 220, w: 140, h: 60, type: 7 },
                { x: 550, y: 180, w: 120, h: 50, type: 5 },
                { x: 850, y: canvas.height - 250, w: 160, h: 70, type: 3 },
                { x: 1100, y: 150, w: 110, h: 50, type: 7 },
                { x: 1400, y: 380, w: 130, h: 60, type: 5 }
            ];
            hazards = [
                { x: 450, y: floorY - 50, w: 300, h: 60, side: 'bottom' },
                { x: 700, y: 45, w: 240, h: 60, side: 'top' }
            ];
        } else {
            player.y = canvas.height / 2;
            platforms = [
                floorPlatform,
                { x: 300, y: 150, w: 100, h: 300, type: 2 },
                { x: 600, y: canvas.height - 350, w: 100, h: 300, type: 2 },
                { x: 900, y: 300, w: 150, h: 60, type: 6 }
            ];
            hazards = [
                { x: 400, y: floorY - 50, w: 500, h: 60, side: 'bottom' },
                { x: 0, y: 45, w: 600, h: 60, side: 'top' }
            ];
        }
        goal.x = canvas.width - 150;
        goal.y = floorY - 110;
    }
}

// --- RENDU DU SOL DÉCORATIF ---
function drawStaticFloor() {
    const img = platImgs[8];
    if (img && img.complete) {
        const imgW = img.width;
        const imgH = 70;
        const yPos = canvas.height - imgH;
        for (let x = 0; x < canvas.width; x += imgW) {
            ctx.drawImage(img, x, yPos, imgW, imgH);
        }
    }
}

// --- GESTION DU MENU ---
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
    if(message) alert(message);
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
    if (keys['ArrowLeft']) { nextX -= player.speed; player.isMoving = true; player.facingRight = false; }

    let canMoveX = true;
    platforms.forEach(p => {
        if (nextX < p.x + p.w && nextX + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) canMoveX = false;
    });
    if (canMoveX) player.x = nextX;

    if (player.isMoving && player.onSurface) {
        player.currentFrame += player.animationSpeed;
        if (player.currentFrame >= walkFrames.length) player.currentFrame = 0;
    } else { player.currentFrame = 0; }

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.velY += gravity * gravityDirection;
    player.y += player.velY;
    player.onSurface = false;

    platforms.forEach(p => {
        if (player.x < p.x + p.w && player.x + player.width > p.x &&
            player.y < p.y + p.h && player.y + player.height > p.y) {
            if (gravityDirection === 1) {
                if (player.velY > 0) { player.y = p.y - player.height; player.velY = 0; player.onSurface = true; }
                else if (player.velY < 0) { player.y = p.y + p.h; player.velY = 0; }
            } else {
                if (player.velY < 0) { player.y = p.y + p.h; player.velY = 0; player.onSurface = true; }
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

    if (player.y < -100 || player.y > canvas.height + 100) {
        resetGame("Perdu dans l'éther...");
    }

    if (player.x < goal.x + goal.w && player.x + player.width > goal.x && 
        player.y < goal.y + goal.h && player.y + player.height > goal.y) {
        if (currentLevel === 'CUSTOM') {
            resetGame("Bravo ! Niveau personnalisé terminé !");
            showMenu();
        } else if (currentLevel < 3) {
            alert(`Niveau ${currentLevel} réussi !`);
            loadLevel(currentLevel + 1);
        } else {
            resetGame("Incroyable ! Vous êtes le Maître de la Gravité !");
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
        ctx.filter = gameState === 'MENU' ? "blur(10px) brightness(0.4)" : "blur(5px) brightness(0.6)";
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (gameState === 'MENU') return;

    drawStaticFloor();

    platforms.forEach(p => {
        if (p.type === 8) return;
        const img = platImgs[p.type];
        if (img && img.complete) ctx.drawImage(img, p.x, p.y, p.w, p.h);
    });

    hazards.forEach(h => {
        if (picsImg.complete) {
            const crystalWidth = 60;
            const count = Math.ceil(h.w / crystalWidth);
            for (let i = 0; i < count; i++) {
                ctx.save();
                let drawX = h.x + (i * crystalWidth);
                let drawW = Math.min(crystalWidth, h.x + h.w - drawX);
                if (h.side === 'top') {
                    ctx.translate(drawX + drawW / 2, h.y + h.h / 2);
                    ctx.scale(1, -1);
                    ctx.drawImage(picsImg, -drawW / 2, -h.h / 2, drawW, h.h);
                } else {
                    ctx.drawImage(picsImg, drawX, h.y, drawW, h.h);
                }
                ctx.restore();
            }
        }
    });

    if (flagImg.complete) ctx.drawImage(flagImg, goal.x, goal.y, goal.w, goal.h);

    if (imagesLoaded >= 5) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.scale(player.facingRight ? 1 : -1, gravityDirection === -1 ? -1 : 1);
        const currentImg = walkFrames[Math.floor(player.currentFrame)];
        ctx.drawImage(currentImg, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();
    }

    ctx.fillStyle = "white";
    ctx.font = "italic 22px 'Palatino Linotype', serif";
    ctx.textAlign = "center";
    ctx.shadowBlur = 8; ctx.shadowColor = "black";
    const title = currentLevel === 'CUSTOM' ? "Niveau Personnalisé" : `Chapitre ${currentLevel}`;
    ctx.fillText(`${title} • Espace pour défier les lois`, canvas.width / 2, canvas.height - 30);
    ctx.shadowBlur = 0;
}

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && player.onSurface && gameState === 'PLAYING') {
        gravityDirection *= -1;
        player.onSurface = false;
        player.y += gravityDirection * 10; 
    }
    if (e.code === 'Escape' && gameState === 'PLAYING') showMenu();
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });

const menuHTML = `
<div id="gameMenu" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(0,0,0,0.85); padding: 50px; border-radius: 20px; border: 2px solid gold; box-shadow: 0 0 20px gold; font-family: 'Palatino Linotype', serif; z-index: 100;">
    <h1 style="color: gold; margin-bottom: 30px; font-size: 3em; text-shadow: 2px 2px black;">Gravity Wizard</h1>
    <button onclick="startGame(1)" style="display: block; width: 280px; margin: 15px auto; padding: 15px; cursor: pointer; background: #444; color: white; border: 1px solid gold; border-radius: 5px; font-size: 1.2em;">✨ Nouvelle Partie</button>
    <button onclick="window.open('editor.html', '_blank')" style="display: block; width: 280px; margin: 15px auto; padding: 15px; cursor: pointer; background: #444; color: white; border: 1px solid #aaa; border-radius: 5px; font-size: 1.2em;">🛠️ Créer un Niveau</button>
    <button onclick="startGame('CUSTOM')" style="display: block; width: 280px; margin: 15px auto; padding: 15px; cursor: pointer; background: #444; color: white; border: 1px solid cyan; border-radius: 5px; font-size: 1.2em;">🎮 Jouer Niveau Perso</button>
</div>`;
document.body.insertAdjacentHTML('beforeend', menuHTML);

update();