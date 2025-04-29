const express = require('express');

//Fichiers JSON
const config = require('../config.json');
const db = require('../DataBase/db');
//

const app = express();


//--------------------------------Ajouter les logs dans la base---------------------------------------//
/*
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
                    console.log("Timestamped identifié avec l'ID : ", result.insertId);
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

        res.json({ success: true, message: `Accès enregistré pour UID ${rfid_id}, timestamp ID ${timestampResult.insertId}` });

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