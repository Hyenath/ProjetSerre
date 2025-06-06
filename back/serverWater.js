// serverWater.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WaterManager = require('./class/WaterManager');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const waterManager = new WaterManager('192.168.65.253', 502);

// -------- GET Sensors --------
app.get('/poseidon/temperature/outdoor', async (req, res) => {
    try {
        const temperature = await waterManager.getOutdoorTemperature();
        res.json({ temperature });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/poseidon/waterFrozen', async (req, res) => {
    try {
        const frozen = await waterManager.isWaterFrozen();
        res.json({ waterFrozen: frozen });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/poseidon/rainWaterLevel', async (req, res) => {
    try {
        const level = await waterManager.getRainWaterLevel();
        res.json({ rainWaterLevel: level });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/poseidon/rainWaterUsed', async (req, res) => {
    try {
        const used = await waterManager.getRainWaterUsed();
        res.json({ rainWaterUsed: used });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/poseidon/tapWaterUsed', async (req, res) => {
    try {
        const used = await waterManager.getTapWaterUsed();
        res.json({ tapWaterUsed: used });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// -------- POST Actuators --------
app.post('/poseidon/valve', async (req, res) => {
    const { source } = req.body;
    try {
        await waterManager.setWaterSource(source);
        res.json({ message: `Valve réglée sur ${source}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/poseidon/pump', async (req, res) => {
    const { state } = req.body;
    try {
        await waterManager.setPumpState(state);
        res.json({ message: `Pompe mise à ${state}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Serveur Poseidon opérationnel sur http://localhost:${PORT}`);
});
