# Gravity Wizard

**Gravity Wizard** est un jeu de plateformes 2D jouable dans le navigateur, basé sur une mécanique centrale d'inversion de gravité. Le joueur traverse plusieurs chapitres en alternant entre sol, plafond et plateformes intermédiaires pour éviter les cristaux du Néant et atteindre le drapeau.

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
| `Suppr` / `Backspace` | Supprimer l'élément sélectionné dans le mode développeur |

---

## Gameplay

Le personnage ne saute pas : il **inverse la gravité**.

- Gravité normale : le joueur tombe vers le bas et marche sur le dessus des plateformes.
- Gravité inversée : le joueur tombe vers le haut et s'accroche au dessous des plateformes.
- L'inversion est autorisée uniquement au contact d'une surface.
- Les cristaux forcent le bon timing d'inversion.
- Les niveaux sont conçus avec des zones d'entrée, des zones de danger, puis des zones de sortie.

La gravité et les collisions sont actuellement validées. Les ajustements visuels doivent rester séparés dans `visual-adjustments.js`.

---

## Niveaux jouables

| Niveau | Thème | Structure | Assets principaux |
|---|---|---|---|
| 1 | Nature / herbe | Sol + 2 plafonds | `background.png`, `floor_grass.png`, `platform1.png` |
| 2 | Été / argile | Sol + plafonds + 1 plateforme milieu | `background_summer.png`, `floor_clay.png`, `platform1.png` |
| 3 | Pierre | Sol + plafonds + 2 plateformes milieu | `background.png`, `floor_stone.png`, `platform1.png` |
| 4 | Hiver | Sol hiver + 3 plafonds + 1 plateforme milieu | `background_winter.png`, `floor_winter.png`, `platform2.png` |
| 5 | Métal / usine | Niveau type chapitre 4, mais entièrement métal | `background_steel.png`, `floor_steel.png`, `platform4.png` |
| 6 | Été difficile / argile | Nouveau tracé plus exigeant avec 5 plateformes | `background_summer.png`, `floor_clay.png`, `platform7.png` |
| 7+ | Custom | Niveaux créés dans le mode développeur | Selon le thème choisi |

### Chemin des niveaux avancés 4 et 5

```txt
sol → c1 → sol → c2 → milieu1 → c3 → sol → goal
```

Le chapitre 5 reprend volontairement la structure validée du chapitre 4. Seule l'identité visuelle change : environnement métal, fond `background_steel.png`, sol `floor_steel.png`, plateformes `platform4.png`.

### Chapitre 6

Le chapitre 6 utilise le thème été / argile avec `background_summer.png`, `floor_clay.png` et `platform7.png`. Sa disposition est différente des chapitres 4 et 5 : elle ajoute deux plateformes intermédiaires à hauteurs contrastées et davantage de cristaux au sol, afin d'augmenter légèrement la difficulté sans modifier la gravité.

---

## Mode développeur

Un **mode développeur MVP** est disponible directement depuis le menu principal avec le bouton :

```txt
🛠️ Mode développeur
```

Il permet de créer visuellement des niveaux depuis le canvas, sans modifier le code manuellement.

### Fonctionnalités disponibles

- Choix du thème du niveau :
  - Nature / herbe ;
  - Été / argile ;
  - Pierre ;
  - Hiver ;
  - Métal.
- Placement visuel dans le canvas :
  - plateformes ;
  - pics au sol ;
  - pics au plafond ;
  - drapeau.
- Déplacement des éléments à la souris.
- Suppression de l'élément sélectionné avec `Suppr` ou `Backspace`.
- Bouton `Tester` pour lancer immédiatement le niveau en cours de création.
- Bouton `Enregistrer` pour ajouter le niveau après les six niveaux intégrés.
- Bouton `Exporter JSON` pour récupérer la structure du niveau.
- Bouton `Vider` pour repartir d'un niveau vierge.

### Sauvegarde locale

Les niveaux créés dans le mode développeur sont stockés dans le navigateur via `localStorage` avec la clé :

```js
const CUSTOM_LEVEL_STORAGE_KEY = 'gravityWizardCustomLevels';
```

Les niveaux sauvegardés apparaissent ensuite dans le menu principal sous forme de chapitres custom :

```txt
🧪 Chapitre 7 custom
🧪 Chapitre 8 custom
...
```

### Export JSON

Le bouton `Exporter JSON` génère une version portable du niveau. Cette exportation sert à intégrer plus tard un niveau custom de façon permanente dans le repo.

Exemple de structure exportée :

```json
{
  "name": "Niveau custom",
  "theme": "grass",
  "platforms": [
    {
      "xRatio": 0.25,
      "yRatio": 0.42,
      "w": 320,
      "h": 60
    }
  ],
  "hazards": [
    {
      "xRatio": 0.45,
      "yRatio": 0.82,
      "w": 130,
      "h": 70,
      "side": "bottom"
    }
  ],
  "goal": {
    "xRatio": 0.82,
    "yRatio": 0.78,
    "w": 100,
    "h": 110
  }
}
```

### Limite volontaire

Le site étant hébergé sur GitHub Pages, le mode développeur **n'écrit pas directement dans le dépôt GitHub**. Écrire automatiquement dans le repo nécessiterait un backend ou un token GitHub exposé côté client, ce qui n'est pas souhaitable.

Le workflow recommandé est donc :

```txt
Créer visuellement → Tester → Enregistrer localement → Exporter JSON → Intégrer au repo si le niveau est validé
```

---

## Thèmes d'assets dans `game.js`

Le jeu utilise deux niveaux de mapping :

1. `themePresets`, qui décrit les biomes disponibles ;
2. `levelThemes`, qui associe les niveaux intégrés à un thème précis.

```js
const themePresets = {
    grass: { background: backgroundImg, floor: floorGrassImg, platform: platImg, floorHeight: FLOOR_H },
    clay: { background: bgSummerImg, floor: floorClayImg, platform: platImg7, floorHeight: FLOOR_H },
    stone: { background: backgroundImg, floor: floorStoneImg, platform: platImg, floorHeight: FLOOR_H },
    winter: { background: bgWinterImg, floor: floorWinterImg, platform: platImg2, floorHeight: WINTER_FLOOR_H },
    steel: { background: bgSteelImg, floor: floorSteelImg, platform: platImg4, floorHeight: STEEL_FLOOR_H }
};

const levelThemes = {
    1: { ...themePresets.grass, platform: platImg },
    2: { ...themePresets.clay, platform: platImg },
    3: { ...themePresets.stone, platform: platImg },
    4: themePresets.winter,
    5: themePresets.steel,
    6: themePresets.clay
};
```

Cette logique permet aussi au mode développeur de créer des niveaux custom avec les mêmes thèmes que le jeu principal.

---

## Direction artistique

Le jeu suit une direction artistique **fantasy / arcane**, avec une progression par biomes :

- nature / herbe ;
- été / argile ;
- pierre ;
- hiver magique ;
- métal / usine ;
- été difficile / argile.

Le menu principal garde une ambiance sombre, dorée et magique. Les niveaux ont désormais des sols dédiés plutôt qu'un simple étirement des plateformes.

---

## Interface

- Menu principal intégré en HTML/CSS.
- Accès direct aux chapitres 1 à 6 depuis le menu.
- Accès direct aux chapitres custom enregistrés localement.
- Mode développeur intégré sous forme de panneau latéral.
- Écran de game over dédié, sans `alert` navigateur.
- Boutons : recommencer le chapitre ou revenir au menu.
- Raccourcis clavier après échec : `R`, `Entrée`, `Échap`.
- Texte bas d'écran supprimé pendant le gameplay pour ne pas gêner la lecture des sols.

Note : la victoire de niveau passe actuellement directement au niveau suivant. La victoire finale renvoie au menu. Un écran de victoire dédié reste une amélioration possible.

---

## Structure des fichiers

```txt
Gravity-Shifter/
├── index.html
├── game.js
├── visual-adjustments.js
├── dev-editor.js
├── style.css
└── assets/
    ├── background.png
    ├── background_summer.png
    ├── background_winter.png
    ├── background_steel.png
    ├── floor_grass.png
    ├── floor_clay.png
    ├── floor_stone.png
    ├── floor_winter.png
    ├── floor_steel.png
    ├── platform1.png
    ├── platform2.png
    ├── platform4.png
    ├── platform7.png
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
| `index.html` | Structure HTML, canvas, menu principal, écran game over, panneau développeur, chargement des scripts |
| `style.css` | Direction artistique de l'interface HTML : menu, boutons, overlays, panneau développeur |
| `game.js` | Moteur principal : physique, gravité, niveaux intégrés, niveaux custom, collisions, thèmes d'assets |
| `visual-adjustments.js` | Ajustements visuels fins sans modifier les collisions ni la gravité |
| `dev-editor.js` | Éditeur visuel de niveaux, sauvegarde locale et export JSON |

---

## Assets

| Asset | Rôle |
|---|---|
| `background.png` | Fond naturel principal |
| `background_summer.png` | Fond été / sécheresse |
| `background_winter.png` | Fond hiver |
| `background_steel.png` | Fond métal / usine du niveau 5 |
| `floor_grass.png` | Sol herbe du niveau 1 |
| `floor_clay.png` | Sol argile / été des niveaux 2 et 6 |
| `floor_stone.png` | Sol pierre du niveau 3 |
| `floor_winter.png` | Sol continu hiver du niveau 4, format actuel `1672 x 85 px` |
| `floor_steel.png` | Sol métal du niveau 5 |
| `platform1.png` | Plateformes des niveaux nature / base |
| `platform2.png` | Plateformes acier/glace du niveau 4 |
| `platform4.png` | Plateformes métal du niveau 5 |
| `platform7.png` | Plateformes été / argile du niveau 6 et du thème `clay` |
| `pics.png` | Cristaux / pièges |
| `flag.png` | Objectif de fin de niveau |
| `walk1.png` à `walk4.png` | Animation de marche du joueur |

---

## Paramètres techniques importants dans `game.js`

| Constante | Valeur actuelle | Rôle |
|---|---:|---|
| `BUILTIN_LEVEL_COUNT` | `6` | Nombre total de niveaux intégrés |
| `CUSTOM_LEVEL_STORAGE_KEY` | `gravityWizardCustomLevels` | Clé `localStorage` des niveaux custom |
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
| `FLOOR_H` | `65` | Hauteur des sols standards |
| `WINTER_FLOOR_H` | `85` | Hauteur du sol hiver du niveau 4 |
| `STEEL_FLOOR_H` | `65` | Hauteur du sol métal du niveau 5 |
| `CRYSTAL_W` | `65` | Largeur des cristaux |
| `CRYSTAL_H` | `70` | Hauteur des cristaux |
| `HBOX_MX` | `20` | Marge horizontale de hitbox des cristaux |
| `HBOX_MY` | `18` | Marge verticale de hitbox des cristaux |

---

## Ajustements visuels dans `visual-adjustments.js`

Ces constantes décalent uniquement le rendu des sprites à l'écran. Elles ne changent pas la physique, les hitbox, les collisions, le sol ou la gravité.

| Constante | Valeur actuelle | Impact |
|---|---:|---|
| `PLAYER_VISUAL_Y_OFFSET` | `10` | Décale visuellement `walk1.png` à `walk4.png` de 10 px vers le bas |
| `PICS_VISUAL_Y_OFFSET` | `9` | Décale visuellement `pics.png` de 9 px vers le bas |
| `FLAG_VISUAL_Y_OFFSET` | `15` | Décale visuellement `flag.png` de 15 px vers le bas |
| `INVERTED_PLAYER_ATTACH_OFFSET` | `26` | Rapproche visuellement le joueur de 26 px vers les plateformes hautes en gravité inversée |
| `INVERTED_PICS_ATTACH_OFFSET` | `22` | Rapproche visuellement les pics de 22 px vers les plateformes hautes |

Ces valeurs ont été réglées pour que les assets soient mieux posés visuellement par rapport aux sols et plateformes, sans casser la gravité.

---

## État actuel du projet

- [x] 6 niveaux intégrés jouables
- [x] Chapitres custom sauvegardés localement
- [x] Mode développeur visuel MVP
- [x] Export JSON des niveaux custom
- [x] Chapitre 5 métal / usine avec `platform4.png`
- [x] Chapitre 6 été / argile avec `platform7.png`
- [x] Physique antigravité complète
- [x] Inversion de gravité seulement au contact d'une surface
- [x] Mouvement horizontal fluide avec accélération et friction
- [x] Vitesse verticale plafonnée
- [x] Plateformes sol, plafond et milieu
- [x] Animation joueur en 4 frames
- [x] Table de thèmes par niveau dans `game.js`
- [x] Assets différenciés par biome
- [x] Sols dédiés par niveau
- [x] Ajustements visuels séparés de la physique
- [x] Menu principal HTML/CSS cohérent avec la direction artistique
- [x] Écran de game over intégré, sans pop-up navigateur
- [x] Suppression du texte bas d'écran pendant le gameplay
- [ ] Écran de victoire dédié
- [ ] Musique et effets sonores
- [ ] Intégration permanente des niveaux exportés depuis le mode développeur
- [ ] Système de sélection/progression de niveaux plus complet

---

## Notes importantes pour la suite

- Ne pas modifier la gravité sans nécessité : le comportement actuel est validé.
- Les ajustements de placement visuel doivent se faire dans `visual-adjustments.js`.
- Les sols dédiés doivent rester dans `assets/` et être associés via `themePresets` / `levelThemes`.
- Les plateformes flottantes doivent être déclarées via `levelThemes` ou via les niveaux custom.
- Les niveaux créés dans le mode développeur sont locaux au navigateur tant qu'ils ne sont pas intégrés au repo.
- Si un nouveau biome est ajouté, créer un couple `background_*` + `floor_*`, puis l'ajouter dans `themePresets`.
