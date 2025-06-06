// Poseidon.js
const net = require('net');

class Poseidon {
    constructor(ip = '192.168.65.253', port = 502) {
        this.ip = ip;
        this.port = port;
    }

    readRegister(registerAddress) {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x06,
                0x01,
                0x04,
                (registerAddress >> 8) & 0xFF,
                registerAddress & 0xFF,
                0x00, 0x01
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                if (data.length >= 11) {
                    const value = (data[9] << 8) | data[10];
                    client.destroy();
                    resolve(value);
                } else {
                    client.destroy();
                    reject(new Error('Réponse Modbus invalide'));
                }
            });

            client.on('error', (err) => reject(err));
        });
    }

    async getOutdoorTemperature() {
        const value = await this.readRegister(100);
        return value / 10;
    }

    async getRainWaterLevel() {
        return await this.readRegister(201);
    }

    async getRainWaterUsed() {
        return await this.readRegister(203);
    }

    async getTapWaterUsed() {
        return await this.readRegister(203);
    }

    async isWaterFrozen() {
        const temp = await this.getOutdoorTemperature();
        return temp < 0;
    }

    // ==================== ACTIONNEURS ====================

    async setWaterSource(source) {
        try {
            console.log(`Changement de la source d'eau vers : ${source}`);
            const client = new net.Socket();
            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,
                0x00, 0xC7, // Valve = 199
                source === 'RAIN' ? 0xFF : 0x00,
                0x00
            ]);

            return new Promise((resolve, reject) => {
                client.connect(this.port, this.ip, () => {
                    client.write(request);
                });

                client.on('data', (data) => {
                    console.log(`Réponse actionneur (source ${source}):`, data.toString('hex'));
                    client.destroy();
                    resolve();
                });

                client.on('error', (err) => {
                    client.destroy();
                    reject(`Erreur Modbus TCP (setWaterSource): ${err.message}`);
                });
            });

        } catch (error) {
            throw new Error("Erreur dans setWaterSource: " + error);
        }
    }

    async setPumpState(state) {
        try {
            console.log(`Mise à jour de l'état de la pompe : ${state}`);
            const client = new net.Socket();

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,
                0x00, 0xC8, // Pompe = 200
                state === 'ON' ? 0xFF : 0x00,
                0x00
            ]);

            return new Promise((resolve, reject) => {
                client.connect(this.port, this.ip, () => {
                    client.write(request);
                });

                client.on('data', (data) => {
                    console.log(`Réponse actionneur (pompe ${state}):`, data.toString('hex'));
                    client.destroy();
                    resolve();
                });

                client.on('error', (err) => {
                    client.destroy();
                    reject(`Erreur Modbus TCP (setPumpState): ${err.message}`);
                });
            });

        } catch (error) {
            throw new Error("Erreur dans setPumpState: " + error);
        }
    }
}

module.exports = Poseidon;
