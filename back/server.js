const express = require('express');
const cors = require('cors');

//Fichiers JSON
const config = require('./config.json');
const db = require('./DataBase/db');
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