const express = require('express');
const checkToken = require('../Middlewares/check-token.js');

//Gestion des Classes

    //Poseidon
    const Poseidon = require('../class/Poseidon.js');
    const poseidon = new Poseidon('192.168.65.253', 502);
    //
//

//Gestion des fichiers
const fs = require('fs');
const path = require('path');
//

//Fichiers JSON
const config = require('../config.json');
const RegParam = require('./RegParam/RegParam.json');
const RegParamSave = require('./RegParam/RegParamSave.json');
const db = require('../config/db');
//

const app = express();





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
        const mainFilePath = path.join(__dirname, 'RegParam/RegParam.json');
        const SaveFilePath = path.join(__dirname, 'RegParam/RegParamSave.json');

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

module.exports = app;