const express = require('express');
const cors = require("cors");
const bodyParser = require('body-parser');
const http = require('http');
const app = express();

const TCW241 = require('./class/TCW241');

app.use(bodyParser.json())
app.use(cors());

const tcw = new TCW241('192.168.65.252', 80);

app.post('/testPost', (req, res) => {
    const {data} = req.body;
    
    console.log(data);
    
    return res.status(200).json({ success : true })
})


app.post('/route', (req,res) => {
    const data = req.body;
    console.table(data);
    return res.status(200).json({ message : 'ok'});
})

app.get('/testGet', (req, res) => {
    return res.status(200).json({ success: true });
})

app.get('/getHumidite', async (req, res) => {
    const { idCapteur } = req.body;
    
    if (!idCapteur) {
        return res.status(400).json({ message: "Capteur non spécifié" });
    }
    if(!["1", "2", "3"].includes(idCapteur)) {
        return res.status(400).json({ message: "Capteur inconnu" });
    }
    
    try {
        const value = await tcw.readSoilMoisture(idCapteur);
        res.json(value);
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des données" });
    }
});

app.listen(1515, () => {
    console.log('Serveur en écoute sur le port 1515');
})