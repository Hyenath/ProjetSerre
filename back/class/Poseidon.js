const net = require('net');

class Poseidon {
    constructor() {
        this.ip = '192.168.65.253';
        this.port = 502;
    }

    async readoutdoorTemperature() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            // Trame hexa modbus brute à envoyer pour recuperer les données du capteurs interieur : '00 00 00 00 00 04 02 04 00 64 00 01'
            const request = Buffer.from([
                0x00, 0x00,  // Transaction ID = 0x0000
                0x00, 0x00,  // Protocol ID    = 0x0000
                0x00, 0x04,  // Length         = 6 bytes
                0x02,        // Unit ID        = 2
                0x04,        // Function Code  = 4 (Read Input Register)
                0x00, 0x64,  // Register Addr  = 100 (0x0064)
                0x00, 0x01   // Quantity       = 1 register
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                // Exemple de réponse attendue : header + byte count + 2 octets de données
                // Les données utiles commencent souvent à l'offset 9
                const high = data[9];
                const low = data[10];
                const value = (high << 8) | low;
                const outdoorTemperature = value / 10;

                client.destroy();
                resolve(outdoorTemperature);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP: " + err.message);
            });
        });
    }

    async getoutdoorTemperature() {
        try {
            const outdoorTemperature = await this.readoutdoorTemperature();
            return {
                Temperature: outdoorTemperature
            };
        } catch (error) {
            throw new Error("Erreur lors de la récupération des données : " + error);
        }
    }

/*
    async isWaterFrozen() {
        try {
            const outdoorTemperature = await this.readoutdoorTemperature();
            return outdoorTemperature < 0;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'eau gelée:", error);
            return null;
        }
    }
*/

}


module.exports = Poseidon;
