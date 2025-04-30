const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');

const WaterManager = require('./WaterManager'); // Suppression du dossier "class/" si non nécessaire

const app = express();
app.use(bodyParser.json());
app.use(cors());

const mainWaterManager = {
    waterManager: new WaterManager('192.168.65.253', 502) // ← IP & port du Poseidon
};

// Route pour récupérer les données des capteurs
app.get('/poseidon/sensors', async (req, res) => {
    try {
        const sensorsData = await mainWaterManager.waterManager.poseidon.getSensorsData();
        return res.json(sensorsData);
    } catch (error) {
        console.error("Erreur dans /poseidon/sensors:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
});

// Route pour savoir si l'eau est gelée
app.get('/poseidon/waterFrozen', async (req, res) => {
    try {
        const isFrozen = await mainWaterManager.waterManager.poseidon.isWaterFrozen();
        return res.json({ waterFrozen: isFrozen });
    } catch (error) {
        console.error("Erreur dans /poseidon/waterFrozen:", error);
        return res.status(500).json({ message: "Erreur lors de la vérification de l'eau gelée" });
    }
});

// Route pour récupérer l'état de la source d'eau
app.get('/waterManager/source', async (req, res) => {
    try {
        await mainWaterManager.waterManager.switchWaterSource();
        return res.json({ waterSource: mainWaterManager.waterManager.waterSource });
    } catch (error) {
        console.error("Erreur dans /waterManager/source:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération de la source d'eau" });
    }
});

// Route pour récupérer la température extérieure
app.get('/poseidon/temperature/outdoor', async (req, res) => {
    try {
        const temperatureData = await mainWaterManager.waterManager.poseidon.getoutdoorTemperature();
        return res.json(temperatureData);
    } catch (error) {
        console.error("Erreur dans /poseidon/temperature/outdoor:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération de la température extérieure" });
    }
});

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur API Poseidon lancé sur http://localhost:${PORT}`);
});
