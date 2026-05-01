/**
 * InputManager.js — Keyboard state → pure action intents.
 * Zero DOM side-effects beyond event listeners.
 * Future: replace with network messages for multiplayer.
 */

export class InputManager {
  constructor() {
    this._keys    = {};
    this._onFlip  = null;
    this._onPause = null;

    this._handleDown = (e) => {
      this._keys[e.code] = true;
      if (e.code === 'Space')  this._onFlip?.();
      if (e.code === 'Escape') this._onPause?.();
    };
    this._handleUp = (e) => { this._keys[e.code] = false; };

    window.addEventListener('keydown', this._handleDown);
    window.addEventListener('keyup',   this._handleUp);
  }

  onFlip(fn)  { this._onFlip  = fn; }
  onPause(fn) { this._onPause = fn; }

  get moveRight() { return !!this._keys['ArrowRight']; }
  get moveLeft()  { return !!this._keys['ArrowLeft'];  }

  flush()   { this._keys = {}; }

  destroy() {
    window.removeEventListener('keydown', this._handleDown);
    window.removeEventListener('keyup',   this._handleUp);
  }
}
