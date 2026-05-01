/**
 * LevelData.js — Pure data, zero DOM/canvas dependencies.
 * Receives world dimensions so geometry adapts to screen size.
 */

export function getLevelData(levelNumber, worldWidth, worldHeight) {
  const floorY = worldHeight - 60;
  const floor  = { x: 0, y: floorY, w: worldWidth * 2, h: 100, type: 8 };

  const goalDefault = {
    x: worldWidth - 150,
    y: floorY - 110,
    w: 100,
    h: 110,
  };

  const levels = {
    1: {
      playerStart: { x: 80, y: 200 },
      platforms: [
        floor,
        { x: 350,  y: 400, w: 250, h: 80, type: 2 },
        { x: 700,  y: 200, w: 200, h: 70, type: 4 },
        { x: 1000, y: 450, w: 150, h: 60, type: 5 },
        { x: 200,  y: 150, w: 120, h: 60, type: 7 },
        { x: 1250, y: 300, w: 180, h: 70, type: 6 },
      ],
      hazards: [
        { x: 600, y: floorY - 50, w: 120, h: 60, side: 'bottom' },
        { x: 450, y: 45,          w: 120, h: 60, side: 'top'    },
      ],
      goal: goalDefault,
    },

    2: {
      playerStart: { x: 80, y: worldHeight - 150 },
      platforms: [
        floor,
        { x: 300,  y: worldHeight - 220, w: 140, h: 60, type: 7 },
        { x: 550,  y: 180,               w: 120, h: 50, type: 5 },
        { x: 850,  y: worldHeight - 250, w: 160, h: 70, type: 3 },
        { x: 1100, y: 150,               w: 110, h: 50, type: 7 },
        { x: 1400, y: 380,               w: 130, h: 60, type: 5 },
      ],
      hazards: [
        { x: 450, y: floorY - 50, w: 300, h: 60, side: 'bottom' },
        { x: 700, y: 45,          w: 240, h: 60, side: 'top'    },
      ],
      goal: goalDefault,
    },

    3: {
      playerStart: { x: 80, y: worldHeight / 2 },
      platforms: [
        floor,
        { x: 300, y: 150,               w: 100, h: 300, type: 2 },
        { x: 600, y: worldHeight - 350,  w: 100, h: 300, type: 2 },
        { x: 900, y: 300,               w: 150, h: 60,  type: 6 },
      ],
      hazards: [
        { x: 400, y: floorY - 50, w: 500, h: 60, side: 'bottom' },
        { x: 0,   y: 45,          w: 600, h: 60, side: 'top'    },
      ],
      goal: goalDefault,
    },
  };

  return levels[levelNumber] ?? null;
}
