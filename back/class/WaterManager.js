const Poseidon = require('./Poseidon');

class WaterManager {
    constructor(ip, port) {
        this.poseidon = new Poseidon(ip, port);
        this.tapWaterUsed = 0;
        this.rainWaterUsed = 0;
        this.waterSource = "RAIN"; // RAIN ou TAP
    }

    async updateWaterUsage() {
        try {
            const data = await this.poseidon.getSensorsData();
            this.rainWaterUsed = data.RainWaterLevel;
            this.tapWaterUsed = data.TapWaterLevel;
        } catch (error) {
            console.error("Erreur dans updateWaterUsage:", error);
        }
    }

    async switchWaterSource() {
        const isFrozen = await this.poseidon.isWaterFrozen();
        this.waterSource = isFrozen ? "TAP" : "RAIN";
    }
}

module.exports = WaterManager;
