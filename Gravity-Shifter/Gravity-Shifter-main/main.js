/**
 * main.js — Entry point. Wires GameLogic ↔ InputManager ↔ Renderer.
 */

import { GAME_STATE, TOTAL_LEVELS, EVENT } from './src/constants.js';
import { GameLogic }    from './src/GameLogic.js';
import { InputManager } from './src/InputManager.js';
import { Renderer }     from './src/Renderer.js';

// ─── Canvas setup ─────────────────────────────────────────────────────────────

const canvas = document.getElementById('gameCanvas');
const menuEl = document.getElementById('gameMenu');

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  if (gameState === GAME_STATE.PLAYING) logic.loadLevel(logic.currentLevel);
});

// ─── Module instances ─────────────────────────────────────────────────────────

const renderer = new Renderer(canvas);
const input    = new InputManager();
const logic    = new GameLogic(canvas.width, canvas.height);

// ─── State ────────────────────────────────────────────────────────────────────

let gameState   = GAME_STATE.MENU;
let pendingFlip = false;

// ─── Input wiring ─────────────────────────────────────────────────────────────

input.onFlip(() => {
  if (gameState === GAME_STATE.PLAYING) pendingFlip = true;
});
input.onPause(() => {
  if (gameState === GAME_STATE.PLAYING) showMenu();
});

// ─── Menu ─────────────────────────────────────────────────────────────────────

function showMenu() {
  gameState            = GAME_STATE.MENU;
  menuEl.style.display = 'flex';
  input.flush();
}

function startGame(levelNumber) {
  menuEl.style.display = 'none';
  gameState            = GAME_STATE.PLAYING;
  logic.loadLevel(levelNumber);
  input.flush();
}

window.startGame = startGame;

// ─── Game loop ─────────────────────────────────────────────────────────────────

function loop() {
  try {
    if (gameState === GAME_STATE.MENU) {
      renderer.drawMenu();
    } else {
      const frameInput = {
        moveLeft:    input.moveLeft,
        moveRight:   input.moveRight,
        flipGravity: pendingFlip,
      };
      pendingFlip = false;

      const event = logic.update(frameInput);
      renderer.drawGame(logic.getState());
      if (event) handleEvent(event);
    }
  } catch (err) {
    console.error('[GravityShifter] loop error:', err);
  }
  requestAnimationFrame(loop);
}

function handleEvent({ type, payload }) {
  if (type === EVENT.DEATH) {
    const msg = payload === 'hazard'
      ? 'Le Néant vous a rattrapé...'
      : "Perdu dans l'éther...";
    setTimeout(() => {
      alert(msg);
      logic.loadLevel(logic.currentLevel);
      input.flush();
    }, 0);
    return;
  }
  if (type === EVENT.LEVEL_COMPLETE) {
    const level = payload;
    if (level < TOTAL_LEVELS) {
      setTimeout(() => {
        alert(`Niveau ${level} réussi !`);
        logic.loadLevel(level + 1);
        input.flush();
      }, 0);
    } else {
      setTimeout(() => {
        alert('Incroyable ! Vous êtes le Maître de la Gravité !');
        showMenu();
      }, 0);
    }
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
// Loop démarre immédiatement — les assets se chargent en arrière-plan.
// Les fallbacks colorés du Renderer gèrent le rendu si les images ne sont pas encore prêtes.

loop();
renderer.loadAssets().catch(err => console.error('[GravityShifter] loadAssets error:', err));
