const http = require('http');

class TCW241 {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.tcpClient = null; // Simulation de la connexion Socket
        this.modbusClient = null; // Simulation du client Modbus
    }
    
    #calculHumidite(Vout) {
        // Conversion de V en mV
        Vout *= 1000;
    
        // Calcul de l'humidité
        let humid = -1.91 * Math.pow(10, -9) * Math.pow(Vout, 3);
        humid += 1.33 * Math.pow(10, -5) * Math.pow(Vout, 2);
        humid += 9.56 * Math.pow(10, -3) * Vout;
        humid -= 2.16 * Math.pow(10, 1);
    
        // Gestion des bornes
        if (humid < 0.0) {
            humid = 0.02;
        } else if (humid > 100.0) {
            humid = 100.0;
        }
    
        return humid;
    }

    readIndoorTemperature() {}
    readIndoorMoisture() {}
    
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
            const request = http.request(options, (resp) => {
                let data = '';
                
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                
                resp.on('end', () => {
                    try {
                        const cleanData = data.trim().replace(/^\uFEFF/, '');
                        const jsonData = JSON.parse(cleanData);
                        let result;
                        switch (sensorId) {
                            case "1":
                                result = {analogValue: jsonData.Monitor.AI.AI1.value, taux_humidite: this.#calculHumidite(jsonData.Monitor.AI.AI1.value)};
                                break;
                            case "2":
                                result = {analogValue: jsonData.Monitor.AI.AI2.value, taux_humidite: this.#calculHumidite(jsonData.Monitor.AI.AI2.value)};
                                break;
                            case "3":
                                result = {analogValue: jsonData.Monitor.AI.AI3.value, taux_humidite: this.#calculHumidite(jsonData.Monitor.AI.AI3.value)};
                                break;
                            default:
                                throw new Error("Capteur inconnu");
                        }
                        resolve(result);
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
    }
    
    setHeaterState(enabled) {}

    async setWindowState(opened) {
        const parameter = opened ? "rof":"ron";
        const options = {
            hostname: this.ip,
            port: this.port,
            path: `/status.json?${parameter}=8`,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
            }
        };
        
        return new Promise((resolve, reject) => {
            const request = http.request(options, (resp) => {
                if (resp.statusCode === 200) {
                    resolve(true);
                } else {
                    reject(`Erreur: Code ${resp.statusCode}`);
                }
            });
            
            request.on("error", (err) => {
                reject("Erreur serveur: " + err.message);
            });
            
            request.end();
        });
    }

    enableMisting(enabled) {}
    enableWatering(enabled) {}
}

module.exports = TCW241;