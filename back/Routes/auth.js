const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const checkToken = require('../Middlewares/check-token.js');

// Fichiers JSON
const config = require('../config.json');
const db = require('../DataBase/db.js');
//

const app = express();

// Utilisation de express.json() pour analyser les requêtes JSON
app.use(express.json());

//-------------------------------LIMITEUR DE REQUETE ET CONNEXION-----------------------------------------//

const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre de 1 minute
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limite à 5 tentatives de connexion par IP par 15 minutes
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
});

app.use(globalLimiter);

//-------------------------------LOGIN----------------------------------//

app.post(config.login, loginLimiter, async (req, res) => {
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

    // Vérifier la validité de l'email
    if (!mail.includes('@') || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(mail)) {
        return res.status(400).json({ message: 'Email invalide' });
    }

    // Vérifier que la taille du pseudonyme respecte une valeur minimale et une valeur maximale
    if (!username || username.length < 3 || username.length > 30 || /[^a-zA-Z0-9_]/.test(username)) {
        return res.status(400).json({ message: 'Nom d\'utilisateur invalide (doit être entre 3 et 30 caractères et ne contenir que des lettres, chiffres et underscores).' });
    }

    // Vérifier la taille pour le nom
    if (!lastname || lastname.length < 2 || lastname.length > 50 || /[^a-zA-Z\s-]/.test(lastname)) {
        return res.status(400).json({ message: 'Nom invalide (doit être entre 2 et 50 caractères et ne contenir que des lettres, espaces et tirets).' });
    }

    // Vérifier la taille pour le prénom
    if (!firstname || firstname.length < 2 || firstname.length > 50 || /[^a-zA-Z\s-]/.test(firstname)) {
        return res.status(400).json({ message: 'Prénom invalide (doit être entre 2 et 50 caractères et ne contenir que des lettres, espaces et tirets).' });
    }

    // Vérifier la taille du mot de passe
    if (!password || password.length < 6 || password.length > 20 || /[^a-zA-Z0-9!@#$%^&*()_+={}\[\]:;"'<>,.?\/\\|-]/.test(password)) {
        return res.status(400).json({ message: 'Mot de passe invalide (doit être entre 6 et 20 caractères et ne contenir que des lettres, chiffres et symboles autorisés).' });
    }

    // Vérifier que l'email n'existe pas déjà dans la base de données
    const sqlSelect = 'SELECT * FROM UserData WHERE mail = ?';
    db.query(sqlSelect, [mail], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'utilisateur' });
        }

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email déjà pris' });
        }

        // Hachage du mot de passe
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Insertion de l'utilisateur dans la base de données
        const sqlInsert = 'INSERT INTO UserData (username, lastname, firstname, mail, password) VALUES (?, ?, ?, ?, ?)';
        db.query(sqlInsert, [username, lastname, firstname, mail, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de l\'inscription dans la base de données' });
            }

            res.status(201).json({ message: 'Utilisateur créé avec succès' });
        });
    });
});

//------------------------------------verif token---------------------------------------------//

app.get(config.verifytoken, (req, res) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ valid: false, message: "Token manquant ou mal formaté" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, config.key, (err, decoded) => {
        if (err) {
            return res.status(401).json({ valid: false, message: "Token invalide" });
        }

        const sql = 'SELECT id, lastname, firstname, mail FROM UserData WHERE id = ?';
        db.query(sql, [decoded.id], (dbErr, results) => {
            if (dbErr || results.length === 0) {
                return res.status(401).json({ valid: false, message: "Utilisateur non trouvé" });
            }

            const user = results[0];

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    lastName: user.lastname,
                    firstName: user.firstname,
                    mail: user.mail
                }
            });
        });
    });
});

//------------------------------------Récupérer Info User---------------------------------------------//
app.get(config.getUser, checkToken, async (req, res) => {
  const userId = req.userId;  // Récupérer l'ID de l'utilisateur depuis le middleware
  console.log('userId récupéré dans la route :', userId);  // Debugger ici

  if (!userId) {
    return res.status(401).json({ message: 'ID utilisateur manquant. Token invalide.' });
  }

  const sql = 'SELECT id, username, lastname, firstname, mail FROM UserData WHERE id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];
    res.status(200).json(user); // Retourner les données de l'utilisateur
  });
});





//------------------------------------Modifier Info User---------------------------------------------//
app.put(config.updateUser, checkToken, async (req, res) => {
  const userId = req.userId;  // L'ID de l'utilisateur est extrait du token

  const { username, lastname, firstname, mail, password } = req.body;

  // Validation de l'email
  if (mail && (!mail.includes('@') || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(mail))) {
    return res.status(400).json({ message: 'Email invalide' });
  }

  // Validation du mot de passe
  if (password && (password.length < 6 || password.length > 20)) {
    return res.status(400).json({ message: 'Mot de passe invalide (doit être entre 6 et 20 caractères).' });
  }

  let hashedPassword = undefined;
  if (password) {
    hashedPassword = bcrypt.hashSync(password, 10); // Hash le mot de passe
  }

  // Construction de la mise à jour
  let updateQuery = 'UPDATE UserData SET ';
  let updateValues = [];

  if (username) {
    updateQuery += 'username = ?, ';
    updateValues.push(username);
  }

  if (lastname) {
    updateQuery += 'lastname = ?, ';
    updateValues.push(lastname);
  }

  if (firstname) {
    updateQuery += 'firstname = ?, ';
    updateValues.push(firstname);
  }

  if (mail) {
    updateQuery += 'mail = ?, ';
    updateValues.push(mail);
  }

  if (password) {
    updateQuery += 'password = ?, ';
    updateValues.push(hashedPassword);
  }

  // Suppression de la virgule finale
  updateQuery = updateQuery.slice(0, -2);
  updateQuery += ' WHERE id = ?';
  updateValues.push(userId); // L'ID de l'utilisateur extrait du token

  db.query(updateQuery, updateValues, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({ message: 'Utilisateur mis à jour avec succès' });
  });
});


module.exports = app;
