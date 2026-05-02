/**
 * ui-helpers.js
 * Gestion des interactions UI : drag-drop du dev panel, toggle du level selector.
 */

// ===== LEVEL SELECTOR =====
function toggleLevelSelector() {
    const selector = document.getElementById('levelSelector');
    if (selector) selector.classList.toggle('hidden');
}

// ===== DRAGGABLE DEV PANEL =====
(function initDragPanel() {
    const panel  = document.getElementById('devPanel');
    const handle = panel ? panel.querySelector('.draggable-handle') : null;
    if (!panel || !handle) return;

    let dragging = false;
    let startMouseX, startMouseY, startPanelX, startPanelY;

    function getXY(e) {
        return e.touches
            ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
            : { x: e.clientX,            y: e.clientY };
    }

    function onStart(e) {
        if (e.target.tagName === 'BUTTON') return;
        const { x, y } = getXY(e);
        const rect = panel.getBoundingClientRect();
        dragging    = true;
        startMouseX = x;
        startMouseY = y;
        startPanelX = rect.left;
        startPanelY = rect.top;
        handle.style.cursor = 'grabbing';
        e.preventDefault();
    }

    function onMove(e) {
        if (!dragging) return;
        const { x, y } = getXY(e);
        const newX = Math.max(0, Math.min(startPanelX + (x - startMouseX), window.innerWidth  - panel.offsetWidth));
        const newY = Math.max(0, Math.min(startPanelY + (y - startMouseY), window.innerHeight - panel.offsetHeight));
        panel.style.right  = 'auto';
        panel.style.bottom = 'auto';
        panel.style.left   = newX + 'px';
        panel.style.top    = newY + 'px';
        e.preventDefault();
    }

    function onEnd() {
        dragging = false;
        handle.style.cursor = 'grab';
    }

    handle.addEventListener('mousedown',  onStart);
    handle.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',  onEnd);
    document.addEventListener('touchend', onEnd);
})();
