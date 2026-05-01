const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

let selectedType = 'platform';
let selectedId = 1; 
let selectedSide = 'bottom';
let currentW = 150;
let currentH = 60;

let levelData = { 
    platforms: [], 
    hazards: [], 
    goal: { x: 800, y: 500, w: 100, h: 110 } 
};

// --- CHARGEMENT DES ASSETS ---
const platImgs = {};
for (let i = 1; i <= 7; i++) {
    platImgs[i] = new Image();
    platImgs[i].src = `assets/platform${i}.png`;
}
const picsImg = new Image(); picsImg.src = 'assets/pics.png';
const flagImg = new Image(); flagImg.src = 'assets/flag.png';

// --- INTERFACE ---
const toolbar = document.createElement('div');
toolbar.id = "toolbar";
toolbar.style = "height: 100px; background: #222; display: flex; align-items: center; padding: 0 20px; gap: 10px; color: white; font-family: sans-serif; border-bottom: 2px solid gold;";
document.body.prepend(toolbar);

function createBtn(text, onClick, isGold = false) {
    let btn = document.createElement('button');
    btn.innerText = text;
    btn.style = `padding: 10px; cursor: pointer; background: ${isGold ? 'gold' : '#444'}; color: ${isGold ? 'black' : 'white'}; border: none; border-radius: 4px; font-weight: bold;`;
    btn.onclick = (e) => {
        Array.from(toolbar.querySelectorAll('button')).forEach(b => b.style.outline = "none");
        btn.style.outline = "3px solid cyan";
        onClick();
    };
    toolbar.appendChild(btn);
    return btn;
}

for (let i = 1; i <= 7; i++) {
    createBtn(`Plat ${i}`, () => { selectedType = 'platform'; selectedId = i; currentW = 150; currentH = 60; });
}
createBtn("Piques ▲", () => { selectedType = 'hazard'; selectedSide = 'bottom'; currentW = 120; currentH = 60; });
createBtn("Piques ▼", () => { selectedType = 'hazard'; selectedSide = 'top'; currentW = 120; currentH = 60; });
createBtn("Drapeau", () => { selectedType = 'goal'; });
createBtn("SAUVEGARDER & JOUER", () => exportLevel(), true);

const info = document.createElement('div');
info.style = "color: #aaa; font-size: 0.8em; margin-left: 20px;";
info.innerHTML = "Flèches : Ajuster taille<br>Clic Droit : Supprimer";
toolbar.appendChild(info);

// --- LOGIQUE SOURIS & CLAVIER ---
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = Math.round((e.clientX - rect.left) / 20) * 20;
    mouseY = Math.round((e.clientY - rect.top) / 20) * 20;
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') currentW += 20;
    if (e.key === 'ArrowLeft') currentW = Math.max(20, currentW - 20);
    if (e.key === 'ArrowUp') currentH = Math.max(20, currentH - 20);
    if (e.key === 'ArrowDown') currentH += 20;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        if (selectedType === 'platform') {
            levelData.platforms.push({ x: mouseX, y: mouseY, w: currentW, h: currentH, type: selectedId });
        } else if (selectedType === 'hazard') {
            levelData.hazards.push({ x: mouseX, y: mouseY, w: currentW, h: currentH, side: selectedSide });
        } else if (selectedType === 'goal') {
            levelData.goal.x = mouseX; levelData.goal.y = mouseY;
        }
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    levelData.platforms = levelData.platforms.filter(p => !(mouseX >= p.x && mouseX < p.x + p.w && mouseY >= p.y && mouseY < p.y + p.h));
    levelData.hazards = levelData.hazards.filter(h => !(mouseX >= h.x && mouseX < h.x + h.w && mouseY >= h.y && mouseY < h.y + h.h));
});

// --- EXPORT ---
function exportLevel() {
    const customLevel = {
        name: "Niveau Perso",
        platforms: levelData.platforms,
        hazards: levelData.hazards,
        goal: levelData.goal,
        playerStart: { x: 80, y: 300 }
    };
    localStorage.setItem('customLevelData', JSON.stringify(customLevel));
    alert("Niveau enregistré dans le grimoire !");
}

// --- RENDU ---
function draw() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    for(let i=0; i<canvas.width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,canvas.height); ctx.stroke(); }
    for(let i=0; i<canvas.height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width,i); ctx.stroke(); }

    levelData.platforms.forEach(p => {
        if(platImgs[p.type].complete) ctx.drawImage(platImgs[p.type], p.x, p.y, p.w, p.h);
    });

    levelData.hazards.forEach(h => {
        ctx.save();
        if (h.side === 'top') {
            ctx.translate(h.x + h.w/2, h.y + h.h/2); ctx.scale(1, -1);
            ctx.drawImage(picsImg, -h.w/2, -h.h/2, h.w, h.h);
        } else {
            ctx.drawImage(picsImg, h.x, h.y, h.w, h.h);
        }
        ctx.restore();
    });

    ctx.drawImage(flagImg, levelData.goal.x, levelData.goal.y, 100, 110);

    ctx.globalAlpha = 0.5;
    if (selectedType === 'platform') {
        if(platImgs[selectedId].complete) ctx.drawImage(platImgs[selectedId], mouseX, mouseY, currentW, currentH);
    } else if (selectedType === 'hazard') {
        if (selectedSide === 'top') {
            ctx.save();
            ctx.translate(mouseX + currentW/2, mouseY + currentH/2); ctx.scale(1, -1);
            ctx.drawImage(picsImg, -currentW/2, -currentH/2, currentW, currentH);
            ctx.restore();
        } else {
            ctx.drawImage(picsImg, mouseX, mouseY, currentW, currentH);
        }
    }
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(draw);
}

draw();