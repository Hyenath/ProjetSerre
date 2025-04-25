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

const MODBUS_IP = "192.168.65.252";
const MODBUS_PORT = 502;
const VASISTAS_RELAY_ADDRESS = 103;

async function getVasistasState() {
    try {
        const result = await tcw.modbusClient.readCoils(VASISTAS_RELAY_ADDRESS, 1);
        const state = result.response._body._valuesAsArray[0];
        console.log(`Relais ${VASISTAS_RELAY_ADDRESS} état :`, state ? 'ON' : 'OFF');
        return state;
    } catch (error) {
        console.error(`Erreur lors de la lecture du relais ${VASISTAS_RELAY_ADDRESS} :`, error);
        return null;
    }
}

// Modifier l'état du relais (vasistas)
async function setVasistasState(state) {
    await tcw.modbusClient.writeSingleCoil(VASISTAS_RELAY_ADDRESS, state);
}
app.post('/vasistasModbus', async (req, res) => {
    try {
        const { state } = req.body;

        if (state !== "open" && state !== "close") {
            return res.status(400).json({ message: "État invalide, utilisez 'open' ou 'close'" });
        }

        const desiredState = state === "open"; // true = open, false = close
        const isOpen = await getVasistasState();

        if (isOpen === null) {
            return res.status(500).json({ error: "Impossible de lire l'état actuel du vasistas" });
        }

        if (isOpen !== desiredState) {
            await setVasistasState(desiredState);
            return res.status(200).json({ message: `Vasistas ${state}` });
        }
        return res.status(200).json({ message: `Vasistas déjà ${state}` });
    } catch (error) {
        console.error("Erreur Modbus serverGestion :", error);
        res.status(500).json({ error: "Erreur lors du contrôle du vasistas" });
    }
});

// Route pour récupérer les données de la carte TWC241 envoyée chaque minute
app.post('/route', (req,res) => {
    const data = req.body;
    console.table(data);
/*
    if(tcw.readIndoorTemperature() =< 1) mainManager.sendMailAlert("Température intérieure inférieure à 1°C");
*/
    return res.status(200).json({ message : 'ok'});
})

app.post('/setWindowState', async (req, res) => {
    const { state } = req.body;

    if (state !== "open" && state !== "close") {
        return res.status(400).json({ message: "État invalide, utilisez 'open' ou 'close'" });
    }

    try {
        await tcw.setWindowState(state === "open" ? true : false);
        return res.status(200).json({ message: `Vasistas ${state === "open" ? "ouvert" : "fermé"}` });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur lors de l'activation du vasistas" });
    }
})

// Route pour ouvrir ou fermer le vasistas
app.post('/vasistas', async (req, res) => {
    try {
        // Récupération de l'état actuel du vasistas
        const options = {
            hostname: tcw.ip,
            port: tcw.port,
            path: '/status.json',
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
            }
        };

        const isRelayOn = await new Promise((resolve, reject) => {
            const request = http.request(options, (resp) => {
                let data = '';

                if (resp.statusCode !== 200) {
                    return reject(`Erreur: Code HTTP ${resp.statusCode}`);
                }

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    try {
                        const cleanData = data.trim().replace(/^\uFEFF/, '');
                        const jsonData = JSON.parse(cleanData);
                        const relayState = jsonData.Monitor.R.R4.value;

                        console.log("État du relais:", relayState);

                        resolve(relayState === "ON");
                    } catch (error) {
                        reject("Erreur de parsing JSON: " + error);
                    }
                });
            });

            request.on("error", (err) => {
                reject("Erreur serveur: " + err.message);
            });

            request.end();
        });
        //Envoi de la commande pour ouvrir ou fermer le vasistas
        await tcw.setWindowState(isRelayOn);
        return res.status(200).json({ message: `Vasistas ${isRelayOn ? "ouvert" : "fermé"}` });
    } catch (error) {
        console.error("Erreur:", error);
        res.status(500).json({ message: "Erreur lors de l'activation du vasistas" });
    }
});

// Route pour récupérer la valeur d'humidité du sol via la carte TCW241
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