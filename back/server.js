const express = require('express');
const mysql = require('mysql2');
const checkToken = require('./Middlewares/check-token.js');
const cors = require('cors');

//Fichiers JSON
const db = require('./config/db');
//

const app = express();

//Pour lancer les serveurs, se référer au package.json du frontreact//


//------------------------------------------------MISE EN PLACE DE L'API---------------------------------------------------------//

app.use(cors());
app.use(express.json());

//------------------------------------------------------------AUTHENTIFICATION----------------------------------------------------------------//
const authRoutes = require('./Routes/auth');
app.use('/auth', authRoutes);

//------------------------------------------------------------GESTION------------------------------------------------------------//
const gestRoutes = require('./Routes/gest');
app.use('/gest', gestRoutes);

//------------------------------------------------------------RFID------------------------------------------------------------//
const rfidRoutes = require('./Routes/rfid');
app.use('/rfid', rfidRoutes);

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