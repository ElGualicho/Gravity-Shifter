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
| # | Flips requis | Spécificités |
|---|---|---|
| 1 | 2 | Sol + plafond uniquement. Apprentissage de la mécanique. |
| 2 | 3 | +1 plateforme milieu. Chemin sol → plafond → milieu → plafond → sol. |
| 3 | 4 | +2 plateformes milieu à hauteurs différentes. Cristaux plus nombreux. |

---

## Fichiers
```
Gravity-Shifter/
├── index.html      # Page principale
├── game.js         # Logique du jeu (physique, niveaux, rendu)
├── style.css       # Styles de la page
└── assets/
    ├── background.png
    ├── platform1.png   # Seul asset plateforme utilisé (taille fixe 320×60)
    ├── flag.png
    ├── pics.png        # Cristaux / pièges
    └── walk1-4.png     # Frames d'animation du joueur
```

---

## Paramètres techniques clés (`game.js`)
| Constante | Valeur | Rôle |
|-----------|--------|------|
| `GRAVITY` | `0.8` | Accélération gravitationnelle |
| `PLAT_W` | `320` | Largeur fixe des plateformes (taille naturelle de l'asset) |
| `PLAT_H` | `60` | Hauteur fixe des plateformes |
| `CRYSTAL_W/H` | `65 / 70` | Taille naturelle d'un cristal |
| `HBOX_MX/MY` | `20 / 18` | Marge de tolérance des hitbox cristaux |
| `player.speed` | `9` | Vitesse de déplacement |

---

## État du projet
- [x] 3 niveaux jouables
- [x] Physique antigravité complète
- [x] Plateformes sol, plafond et milieu
- [x] Animations joueur (4 frames)
- [x] Level design adaptatif (positions en % de la largeur d'écran)
- [ ] Écran de game over dédié (actuellement `alert`)
- [ ] Musique / effets sonores
- [ ] Niveaux supplémentaires
