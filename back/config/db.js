const mysql = require('mysql2');
const config = require('../config.json'); // adapte le chemin si besoin

const db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
});

db.connect(err => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
    } else {
    }
});

module.exports = db;