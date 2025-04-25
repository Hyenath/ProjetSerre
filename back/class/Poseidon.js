const net = require('net');

class Poseidon {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
    }

    // Lecture de 2 registres (32 bits) à une adresse précise (ex: 36033)
    async readTemperatureRegister(registerAddress) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            const unitId = 1;
            const transactionId = 0x0001;
            const protocolId = 0x0000;
            const length = 0x0006;
            const functionCode = 0x04; // Read Input Registers
            const quantity = 0x0002;

            // Modbus utilise un décalage de 1 (36033 → adresse 36032 en base 0)
            const address = registerAddress - 1;

            const request = Buffer.alloc(12);
            request.writeUInt16BE(transactionId, 0);
            request.writeUInt16BE(protocolId, 2);
            request.writeUInt16BE(length, 4);
            request.writeUInt8(unitId, 6);
            request.writeUInt8(functionCode, 7);
            request.writeUInt16BE(address, 8);
            request.writeUInt16BE(quantity, 10);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                // Les données commencent à l'octet 9
                const raw = data.slice(9, 13); // 4 octets
                // Swapped words + swapped bytes
                const reordered = Buffer.from([
                    raw[2], raw[3], raw[0], raw[1]
                ]);
                const value = reordered.readFloatBE(0);
                client.destroy();
                resolve(value);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP: " + err.message);
            });
        });
    }

    async getSensorsData() {
        try {
            const temperature = await this.readTemperatureRegister(36033);
            return {
                Temperature: temperature,
                TapWaterLevel: 0, // Placeholder si non implémenté
                RainWaterLevel: 0 // Placeholder si non implémenté
            };
        } catch (error) {
            throw new Error("Erreur lors de la récupération des données : " + error);
        }
    }

    async isWaterFrozen() {
        try {
            const temperature = await this.readTemperatureRegister(36033);
            return temperature < 0;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'eau gelée:", error);
            return null;
        }
    }
    
}

module.exports = Poseidon;
