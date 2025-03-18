const express = require('express');
const rateLimit = require('express-rate-limit');
const mysql = require('mysql2');

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
const data = require('./data.json');
const RegParam = require('./RegParam.json');
const RegParamSave = require('./RegParamSave.json');
const RegParamUpdate = require('./RegParamUpdate.json');

//Pour lancer les serveurs, se référer au package.json du frontreact


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
app.post(config.add, async (req, res) => {
    try {
        // Données récupérées depuis le JSON
        const Data = [
            data.water_network,
            data.pump === "1",
            parseInt(data.rain_water_consumption, 10),
            parseInt(data.tap_water_consumption, 10),
            parseFloat(data.soil_moisture_1),
            parseFloat(data.soil_moisture_2),
            parseFloat(data.soil_moisture_3),
            data.watering === "1",
            data.misting === "1",
            parseFloat(data.indoor_air_humidity),
            parseFloat(data.indoor_temperature),
            parseFloat(data.outdoor_temperature),
            data.open_window === "1",
            data.heating === "1"
        ];
        

        // Fonction de vérification des types
        const checkDataTypes = (data) => {
            const expectedTypes = [
                'string',  // water_network
                'boolean', // pump
                'number',  // rain_water_consumption
                'number',  // tap_water_consumption 
                'number',  // soil_moisture_1
                'number',  // soil_moisture_2
                'number',  // soil_moisture_3
                'boolean', // watering
                'boolean', // misting
                'number',  // indoor_air_humidity
                'number',  // indoor_temperature
                'number',  // outdoor_temperature
                'boolean', // open_window
                'boolean'  // heating
            ];

            // Vérification des types de données
            for (let i = 0; i < data.length; i++) {
                // Vérification du type des données par rapport aux types attendus
                if (typeof data[i] !== expectedTypes[i]) {
                    return false; // Si un type ne correspond pas, retourner false
                }
            }
            return true; // Si tous les types sont valides, retourner true
        };

        // Vérifier les types des données
        if (!checkDataTypes(Data)) {
            return res.status(400).json({
                success: false,
                message: "Les types de données ne sont pas valides."
            });
        }

        // SQL d'insertion dans la base de données
        const sqlInsert = `
            INSERT INTO EventsRegulation 
            (water_network, pump, rain_water_consumption, tap_water_consumption, 
            soil_moisture_1, soil_moisture_2, soil_moisture_3, watering, misting, 
            indoor_air_humidity, indoor_temperature, outdoor_temperature, open_window, heating) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = Object.values(Data); // Convertir les données dans un tableau pour l'insertion SQL

        // Exécuter la requête d'insertion dans la base de données
        db.query(sqlInsert, values, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Erreur lors de l'insertion des valeurs." });
            }
            console.log("Valeurs insérées dans la base de données.");

            // Retourner une réponse de succès avec les valeurs insérées
            return res.status(200).json({
                success: true,
                values
            });
        });

    } catch (error) {
        console.error(error);
        // Retourner une erreur interne si une exception est lancée
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

            // Définir le chemin du fichier JSON
            const filePath = path.join(__dirname, 'RegParam.json');

            try {
                // Écrire les résultats dans le fichier JSON
                fs.writeFileSync(filePath, JSON.stringify(result, null, 4), 'utf-8');
                console.log("Données enregistrées dans le json");
            } catch (writeErr) {
                console.error("Erreur d'écriture dans le fichier JSON :", writeErr);
            }

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
app.put(config.updateRegParam, async (req, res) => {
    try {
        // Chemins des fichiers JSON
        const mainFilePath = path.join(__dirname, 'RegParam.json');
        const SaveFilePath = path.join(__dirname, 'RegParamSave.json');
        const UpdateFilePath = path.join(__dirname, 'RegParamUpdate.json');

        const Data = [
            parseInt(RegParamUpdate.threshold_low_frozen_water, 10),
            parseInt(RegParamUpdate.threshold_low_soil_moisture, 10),
            parseInt(RegParamUpdate.threshold_high_soil_moisture, 10),
            parseInt(RegParamUpdate.threshold_low_air_humidity, 10),    
            parseInt(RegParamUpdate.threshold_high_air_humidity, 10),
            parseInt(RegParamUpdate.threshold_low_temperature, 10),
            parseInt(RegParamUpdate.threshold_high_temperature, 10)
        ];
        
        // Fonction de vérification des types
        const checkDataTypes = (data) => {
            const expectedTypes = [
                'number',  // threshold_low_frozen_water
                'number', // threshold_low_soil_moisture
                'number',  // threshold_high_soil_moisture
                'number',  // threshold_low_air_humidity 
                'number',  // threshold_high_air_humidity
                'number',  // threshold_low_temperature
                'number',  // threshold_high_temperature
            ];

            // Vérification des types de données
            for (let i = 0; i < data.length; i++) {
                // Vérification du type des données par rapport aux types attendus
                if (typeof data[i] !== expectedTypes[i]) {
                    return false; // Si un type ne correspond pas, retourner false
                }
            }
            return true; // Si tous les types sont valides, retourner true
        };

        // Vérifier les types des données
        if (!checkDataTypes(Data)) {
            return res.status(400).json({
                success: false,
                message: "Les types de données ne sont pas valides."
            });
        }

        const sqlUpdate = `
        UPDATE RegulationParameters SET 
            threshold_low_frozen_water = ?,
            threshold_low_soil_moisture = ?,
            threshold_high_soil_moisture = ?,
            threshold_low_air_humidity = ?,
            threshold_high_air_humidity = ?,
            threshold_low_temperature = ?,
            threshold_high_temperature = ?
        `;

        const values = Object.values(Data);
    

        db.query(sqlUpdate, values, (err, result) => {
            if (err) {
                console.error("Erreur SQL :", err);
                return res.status(500).json({ error: "Erreur lors de la mise à jour des paramètres." });
            }
            console.log("Valeurs modifiées dans la base de données.");

            // Envoyer la réponse au client
            res.status(200).json({
                success: true,
                values
            });
        });

        fs.writeFileSync(SaveFilePath, '', 'utf-8'); // Effacer le contenu actuel de la dernière sauvegarde
        fs.writeFileSync(SaveFilePath, mainFilePath, 'utf-8'); // Ajouter une nouvelle sauvegarde des données du mainFilePath (RegParam.json)

        // Démarrer un timer de 15 minutes (900000 ms)
        setTimeout(() => {
            try {
                // Lire les données de RegParamUpdate.json
                const UpdateData = fs.readFileSync(UpdateFilePath, 'utf-8');

                // Écrire dans RegParam.json
                fs.writeFileSync(mainFilePath, '', 'utf-8'); // Effacer le contenu actuel
                fs.writeFileSync(mainFilePath, UpdateData, 'utf-8'); // Remplacer le contenu par les nouvelles données
                console.log("Données de RegParamUpdate.json copiées dans RegParam.json.");
            } catch (err) {
                console.error("Erreur lors de la mise à jour de RegParam.json :", err);
            }
        }, 900000); // 15 minutes

    } catch (error) {
        console.error("Erreur :", error);
        res.status(500).json({
            success: false,
            errormessage: "Erreur lors de la mise à jour."
        });
    }
});



// Démarrer le serveur
app.listen(3001, () => {
    console.log(`Serveur en écoute sur le port 3001`);
});