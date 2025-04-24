const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');

const WaterManager = require('./class/WaterManager');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const mainManager = {
    waterManager: new WaterManager('192.168.1.100', 502) // ← IP & port du Poseidon à adapter
};

// Route pour récupérer les données des capteurs Poseidon2 3268
app.get('/poseidon/sensors', async (req, res) => {
    try {
        const sensorsData = await mainManager.waterManager.poseidon.getSensorsData();
        return res.json(sensorsData);
    } catch (error) {
        console.error("Erreur dans /poseidon/sensors:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
});

// Route pour savoir si l'eau est gelée
app.get('/poseidon/waterFrozen', async (req, res) => {
    try {
        const isFrozen = await mainManager.waterManager.poseidon.isWaterFrozen();
        return res.json({ waterFrozen: isFrozen });
    } catch (error) {
        console.error("Erreur dans /poseidon/waterFrozen:", error);
        return res.status(500).json({ message: "Erreur lors de la vérification de l'eau gelée" });
    }
});

// Route pour récupérer l'état de la source d'eau
app.get('/waterManager/source', async (req, res) => {
    try {
        await mainManager.waterManager.switchWaterSource();
        return res.json({ waterSource: mainManager.waterManager.waterSource });
    } catch (error) {
        console.error("Erreur dans /waterManager/source:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération de la source d'eau" });
    }
});

// Lancement du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
