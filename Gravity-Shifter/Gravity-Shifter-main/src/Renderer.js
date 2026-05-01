/**
 * Renderer.js — All canvas drawing. Zero game logic.
 * Receives a state snapshot each frame and paints it.
 * All draw methods have colored fallbacks when image assets are missing.
 */

import { TOTAL_LEVELS } from './constants.js';

// Fallback palette (used when image assets are not deployed)
const COLORS = {
  bg:       '#1a0a2e',
  floor:    '#5c3d1e',
  platform: '#7b5e3a',
  hazard:   '#c0392b',
  goal:     '#f1c40f',
  player:   '#3498db',
  hud:      'white',
};

function imgOk(img) {
  return img?.complete && img.naturalWidth > 0;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.assets = { ready: false };
  }

  // ─── Asset loading ──────────────────────────────────────────────────────────

  loadAssets() {
    return new Promise((resolve) => {
      let loaded = 0;
      const total = 1 + 8 + 1 + 1 + 4; // bg + platforms(1-8) + flag + pics + walk frames
      const tick  = () => { if (++loaded >= total) { this.assets.ready = true; resolve(); } };
      const img   = (src) => {
        const i    = new Image();
        i.src      = src;
        i.onload   = tick;
        i.onerror  = tick; // missing asset → still counts, fallbacks handle rendering
        return i;
      };

      this.assets.bg         = img('assets/background.png');
      this.assets.platImgs   = {};
      for (let i = 1; i <= 8; i++) this.assets.platImgs[i] = img(`assets/platform${i}.png`);
      this.assets.flag       = img('assets/flag.png');
      this.assets.pics       = img('assets/pics.png');
      this.assets.walkFrames = ['walk1.png','walk2.png','walk3.png','walk4.png'].map(n => img(`assets/${n}`));
    });
  }

  // ─── Public draw calls ──────────────────────────────────────────────────────

  drawMenu() {
    this._drawBackground(true);
  }

  drawGame(state) {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this._drawBackground(false);
    this._drawFloor(state.platforms);
    this._drawPlatforms(state.platforms);
    this._drawHazards(state.hazards);
    this._drawGoal(state.goal);
    this._drawPlayer(state.player, state.gravityDir);
    this._drawHUD(state.currentLevel);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  _drawBackground(blurHeavy) {
    const { ctx, canvas, assets } = this;
    if (imgOk(assets.bg)) {
      ctx.save();
      ctx.filter = blurHeavy ? 'blur(10px) brightness(0.4)' : 'blur(5px) brightness(0.6)';
      ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      // Fallback: solid dark gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0d0015');
      grad.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  _drawFloor(platforms) {
    const { ctx, canvas, assets } = this;
    const floorPlat = platforms.find(p => p.type === 8);
    if (!floorPlat) return;

    const img  = assets.platImgs?.[8];
    const imgH = 70;
    const yPos = canvas.height - imgH;

    if (imgOk(img)) {
      for (let x = 0; x < canvas.width; x += img.width)
        ctx.drawImage(img, x, yPos, img.width, imgH);
    } else {
      // Fallback: solid bar
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(0, yPos, canvas.width, imgH);
      // Top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(0, yPos, canvas.width, 3);
    }
  }

  _drawPlatforms(platforms) {
    const { ctx, assets } = this;
    platforms.forEach(p => {
      if (p.type === 8) return; // floor drawn separately
      const img = assets.platImgs?.[p.type];
      if (imgOk(img)) {
        ctx.drawImage(img, p.x, p.y, p.w, p.h);
      } else {
        // Fallback: rounded rect with slight gradient
        ctx.fillStyle = COLORS.platform;
        ctx.beginPath();
        ctx.roundRect(p.x, p.y, p.w, p.h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 4);
      }
    });
  }

  _drawHazards(hazards) {
    const { ctx, assets } = this;
    const pics         = assets.pics;
    const crystalWidth = 60;

    hazards.forEach(h => {
      if (imgOk(pics)) {
        const count = Math.ceil(h.w / crystalWidth);
        for (let i = 0; i < count; i++) {
          const drawX = h.x + i * crystalWidth;
          const drawW = Math.min(crystalWidth, h.x + h.w - drawX);
          ctx.save();
          if (h.side === 'top') {
            ctx.translate(drawX + drawW / 2, h.y + h.h / 2);
            ctx.scale(1, -1);
            ctx.drawImage(pics, -drawW / 2, -h.h / 2, drawW, h.h);
          } else {
            ctx.drawImage(pics, drawX, h.y, drawW, h.h);
          }
          ctx.restore();
        }
      } else {
        // Fallback: red spikes (triangles)
        ctx.fillStyle = COLORS.hazard;
        const spikeW = 20;
        const count  = Math.floor(h.w / spikeW);
        for (let i = 0; i < count; i++) {
          const sx = h.x + i * spikeW;
          ctx.beginPath();
          if (h.side === 'top') {
            // Spikes pointing DOWN
            ctx.moveTo(sx, h.y);
            ctx.lineTo(sx + spikeW / 2, h.y + h.h);
            ctx.lineTo(sx + spikeW, h.y);
          } else {
            // Spikes pointing UP
            ctx.moveTo(sx, h.y + h.h);
            ctx.lineTo(sx + spikeW / 2, h.y);
            ctx.lineTo(sx + spikeW, h.y + h.h);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
    });
  }

  _drawGoal(goal) {
    const { ctx, assets } = this;
    if (imgOk(assets.flag)) {
      ctx.drawImage(assets.flag, goal.x, goal.y, goal.w, goal.h);
    } else {
      // Fallback: glowing gold flag pole + flag
      ctx.fillStyle = '#aaa';
      ctx.fillRect(goal.x + 4, goal.y, 4, goal.h);      // pole
      ctx.fillStyle = COLORS.goal;
      ctx.fillRect(goal.x + 8, goal.y, 40, 30);          // flag
      // Glow
      ctx.shadowColor = COLORS.goal;
      ctx.shadowBlur  = 15;
      ctx.fillRect(goal.x + 8, goal.y, 40, 30);
      ctx.shadowBlur  = 0;
    }
  }

  _drawPlayer(player, gravityDir) {
    const { ctx, assets } = this;
    const frame = assets.walkFrames?.[Math.floor(player.animFrame)];

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.scale(player.facingRight ? 1 : -1, gravityDir === -1 ? -1 : 1);

    if (imgOk(frame)) {
      ctx.drawImage(frame, -player.width / 2, -player.height / 2, player.width, player.height);
    } else {
      // Fallback: simple character shape
      const w = player.width;
      const h = player.height;
      // Body
      ctx.fillStyle = COLORS.player;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h * 0.65, 6);
      ctx.fill();
      // Head
      ctx.fillStyle = '#5dade2';
      ctx.beginPath();
      ctx.arc(0, -h / 2 + 2, w * 0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = 'white';
      ctx.fillRect(4, -h / 2 - 4, 6, 6);
      ctx.fillStyle = '#1a252f';
      ctx.fillRect(6, -h / 2 - 3, 3, 3);
    }
    ctx.restore();
  }

  _drawHUD(currentLevel) {
    const { ctx, canvas } = this;
    const label = currentLevel <= TOTAL_LEVELS ? `Chapitre ${currentLevel}` : 'Niveau Personnalisé';
    ctx.fillStyle   = COLORS.hud;
    ctx.font        = "italic 22px 'Palatino Linotype', serif";
    ctx.textAlign   = 'center';
    ctx.shadowBlur  = 8;
    ctx.shadowColor = 'black';
    ctx.fillText(`${label} • Espace pour défier les lois`, canvas.width / 2, canvas.height - 30);
    ctx.shadowBlur  = 0;
  }
}
