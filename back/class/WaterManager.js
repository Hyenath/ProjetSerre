// WaterManager.js
const Poseidon = require('./Poseidon');

class WaterManager {
    constructor(ip, port) {
        this.poseidon = new Poseidon(ip, port);
    }

    getOutdoorTemperature() {
        return this.poseidon.getOutdoorTemperature();
    }

    getRainWaterLevel() {
        return this.poseidon.getRainWaterLevel();
    }

    getRainWaterUsed() {
        return this.poseidon.getRainWaterUsed();
    }

    getTapWaterUsed() {
        return this.poseidon.getTapWaterUsed();
    }

    isWaterFrozen() {
        return this.poseidon.isWaterFrozen();
    }

    setWaterSource(source) {
        return this.poseidon.setWaterSource(source);
    }

    setPumpState(state) {
        return this.poseidon.setPumpState(state);
    }
}

module.exports = WaterManager;
