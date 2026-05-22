# Projet Adventura

## Introduction

Adventura est une application mobile de jeu de piste géolocalisé. Les joueurs partent à la découverte de "quêtes" cachées dans le monde réel, résolvent des énigmes et collectionnent des trésors sous forme de pixel art.

## Présentation de l'application

Adventura est une application de chasse au trésor géolocalisée qui combine exploration réelle, collecte et création artistique. Le joueur se déplace dans le monde réel, suit sa position sur la carte, repère des zones de trésor et se rapproche physiquement de ces lieux pour progresser. L'expérience met en avant la curiosité, l'esprit d’aventure et une progression de type RPG (points, niveaux, inventaire, collection).

L'univers visuel est centré sur le pixel art : les trésors trouvés et créés prennent la forme d’objets pixelisés. La progression se fait via des récompenses (pièces, objets, cosmétiques) qui permettent de personnaliser son profil et d’améliorer son expérience. La dimension créative est portée par l’Atelier, où les joueurs peuvent concevoir leurs propres trésors et les publier.

## Boucle de jeu (vue d'ensemble)

1. **Explorer la carte** : repérer des zones de trésor et se rapprocher d’elles.
2. **Obtenir des indices** : utiliser des clés d’indices pour affiner la localisation d’un trésor.
3. **Débloquer la récompense** : passer en réalité augmentée pour ouvrir un coffre et récupérer une récompense.
4. **Progresser** : gagner des PX et des pièces, compléter sa collection et gravir les classements.
5. **Créer** : dessiner des trésors en pixel art dans l’Atelier et gérer leur statut avant publication.
6. **Personnaliser** : acheter des cosmétiques et boosters dans le Marché, choisir un thème de carte et un avatar.

## Fonctionnalités principales (détaillées)

- **Carte interactive géolocalisée**
  - Affichage de la position du joueur en temps réel.
  - Zones de trésors matérialisées sur la carte.
  - Contrôles de zoom et recentrage rapide sur l’utilisateur.
  - Accès rapide à l’expérience AR depuis la carte.
- **Chasses au trésor en AR**
  - Interaction avec un coffre en réalité augmentée.
  - Ouverture par appui prolongé avec retour haptique.
  - Récompense immédiate lors de l’ouverture.
- **Atelier de création (pixel art)**
  - Éditeur de dessin avec grille et tailles variables.
  - Outils de création (pinceau, gomme, pipette, remplissage).
  - Gestion des créations par statut : brouillon, en attente, publié.
  - Prévisualisation des créations et organisation par catégories.
- **Marché & économie**
  - Boutique de cosmétiques : avatars et thèmes de carte.
  - Objets de progression : clés d’indices et boosters de pièces.
  - Raretés (commun, rare, épique, légendaire) et prix en pièces.
  - Gestion d’un mini-inventaire d’objets achetés.
- **Classements**
  - Classement des explorateurs (points et trésors trouvés).
  - Classement des artisans (créations publiées).
  - Mise en avant des meilleurs joueurs et suivi du rang.
- **Profil & progression**
  - Statistiques détaillées : PX, trésors trouvés/créés, expéditions, badges.
  - Inventaire d’objets et collection des trésors découverts.
  - Paramètres de personnalisation (thèmes de carte, avatar).
  - Notifications (mises à jour, cadeaux, informations).
  - Signalement de problèmes ou contenus inappropriés.

## Structure du Projet

Le projet est développé avec React Native et Expo, en utilisant TypeScript. La navigation est gérée par `expo-router`.

### Fichiers principaux

- **`app.json`**: Fichier de configuration principal d'Expo, contenant les métadonnées de l'application, les icônes, les écrans de démarrage, les plugins, etc.
- **`package.json`**: Définit les dépendances du projet et les scripts (démarrage, build, etc.).
- **`tsconfig.json`**: Fichier de configuration de TypeScript.
- **`app/_layout.tsx`**: Layout principal de l'application, utilisant `expo-router` pour définir la structure de navigation de base.
- **`app/(tabs)/_layout.tsx`**: Définit la navigation par onglets de l'application, avec les écrans principaux : Carte, Marché, Classement, Atelier et Profil.
- **`app/ar.tsx`**: Écran pour l'expérience en réalité augmentée.

### Données de l'application

Les données de l'application sont stockées localement sur l'appareil de l'utilisateur à l'aide de `@react-native-async-storage/async-storage`. La gestion des données est répartie dans les fichiers suivants :

- **`app/data/profileStorage.ts`**: Gère le profil de l'utilisateur (nom d'utilisateur, avatar).
- **`app/data/progressStorage.ts`**: Suit la progression du joueur (XP, trésors trouvés, quêtes terminées, pixel arts collectés).
- **`app/data/questsStorage.ts`**: Gère les créations de l'atelier et les trésors de la carte.

## Dépendances

### Principales dépendances

- **`expo`**: Framework de base pour le développement d'applications React Native.
- **`expo-router`**: Pour la navigation basée sur les fichiers.
- **`react-native-maps`**: Pour l'affichage des cartes et la géolocalisation.
- **`@react-native-async-storage/async-storage`**: Pour le stockage de données local.
- **`expo-camera`**: Pour les fonctionnalités liées à la caméra (utilisée dans l'écran AR).
- **`@reactvision/react-viro`**: Pour la réalité augmentée.

### Dépendances de développement

- **`typescript`**: Pour le typage statique du code.
- **`eslint`**: Pour le linting du code.

## Scripts

- **`npm start`**: Démarre le serveur de développement Expo.
- **`npm run android`**: Lance l'application sur un appareil ou un émulateur Android.
- **`npm run ios`**: Lance l'application sur un appareil ou un simulateur iOS.
- **`npm run web`**: Lance l'application dans un navigateur web.
- **`npm run lint`**: Analyse le code à la recherche d'erreurs de style.

## Configuration

### Google Maps

La clé API de Google Maps pour Android est configurée dans `app.json` sous `android.config.googleMaps.apiKey`.

### Permissions

L'application demande les permissions pour la caméra et la galerie de photos, configurées dans `app.json` sous les clés `ios.infoPlist` et `plugins`.

## Démarrage Rapide

1.  **Installer les dépendances :**
    ```bash
    npm install
    ```
2.  **Lancer l'application :**
    ```bash
    npm start
    ```
3.  Scannez le QR code avec l'application Expo Go sur votre téléphone ou lancez l'application sur un émulateur.
