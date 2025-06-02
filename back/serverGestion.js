const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json())
app.use(cors());

const MainManager = require('./class/MainManager');

const mainManager = new MainManager(app);

mainManager.setupAPIEndpoints();

app.listen(1515, () => {
    console.log('Serveur en écoute sur le port 1515');
})