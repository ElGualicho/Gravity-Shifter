const devPanel       = document.getElementById('devPanel');
const devThemeSelect = document.getElementById('devThemeSelect');
const devExportEl    = document.getElementById('devExport');
const devStatus      = document.getElementById('devStatus');

let devMode      = false;
let devTool      = 'platform';
let devSelected  = null;
let devDragging  = false;
let devDragOffset = { x: 0, y: 0 };

const devLevel = {
    name: 'Niveau custom',
    theme: 'nature',
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
    devLevel.theme = devThemeSelect ? devThemeSelect.value : 'nature';
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
    if (devStatus) devStatus.textContent = `Outil actif : ${tool}`;
}

function getPointerPos(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width  / rect.width),
        y: (evt.clientY - rect.top)  * (canvas.height / rect.height)
    };
}

function normalizeDevRect(rect) {
    return {
        xRatio: Math.max(0, Math.min(1, rect.x / canvas.width)),
        yRatio: Math.max(0, Math.min(1, rect.y / canvas.height)),
        w: rect.w, h: rect.h, side: rect.side
    };
}

function denormalizeDevRect(rect) {
    return {
        x: Math.round((rect.xRatio ?? 0) * canvas.width),
        y: Math.round((rect.yRatio ?? 0) * canvas.height),
        w: rect.w, h: rect.h, side: rect.side
    };
}

function getDevObjects() {
    const objs = [];
    devLevel.platforms.forEach((item, i) => objs.push({ type: 'platform', index: i, rect: denormalizeDevRect(item) }));
    devLevel.hazards.forEach((item, i)   => objs.push({ type: 'hazard',   index: i, rect: denormalizeDevRect(item) }));
    objs.push({ type: 'goal', index: 0, rect: denormalizeDevRect(devLevel.goal) });
    return objs;
}

function findDevObjectAt(x, y) {
    return getDevObjects().reverse().find(
        obj => x >= obj.rect.x && x <= obj.rect.x + obj.rect.w &&
               y >= obj.rect.y && y <= obj.rect.y + obj.rect.h
    ) || null;
}

canvas.addEventListener('mousedown', evt => {
    if (!devMode) return;
    const pos = getPointerPos(evt);
    const sel = findDevObjectAt(pos.x, pos.y);
    if (sel) {
        devSelected = sel;
        devDragging = true;
        devDragOffset.x = pos.x - sel.rect.x;
        devDragOffset.y = pos.y - sel.rect.y;
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

window.addEventListener('mouseup', () => { devDragging = false; });

window.addEventListener('keydown', evt => {
    if (!devMode || !devSelected) return;
    if (evt.code === 'Delete' || evt.code === 'Backspace') {
        if (devSelected.type === 'platform') devLevel.platforms.splice(devSelected.index, 1);
        if (devSelected.type === 'hazard')   devLevel.hazards.splice(devSelected.index, 1);
        devSelected = null;
    }
});

function clearDevLevel() {
    devLevel.platforms = [];
    devLevel.hazards   = [];
    devLevel.goal      = { xRatio: 0.82, yRatio: 0.78, w: 100, h: 110 };
    devSelected = null;
    if (devExportEl) devExportEl.value = '';
    if (devStatus)   devStatus.textContent = 'Niveau vidé.';
}

function testDevLevel() {
    devLevel.theme = devThemeSelect ? devThemeSelect.value : 'nature';
    const snapshot = JSON.parse(JSON.stringify(devLevel));
    devPanel.classList.remove('is-visible');
    devMode = false;
    startDevTest(snapshot);
}

function exportDevLevel() {
    if (devExportEl) {
        devExportEl.value = JSON.stringify(devLevel, null, 2);
        devExportEl.select();
    }
    if (devStatus) devStatus.textContent = "JSON exporté. Copie-le pour l'intégrer plus tard au repo.";
}

function drawDevEditorOverlay() {
    if (!devMode) return;
    const theme  = themePresets[devLevel.theme] || themePresets.nature;
    const bgImg  = theme.background;
    const flImg  = theme.floor;
    const plImg  = theme.platform;
    const piImg  = theme.pics;
    const flImg2 = theme.flag;
    const floorH = theme.floorHeight;
    const floorY = canvas.height - floorH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImg && bgImg.complete) {
        ctx.save();
        ctx.filter = 'blur(4px) brightness(0.65)';
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    if (flImg && flImg.complete && flImg.naturalWidth) {
        for (let x = 0; x < canvas.width; x += flImg.naturalWidth)
            ctx.drawImage(flImg, x, floorY, flImg.naturalWidth, floorH);
    }
    devLevel.platforms.forEach(item => {
        const r = denormalizeDevRect(item);
        if (plImg && plImg.complete) ctx.drawImage(plImg, r.x, r.y, r.w, r.h);
    });
    devLevel.hazards.forEach(item => {
        const r = denormalizeDevRect(item);
        if (!piImg || !piImg.complete) return;
        ctx.save();
        if (item.side === 'top') {
            ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
            ctx.scale(1, -1);
            ctx.drawImage(piImg, -r.w / 2, -r.h / 2, r.w, r.h);
        } else {
            const count = Math.ceil(r.w / CRYSTAL_W);
            for (let i = 0; i < count; i++) ctx.drawImage(piImg, r.x + i * CRYSTAL_W, r.y, CRYSTAL_W, CRYSTAL_H);
        }
        ctx.restore();
    });
    const g = denormalizeDevRect(devLevel.goal);
    if (flImg2 && flImg2.complete) ctx.drawImage(flImg2, g.x, g.y, g.w, g.h);

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
    ctx.fillRect(18, canvas.height - 48, 520, 30);
    ctx.fillStyle = '#fff8df';
    ctx.font = '16px Palatino Linotype, serif';
    ctx.fillText('Mode développeur : clique pour placer, glisse pour déplacer, Suppr pour effacer', 32, canvas.height - 27);
    ctx.restore();
}

// Patch de draw() pour intégrer le rendu du dev editor
const _baseDraw = draw;
draw = function patchedDraw() {
    if (devMode) { drawDevEditorOverlay(); return; }
    _baseDraw();
};

if (devThemeSelect) {
    devThemeSelect.addEventListener('change', () => { devLevel.theme = devThemeSelect.value; });
}
