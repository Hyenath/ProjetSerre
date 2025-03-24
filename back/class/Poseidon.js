const http = require('http');

class Poseidon {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
    }

    // Méthode pour récupérer les données des capteurs
    async getSensorsData() {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.ip,
                port: this.port,
                path: '/status.json',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('admin:admin').toString('base64')
                }
            };

            const request = http.request(options, (resp) => {
                let data = '';

                if (resp.statusCode !== 200) {
                    return reject(`Erreur HTTP ${resp.statusCode}`);
                }

                resp.on('data', (chunk) => {
                    data += chunk;
                });

                resp.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data.trim());
                        resolve(jsonData);
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

    // Vérifier si l'eau est gelée (exemple)
    async isWaterFrozen() {
        try {
            const data = await this.getSensorsData();
            return data.Temperature < 0; // Si la température est inférieure à 0°C, l'eau est gelée
        } catch (error) {
            console.error("Erreur lors de la vérification de l'eau gelée:", error);
            return null;
        }
    }
}

module.exports = Poseidon;
