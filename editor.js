const canvas = document.getElementById('editorCanvas');
const ctx = canvas.getContext('2d');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight - 100;

let selectedType = 'platform';
let selectedTheme = 'nature';
let selectedSide  = 'bottom';
let currentW = 150;
let currentH = 60;

const themeNames = ['nature', 'ice', 'clay', 'steel'];

const levelData = {
    platforms: [],
    hazards:   [],
    goal:      { x: 800, y: 500, w: 100, h: 110 },
    theme:     'nature'
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────
const platImgs  = {};
const floorImgs = {};
const picsImgs  = {};
const flagImgs  = {};

themeNames.forEach(theme => {
    const load = src => { const i = new Image(); i.src = src; return i; };
    platImgs[theme]  = load(`assets/platform_${theme}.png`);
    floorImgs[theme] = load(`assets/floor_${theme}.png`);
    picsImgs[theme]  = load(`assets/pics_${theme}.png`);
    flagImgs[theme]  = load(`assets/flag_${theme}.png`);
});

// ─── TOOLBAR ─────────────────────────────────────────────────────────────────
const toolbar = document.createElement('div');
toolbar.style = 'height:100px;background:#222;display:flex;align-items:center;padding:0 20px;gap:8px;color:white;font-family:sans-serif;border-bottom:2px solid gold;flex-wrap:wrap;';
document.body.prepend(toolbar);

function addLabel(text) {
    const lbl = document.createElement('span');
    lbl.innerText = text;
    lbl.style = 'color:gold;font-size:0.75em;font-weight:bold;margin:0 4px;';
    toolbar.appendChild(lbl);
}

function createBtn(text, onClick, color = '#444', textColor = 'white') {
    const btn = document.createElement('button');
    btn.innerText = text;
    btn.style = `padding:8px 10px;cursor:pointer;background:${color};color:${textColor};border:1px solid #666;border-radius:4px;font-size:0.85em;font-weight:bold;`;
    btn.onclick = () => {
        Array.from(toolbar.querySelectorAll('button')).forEach(b => b.style.outline = 'none');
        btn.style.outline = '3px solid cyan';
        onClick();
    };
    toolbar.appendChild(btn);
    return btn;
}

addLabel('THÈME :');
themeNames.forEach(theme => {
    createBtn(theme.charAt(0).toUpperCase() + theme.slice(1), () => {
        selectedTheme = theme;
        levelData.theme = theme;
    });
});

addLabel('| OUTIL :');
createBtn('Plateforme', () => { selectedType = 'platform'; currentW = 150; currentH = 60; });
createBtn('Piques ▲',   () => { selectedType = 'hazard'; selectedSide = 'bottom'; currentW = 120; currentH = 60; });
createBtn('Piques ▼',   () => { selectedType = 'hazard'; selectedSide = 'top';    currentW = 120; currentH = 60; });
createBtn('Drapeau 🚩', () => { selectedType = 'goal'; });

addLabel('|');
createBtn('SAUVEGARDER & JOUER', () => exportLevel(), 'gold', 'black');

const info = document.createElement('div');
info.style = 'color:#aaa;font-size:0.75em;margin-left:10px;';
info.innerHTML = '← → : Largeur&nbsp;&nbsp;↑ ↓ : Hauteur<br>Clic gauche : Poser&nbsp;&nbsp;Clic droit : Supprimer';
toolbar.appendChild(info);

// ─── SOURIS & CLAVIER ────────────────────────────────────────────────────────
let mouseX = 0, mouseY = 0;

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = Math.round((e.clientX - rect.left) / 20) * 20;
    mouseY = Math.round((e.clientY - rect.top)  / 20) * 20;
});

window.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') currentW += 20;
    if (e.key === 'ArrowLeft')  currentW  = Math.max(20, currentW - 20);
    if (e.key === 'ArrowUp')    currentH  = Math.max(20, currentH - 20);
    if (e.key === 'ArrowDown')  currentH += 20;
});

canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (selectedType === 'platform') {
        levelData.platforms.push({ x: mouseX, y: mouseY, w: currentW, h: currentH });
    } else if (selectedType === 'hazard') {
        levelData.hazards.push({ x: mouseX, y: mouseY, w: currentW, h: currentH, side: selectedSide });
    } else if (selectedType === 'goal') {
        levelData.goal.x = mouseX;
        levelData.goal.y = mouseY;
    }
});

canvas.addEventListener('contextmenu', e => {
    e.preventDefault();
    levelData.platforms = levelData.platforms.filter(p => !(mouseX >= p.x && mouseX < p.x + p.w && mouseY >= p.y && mouseY < p.y + p.h));
    levelData.hazards   = levelData.hazards.filter(h =>   !(mouseX >= h.x && mouseX < h.x + h.w && mouseY >= h.y && mouseY < h.y + h.h));
});

// ─── EXPORT ──────────────────────────────────────────────────────────────────
function exportLevel() {
    const W = canvas.width;
    const H = canvas.height;

    const normalized = {
        theme: selectedTheme,
        platforms: levelData.platforms.map(p => ({
            xRatio: p.x / W, yRatio: p.y / H, w: p.w, h: p.h
        })),
        hazards: levelData.hazards.map(h => ({
            xRatio: h.x / W, yRatio: h.y / H, w: h.w, h: h.h, side: h.side
        })),
        goal: {
            xRatio: levelData.goal.x / W,
            yRatio: levelData.goal.y / H,
            w: levelData.goal.w,
            h: levelData.goal.h
        }
    };

    localStorage.setItem('gravityWizardDevLevel', JSON.stringify(normalized));
    alert('Niveau enregistré — lancez le mode dev pour tester !');
}

// ─── RENDU ───────────────────────────────────────────────────────────────────
function draw() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width;  i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    // Sol
    const fImg = floorImgs[selectedTheme];
    if (fImg?.complete && fImg.naturalWidth) {
        const yPos = canvas.height - 65;
        for (let x = 0; x < canvas.width; x += fImg.naturalWidth)
            ctx.drawImage(fImg, x, yPos, fImg.naturalWidth, 65);
    }

    // Plateformes
    const pImg = platImgs[selectedTheme];
    levelData.platforms.forEach(p => {
        if (pImg?.complete) ctx.drawImage(pImg, p.x, p.y, p.w, p.h);
        else { ctx.fillStyle = '#558855'; ctx.fillRect(p.x, p.y, p.w, p.h); }
    });

    // Piques
    const piImg = picsImgs[selectedTheme];
    levelData.hazards.forEach(h => {
        ctx.save();
        if (h.side === 'top') {
            ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
            ctx.scale(1, -1);
            if (piImg?.complete) ctx.drawImage(piImg, -h.w / 2, -h.h / 2, h.w, h.h);
        } else {
            if (piImg?.complete) ctx.drawImage(piImg, h.x, h.y, h.w, h.h);
        }
        ctx.restore();
    });

    // Drapeau
    const flImg = flagImgs[selectedTheme];
    if (flImg?.complete) ctx.drawImage(flImg, levelData.goal.x, levelData.goal.y, 100, 110);

    // Fantôme
    ctx.globalAlpha = 0.5;
    if (selectedType === 'platform' && pImg?.complete) {
        ctx.drawImage(pImg, mouseX, mouseY, currentW, currentH);
    } else if (selectedType === 'hazard' && piImg?.complete) {
        ctx.save();
        if (selectedSide === 'top') {
            ctx.translate(mouseX + currentW / 2, mouseY + currentH / 2);
            ctx.scale(1, -1);
            ctx.drawImage(piImg, -currentW / 2, -currentH / 2, currentW, currentH);
        } else {
            ctx.drawImage(piImg, mouseX, mouseY, currentW, currentH);
        }
        ctx.restore();
    } else if (selectedType === 'goal' && flImg?.complete) {
        ctx.drawImage(flImg, mouseX, mouseY, 100, 110);
    }
    ctx.globalAlpha = 1.0;

    // Infos
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Thème : ${selectedTheme}  |  Taille : ${currentW} × ${currentH}`, 10, canvas.height - 10);

    requestAnimationFrame(draw);
}

draw();
