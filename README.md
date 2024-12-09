README : Utilisation du projet Spotify API
Introduction
Bienvenue dans le projet Spotify API. Ce projet permet d'interagir avec l'API Spotify afin d'extraire des données sur les artistes, les albums, les pistes, et plus encore. Utilisez ce guide pour comprendre comment lancer le projet, l'utiliser et contribuer.

Prérequis
Avant de commencer, assurez-vous d'avoir les éléments suivants :

Un compte Spotify développeur : Vous devez créer un compte sur la plateforme Spotify pour obtenir des informations d'identification (Client ID et Client Secret) nécessaires pour accéder à l'API Spotify.
Node.js et npm : Assurez-vous d'avoir Node.js et npm installés sur votre machine. Vous pouvez télécharger Node.js à partir de nodejs.org.
Installation
Pour lancer le projet, suivez ces étapes :

Cloner le dépôt :

bash
Copier le code
git clone https://github.com/BR4NJO/Spotify_API.git
cd Spotify_API
Installer les dépendances :

bash
Copier le code
npm install
Configuration des identifiants Spotify :

Allez sur le portail Spotify pour les développeurs.
Créez une nouvelle application pour obtenir Client ID et Client Secret.
Ouvrez le fichier .env dans le projet et ajoutez vos informations d'identification :
plaintext
Copier le code
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
Démarrage du serveur :

bash
Copier le code
npm start
Utilisation de l'API : L'API est maintenant en marche et prête à être utilisée. Accédez aux points de terminaison de l'API via votre navigateur ou un outil comme curl ou Postman pour interagir avec les données Spotify.
