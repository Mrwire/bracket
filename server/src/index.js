/**
 * Ce fichier est conservé pour la compatibilité avec les scripts existants, 
 * mais l'application utilise maintenant server.js à la racine du dossier server.
 * 
 * Voir : server.js pour le point d'entrée principal de l'application.
 */

console.log('Ce fichier est déprécié. Veuillez utiliser server.js à la racine du dossier server.');

// Rediriger vers le bon fichier
try {
  require('../server');
} catch (error) {
  console.error('Erreur lors du chargement du serveur principal:', error);
  console.log('Veuillez vous assurer que toutes les dépendances sont installées et que le fichier server.js existe.');
}
