# Gravity Wizard

**Gravity Wizard** est un jeu de plateformes 2D jouable dans le navigateur, basé sur une mécanique centrale d'inversion de gravité. Le joueur doit traverser plusieurs chapitres en alternant entre sol, plafond et plateformes intermédiaires pour éviter les cristaux du Néant et atteindre le drapeau.

## Jouer en ligne

https://elgualicho.github.io/Gravity-Shifter/

---

## Contrôles

| Touche | Action |
|--------|--------|
| `←` `→` | Se déplacer horizontalement |
| `Espace` | Inverser la gravité, uniquement au contact d'une surface |
| `Échap` | Revenir au menu principal pendant une partie |
| `R` / `Entrée` | Recommencer après un game over |

---

## Concept de gameplay

Le jeu repose sur une logique simple : le personnage ne saute pas vraiment, il **inverse la gravité**.

- En gravité normale, le joueur tombe vers le bas et marche sur le dessus des plateformes.
- En gravité inversée, le joueur tombe vers le haut et s'accroche au dessous des plateformes.
- L'inversion est autorisée seulement quand le joueur touche une surface : sol, plafond ou plateforme intermédiaire.
- Les cristaux bloquent certaines zones et forcent le joueur à choisir le bon moment pour inverser la gravité.

Chaque niveau est construit autour d'une lecture en trois temps :

1. **Entrée** : zone de placement avant le danger.
2. **Danger** : cristaux à éviter en utilisant la gravité.
3. **Sortie** : zone sûre pour récupérer le contrôle avant la section suivante.

---

## Niveaux jouables

| Niveau | Structure | Objectif de design | Assets principaux |
|---|---|---|---|
| 1 | Sol + 2 plafonds | Apprentissage de la mécanique d'inversion | `background.png`, `platform1.png` |
| 2 | Sol + plafonds + 1 plateforme milieu | Introduction d'une transition intermédiaire | `background.png`, `platform1.png` |
| 3 | Sol + plafonds + 2 plateformes milieu | Enchaînements plus longs et hauteurs variées | `background.png`, `platform1.png` |
| 4 | Sol hiver dédié + 3 plafonds + 1 plateforme milieu | Niveau hiver plus structuré, avec chemin obligatoire | `background_winter.png`, `floor_winter.png`, `platform2.png` |

### Chemin du niveau 4

```txt
sol → c1 → sol → c2 → milieu1 → c3 → sol → goal
```

Le niveau 4 utilise un sol spécifique, `floor_winter.png`, séparé des plateformes flottantes. Les plateformes du niveau 4 restent basées sur `platform2.png`.

Le chemin est volontairement dirigé : la plateforme milieu sert de pont obligatoire entre le deuxième plafond et le troisième plafond. Les cristaux au sol empêchent de traverser directement sans utiliser la gravité.

---

## Direction artistique

Le jeu suit une direction artistique **fantasy / arcane / hiver magique** :

- menu principal sombre et doré, ambiance grimoire / magie ;
- fond naturel pour les trois premiers niveaux ;
- fond hivernal pour le chapitre 4 ;
- sol hiver dédié en `1672 x 85 px` ;
- plateformes acier/glace sur le niveau 4 ;
- cristaux comme danger principal ;
- animation de marche en 4 frames pour rendre le personnage plus vivant.

---

## Interface

- Menu principal intégré en HTML/CSS.
- Écran de game over dédié, sans `alert` navigateur.
- Boutons : recommencer le chapitre ou revenir au menu.
- Raccourcis clavier après échec : `R`, `Entrée`, `Échap`.
- Texte de gameplay en bas d'écran supprimé pour ne pas gêner la lecture du sol.

Note : la victoire de niveau passe actuellement directement au niveau suivant. La victoire finale renvoie au menu. Un écran de victoire dédié reste une amélioration possible.

---

## Structure des fichiers

```txt
Gravity-Shifter/
├── index.html
├── game.js
├── visual-adjustments.js
├── style.css
└── assets/
    ├── background.png
    ├── background_winter.png
    ├── floor_winter.png
    ├── platform1.png
    ├── platform2.png
    ├── flag.png
    ├── pics.png
    ├── walk1.png
    ├── walk2.png
    ├── walk3.png
    └── walk4.png
```

### Rôle des fichiers principaux

| Fichier | Rôle |
|---|---|
| `index.html` | Structure HTML, canvas, menu principal, écran game over, chargement des scripts |
| `style.css` | Direction artistique de l'interface HTML : menu, boutons, overlays |
| `game.js` | Moteur principal : physique, gravité, niveaux, collisions, rendu de base |
| `visual-adjustments.js` | Ajustements visuels fins sans modifier les collisions ni la gravité |

---

## Assets

| Asset | Rôle |
|---|---|
| `background.png` | Fond des niveaux 1 à 3 |
| `background_winter.png` | Fond du niveau 4 |
| `floor_winter.png` | Sol continu du niveau 4, format actuel `1672 x 85 px` |
| `platform1.png` | Plateformes et sol des niveaux 1 à 3 |
| `platform2.png` | Plateformes flottantes du niveau 4 |
| `pics.png` | Cristaux / pièges |
| `flag.png` | Objectif de fin de niveau |
| `walk1.png` à `walk4.png` | Animation de marche du joueur |

---

## Paramètres techniques importants dans `game.js`

| Constante | Valeur actuelle | Rôle |
|---|---:|---|
| `GRAVITY` | `0.8` | Accélération gravitationnelle |
| `MAX_VY` | `13` | Vitesse verticale maximale |
| `MAX_VX` | `9` | Vitesse horizontale maximale |
| `ACCEL` | `1.3` | Accélération horizontale |
| `FRIC` | `0.78` | Friction à l'arrêt |
| `FLIP_OFFSET` | `12` | Décalage anti-recollision après inversion |
| `PLAYER_W` | `75` | Largeur du joueur |
| `PLAYER_H` | `95` | Hauteur du joueur |
| `PLAT_W` | `320` | Largeur fixe des plateformes |
| `PLAT_H` | `60` | Hauteur fixe des plateformes |
| `FLOOR_H` | `65` | Hauteur du sol standard |
| `WINTER_FLOOR_H` | `85` | Hauteur du sol hiver du niveau 4 |
| `CRYSTAL_W` | `65` | Largeur des cristaux |
| `CRYSTAL_H` | `70` | Hauteur des cristaux |
| `HBOX_MX` | `20` | Marge horizontale de hitbox des cristaux |
| `HBOX_MY` | `18` | Marge verticale de hitbox des cristaux |

La gravité et les collisions sont actuellement considérées comme stables. Les ajustements visuels doivent rester séparés dans `visual-adjustments.js`.

---

## Ajustements visuels dans `visual-adjustments.js`

Ces constantes décalent uniquement le rendu des sprites à l'écran. Elles ne changent pas la physique, les hitbox, les collisions, le sol ou la gravité.

| Constante | Valeur actuelle | Impact |
|---|---:|---|
| `PLAYER_VISUAL_Y_OFFSET` | `10` | Décale visuellement `walk1.png` à `walk4.png` de 10 px vers le bas |
| `PICS_VISUAL_Y_OFFSET` | `9` | Décale visuellement `pics.png` de 9 px vers le bas |
| `FLAG_VISUAL_Y_OFFSET` | `15` | Décale visuellement `flag.png` de 15 px vers le bas |

Ces valeurs ont été réglées pour que les assets soient mieux posés visuellement par rapport au sol `floor_winter.png`, sans casser la gravité.

---

## État actuel du projet

- [x] 4 niveaux jouables
- [x] Physique antigravité complète
- [x] Inversion de gravité seulement au contact d'une surface
- [x] Mouvement horizontal fluide avec accélération et friction
- [x] Vitesse verticale plafonnée
- [x] Plateformes sol, plafond et milieu
- [x] Animation joueur en 4 frames
- [x] Assets différenciés entre niveaux normaux et niveau hiver
- [x] Sol hiver dédié au niveau 4
- [x] Ajustements visuels séparés de la physique
- [x] Menu principal HTML/CSS cohérent avec la direction artistique
- [x] Écran de game over intégré, sans pop-up navigateur
- [x] Suppression du texte bas d'écran pendant le gameplay
- [ ] Écran de victoire dédié
- [ ] Musique et effets sonores
- [ ] Niveaux supplémentaires
- [ ] Éventuel système de sélection/progression de niveaux

---

## Notes importantes pour la suite

- Ne pas modifier la gravité sans nécessité : le comportement actuel est validé.
- Les ajustements de placement visuel doivent se faire dans `visual-adjustments.js`.
- `floor_winter.png` doit rester dans `assets/` et conserver une hauteur cohérente avec `WINTER_FLOOR_H = 85`.
- Les plateformes flottantes du niveau 4 doivent continuer à utiliser `platform2.png`, pas `floor_winter.png`.
- Si de nouveaux sols dédiés sont ajoutés plus tard, prévoir une logique similaire à `WINTER_FLOOR_H` plutôt que d'étirer une plateforme existante.
