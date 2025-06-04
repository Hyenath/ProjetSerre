const Socket = require('net').Socket;
const client = require('jsmodbus').client;

const Heating = require('./Heating.js');
const State = Heating.State;

class TCW241 {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.client = null;
        this.modbusClient = null;
        this.connected = false;
        this.heating = new Heating(State.OFF);

        this.#connect().catch(err => {
            console.error("Erreur initiale de connexion :", err.message);
        });
    }

    #connect() {
    return new Promise((resolve, reject) => {
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }

        this.client = new Socket();
        this.modbusClient = new client.TCP(this.client, 0);

        // Timeout de 5 secondes sur la socket
        this.client.setTimeout(5000);

        this.client.once('connect', () => {
            console.log("✅ Connexion Modbus TCP établie");
            this.connected = true;
            resolve();
        });

        this.client.once('error', (err) => {
            console.error("❌ Erreur TCP (once):", err.message);
            this.connected = false;
            // On ne rejette pas la promesse pour éviter blocage
        });

        this.client.once('close', (hadError) => {
            console.log("⚠️ Connexion Modbus TCP fermée", hadError ? "avec erreur" : "sans erreur");
            this.connected = false;
        });

        this.client.once('timeout', () => {
            console.error("❌ Timeout TCP");
            this.client.destroy();
            this.connected = false;
        });

        console.log(`Tentative de connexion à ${this.ip}:${this.port}...`);
        this.client.connect({ host: this.ip, port: this.port });
    });
}


    async ensureConnection(maxRetries = 5) {
    let attempts = 0;
    while (!this.connected && attempts < maxRetries) {
        try {
            console.log(`Tentative de reconnexion Modbus (#${attempts + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // délai 2s avant reconnexion
            await this.#connect();
        } catch (e) {
            console.error("Erreur reconnexion :", e.message);
        }
        attempts++;
    }
    if (!this.connected) {
        throw new Error("Impossible de se reconnecter au serveur Modbus après plusieurs tentatives");
    }
}


    async #setStates() {
        try {
            await this.ensureConnection();
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            
            if (isEnabled) this.heating = new Heating(State.ON);
            else this.heating = new Heating(State.OFF);    
        } catch (error) {
            console.error("Erreur setStates:", error);
        }
    }

    async getHeaterState() {
        try {
            await this.ensureConnection();
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel du chauffage");
            return isEnabled;
        } catch (error) {
            return new Error("Erreur lors de la lecture de l'état du chauffage : " + error.message);
        }
    }

    async getWindowState() {
        try {
            await this.ensureConnection();
            const result = await this.modbusClient.readCoils(103, 1);
            const state = result.response._body._valuesAsArray[0];
            const isOpen = state ? true : false;           
            if (isOpen !== true && isOpen !== false) throw new Error("Impossible de lire l'état actuel du vasistas");
            return isOpen;
        } catch (error) {
            return new Error("Erreur lors de la lecture de l'état du vasistas : " + error.message);
        }
    }

    async getMistingState() {
        try {
            await this.ensureConnection();
            const result = await this.modbusClient.readCoils(100, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de la brumisation");
            return isEnabled;
        } catch (error) {
            return new Error("Erreur lors de la lecture de l'état de la brumisation : " + error.message);
        }
    }

    async getWateringState() {
        try {
            await this.ensureConnection();
            const result = await this.modbusClient.readCoils(101, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de l'arrosage");
            return isEnabled;
        } catch (error) {
            return new Error("Erreur lors de la lecture de l'état de l'arrosage : " + error.message);
        }
    }

    async activateRelay(relay) {
        switch (relay) {
            case "1":
                return await this.enableWatering();
            case "2":
                return await this.enableMisting();
            case "3":
                return await this.setHeaterState();
            case "4":
                return await this.setWindowState();
            default:
                throw new Error("Numéro de relais invalide");
        }
    }

    async readSoilMoisture(sensorId) {
        try {
            await this.ensureConnection();

            let register;
            switch (sensorId) {
                case "1": register = 17500; break;
                case "2": register = 17502; break;
                case "3": register = 17504; break;
                default: throw new Error("Capteur inconnu");
            }

            console.log(`Lecture registre ${register} pour capteur ${sensorId}...`);

            const result = await this.modbusClient.readHoldingRegisters(register, 2);

            if (!result || !result.response || !result.response._body) {
                throw new Error("Réponse Modbus invalide ou vide");
            }

            const data = result.response._body._valuesAsArray;
            console.log(`Valeurs brutes reçues :`, data);

            const Vout = data[0] * 0.1;
            const humidite = -1.91e-9 * Vout ** 3 + 1.33e-5 * Vout ** 2 + 9.56e-3 * Vout - 21.6;

            const taux_humidite = Math.max(0.02, Math.min(humidite, 100)).toFixed(2);

            console.log(`Humidité calculée : ${taux_humidite}%`);

            return {
                analogValue: data[0],
                taux_humidite
            };
        } catch (error) {
            console.error(`Erreur lecture capteur soil_moisture_${sensorId}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    async readIndoorTemperature() {
        try {
            await this.ensureConnection();

            const result = await this.modbusClient.readHoldingRegisters(300, 2);

            const buffer = Buffer.alloc(4);
            buffer.writeUInt16BE(result.response.body.values[0], 0);
            buffer.writeUInt16BE(result.response.body.values[1], 2);

            const temperature = buffer.readFloatBE(0);

            return { success: true, temperature: temperature.toFixed(2) };
        } catch (error) {
            console.error("Erreur lecture capteur S1 :", error);
            return { success: false, error: error.message };
        }
    }

    readIndoorMoisture() {
        // A compléter selon besoin
    }

    async setHeaterState() {
        try {
            await this.ensureConnection();

            const isEnabled = await this.getHeaterState();
            await this.modbusClient.writeSingleCoil(102, !isEnabled);
            return { success: true, message: `Chauffage ${!isEnabled ? "allumé" : "éteint"}` };
        } catch (error) {
            console.error("Erreur :", error);
            return { success: false, error: error.message };
        }
    }

    async enableMisting() {
        try {
            await this.ensureConnection();

            const isEnabled = await this.getMistingState();
            await this.modbusClient.writeSingleCoil(100, !isEnabled);
            return { success: true, message: `Brumisation ${!isEnabled ? "activée" : "désactivée"}` };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }

    async enableWatering() {
        try {
            await this.ensureConnection();

            const isEnabled = await this.getWateringState();
            await this.modbusClient.writeSingleCoil(101, !isEnabled);
            return { success: true, message: `Arrosage ${!isEnabled ? "activé" : "désactivé"}` };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }

    async setWindowState() {
        try {
            await this.ensureConnection();

            const result = await this.modbusClient.readCoils(103, 1);
            const state = result.response._body._valuesAsArray[0];
            const isOpen = state ? true : false;           
            if (isOpen !== true && isOpen !== false) throw new Error("Impossible de lire l'état actuel du vasistas");
            await this.modbusClient.writeSingleCoil(103, !isOpen);
            return { success: true, message: `Vasistas ${!isOpen ? "ouvert" : "fermé"}` };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TCW241;
