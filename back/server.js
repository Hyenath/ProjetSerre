const express = require('express');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

const config = require('./config.json');
const secretKey = config.key

//------------------------------------------------MISE EN PLACE DE L'API---------------------------------------------------------//

app.use(cors());
app.use(express.json());

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
        console.log('Connexion réussie à la base de données MySQL');
    }
});

//----------------------------------LIMITEUR DE REQUETE ET CONNEXION-----------------------------------------//

// Configuration du rate-limiter pour toutes les routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limite chaque IP à 100 requêtes par windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
});

// Limite spécifique pour la route de connexion
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite à 5 tentatives de connexion par IP par 15 minutes
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
});

// Utiliser le rate-limiter global pour toutes les routes
app.use(globalLimiter);

//-------------------------------FONCTION POUR TOKEN----------------------------------------//

function checkToken(req, res, next) {
    const token = req.headers['authorization'];
    console.log("lancement");
    if (token) {
        jwt.verify(token.split(' ')[1], secretKey.key, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Token invalide ou expiré' });
            }
            // Si le token est valide, informer que l'utilisateur est déjà connecté
            return res.status(400).json({ message: 'Déjà connecté' });
        });
    } else {
        next();
    }
}

//-------------------------------LOGIN----------------------------------//

// Route pour la connexion avec un limiteur spécifique
app.post('/login', loginLimiter, checkToken, async (req, res) => {
    console.log("Données reçues:", req.body); // Vérifie ce qui est reçu

    const { email, password } = req.body;
    console.log("Email reçu:", email);

    const sql = 'SELECT * FROM user WHERE email = ?';

    db.query(sql, [email], (err, results) => {
        if (err) {
            console.error("Erreur SQL:", err); // Affiche l'erreur SQL si elle existe
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        console.log("Résultats SQL:", results); // Vérifie le contenu de results

        if (!results || results.length === 0) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        const user = results[0];
        console.log("Utilisateur trouvé:", user);

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            secretKey.key,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Connexion réussie',
            token
        });
    });
});


//-----------------------------------------------REGISTER-------------------------------------------------------//

// Route POST pour l'inscription avec multer pour gérer les fichiers
app.post('/register', async (req, res) => {
    const { firstname, name, email, password } = req.body;

    // Validation de l'email
    if (!email.includes('@')) {
        return res.status(400).json({ message: 'Email invalide' });
    }

    // Vérifier si l'email existe déjà
    const sqlSelect = 'SELECT * FROM user WHERE email = ?';
    db.query(sqlSelect, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email déjà pris' });
        }

        // Hasher le mot de passe
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insérer l'utilisateur dans la base de données
        const sqlInsert = 'INSERT INTO user (nom, prenom, email, password) VALUES (?, ?, ?, ?)';
        db.query(sqlInsert, [name, firstname, email, hashedPassword], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ message: 'Erreur lors de l\'inscription dans la base de données' });
            }

            // Création du token avec les infos du nouvel utilisateur
            const token = jwt.sign(
                { id: result.insertId, email: email }, // Utilisation de result.insertId pour l'ID
                secretKey.key,
                { expiresIn: '1h' }
            );

            res.status(201).json({ message: 'Inscription réussie', userId: result.insertId, email, token });
        });
    });
});

//------------------------------------verif token---------------------------------------------//

app.post('/check-token', (req, res) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, message: "Token manquant ou mal formaté" });
    }

    const token = authHeader.split(" ")[1]; // Récupère le token après "Bearer "

    jwt.verify(token, secretKey.key, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: "Token invalide" });
        }

        // Récupération des informations utilisateur depuis la base de données (optionnel)
        const sql = 'SELECT id, prenom, nom, email FROM user WHERE id = ?';
        db.query(sql, [decoded.id], (dbErr, results) => {
            if (dbErr || results.length === 0) {
                return res.status(401).json({ valid: false, message: "Utilisateur non trouvé" });
            }

            const user = results[0];

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    firstName: user.prenom, // "prenom" dans la base de données
                    lastName: user.nom, // "nom" dans la base de données
                    email: user.email
                }
            });
        });
    });
});


// Démarrer le serveur
app.listen(3001, () => {
    console.log(`Serveur en écoute sur le port 3001`);
});