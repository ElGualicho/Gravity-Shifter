# Gravity Wizard

Jeu de plateformes 2D avec mécanique d'inversion de gravité.

## Jouer en ligne
https://elgualicho.github.io/Gravity-Shifter/

---

## Contrôles
| Touche | Action |
|--------|--------|
| `←` `→` | Se déplacer |
| `Espace` | Inverser la gravité *(au sol seulement)* |
| `Échap` | Menu principal |

---

## Mécanique centrale
- **Gravité normale** (`dir = 1`) : le joueur tombe vers le bas et se pose sur le **dessus** des plateformes.
- **Gravité inversée** (`dir = -1`) : le joueur monte vers le haut et s'accroche au **dessous** des plateformes plafond.
- L'inversion n'est possible que lorsque le joueur est **au contact d'une surface**.

Chaque section de niveau suit la logique :
1. **Zone d'entrée** – sol libre pour se placer sous la prochaine plateforme.
2. **Zone de cristaux** – sol bloqué, le joueur doit être en hauteur.
3. **Zone de sortie** – sol libre pour atterrir sans risque après le basculement.

---

## Niveaux
| # | Flips requis | Spécificités | Assets |
|---|---|---|---|
| 1 | 2 | Sol + plafond. Apprentissage. | `platform1` + `background` |
| 2 | 3 | +1 plateforme milieu. Cristal plafond sur c2. | `platform1` + `background` |
| 3 | 4 | +2 plateformes milieu à hauteurs différentes. | `platform1` + `background` |
| 4 | 5 | 3 plafonds + 1 milieu. Milieu bloque l'accès direct à c3. Cristaux denses. | `platform2` + `background_winter` |

### Chemin niveau 4
```
sol → c1 → sol → c2 → milieu1 (obligatoire) → c3 → sol → goal
```
La plateforme milieu1 est positionnée de façon à bloquer l'accès direct depuis
le sol vers c3 (cristaux au sol dans cette zone). Le joueur **doit** passer par
c2 → milieu1 → c3.

---

## Fichiers
```
Gravity-Shifter/
├── index.html
├── game.js          # Physique, niveaux, rendu
├── style.css
└── assets/
    ├── background.png          # Fond niveaux 1-3
    ├── background_winter.png   # Fond niveau 4 (hiver)
    ├── platform1.png           # Plateforme herbe/terre (niveaux 1-3)
    ├── platform2.png           # Plateforme acier (niveau 4)
    ├── flag.png
    ├── pics.png                # Cristaux / pièges
    └── walk1-4.png             # Frames d'animation joueur
```

---

## Paramètres techniques clés (`game.js`)
| Constante | Valeur | Rôle |
|-----------|--------|------|
| `GRAVITY` | `0.8` | Accélération gravitationnelle |
| `MAX_VY`  | `13`  | Vitesse terminale (chute plafonnée) |
| `MAX_VX`  | `9`   | Vitesse horizontale max |
| `ACCEL`   | `1.3` | Accélération au démarrage |
| `FRIC`    | `0.78`| Friction à l'arrêt |
| `PLAT_W`  | `320` | Largeur fixe des plateformes |
| `PLAT_H`  | `60`  | Hauteur fixe des plateformes |
| `CRYSTAL_W/H` | `65 / 70` | Taille naturelle d'un cristal |
| `HBOX_MX/MY`  | `20 / 18` | Marge de tolérance hitbox cristaux |

---

## État du projet
- [x] 4 niveaux jouables
- [x] Physique antigravité complète
- [x] Mouvement fluide (accélération + friction + vitesse terminale)
- [x] Plateformes sol, plafond et milieu
- [x] Animations joueur (4 frames)
- [x] Assets différenciés par niveau (platform1/2, bg normal/hiver)
- [x] Positions plateformes adaptatives (% de l'écran)
- [ ] Écran de game over dédié (actuellement `alert`)
- [ ] Musique / effets sonores
- [ ] Niveaux supplémentaires
