const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

//Fichiers JSON
const WaterManager = require('./class/WaterManager.js');
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

//------------------------------------------------------------SERRE------------------------------------------------------------//
const serreRoutes = require('./Routes/serre');
app.use('/serre', serreRoutes);


// Démarrer le serveur
app.listen(3001, () => {
    console.log(`Serveur en écoute sur le port 3001`);
});