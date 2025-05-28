# Tournament Bracket Manager 🏆

Une application web mono-page (SPA) sophistiquée pour la gestion d'un tournoi à élimination directe avec 16 participants.

![Bracket Tournament UI](https://via.placeholder.com/800x400?text=Tournament+Bracket+Manager)

## 🌟 Caractéristiques

### Interface Utilisateur Futuriste
- Design sombre avec accents néon orange et cyan
- Animations avancées avec effets de transition et surbrillance
- Connecteurs de bracket dynamiques avec animations fluides
- Interface responsive optimisée pour tablette et desktop
- Scrollbars personnalisées pour une meilleure expérience utilisateur

### Fonctionnalités Principales
- **Visualisation complète du bracket** (16 participants, 4 rounds)
- **Mode Admin** pour la modification des scores
- **Protection par mot de passe** pour l'accès à l'application
- **Gestion avancée des participants** (modification des noms et upload d'images)
- **Propagation automatique** des gagnants vers les rounds suivants
- **API RESTful** pour intégration avec des systèmes tiers (ex: régie vMix)

## 🔧 Architecture

### Frontend
- HTML5, CSS3 et JavaScript (Vanilla)
- Interface utilisateur responsive et intuitive
- Visualisation claire du bracket avec animations
- Support pour les photos des participants

### Backend
- Node.js avec Express
- Stockage des données dans un fichier JSON
- API RESTful complète
- Support pour les images (encodage base64)

## 📚 API Documentation (Port 3500)

Base URL : `http://localhost:3500`

### Endpoints disponibles

#### 1. Obtenir la structure complète du tournoi
- **GET** `/api/bracket`
- **Réponse** :
```json
{
  "rounds": [...],
  "participants": [...]
}
```

#### 2. Mettre à jour le score d’un match et propager le gagnant
- **POST** `/api/bracket/match/:id`
- **Body** (JSON) :
```json
{
  "teams": [ { "name": "Team A", "score": 2, "image": null }, { "name": "Team B", "score": 1, "image": null } ],
  "winner": 0
}
```
- **Réponse** : `{ "success": true, ... }`

#### 3. Obtenir le match en cours (premier non complété)
- **GET** `/api/bracket/current-match`
- **Réponse** :
```json
{
  "round": "Demi-finale",
  "match": 13,
  "teams": ["Team A", "Team B"],
  "score": [2, 1],
  "images": [null, null]
}
```

#### 4. Obtenir le gagnant du tournoi
- **GET** `/api/bracket/final`
- **Réponse** :
```json
{
  "winner": "Team A",
  "score": [2, 1],
  "teams": ["Team A", "Team B"],
  "images": [null, null]
}
```

#### 5. Mettre à jour un participant (nom ou image)
- **POST** `/api/bracket/participant`
- **Body** (JSON) :
```json
{
  "oldName": "Team A",
  "newName": "Team Alpha",
  "image": "data:image/png;base64,..."
}
```
- `newName` et `image` sont optionnels (au moins un requis)

#### 6. Obtenir la liste des participants
- **GET** `/api/bracket/participants`
- **Réponse** :
```json
[
  { "name": "Team Alpha", "image": null },
  ...
]
```

---
**Remarques importantes** :
- L’application utilise le port **3500** par défaut (changeable dans `server.js`).
- Mot de passe par défaut : `api123456` (modifiable dans `client/script.js`).
- Toutes les routes API renvoient des données au format JSON.
- Pour les requêtes POST, le header `Content-Type: application/json` est requis.

---

## 🚀 Installation et Démarrage

### Prérequis
- Node.js (v14+ recommandé)
- npm ou yarn

### Installation
```bash
# Cloner le repository
git clone [url_du_repo]
cd tournament-bracket

# Installer les dépendances
npm install
```

### Démarrage
```bash
# Démarrer l'application
npm start
```

L'application sera accessible à l'adresse: http://localhost:5000

## 🔐 Sécurité et Accès

- Mot de passe par défaut: `api123456`
- Mode Admin: Accessible via `?admin=true` dans l'URL ou en cliquant sur le bouton "Mode Admin"

## 📱 Utilisation

1. **Connexion**: Entrez le mot de passe pour accéder à l'application
2. **Visualisation du bracket**: Parcourez les différents rounds du tournoi
3. **Mode Admin**: Activez-le pour modifier les scores
4. **Édition des participants**: Utilisez l'onglet "Participants" pour modifier noms et images
5. **Saisie des scores**: En mode admin, cliquez sur "Modifier le score" pour un match spécifique

## 📊 Intégration avec les systèmes externes (vMix)

L'API expose toutes les données nécessaires pour l'intégration avec des systèmes tiers comme vMix:

```json
// Exemple de réponse de /api/bracket/current-match
{
  "round": "Demi-finale",
  "match": 13,
  "teams": ["Team A", "Team B"],
  "score": [2, 1],
  "images": ["data:image/...", "data:image/..."]
}
```

## 🛠️ Personnalisation et Configuration

- **Apparence**: Modifiez les variables CSS dans `client/styles.css` pour personnaliser entièrement les couleurs, animations et styles
- **Accès**: Changez la constante `PASSWORD` dans `client/script.js` (par défaut: `api123456`)
- **Données initiales**: Le script `server/initBracket.js` initialise automatiquement le tournoi avec 16 équipes nommées
- **Structure des données**: Format de données optimisé dans `server/data/bracket.json` avec persistance améliorée des participants

## ⚠️ Notes Importantes

- L'application utilise le localStorage pour stocker la session utilisateur
- Les modifications de données sont persistantes et sauvegardées automatiquement
- Les images sont stockées en base64 directement dans le fichier JSON pour une portabilité maximale
- L'architecture a été optimisée pour assurer la consistance des données entre rafraîchissements

---

Développé avec ❤️ pour les passionnés de tournois et compétitions.
