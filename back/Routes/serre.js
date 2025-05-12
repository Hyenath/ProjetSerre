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
  vasistas = false;

  app.get("/test-vasistas", (req, res) => {
      vasistas = !vasistas;
      res.json({ Vasistas: vasistas });
    });

  app.get("/etat-vasistas", (req, res) => {
      res.json({ Vasistas: vasistas });
  });

  app.get("/outdoor-temperature", async (req, res) => {
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