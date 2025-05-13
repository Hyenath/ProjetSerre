const jwt = require('jsonwebtoken');

//Fichiers JSON
const config = require('../config.json');

function checkToken(req, res, next) {
    const token = req.headers['authorization'];

    if (token && token.startsWith('Bearer ')) {
        const actualToken = token.split(' ')[1];  // Extraire le token réel

        jwt.verify(actualToken, config.key, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Token invalide ou expiré' });
            }
            req.userId = decoded.id;  // Récupérer l'ID de l'utilisateur depuis le token
            next();
        });
    } else {
        return res.status(401).json({ message: 'Token manquant ou mal formaté. Vous devez être connecté.' });
    }
}

module.exports = checkToken;