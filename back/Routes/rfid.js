const express = require('express');

//Fichiers JSON
const config = require('../config.json');
const db = require('../DataBase/db');
//

const app = express();


//--------------------------------Ajouter les logs dans la base---------------------------------------//
/*

app.post(config.postRFIDLog, async (req, res) => {
    const { rfid_id } = req.body;
    console.log("Body Content: ", req.body);

    if (!rfid_id) {
        return res.status(400).json({ success: false, message: "UID manquant !" });
    }

    try {
        // Vérifier si le rfid_id existe dans AuthorizedAccess
        const authorizedUser = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM AuthorizedAccess WHERE rfid_id = ?', [rfid_id], (err, results) => {
                if (err) {
                    console.error("Erreur lors de la vérification de l'UID : ", err);
                    reject(err);
                } else {
                    resolve(results.length > 0 ? results[0] : null);
                }
            });
        });

        if (!authorizedUser) {
            // Pas trouvé, donc interdit d'insérer
            return res.status(403).json({ success: false, message: "UID non autorisé !" });
        }

        // UID trouvé : alors insérer dans TimestampedAccess
        const timestampResult = await new Promise((resolve, reject) => {
            db.query('INSERT INTO TimestampedAccess (date) VALUES (NOW())', (err, result) => {
                if (err) {
                    console.error("Erreur lors de l'insertion dans TimestampedAccess : ", err);
                    reject(err);
                } else {
                    console.log("Timestamped inséré avec l'ID : ", result.insertId);
                    resolve(result);
                }
            });
        });

        if (!timestampResult || !timestampResult.insertId) {
            throw new Error("Impossible de récupérer l'insertId pour TimestampedAccess.");
        }

        // Réponse avec accessGranted pour l'Arduino
        res.json({
            success: true,
            accessGranted: true,
            message: `Accès autorisé pour UID ${rfid_id}, timestamp ID ${timestampResult.insertId} -> enregistrement en base effectué`
        });

    } catch (err) {
        console.error("Erreur lors de l'enregistrement RFID :", err);
        res.status(500).json({ success: false, error: "Erreur serveur" });
    }
});
*/

app.post(config.postRFIDLog, async (req, res) => {
    const { rfid_id } = req.body;
    console.log("Body Content: ", req.body);

    if (!rfid_id) {
        return res.status(400).json({ success: false, message: "UID manquant !" });
    }

    try {
        // Vérifier si le rfid_id existe dans AuthorizedAccess
        const authorizedUser = await new Promise((resolve, reject) => {
            db.query('SELECT * FROM AuthorizedAccess WHERE rfid_id = ?', [rfid_id], (err, results) => {
                if (err) {
                    console.error("Erreur lors de la vérification de l'UID : ", err);
                    reject(err);
                } else {
                    resolve(results.length > 0 ? results[0] : null);
                }
            });
        });

        if (!authorizedUser) {
            // Pas trouvé, donc interdit d'insérer
            return res.status(403).json({ success: false, message: "UID non autorisé !" });
        }

        // UID trouvé, insérer dans TimestampedAccess et établir la relation
        const timestampResult = await new Promise((resolve, reject) => {
            db.query('INSERT INTO TimestampedAccess (rfid_id, date) VALUES (?, NOW())', [rfid_id], (err, result) => {
                if (err) {
                    console.error("Erreur lors de l'insertion dans TimestampedAccess : ", err);
                    reject(err);
                } else {
                    console.log("Timestamped inséré avec l'ID : ", result.insertId);
                    resolve(result);
                }
            });
        });

        if (!timestampResult || !timestampResult.insertId) {
            throw new Error("Impossible de récupérer l'insertId pour TimestampedAccess.");
        }

        // Réponse avec accessGranted pour l'Arduino
        res.json({
            success: true,
            accessGranted: true,
            message: `Accès autorisé pour UID ${rfid_id}, timestamp ID ${timestampResult.insertId} -> enregistrement en base effectué`
        });

    } catch (err) {
        console.error("Erreur lors de l'enregistrement RFID :", err);
        res.status(500).json({ success: false, error: "Erreur serveur" });
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
module.exports = app;