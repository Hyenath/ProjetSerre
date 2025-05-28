import { Socket } from 'net';
import { client } from 'jsmodbus';

import Heating, { State } from './Heating.js';

class TCW241 {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.client = new Socket();
        this.modbusClient = new client.TCP(this.client, 1);
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
            
            if (isEnabled) this.heating = new Heating(State.ON);
            else this.heating = new Heating(State.OFF);    
        } catch (error) {
            console.error("Erreur :", error);
        }
    }
    
    async getHeaterState() {
        try {
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel du chauffage 5");
            return isEnabled;
        } catch (error) {
            return Error("Erreur lors de la lecture de l'état du chauffage : " + error.message);
        }
    }
    
    async getWindowState() {
        try {
            const result = await this.modbusClient.readCoils(103, 1);
            const state = result.response._body._valuesAsArray[0];
            const isOpen = state ? true : false;           
            if (isOpen !== true && isOpen !== false) throw new Error("Impossible de lire l'état actuel du vasistas");
            return isOpen;
        } catch (error) {
            return Error("Erreur lors de la lecture de l'état du vasistas : " + error.message);
        }
    }
    
    async getMistingState() {
        try {
            const result = await this.modbusClient.readCoils(100, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de la brumisation");
            return isEnabled;
        } catch (error) {
            return Error("Erreur lors de la lecture de l'état de la brumisation : " + error.message);
        }
    }
    
    async getWateringState() {
        try {
            const result = await this.modbusClient.readCoils(101, 1);
            const state = result.response._body._valuesAsArray[0];
            const isEnabled = state === 1;
            if (isEnabled !== true && isEnabled !== false) throw new Error("Impossible de lire l'état actuel de l'arrosage");
            return isEnabled;
        } catch (error) {
            return Error("Erreur lors de la lecture de l'état de l'arrosage : " + error.message);
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
            var register = 0;
            switch (sensorId) {
                case "1":
                register = 17500;
                break;
                case "2":
                register = 17502;
                break;
                case "3":
                register = 17504;
                break;
                default:
                throw new Error("Capteur inconnu");
            }
            const result = await this.modbusClient.readHoldingRegisters(register, 2);
            const data = result.response._body._valuesAsArray;
            const Vout = data[0] * 0.1;
            const humidite = -1.91e-9 * Vout ** 3 + 1.33e-5 * Vout ** 2 + 9.56e-3 * Vout - 21.6;
            return {
                analogValue: data[0],
                taux_humidite: Math.max(0.02, Math.min(humidite, 100)).toFixed(2)
            };
        } catch (error) {
            console.error(error);
            return { success: false, error: error.message };
        }
    }
    
    readIndoorTemperature() {}
    
    readIndoorMoisture() {}
    
    async setHeaterState() {
        try {
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

export default TCW241;