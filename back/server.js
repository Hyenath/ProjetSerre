const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

//Fichiers JSON
const config = require('./config.json');
const db = require('./DataBase/db');

const app = express();

//------------------------------------------------MISE EN PLACE DE L'API---------------------------------------------------------//

app.use(cors());
app.use(express.json());

//Gestion Globale Main Manager
const MainManager = require('./class/MainManager');

const mainManager = new MainManager(app);

mainManager.setupAPIEndpoints();
//


//Pour lancer les serveurs, se référer au package.json du frontreact//


// Démarrer le serveur
app.listen(3001, () => {
    console.log(`Serveur en écoute sur le port 3001`);
});

// Appeler automatiquement une route toutes les minutes
setInterval(async () => {
  try {
    const dataToSend = {
      water_network: "rain",
      pump: true,
      rain_water_consumption: 54,
      tap_water_consumption: 46,
      soil_moisture_1: 50,
      soil_moisture_2: 60,
      soil_moisture_3: 70,
      watering: true,
      misting: false,
      indoor_air_humidity: 45,
      indoor_temperature: 22,
      open_window: false,
      heating: true
    };

    const response = await axios.post('http://localhost:3001/gest/add', dataToSend);
    const data = await response.data;
    console.log('Mise à jour automatique des températures :', data);
  } catch (error) {
    console.error('Erreur lors de l’appel périodique :', error.message);
  }
}, 300 * 1000); // toutes les 300 secondes (5min); 30 s = 1 min