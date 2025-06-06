const mysql = require('mysql2');

//Fichiers JSON
const config = require('../config.json');
//


const db = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
});

db.connect(err => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
    }
});

module.exports = db;