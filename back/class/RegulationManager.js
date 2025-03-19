class RegulationManager {
    constructor(ip, port) {
        this.indoorTemperature = 0.0;
        this.indoorMoisture = 0.0;
        this.soilMoisture = [0.0, 0.0, 0.0];
        this.heaterState = false;
        this.windowState = false;
        this.mistingState = false;
        this.wateringState = false;
        this.ip = ip;
        this.port = port;
    }

    updateSystem() {}

    getMeanSoilMoisture() {}
}

module.exports = RegulationManager;