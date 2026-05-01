/**
 * GameLogic.js — Pure game simulation. Zero DOM / canvas dependencies.
 * This module is the future "server-side" logic for multiplayer.
 *
 * Public API:
 *   new GameLogic(worldWidth, worldHeight)
 *   .loadLevel(levelNumber)  → bool
 *   .update(input)           → { type, payload } | null
 *   .getState()              → snapshot (read-only)
 */

import { GRAVITY, PLAYER, EVENT } from './constants.js';
import { getLevelData }           from './LevelData.js';

export class GameLogic {
  constructor(worldWidth, worldHeight) {
    this._w = worldWidth;
    this._h = worldHeight;

    this.player       = this._defaultPlayer();
    this.platforms    = [];
    this.hazards      = [];
    this.goal         = { x: 0, y: 0, w: 0, h: 0 };
    this.gravityDir   = 1;  // 1 = down, -1 = up
    this.currentLevel = 1;
  }

  loadLevel(levelNumber) {
    const data = getLevelData(levelNumber, this._w, this._h);
    if (!data) return false;

    this.currentLevel = levelNumber;
    this.gravityDir   = 1;
    this.player       = this._defaultPlayer();
    this.player.x     = data.playerStart.x;
    this.player.y     = data.playerStart.y;
    this.platforms    = data.platforms;
    this.hazards      = data.hazards;
    this.goal         = data.goal;
    return true;
  }

  update(input) {
    const p = this.player;

    // Flip gravity (Space, only when on surface)
    if (input.flipGravity && p.onSurface) {
      this.gravityDir *= -1;
      p.onSurface      = false;
      p.y             += this.gravityDir * 10;
    }

    // Horizontal movement
    p.isMoving = false;
    let nextX  = p.x;
    if (input.moveRight) { nextX += PLAYER.SPEED; p.isMoving = true; p.facingRight = true;  }
    if (input.moveLeft)  { nextX -= PLAYER.SPEED; p.isMoving = true; p.facingRight = false; }
    if (!this._collidesWithPlatforms(nextX, p.y, p.width, p.height)) p.x = nextX;
    p.x = Math.max(0, Math.min(p.x, this._w - p.width));

    // Animation
    if (p.isMoving && p.onSurface) {
      p.animFrame += PLAYER.ANIMATION_SPEED;
      if (p.animFrame >= PLAYER.WALK_FRAMES) p.animFrame = 0;
    } else {
      p.animFrame = 0;
    }

    // Vertical physics
    p.velY     += GRAVITY * this.gravityDir;
    p.y        += p.velY;
    p.onSurface = false;

    for (const plat of this.platforms) {
      if (!this._overlaps(p.x, p.y, p.width, p.height, plat.x, plat.y, plat.w, plat.h)) continue;
      if (this.gravityDir === 1) {
        if (p.velY > 0) { p.y = plat.y - p.height; p.velY = 0; p.onSurface = true; }
        else            { p.y = plat.y + plat.h;    p.velY = 0; }
      } else {
        if (p.velY < 0) { p.y = plat.y + plat.h;   p.velY = 0; p.onSurface = true; }
        else            { p.y = plat.y - p.height;  p.velY = 0; }
      }
    }

    // Hazard check
    for (const h of this.hazards) {
      if (this._overlaps(p.x, p.y, p.width, p.height, h.x, h.y, h.w, h.h))
        return { type: EVENT.DEATH, payload: 'hazard' };
    }

    // Out of bounds
    if (p.y < -100 || p.y > this._h + 100)
      return { type: EVENT.DEATH, payload: 'oob' };

    // Goal check
    const g = this.goal;
    if (this._overlaps(p.x, p.y, p.width, p.height, g.x, g.y, g.w, g.h))
      return { type: EVENT.LEVEL_COMPLETE, payload: this.currentLevel };

    return null;
  }

  getState() {
    return {
      player:       { ...this.player },
      platforms:    this.platforms,
      hazards:      this.hazards,
      goal:         this.goal,
      gravityDir:   this.gravityDir,
      currentLevel: this.currentLevel,
    };
  }

  _defaultPlayer() {
    return {
      x: 80, y: 200,
      width: PLAYER.WIDTH, height: PLAYER.HEIGHT,
      velY: 0, onSurface: false,
      isMoving: false, facingRight: true, animFrame: 0,
    };
  }

  _overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  _collidesWithPlatforms(x, y, w, h) {
    return this.platforms.some(p => this._overlaps(x, y, w, h, p.x, p.y, p.w, p.h));
  }
}
