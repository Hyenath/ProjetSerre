  const express = require('express');
  const checkToken = require('../Middlewares/check-token.js');

  //Gestion des Classes

      // Poseidon
      const Poseidon = require('../class/Poseidon.js');
      const poseidon = new Poseidon('192.168.65.253', 502);
      // TCW241
      const TCW241 = require('../class/TCW241.js');
      const tcw = new TCW241('192.168.65.252', 502);
  //

  //Fichiers JSON
  const config = require('../config.json');
  const WaterManager = require('../class/WaterManager.js');
  const db = require('../DataBase/db.js');
  //

  const app = express();

  //------------------------------------------------------CODE (NOTAMMENT POSEIDON)----------------------------------------------------//

  app.get("/vasistas", (req, res) => {
    const sql = `
      SELECT open_window
      FROM EventsRegulation
      ORDER BY date DESC
      LIMIT 1
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Erreur MySQL :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Aucune donnée trouvée" });
      }
      res.json({ Etat : results[0].open_window === 1 });
    });
  });

  app.get("/update-vasistas", (req, res) => {
    // Étape 1 : récupérer l'ID de la dernière ligne
    console.log("démarrage de la commande")
    const selectSql = `
      SELECT id, open_window
      FROM EventsRegulation
      ORDER BY date DESC
      LIMIT 1
    `;

    db.query(selectSql, (err, results) => {
      if (err) {
        console.error("Erreur MySQL SELECT :", err);
        return res.status(500).json({ error: "Erreur serveur (SELECT)" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Aucune donnée trouvée" });
      }

      const { id, open_window } = results[0];
      const newValue = open_window === 1 ? 0 : 1;

      // Étape 2 : mise à jour avec la valeur inversée
      const updateSql = `
        UPDATE EventsRegulation
        SET open_window = ?
        WHERE id = ?
      `;

      db.query(updateSql, [newValue, id], (err2) => {
        if (err2) {
          console.error("Erreur MySQL UPDATE :", err2);
          return res.status(500).json({ error: "Erreur serveur (UPDATE)" });
        }

        console.log("execution terminé")
        res.json({ Etat : newValue === 1 });
      });
    });
  });

  app.get("/heating", (req, res) => {
    const sql = `
      SELECT heating
      FROM EventsRegulation
      ORDER BY date DESC
      LIMIT 1
    `;

    db.query(sql, (err, results) => {
      if (err) {
        console.error("Erreur MySQL :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Aucune donnée trouvée" });
      }
      res.json({ Etat : results[0].open_window === 1 });
    });
  });

  app.get("/update-heating", (req, res) => {
    // Étape 1 : récupérer l'ID de la dernière ligne
    console.log("démarrage de la commande")
    const selectSql = `
      SELECT id, heating
      FROM EventsRegulation
      ORDER BY date DESC
      LIMIT 1
    `;

    db.query(selectSql, (err, results) => {
      if (err) {
        console.error("Erreur MySQL SELECT :", err);
        return res.status(500).json({ error: "Erreur serveur (SELECT)" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Aucune donnée trouvée" });
      }

      const { id, heating } = results[0];
      const newValue = heating === 1 ? 0 : 1;

      // Étape 2 : mise à jour avec la valeur inversée
      const updateSql = `
        UPDATE EventsRegulation
        SET heating = ?
        WHERE id = ?
      `;

      db.query(updateSql, [newValue, id], (err2) => {
        if (err2) {
          console.error("Erreur MySQL UPDATE :", err2);
          return res.status(500).json({ error: "Erreur serveur (UPDATE)" });
        }

        console.log("execution terminé")
        res.json({ Etat : newValue === 1 });
      });
    });
  });

  app.get("/etat-serre", async (req, res) => {
      try {
        const sql = `
          SELECT indoor_temperature, outdoor_temperature, indoor_air_humidity, soil_moisture_1, soil_moisture_2, soil_moisture_3, date 
          FROM EventsRegulation
          ORDER BY date DESC
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
            température: row.outdoor_temperature,
            températureInt: row.indoor_temperature,
            humidité: row.indoor_air_humidity,
            humiditéSol1: row.soil_moisture_1,
            humiditéSol2: row.soil_moisture_2,
            humiditéSol3: row.soil_moisture_3,
          }));
    
          res.json(data);
        });
      } catch (err) {
        console.error("Erreur serveur :", err);
        res.status(500).json({ error: "Erreur serveur" });
      }
    });

    // Route pour récupérer la température extérieure (STAN)
    app.get('/poseidon/outdoortemperature', async (req, res) => {
      try {
          const temperatureData = await WaterManager.poseidon.getoutdoorTemperature();
          return res.json(temperatureData);
      } catch (error) {
          console.error("Erreur dans /poseidon/outdoortemperature:", error);
          return res.status(500).json({ message: "Erreur lors de la récupération de la température extérieure" });
      }
    });

    app.get("/water-conso", async (req, res) => {
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


    module.exports = app;