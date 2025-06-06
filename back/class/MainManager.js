const  createTransport = require('nodemailer').createTransport;
const checkToken = require('../Middlewares/check-token.js');

const RegulationManager = require('./RegulationManager');
const TCW = require('./TCW241');

const WaterManager = require('./WaterManager');
const Poseidon = require('./Poseidon');

const mail = require('../config.json').mail;

class MainManager {
    constructor(app) {
        this.database = 'mysql';
        this.poseidon = new Poseidon('192.168.65.253', 503);
        this.waterManager = new WaterManager(this.poseidon); // Instance de WaterManager
        this.tcw = new TCW('192.168.65.252', 502);
        this.regulationManager = new RegulationManager(this.tcw); // Instance de RegulationManager
        this.wss = null; // Instance de WebSocketServer
        this.regulationParameters = null; // Instance de RegulationParameters
        this.rfidReader = null; // Instance de RFIDReader
        this.eth002b = null; // Instance de ETH002B
        this.app = app; // Instance de l'application Express
    }
    
    updateSystem() {
        this.regulationManager.updateSystem();
        
        // Vérification de la température intérieure
        if (this.regulationManager.indoorTemperature < 1 || this.waterManager.outdoorTemperature < 1) {
            this.sendMailAlert("Température intérieure inférieure à 1°C");
        }
    }
    
    insertRegulationEvent() {}
    
    setupAPIEndpoints() {
        this.app.post('/setWatering', checkToken, async (req, res) => {
            const result = await this.tcw.enableWatering();
            if (!result.success) return res.status(500).json({ message: result.error });
            return res.status(200).json({ message: result.message });
        });
        
        this.app.post('/setMisting', checkToken, async (req, res) => {
            const result = await this.tcw.enableMisting();
            if (!result.success) return res.status(500).json({ message: result.error });
            return res.status(200).json({ message: result.message });
        });
        
        this.app.post('/setHeaterState', checkToken, async (req, res) => {
            const result = await this.tcw.setHeaterState();
            if (!result.success) return res.status(500).json({ message: result.error });
            return res.status(200).json({ message: result.message });
        });
        
        this.app.post('/setWindowState', checkToken, async (req, res) => {
            const result = await this.tcw.setWindowState();
            if (!result.success) return res.status(500).json({ message: result.error });
            return res.status(200).json({ message: result.message });
        });
        
        this.app.get('/getHumidite', checkToken, async (req, res) => {
            const { idCapteur } = req.body;
            if (!idCapteur) return res.status(400).json({ message: "Capteur non spécifié" });
            if(!["1", "2", "3"].includes(idCapteur)) return res.status(400).json({ message: "Capteur inconnu" });
            try {
                const value = await this.tcw.readSoilMoisture(idCapteur);
                res.json(value);
            } catch (error) {
                console.error("Erreur:", error);
                res.status(500).json({ message: "Erreur lors de la récupération des données" });
            }
        });

        this.app.get('/getTemperatureAir', checkToken, async (req, res) => {
            try {
                const temperature = await this.tcw.getIndoorTemperature();
                res.json({ temperature });
            } catch (error) {
                console.error("Erreur:", error);
                res.status(500).json({ message: "Erreur lors de la récupération de la température intérieure" });
            }
        });
        
        this.app.post('/activeRelay', checkToken, async (req, res) => {
            const { relay } = req.body;
            if (!relay) return res.status(400).json({ message: "Relais non spécifié" });
            if(!["1", "2", "3", "4"].includes(relay)) return res.status(400).json({ message: "Relais inconnu" });
            try {
                await this.tcw.activateRelay(relay);
                res.json({ message: `Relais ${relay} activé` });
            } catch (error) {
                console.error("Erreur:", error);
                res.status(500).json({ message: "Erreur lors de l'activation du relais" });
            }
        });
        
        // Routes de test du serveur POST et GET
        this.app.post('/testPost', (req, res) => {
            const {data} = req.body;
            console.log(data);
            return res.status(200).json({ success : true })
        })
        
        this.app.get('/testGet', (req, res) => {
            return res.status(200).json({ success: true });
        })
        
        //------------------------------------------------------------AUTHENTIFICATION----------------------------------------------------------------//
        const authRoutes = require('../Routes/auth');
        this.app.use('/auth', authRoutes);
        
        //------------------------------------------------------------GESTION------------------------------------------------------------//
        const gestRoutes = require('../Routes/gest');
        this.app.use('/gest', gestRoutes);
        
        //------------------------------------------------------------RFID------------------------------------------------------------//
        const rfidRoutes = require('../Routes/rfid');
        this.app.use('/rfid', rfidRoutes);
        
        //------------------------------------------------------------SERRE------------------------------------------------------------//
        const serreRoutes = require('../Routes/serre');
        this.app.use('/serre', serreRoutes);
    }
    
    sendMailAlert(message) {
        const transporter = createTransport({
            service: "gmail",
            auth: {
                user: mail.sender,
                pass: mail.password
            }
        });
        
        const mailOptions = {
            from: mail.sender,
            to: mail.receiver,
            subject: mail.subject,
            text: message
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("Erreur:", error);
            } else {
                console.log("Email envoyé:", info.response);
            }
        });
    }    
    
    sendSystemStateToWSClients() {}
    
    loadRegulationParameters() {}
    
    saveRegulationParameters() {}
    
    RFIDReadEventHandler(rfid) {}
}

module.exports = MainManager;