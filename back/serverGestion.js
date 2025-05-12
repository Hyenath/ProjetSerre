const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json())
app.use(cors());

const TCW241 = require('./class/TCW241');
const MainManager = require('./class/MainManager');
const tcw = new TCW241('192.168.65.252', 502);
const mainManager = new MainManager();

// Route pour récupérer les données de la carte TWC241 envoyée chaque minute
app.post('/route', (req,res) => {
    const data = req.body;
    console.table(data);
/*
    if(tcw.readIndoorTemperature() =< 1) mainManager.sendMailAlert("Température intérieure inférieure à 1°C");
*/
    return res.status(200).json({ message : 'ok'});
})

app.post('/setWatering', async (req, res) => {
    const result = await tcw.enableWatering();
    if (!result.success) return res.status(500).json({ message: result.error });
    return res.status(200).json({ message: result.message });
});

app.post('/setMisting', async (req, res) => {
    const result = await tcw.enableMisting();
    if (!result.success) return res.status(500).json({ message: result.error });
    return res.status(200).json({ message: result.message });
});

app.post('/setHeaterState', async (req, res) => {
    const result = await tcw.setHeaterState();
    if (!result.success) return res.status(500).json({ message: result.error });
    return res.status(200).json({ message: result.message });
});

app.post('/setWindowState', async (req, res) => {
    const result = await tcw.setWindowState();
    if (!result.success) return res.status(500).json({ message: result.error });
    return res.status(200).json({ message: result.message });
});

app.get('/getHumidite', async (req, res) => {
    const { idCapteur } = req.body;
    if (!idCapteur) return res.status(400).json({ message: "Capteur non spécifié" });
    if(!["1", "2", "3"].includes(idCapteur)) return res.status(400).json({ message: "Capteur inconnu" });
    try {
        const value = await tcw.readSoilMoisture(idCapteur);
        res.json(value);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
});

app.post('/activeRelay', async (req, res) => {
    const { relay } = req.body;
    if (!relay) return res.status(400).json({ message: "Relais non spécifié" });
    if(!["1", "2", "3", "4"].includes(relay)) return res.status(400).json({ message: "Relais inconnu" });
    try {
        await tcw.activateRelay(relay);
        res.json({ message: `Relais ${relay} activé` });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur lors de l'activation du relais" });
    }
});

// Routes de test du serveur POST et GET
app.post('/testPost', (req, res) => {
    const {data} = req.body;
    console.log(data);
    return res.status(200).json({ success : true })
})

app.get('/testGet', (req, res) => {
    return res.status(200).json({ success: true });
})

//lancement du serveur sur le port 1515
app.listen(1515, () => {
    console.log('Serveur en écoute sur le port 1515');
})