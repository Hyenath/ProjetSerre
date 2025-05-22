const net = require('net');
const Modbus = require('jsmodbus');

const Heating = require('./Heating.js');

class TCW241 {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.client = new net.Socket();
        this.modbusClient = new Modbus.client.TCP(this.client, 1);
        this.heating = null;
        
        this.client.connect({ host: ip, port: port }, async () => {
            console.log("✅ Connexion Modbus TCP établie");
            
            await this.#setStates();
        });
        
        this.client.on('error', (err) => {
            console.error("❌ Erreur TCP :", err.message);
        });
        
    }
    
    async #setStates() {
        try {
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            
            if (isEnabled) this.heating = new Heating(Heating.State.ON);
            else this.heating = new Heating(Heating.State.OFF);    
        } catch (error) {
            console.error("Erreur :", error);
        }
    }
    
    async activateRelay(relay) {
        switch (relay) {
            case "1":
            await this.enableWatering();
            break;
            case "2":
            await this.enableMisting();
            break;
            case "3":
            await this.setHeaterState();
            break;
            case "4":
            await this.setWindowState();
            break;    
            default:
            throw new Error("Numéro de relais invalide");
        }
    }
    
    async readSoilMoisture(sensorId) {
        try {
            const result = await this.modbusClient.readHoldingRegisters(17500, 2);
            const data = result.response._body._valuesAsArray;
            const Vout = data[0] * 0.1; // Conversion en volts
            const humidite = -1.91e-9 * Vout ** 3 + 1.33e-5 * Vout ** 2 + 9.56e-3 * Vout - 21.6;
            return {
                analogValue: data[0],
                taux_humidite: Math.max(0.02, Math.min(humidite, 100)).toFixed(2)
            };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
    
    readIndoorTemperature() {}
    readIndoorMoisture() {}
    async setHeaterState() {
        try {
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel du chauffage 5");
            await this.modbusClient.writeSingleCoil(102, !isEnabled);
            return { success: true, message: `Chauffage ${!isEnabled ? "allumé" : "éteint"}` };
        } catch (error) {
            console.error("Erreur :", error);
            return { success: false, error: error.message };
        }
    }
    async enableMisting() {
        try {
            const result = await this.modbusClient.readCoils(100, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de la brumisation");
            await this.modbusClient.writeSingleCoil(100, !isEnabled);
            return { success: true, message: `Brumisation ${!isEnabled ? "activée" : "désactivée"}` };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
    async enableWatering() {
        try {
            const result = await this.modbusClient.readCoils(101, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de l'arrosage");
            await this.modbusClient.writeSingleCoil(101, !isEnabled);
            return { success: true, message: `Arrosage ${!isEnabled ? "activé" : "désactivé"}` };
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
    async setWindowState() {
        try {
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