const devPanel = document.getElementById('devPanel');
const devThemeSelect = document.getElementById('devThemeSelect');
const devExport = document.getElementById('devExport');
const devStatus = document.getElementById('devStatus');
const customLevelButtons = document.getElementById('customLevelButtons');

let devMode = false;
let devTool = 'platform';
let devSelected = null;
let devDragging = false;
let devDragOffset = { x: 0, y: 0 };

const devLevel = {
    name: 'Niveau custom',
    theme: 'grass',
    platforms: [],
    hazards: [],
    goal: { xRatio: 0.82, yRatio: 0.78, w: 100, h: 110 }
};

function openDevEditor() {
    gameState = 'DEV';
    devMode = true;
    keys = {};
    setOverlayVisibility(false, false);
    devPanel.classList.add('is-visible');
    devLevel.theme = devThemeSelect.value;
    normalizeDevDefaultGoal();
}

function closeDevEditor() {
    devMode = false;
    devSelected = null;
    devDragging = false;
    devPanel.classList.remove('is-visible');
    showMenu();
}

function setDevTool(tool) {
    devTool = tool;
    devStatus.textContent = `Outil actif : ${tool}`;
}

function getPointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function normalizeDevRect(rect) {
    return {
        xRatio: Math.max(0, Math.min(1, rect.x / canvas.width)),
        yRatio: Math.max(0, Math.min(1, rect.y / canvas.height)),
        w: rect.w,
        h: rect.h,
        side: rect.side
    };
}

function denormalizeDevRect(rect) {
    return {
        x: Math.round((rect.xRatio ?? 0) * canvas.width),
        y: Math.round((rect.yRatio ?? 0) * canvas.height),
        w: rect.w,
        h: rect.h,
        side: rect.side
    };
}

function normalizeDevDefaultGoal() {
    if (!devLevel.goal) {
        devLevel.goal = { xRatio: 0.82, yRatio: 0.78, w: 100, h: 110 };
    }
}

function getDevObjects() {
    const objects = [];
    devLevel.platforms.forEach((item, index) => objects.push({ type: 'platform', index, rect: denormalizeDevRect(item) }));
    devLevel.hazards.forEach((item, index) => objects.push({ type: 'hazard', index, rect: denormalizeDevRect(item) }));
    objects.push({ type: 'goal', index: 0, rect: denormalizeDevRect(devLevel.goal) });
    return objects;
}

function findDevObjectAt(x, y) {
    const objects = getDevObjects().reverse();
    return objects.find(obj => x >= obj.rect.x && x <= obj.rect.x + obj.rect.w && y >= obj.rect.y && y <= obj.rect.y + obj.rect.h) || null;
}

canvas.addEventListener('mousedown', evt => {
    if (!devMode) return;
    const pos = getPointerPos(evt);
    const selected = findDevObjectAt(pos.x, pos.y);

    if (selected) {
        devSelected = selected;
        devDragging = true;
        devDragOffset.x = pos.x - selected.rect.x;
        devDragOffset.y = pos.y - selected.rect.y;
        return;
    }

    if (devTool === 'platform') {
        devLevel.platforms.push(normalizeDevRect({ x: pos.x - PLAT_W / 2, y: pos.y - PLAT_H / 2, w: PLAT_W, h: PLAT_H }));
    } else if (devTool === 'hazard-bottom') {
        devLevel.hazards.push(normalizeDevRect({ x: pos.x - CRYSTAL_W, y: pos.y - CRYSTAL_H / 2, w: 2 * CRYSTAL_W, h: CRYSTAL_H, side: 'bottom' }));
    } else if (devTool === 'hazard-top') {
        devLevel.hazards.push(normalizeDevRect({ x: pos.x - CRYSTAL_W / 2, y: pos.y - CRYSTAL_H / 2, w: CRYSTAL_W, h: CRYSTAL_H, side: 'top' }));
    } else if (devTool === 'goal') {
        devLevel.goal = normalizeDevRect({ x: pos.x - 50, y: pos.y - 55, w: 100, h: 110 });
    }
});

canvas.addEventListener('mousemove', evt => {
    if (!devMode || !devDragging || !devSelected) return;
    const pos = getPointerPos(evt);
    const x = pos.x - devDragOffset.x;
    const y = pos.y - devDragOffset.y;

    if (devSelected.type === 'platform') {
        const item = devLevel.platforms[devSelected.index];
        Object.assign(item, normalizeDevRect({ x, y, w: item.w, h: item.h }));
    } else if (devSelected.type === 'hazard') {
        const item = devLevel.hazards[devSelected.index];
        Object.assign(item, normalizeDevRect({ x, y, w: item.w, h: item.h, side: item.side }));
    } else if (devSelected.type === 'goal') {
        Object.assign(devLevel.goal, normalizeDevRect({ x, y, w: devLevel.goal.w, h: devLevel.goal.h }));
    }
});

window.addEventListener('mouseup', () => {
    devDragging = false;
});

window.addEventListener('keydown', evt => {
    if (!devMode) return;
    if ((evt.code === 'Delete' || evt.code === 'Backspace') && devSelected) {
        if (devSelected.type === 'platform') devLevel.platforms.splice(devSelected.index, 1);
        if (devSelected.type === 'hazard') devLevel.hazards.splice(devSelected.index, 1);
        devSelected = null;
    }
});

function clearDevLevel() {
    devLevel.platforms = [];
    devLevel.hazards = [];
    devLevel.goal = { xRatio: 0.82, yRatio: 0.78, w: 100, h: 110 };
    devSelected = null;
    devExport.value = '';
    devStatus.textContent = 'Niveau vidé.';
}

function saveDevLevel() {
    const levelToSave = JSON.parse(JSON.stringify(devLevel));
    levelToSave.name = `Niveau custom ${customLevels.length + 1}`;
    customLevels.push(levelToSave);
    saveCustomLevels();
    syncCustomLevelButtons();
    devStatus.textContent = `Enregistré : chapitre ${BUILTIN_LEVEL_COUNT + customLevels.length}`;
}

function testDevLevel() {
    // Synchronise le thème depuis le select, puis passe le snapshot complet
    // à startDevTest() dans game.js — aucune modification de customLevels,
    // donc getCustomLevel() restera stable à chaque frame de rendu.
    devLevel.theme = devThemeSelect.value;
    const snapshot = JSON.parse(JSON.stringify(devLevel));
    devPanel.classList.remove('is-visible');
    devMode = false;
    startDevTest(snapshot);
}

function exportDevLevel() {
    devExport.value = JSON.stringify(devLevel, null, 2);
    devExport.select();
    devStatus.textContent = "JSON exporté. Copie-le pour l'intégrer plus tard au repo.";
}

function syncCustomLevelButtons() {
    if (!customLevelButtons) return;
    customLevelButtons.innerHTML = '';
    customLevels.forEach((level, index) => {
        const btn = document.createElement('button');
        const levelNumber = BUILTIN_LEVEL_COUNT + index + 1;
        btn.textContent = `🧪 Chapitre ${levelNumber} custom`;
        btn.onclick = () => startGame(levelNumber);
        customLevelButtons.appendChild(btn);
    });
}

function drawDevEditorOverlay() {
    if (!devMode) return;

    const theme = themePresets[devLevel.theme] || themePresets.grass;
    const bgImg = theme.background;
    const floorImg = theme.floor;
    const platImg = theme.platform;
    const floorH = theme.floorHeight;
    const floorY = canvas.height - floorH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImg.complete) {
        ctx.save();
        ctx.filter = 'blur(2px) brightness(0.7)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    if (floorImg.complete) {
        for (let x = 0; x < canvas.width; x += floorImg.naturalWidth) {
            ctx.drawImage(floorImg, x, floorY, floorImg.naturalWidth, floorH);
        }
    }

    devLevel.platforms.forEach(item => {
        const r = denormalizeDevRect(item);
        if (platImg.complete) ctx.drawImage(platImg, r.x, r.y, r.w, r.h);
    });

    devLevel.hazards.forEach(item => {
        const r = denormalizeDevRect(item);
        if (!picsImg.complete) return;
        ctx.save();
        if (item.side === 'top') {
            ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
            ctx.scale(1, -1);
            ctx.drawImage(picsImg, -r.w / 2, -r.h / 2, r.w, r.h);
        } else {
            const count = Math.ceil(r.w / CRYSTAL_W);
            for (let i = 0; i < count; i++) ctx.drawImage(picsImg, r.x + i * CRYSTAL_W, r.y, CRYSTAL_W, CRYSTAL_H);
        }
        ctx.restore();
    });

    const g = denormalizeDevRect(devLevel.goal);
    if (flagImg.complete) ctx.drawImage(flagImg, g.x, g.y, g.w, g.h);

    if (devSelected) {
        const r = devSelected.type === 'goal' ? denormalizeDevRect(devLevel.goal) : devSelected.rect;
        ctx.save();
        ctx.strokeStyle = '#f5c96b';
        ctx.lineWidth = 3;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(18, canvas.height - 48, 460, 30);
    ctx.fillStyle = '#fff8df';
    ctx.font = '16px Palatino Linotype, serif';
    ctx.fillText('Mode développeur : clique pour placer, glisse pour déplacer, Suppr pour effacer', 32, canvas.height - 27);
    ctx.restore();
}

const originalDrawForDevEditor = draw;
draw = function patchedDraw() {
    if (devMode) {
        drawDevEditorOverlay();
        return;
    }
    originalDrawForDevEditor();
};

if (devThemeSelect) {
    devThemeSelect.addEventListener('change', () => {
        devLevel.theme = devThemeSelect.value;
    });
}

syncCustomLevelButtons();
