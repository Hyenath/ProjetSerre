const jwt = require('jsonwebtoken');

//Fichiers JSON
const config = require('../config.json');

function checkToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token manquant ou mal formaté' });
    }

    jwt.verify(token.split(' ')[1], config.key, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token invalide ou expiré' });
        }

        req.user = decoded;
        next();
    });
}

module.exports = checkToken;