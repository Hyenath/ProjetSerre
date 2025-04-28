const jwt = require('jsonwebtoken');

//Fichiers JSON
const config = require('../config.json');

function checkToken(req, res, next) {
    const token = req.headers['authorization'];

    if (token) {
        jwt.verify(token.split(' ')[1], config.key, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Token invalide ou expiré' });
            }
            return res.status(400).json({ message: 'Déjà connecté' });
        });
    } else {
        next();
    }
}

module.exports = checkToken;