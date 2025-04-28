const net = require('net');
const Modbus = require('jsmodbus');
const http = require('http');

class TCW241 {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.client = new net.Socket();
        this.modbusClient = new Modbus.client.TCP(this.client, 1); // Slave ID = 1

        this.client.connect({ host: ip, port: port }, () => {
            console.log("✅ Connexion Modbus TCP établie");
        });

        this.client.on('error', (err) => {
            console.error("❌ Erreur TCP :", err.message);
        });
    }

    #calculHumidite(Vout) {
        Vout *= 1000;
        let humid = -1.91e-9 * Vout ** 3 + 1.33e-5 * Vout ** 2 + 9.56e-3 * Vout - 21.6;
        return Math.max(0.02, Math.min(humid, 100));
    }
    
    async #getVasistasState() {
        try {
            const result = await this.modbusClient.readCoils(103, 1);
            const state = result.response._body._valuesAsArray[0];
            console.log(`Relais ${103} état :`, state ? 'ON' : 'OFF');
            return state;
        } catch (error) {
            console.error(`Erreur lors de la lecture du relais ${103} :`, error);
            return null;
        }
    }

    async #getHeaterState() {
        try {
            const result = await this.modbusClient.readCoils(102, 1);
            const state = result.response._body._valuesAsArray[0];
            console.log(`Relais ${103} état :`, state ? 'ON' : 'OFF');
            return state;
        } catch (error) {
            console.error(`Erreur lors de la lecture du relais ${103} :`, error);
            return null;
        }
    }

    async readSoilMoisture(sensorId) {
        const options = {
            hostname: this.ip,
            port: this.port,
            path: '/status.json',
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
            }
        };

        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const cleanData = data.trim().replace(/^\uFEFF/, '');
                        const json = JSON.parse(cleanData);
                        const analog = json.Monitor.AI;
                        const ai = analog[`AI${sensorId}`];
                        if (!ai) throw new Error("Capteur inconnu");
                        resolve({
                            analogValue: ai.value,
                            taux_humidite: this.#calculHumidite(ai.value)
                        });
                    } catch (e) {
                        reject("Erreur de parsing JSON: " + e.message);
                    }
                });
            });

            req.on("error", err => reject("Erreur serveur: " + err.message));
            req.end();
        });
    }

    // Fonctions à compléter
    readIndoorTemperature() {}
    readIndoorMoisture() {}
    async setHeaterState(enabled) {
        try {
            const isEnabled = await this.#getHeaterState();
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
    enableMisting(enabled) {}
    enableWatering(enabled) {}
    async setWindowState(opened) {
        try {
            const isOpen = await this.#getVasistasState();
    
            if (isOpen === null) throw new Error("Impossible de lire l'état actuel du vasistas");
    
            if (isOpen !== opened) {
                await this.modbusClient.writeSingleCoil(103, opened);
                return { success: true, message: `Vasistas ${opened ? "ouvert" : "fermé"}` };
            }
    
            return { success: true, message: `Vasistas déjà ${opened ? "ouvert" : "fermé"}` };
    
        } catch (error) {
            console.error("Erreur Modbus :", error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = TCW241;