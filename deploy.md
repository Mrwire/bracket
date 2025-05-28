# Guide de déploiement sur VPS 141.94.208.84

Ce guide vous aidera à déployer rapidement l'application Tournament Bracket Manager sur le VPS spécifique 141.94.208.84.

## Prérequis sur le VPS
- Node.js (v14+ recommandé)
- Git
- PM2 (pour maintenir l'application en fonctionnement)

## Étapes de déploiement

### 1. Connexion au VPS
```bash
ssh utilisateur@141.94.208.84
```

### 2. Cloner le dépôt GitHub
```bash
# Créer un répertoire pour l'application
mkdir -p /var/www/bracket
cd /var/www/bracket

# Cloner le dépôt
git clone https://github.com/Mrwire/bracket.git .
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configuration (optionnel)
Vous pouvez modifier le port par défaut (5000) en éditant le fichier `server/server.js` ou en définissant la variable d'environnement PORT :
```bash
export PORT=8080
```

### 5. Démarrer l'application

#### Option 1 : Démarrage simple
```bash
npm start
```

#### Option 2 : Démarrage avec PM2 (recommandé pour la production)
```bash
# Installer PM2 si ce n'est pas déjà fait
npm install -g pm2

# Démarrer l'application avec PM2
pm2 start server/server.js --name "bracket-tournament"

# Configurer PM2 pour démarrer automatiquement au redémarrage du serveur
pm2 save
pm2 startup
```

### 6. Configuration du serveur web (Nginx/Apache)

Si vous souhaitez utiliser un nom de domaine et/ou HTTPS, configurez un reverse proxy avec Nginx ou Apache.

#### Exemple de configuration Nginx
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7. Mise à jour de l'application

Pour mettre à jour l'application avec les dernières modifications :

```bash
cd /var/www/bracket
git pull

# Redémarrer l'application si nécessaire
npm install  # Si les dépendances ont changé
pm2 restart bracket-tournament  # Si vous utilisez PM2
```

## Accès à l'application

Une fois déployée, votre application sera accessible à :
- http://adresse-ip-vps:5000 (ou le port que vous avez configuré)
- http://votre-domaine.com (si vous avez configuré un nom de domaine)

N'oubliez pas que le mot de passe par défaut est : `api123456`
