const express = require('express');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

const config = require('./config.json');

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

//----------------DEFAULT PAGE IF TOKEN TO REDIRECT--------------//
app.get("/", (req, res) => {
    const authHeader = req.headers["authorization"];

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        jwt.verify(token, config.key, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Token invalide ou expiré" });
            }
            // Si le token est valide, rediriger vers la page React
            res.redirect("http://localhost:3001/dashboard");
        });
    } else {
        res.send("Bienvenue sur le backend ! Connectez-vous pour accéder à l'application.");
    }
});

//-------------------------------LIMITEUR DE REQUETE ET CONNEXION-----------------------------------------//

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limite chaque IP à 50 requêtes par windowMs
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite à 5 tentatives de connexion par IP par 15 minutes
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
});

app.use(globalLimiter);

//-------------------------------MIDDLEWARE POUR LE TOKEN----------------------------------------//

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

//-------------------------------LOGIN----------------------------------//

app.post(config.login, loginLimiter, checkToken, async (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM UserData WHERE username = ?';

    db.query(sql, [username], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur serveur' });
        }

        if (!results || results.length === 0) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        const user = results[0];

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            config.key,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Connexion réussie',
            token
        });
    });
});

//-----------------------------------------------REGISTER-------------------------------------------------------//

app.post(config.register, async (req, res) => {
    const { username, lastname, firstname, mail, password } = req.body;

    if (!mail.includes('@')) {
        return res.status(400).json({ message: 'Email invalide' });
    }

    const sqlSelect = 'SELECT * FROM UserData WHERE mail = ?';
    db.query(sqlSelect, [mail], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email déjà pris' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const sqlInsert = 'INSERT INTO UserData (username, lastname, firstname, mail, password) VALUES (?, ?, ?, ?, ?)';
        db.query(sqlInsert, [username, lastname, firstname, mail, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de l\'inscription dans la base de données' });
            }

            const token = jwt.sign(
                { id: result.insertId, email: mail },
                config.key,
                { expiresIn: '1h' }
            );

            res.status(201).json({ message: 'Inscription réussie', userId: result.insertId, mail, token });
        });
    });
});

//------------------------------------verif token---------------------------------------------//

app.post(config.token, (req, res) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, message: "Token manquant ou mal formaté" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, config.key, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: "Token invalide" });
        }

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
                    firstName: user.prenom,
                    lastName: user.nom,
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
