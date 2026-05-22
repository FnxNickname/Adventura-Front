# Projet Adventura

## Introduction

Adventura est une application mobile de jeu de piste géolocalisé. Les joueurs partent à la découverte de "quêtes" cachées dans le monde réel, résolvent des énigmes et collectionnent des trésors sous forme de pixel art.

## Présentation de l'application

Adventura mêle exploration réelle et progression RPG légère : vous suivez votre position sur une carte, repérez des zones de trésor, utilisez des indices, puis récupérez des récompenses et des pièces pour enrichir votre collection. L'expérience est pensée pour encourager la découverte, la créativité et la compétition amicale.

## Fonctionnalités principales

- **Carte interactive géolocalisée** : suivi de la position, zones de trésors, zoom et recentrage rapide.
- **Chasses au trésor en AR** : ouverture de coffres en réalité augmentée avec retour haptique.
- **Atelier de création** : éditeur de pixel art pour concevoir des trésors, gérer leurs statuts (brouillon, en attente, publié).
- **Marché** : achats de cosmétiques (avatars, thèmes de carte) et d'objets de progression (clés d'indices, boosters de pièces).
- **Classements** : compétitions entre explorateurs et artisans pour les points, trésors et créations.
- **Profil & progression** : statistiques, inventaire, collection de trouvailles, thèmes actifs, notifications et signalement.

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
