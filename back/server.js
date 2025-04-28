const express = require('express');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2');

//Gestion des Classes

//Poseidon
const Poseidon = require('./class/Poseidon.js');
const poseidon = new Poseidon('192.168.65.253', 502);
//


//Gestion des fichiers
const fs = require('fs');
const path = require('path');
//

const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

//Fichiers JSON
const config = require('./config.json');
const RegParam = require('./RegParam.json');
const RegParamSave = require('./RegParamSave.json');

//Pour lancer les serveurs, se référer au package.json du frontreact//


//------------------------------------------------MISE EN PLACE DE L'API---------------------------------------------------------//

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({ //db => database
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


//-------------------------------LIMITEUR DE REQUETE ET CONNEXION-----------------------------------------//

const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limite chaque IP à 50 requêtes par windowMs
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

            // Création du token JWT
            const token = jwt.sign(
                { id: result.insertId, email: mail },
                config.key,
                { expiresIn: '1h' }
            );

            // Réponse avec succès et token
            res.status(201).json({ message: 'Inscription réussie', userId: result.insertId, mail, token });
        });
    });
});


//------------------------------------verif token---------------------------------------------//

app.post(config.verifytoken, (req, res) => {
    const authHeader = req.headers["authorization"];
    //console.log(globalLimiter);
    

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

//--------------------------------Insérer Valeurs Capteurs dans la base---------------------------------------//
app.post(config.add, checkToken, async (req, res) => {
    try {
        const outdoor_temperature = await poseidon.readoutdoorTemperature();

        // Ajouter la température extérieure à req.body
        req.body.outdoor_temperature = outdoor_temperature;

        // Définition des champs attendus avec leurs contraintes
        const Data = {
            water_network: { allowedValues: ["rain", "tap"] },
            pump: { type: "boolean" },
            rain_water_consumption: { min: 0, max: 500 },
            tap_water_consumption: { min: 0, max: 500 },
            soil_moisture_1: { min: 0, max: 100 },
            soil_moisture_2: { min: 0, max: 100 },
            soil_moisture_3: { min: 0, max: 100 },
            watering: { type: "boolean" },
            misting: { type: "boolean" },
            indoor_air_humidity: { min: 0, max: 100 },
            indoor_temperature: { min: -50, max: 50 },
            outdoor_temperature: { min: -50, max: 50 },
            open_window: { type: "boolean" },
            heating: { type: "boolean" }
        };

        const tab = [];
        console.log("Données reçues :", req.body);

        // Vérification des champs et conversion des valeurs
        for (const field in Data) {
            let value = req.body[field];

            // Vérifier que le champ est bien présent dans la requête
            if (value === undefined) {
                console.log(`Le champ '${field}' est manquant.`);
                return res.status(400).json({
                    success: false,
                    message: `Le champ '${field}' est manquant.`
                });
            }

            // Vérification spécifique pour `water_network`
            if (Data[field].allowedValues) {
                if (!Data[field].allowedValues.includes(value)) {
                    console.log(`La valeur de '${field}' (${value}) est invalide.`);
                    return res.status(400).json({
                        success: false,
                        message: `La valeur de '${field}' doit être "rain" ou "tap".`
                    });
                }
            }
            // Vérification des booléens
            else if (Data[field].type === "boolean") {
                value = value == "1" || value == 1; // Conversion en booléen (true/false)
            }
            // Vérification des nombres
            else {
                value = Number(value); // Conversion en nombre

                // Vérification si la valeur est bien un nombre
                if (isNaN(value)) {
                    console.log(`La valeur de '${field}' est invalide.`);
                    return res.status(400).json({
                        success: false,
                        message: `La valeur de '${field}' doit être un nombre.`
                    });
                }

                // Vérification des limites min/max
                if (value < Data[field].min || value > Data[field].max) {
                    console.log(`La valeur de '${field}' (${value}) est hors limites (${Data[field].min}-${Data[field].max}).`);
                    return res.status(400).json({
                        success: false,
                        message: `La valeur de '${field}' doit être entre ${Data[field].min} et ${Data[field].max}.`
                    });
                }
            }

            tab.push(value);
        }

        // SQL d'insertion dans la base de données
        const sqlInsert = `
            INSERT INTO EventsRegulation 
            (${Object.keys(Data).join(', ')}) 
            VALUES (${Object.keys(Data).map(() => '?').join(', ')})
        `;

        // Exécuter la requête d'insertion dans la base de données
        db.query(sqlInsert, tab, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Erreur lors de l'insertion des valeurs." });
            }
            console.log("Valeurs insérées dans la base de données.");

            // Retourner une réponse de succès avec les valeurs insérées
            return res.status(200).json({
                success: true,
                values: req.body
            });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            errormessage: "Erreur lors de l'insertion."
        });
    }
});


//--------------------------------Récupérer les paramètres de régulation---------------------------------------//
app.get(config.getRegParam, async (req, res) => {
    try {
        const sqlSelect = `
            SELECT
                threshold_low_frozen_water,
                threshold_low_soil_moisture,
                threshold_high_soil_moisture,
                threshold_low_air_humidity,
                threshold_high_air_humidity,
                threshold_low_temperature,
                threshold_high_temperature
            FROM RegulationParameters
        `;
        

        db.query(sqlSelect, (err, result) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur lors de la récupération des paramètres." });
            }

            // Vérifier que chaque valeur est bien un entier
            const isValid = result.every(row =>
            Object.values(row).every(value => Number.isInteger(value))
            );

            if (!isValid) {
                return res.status(400).json({ error: "Les paramètres récupérés ne sont pas tous des entiers valides." });
            }

            console.log("Paramètres récupérés avec succès:", result);

            // Envoyer la réponse au client
            res.status(200).json({
                success: true,
                result
            });
        });

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            errormessage: "Erreur lors de la récupération."
        });
    }
});

//--------------------------------Modifier les paramètres de régulation---------------------------------------//
app.put(config.updateRegParam, checkToken, async (req, res) => {
    try {
        // Chemins des fichiers JSON
        const mainFilePath = path.join(__dirname, 'RegParam.json');
        const SaveFilePath = path.join(__dirname, 'RegParamSave.json');

        // Définition des champs attendus avec leurs contraintes
        const Data = {
            threshold_low_frozen_water: { min: 0, max: 10 },
            threshold_low_soil_moisture: { min: 0, max: 100 },
            threshold_high_soil_moisture: { min: 0, max: 100 },
            threshold_low_air_humidity: { min: 0, max: 100 },
            threshold_high_air_humidity: { min: 0, max: 100 },
            threshold_low_temperature: { min: -50, max: 50 },
            threshold_high_temperature: { min: -50, max: 50 }
        };

        const tab = [];

        console.log("Données reçues :", req.body);

        // Vérification de la validité de chaque champ et de sa valeur
        for (const field in req.body) {
            let value = req.body[field];

            // Vérification de validité de la clé reçue
            if (!Data.hasOwnProperty(field)) {
                console.log(`Le champ '${field}' n'est pas valide.`);
                return res.status(400).json({
                    success: false,
                    message: `Le champ '${field}' n'est pas valide.`
                });
            }

            value = Number(value); // Convertir la valeur en nombre

            // Vérifier que la valeur est bien un nombre
            if (isNaN(value)) {
                console.log(`La valeur de '${field}' n'est pas un nombre.`);
                return res.status(400).json({
                    success: false,
                    message: `La valeur de '${field}' doit être un nombre.`
                });
            }

            // Vérifier les limites min/max
            if (value < Data[field].min || value > Data[field].max) {
                console.log(`La valeur de '${field}' : (${value}) est hors des limites de l'intervalle attendue : (${Data[field].min}-${Data[field].max}).`);
                return res.status(400).json({
                    success: false,
                    message: `La valeur de '${field}' doit être entre ${Data[field].min} et ${Data[field].max}.`
                });
            }

            // Ajouter chaque champ et valeur dans le tableau
            tab.push({ field, value });
        }

        // Appliquer les mises à jour SQL
        for (const update of tab) {
            const { field, value } = update;
            const sqlUpdate = `UPDATE RegulationParameters SET ${field} = ?`;

            // Exécution de la requête SQL
            db.query(sqlUpdate, [value], (err, result) => {
                if (err) {
                    console.error("Erreur SQL :", err);
                    return res.status(500).json({ error: "Erreur lors de la mise à jour des paramètres." });
                }
                console.log(`Valeur modifiée dans la base de données pour ${field} avec ${value}.`);
            });
        }

  
        // Sauvegarde de l'ancien fichier JSON   
        fs.writeFileSync(SaveFilePath, '', 'utf-8'); // Effacer le contenu actuel de la dernière sauvegarde
        fs.writeFileSync(SaveFilePath, fs.readFileSync(mainFilePath, 'utf-8'), 'utf-8');
        
        
        // Démarrer un timer de 5 minutes pour mettre à jour le JSON
        setTimeout(() => {
            try {
                let currentData = {};

                // Mettre à jour chaque champ avec sa nouvelle valeur
                tab.forEach(update => {
                    currentData[update.field] = update.value;
                });
                console.log("erreur? :", currentData);

                // Sauvegarder les nouvelles données dans le fichier JSON
                fs.writeFileSync(mainFilePath, '', 'utf-8'); // Effacer le contenu actuel de la dernière sauvegarde avant d'écrire
                fs.writeFileSync(mainFilePath, JSON.stringify(currentData, null, 2), 'utf-8');
                console.log("Données mises à jour dans RegParam.json après 5 minutes.");

            } catch (err) {
                console.error("Erreur lors de la mise à jour de RegParam.json :", err);
            }
        }, 30000); // 5 minutes (300 000 ms)

        // Générer une réponse dynamiquement pour modifier l'affichage de renvoie de la réponse json, afin de rendre cela plus lisible
        const responseValues = {};
        for (const field of Object.keys(req.body)) {
            responseValues[field] = req.body[field];
        }

        // Retourner la réponse avec le corps dynamique
        return res.status(200).json({
            success: true,
            values: responseValues
        });

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            errormessage: "Erreur lors de la mise à jour."
        });
    }
});

//--------------------------------Route pour vérifier l'accès RFID--------------------------------//
app.post("/check-access", (req, res) => {
    const { rfid_id } = req.body;

    if (!rfid_id) {
        return res.status(400).json({ success: false, message: "UID manquant !" });
    }

    const query = `SELECT AuthorizedAccess.rfid_id, t.id AS access_id FROM AuthorizedAccess a
                   LEFT JOIN TimestampedAccess t ON a.TimestampedAccess_Id = t.id
                   WHERE a.rfid_id = ?`;

    db.query(query, [rfid_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });

        if (result.length > 0) {
            // Accès autorisé -> Enregistrement du passage
            const insertQuery = `INSERT INTO TimestampedAccess (date) VALUES (NOW())`;

            db.query(insertQuery, (err, insertResult) => {
                if (err) return res.status(500).json({ success: false, error: err });

                res.json({
                    success: true,
                    message: "Accès autorisé !",
                    access_id: insertResult.insertId
                });
            });

        } else {
            res.json({ success: false, message: "Accès refusé !" });
        }
    });
});

/*
//---------------------------------OLD ONE---------------------------------------------------------//
//--------------------------------Ajouter les logs dans la base---------------------------------------//
app.post(config.postRFIDLog, async (req, res) => {
    try {
        const { event_type, description, user_id } = req.body; 

        // Vérifier que toutes les données sont bien présentes
        if (!event_type || !description || !user_id) {
            return res.status(400).json({
                success: false,
                message: "Données manquantes. Veuillez fournir event_type, description et user_id."
            });
        }

        // Requête SQL pour insérer un log
        const sqlInsert = `INSERT INTO Authoriezs (event_type, description, user_id, timestamp) VALUES (?, ?, ?, NOW())`;

        db.query(sqlInsert, [event_type, description, user_id], (err, result) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur lors de l'ajout du log." });
            }
            console.log("Log ajouté avec succès.");
            res.status(200).json({
                success: true,
                log_id: result.insertId,
                message: "Log ajouté avec succès."
            });
        });

    } catch (error) {
        console.error("Erreur serveur :", error);
        res.status(500).json({
            success: false,
            errormessage: "Erreur interne lors de l'ajout du log."
        });
    }
});
*/
app.post(config.postRFIDLog, async (req, res) => {
    const { rfid_id, lastname, firstname } = req.body;
    console.log("Body Content: ", req.body);

    if (!rfid_id) {
        return res.status(400).json({ success: false, message: "UID manquant !" });
    }

    try {
        // Insertion dans TimestampedAccess pour enregistrer la date et l'heure et récupérer l'insertId
        const timestampResult = await new Promise((resolve, reject) => {
            db.query('INSERT INTO TimestampedAccess (date) VALUES (NOW())', (err, result) => {
                console.log("Contenu retourné suite à l'insertion", result);
                if (err) {
                    console.error("Erreur lors de l'insertion dans TimestampedAccess : ", err);
                    reject(err);
                } else {
                    console.log("Timestamped de l'accès autorisé inséré avec succès pour l'ID : ", result.insertId);
                    resolve(result);
                }
            });
        });

        // Vérification que l'insertion a bien renvoyé un insertId
        if (!timestampResult || !timestampResult.insertId) {
            console.error("L'insertion dans TimestampedAccess a échoué.");
            throw new Error("Impossible de récupérer l'insertId pour TimestampedAccess.");
        }

        const timestampId = timestampResult.insertId;

        // Insertion dans AuthorizedAccess en utilisant l'insertId récupéré de TimestampedAccess
        const authorizedResult = await new Promise((resolve, reject) => {
            db.query(
                'INSERT INTO AuthorizedAccess (rfid_id, lastname, firstname, TimestampedAccess_Id) VALUES (?, ?, ?, ?)',
                [rfid_id, lastname, firstname, timestampId],
                (err, result) => {
                    if (err) {
                        console.error("Erreur lors de l'insertion dans AuthorizedAccess : ", err);
                        reject(err);
                    } else {
                        console.log("AuthorizedAccess inséré avec succès pour l'ID : ", result.insertId);
                        resolve(result);
                    }
                }
            );
        });
        
        // Réponse indiquant que le log a été ajouté avec succès
        res.json({ success: true, message: `Log ajouté avec ID ${timestampId}` });

    } catch (err) {
        console.error("Erreur lors de l'ajout du log RFID :", err);
        res.status(500).json({ success: false, error: "Erreur lors de l'ajout du log RFID" });
    }
});

  
//Nathan (TEST Interroger RFID)
/*
const axios = require('axios');

async function fetchUID() {
  try {
    const response = await axios.get('http://192.168.65.240', {
      auth: {
        username: 'TON_USER',  // ➔ remplace par ton vrai login
        password: 'TON_MDP'     // ➔ remplace par ton vrai mot de passe
      }
    });
    console.log("UID reçu :", response.data);
  } catch (err) {
    console.error("Erreur de requête :", err);
  }
}

fetchUID();
*/



//Florent (Capture des données Réelles => GET)
vasistas = false;

app.get("/test-vasistas", (req, res) => {
    vasistas = !vasistas;
    res.json({ Vasistas: vasistas });
  });

app.get("/etat-vasistas", (req, res) => {
    res.json({ Vasistas: vasistas });
});

app.get("/outdoor-temperature", checkToken, async (req, res) => {
    try {
      const sql = `
        SELECT outdoor_temperature, date 
        FROM EventsRegulation
        ORDER BY date ASC
        LIMIT 10
      `;
  
      db.query(sql, (err, results) => {
        if (err) {
          console.error("Erreur MySQL :", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }
  
        // Format des données pour le front
        const data = results.map(row => ({
          name: new Date(row.date).toLocaleString("fr-FR", {
             day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
          }),
          température: row.outdoor_temperature
        }));
  
        res.json(data);
      });
    } catch (err) {
      console.error("Erreur serveur :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  app.get("/water-conso", checkToken, async (req, res) => {
    try {
      const sql = `
        SELECT rain_water_consumption, tap_water_consumption 
        FROM EventsRegulation
        ORDER BY date DESC
        LIMIT 1
      `;
  
      db.query(sql, (err, results) => {
        if (err) {
          console.error("Erreur MySQL :", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }
  
        // Envoi direct des deux valeurs (sans map, puisque 1 seul résultat)
        const row = results[0];
        const data = {
          rain: row.rain_water_consumption,
          tap: row.tap_water_consumption
        };
  
        res.json(data);
      });
    } catch (err) {
      console.error("Erreur serveur :", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

// Démarrer le serveur
app.listen(3001, () => {
    console.log(`Serveur en écoute sur le port 3001`);
});