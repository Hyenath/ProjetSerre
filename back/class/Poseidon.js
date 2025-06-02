const net = require('net');

class Poseidon {
    constructor() {
        this.ip = '192.168.65.253';
        this.port = 502;
    }

// ---------------------------------------- CAPTEUR TEMPERATURE EXTERIEUR : ----------------------------------------
    async readoutdoorTemperature() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            // Trame hexa modbus brute à envoyer pour recuperer les données du capteurs exterieur : '00 00 00 00 00 04 02 04 00 64 00 01'
            const request = Buffer.from([
                0x00, 0x00,  // Transaction ID
                0x00, 0x00,  // Protocol ID
                0x00, 0x04,  // Length
                0x02,        // Unit ID
                0x04,        // Function Code
                0x00, 0x64,  // Register Addr = 100 (0x0064)
                0x00, 0x01   // Quantity
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                const high = data[9];
                const low = data[10];
                const value = (high << 8) | low;
                const outdoorTemperature = value / 10;

                client.destroy();
                resolve(outdoorTemperature);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP (Capteur Temperature Exterieur): " + err.message);
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

    // VERIFICATION POUR SAVOIR SI L'EAU EST GELE :
    async isWaterFrozen() {
        try {
            const outdoorTemperature = await this.readoutdoorTemperature();
            return outdoorTemperature < 0;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'eau gelée:", error);
            return null;
        }
    }



// ---------------------------------------- CAPTEUR DU NIVEAU DE L'EAU DU BIDON : ----------------------------------------
    async readrainWaterLevel() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            const adrs1 = 0x00 ; // Register Addr 0000 puisque je n'ai pas le capteur en réel (29/04/2025)
            const adrs2 = 0x00 ;

            // Trame hexa modbus brute à envoyer pour recuperer les données du capteurs interieur : '00 00 00 00 00 04 02 04 XX XX 00 01'
            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x04,           // Function Code  = 4 (Read Input Register)
                adrs1, adrs2, 
                0x00, 0x01   
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                const high = data[9];
                const low = data[10];
                const value = (high << 8) | low;
                const rainWaterLevel = value ;

                client.destroy();
                resolve(rainWaterLevel);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP (Capteur Niveau d'eau): " + err.message);
            });
        });
    }

    async getrainWaterLevel() {
        try {
            const rainWaterLevel = await this.readrainWaterLevel();
            return {
                RainWaterLevel: rainWaterLevel
            };
        } catch (error) {
            throw new Error("Erreur lors de la récupération des données : " + error);
        }
    }

// ---------------------------------------- CAPTEUR DEBITMETRE (GESTION CONSOMATION D'EAU) : ----------------------------------------
    
    // -------------------- CAPTEUR DEBITMETRE RAIN (EAU DE PLUIE) : --------------------
    async readrainWaterUsed() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            const adrs1 = 0x00 ; // Register Addr 0000 puisque je n'ai pas le capteur en réel (29/04/2025)
            const adrs2 = 0x00 ;

            // Trame hexa modbus brute à envoyer pour recuperer les données du capteurs interieur : '00 00 00 00 00 04 02 04 XX XX 00 01'
            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x04,           // Function Code  = 4 (Read Input Register)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (29/04/2025)
                0x00, 0x01   
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                const high = data[9];
                const low = data[10];
                const value = (high << 8) | low;
                const rainWaterUsed = value ;

                client.destroy();
                resolve(rainWaterUsed);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP (Capteur Debitmetre Rain): " + err.message);
            });
        });
    }

    async getrainWaterUsed() {
        try {
            const rainWaterUsed = await this.readrainWaterUsed();
            return {
                RainWaterUsed: rainWaterUsed
            };
        } catch (error) {
            throw new Error("Erreur lors de la récupération des données : " + error);
        }
    }

    // -------------------- CAPTEUR DEBITMETRE TAP (EAU COURANTE) : --------------------
    async readtapWaterUsed() {
        return new Promise((resolve, reject) => {
            const client = new net.Socket();

            const adrs1 = 0x00 ; // Register Addr 0000 puisque je n'ai pas le capteur en réel (29/04/2025)
            const adrs2 = 0x00 ;

            // Trame hexa modbus brute à envoyer pour recuperer les données du capteurs interieur : '00 00 00 00 00 04 02 04 XX XX 00 01'
            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x04,           // Function Code  = 4 (Read Input Register)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (29/04/2025)
                0x00, 0x01   
            ]);

            client.connect(this.port, this.ip, () => {
                client.write(request);
            });

            client.on('data', (data) => {
                const high = data[9];
                const low = data[10];
                const value = (high << 8) | low;
                const tapWaterUsed = value ;

                client.destroy();
                resolve(tapWaterUsed);
            });

            client.on('error', (err) => {
                reject("Erreur Modbus TCP (Capteur Debitmetre Rain): " + err.message);
            });
        });
    }

    async gettapWaterUsed() {
        try {
            const tapWaterUsed = await this.readtapWaterUsed();
            return {
                TapWaterUsed: tapWaterUsed
            };
        } catch (error) {
            throw new Error("Erreur lors de la récupération des données : " + error);
        }
    }

    // -------------------- ACTIONNEURS (VALVE & POMPE) : --------------------
    async setWaterSource(source) {
        try {
            console.log(`Changement de la source d'eau vers : ${source}`);
            // -------------------- VALVE TAP : --------------------
            if (source === "TAP") await new Promise((resolve, reject) => {
            const client = new net.Socket();
            const adrs1 = 0x00 ; // Register Addr 0000 puisque je n'ai pas le capteur en réel (29/04/2025)
            const adrs2 = 0x00 ;

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,           // Function Code  = 5 (Write Single Coil)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (26/05/2025)
                0x00, 0x00   
            ]);
            client.connect(this.port, this.ip, () => {
                client.write(request);
            });
            client.on('data', (data) => {
                console.log(`Réponse actionneur (source ${source}):`, data.toString('hex'));
                client.destroy();
                resolve();
            });
            client.on('error', (err) => {
                reject("Erreur Modbus TCP (setWaterSource TAP): " + err.message);
            });
            });
            
            // -------------------- VALVE RAIN : --------------------
            else if (source === "RAIN") await new Promise((resolve, reject) => {
            const client = new net.Socket();
            const adrs1 = 0x00 ; // Register Addr 0000 puisque je n'ai pas l'actionneur en réel (26/05/2025)
            const adrs2 = 0x00 ;

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,           // Function Code  = 5 (Write Single Coil)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (26/05/2025)
                0xFF, 0x00   
            ]);
            client.connect(this.port, this.ip, () => {
                client.write(request);
            });
            client.on('data', (data) => {
                console.log(`Réponse actionneur (source ${source}):`, data.toString('hex'));
                client.destroy();
                resolve();
            });
            client.on('error', (err) => {
                reject("Erreur Modbus TCP (setWaterSource RAIN): " + err.message);
            });
        });
        
        } catch (error) {
            console.error("Erreur dans setWaterSource:", error);
            throw error;
        }
    }

    async setPumpState(state) {
    try {
        console.log(`Mise à jour de l'état de la pompe : ${state}`);

        // -------------------- POMPE OFF : --------------------
        if (state === "OFF") await new Promise((resolve, reject) => {
            const client = new net.Socket();
            const adrs1 = 0x00; // Register Addr 0000 puisque je n'ai pas l'actionneur en réel (26/05/2025)
            const adrs2 = 0x00;

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,           // Function Code  = 5 (Write Single Coil)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (26/05/2025)
                0x00, 0x00   
            ]);
            client.connect(this.port, this.ip, () => {
                client.write(request);
            });
            client.on('data', (data) => {
                console.log(`Réponse actionneur (pompe OFF):`, data.toString('hex'));
                client.destroy();
                resolve();
            });
            client.on('error', (err) => {
                reject("Erreur Modbus TCP (setPumpState OFF): " + err.message);
            });
        });

        // -------------------- POMPE ON : --------------------
        else if (state === "ON") await new Promise((resolve, reject) => {
            const client = new net.Socket();
            const adrs1 = 0x00; // Register Addr 0000 puisque je n'ai pas l'actionneur en réel (26/05/2025)
            const adrs2 = 0x00;

            const request = Buffer.from([
                0x00, 0x00,
                0x00, 0x00,
                0x00, 0x04,
                0x02,
                0x05,           // Function Code  = 5 (Write Single Coil)
                adrs1, adrs2,   // Register Addr  = JE NE SAIS PAS ENCORE (26/05/2025)
                0xFF, 0x00   
            ]);
            client.connect(this.port, this.ip, () => {
                client.write(request);
            });
            client.on('data', (data) => {
                console.log(`Réponse actionneur (pompe ON):`, data.toString('hex'));
                client.destroy();
                resolve();
            });
            client.on('error', (err) => {
                reject("Erreur Modbus TCP (setPumpState ON): " + err.message);
            });
        });

    } catch (error) {
        console.error("Erreur dans setPumpState:", error);
        throw error;
    }
    }
}

module.exports = Poseidon;

