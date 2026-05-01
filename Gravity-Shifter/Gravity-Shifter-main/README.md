# Gravity Shifter

Platformer 2D où le joueur manipule la gravité pour traverser des niveaux.

## Architecture

```
Gravity-Shifter/
├── index.html          # Point d'entrée HTML
├── style.css           # Styles globaux
├── main.js             # Orchestrateur — boucle de jeu, câblage des modules
├── src/
│   ├── constants.js    # Constantes partagées (GRAVITY, PLAYER, EVENTS…)
│   ├── LevelData.js    # Données pures des niveaux (zéro dépendance DOM)
│   ├── GameLogic.js    # Simulation physique (zéro DOM/canvas)
│   ├── InputManager.js # Clavier → actions pures
│   └── Renderer.js     # Rendu canvas (zéro logique de jeu)
└── assets/             # Images (non versionnées)
```

### Séparation des responsabilités

| Module | Rôle | DOM ? | Canvas ? |
|---|---|---|---|
| `GameLogic` | Physique, collisions, état | ✗ | ✗ |
| `LevelData` | Données des niveaux | ✗ | ✗ |
| `InputManager` | Capture clavier | event listeners | ✗ |
| `Renderer` | Dessin | ✗ | ✓ |
| `main.js` | Câblage + boucle | ✓ | ✗ |

> **GameLogic** et **LevelData** sont intentionnellement sans dépendances DOM/canvas — ils sont prêts à tourner côté serveur (Colyseus / Node.js) pour le passage en multijoueur.

## Stack technique

- Vanilla JS (ES Modules)
- Canvas API
- Aucune dépendance externe

## Roadmap multijoueur (Kiasma)

- [ ] Migrer vers **Phaser.js** pour le rendu
- [ ] Intégrer **Colyseus** (Node.js) comme serveur de jeu
- [ ] `GameLogic` devient la game loop serveur (aucune modif nécessaire)
- [ ] `InputManager` émet vers le réseau au lieu de lire le clavier localement
- [ ] Modes envisagés : coopératif, compétitif, asynchrone (ghost replay)

## Contrôles

| Touche | Action |
|---|---|
| ← → | Déplacer le personnage |
| Espace | Inverser la gravité (au sol uniquement) |
| Échap | Menu principal |
