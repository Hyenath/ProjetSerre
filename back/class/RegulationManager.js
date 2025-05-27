const TCW = require('./TCW241');

class RegulationManager {
    constructor(ip, port) {
        this.indoorTemperature = 0.0;
        this.indoorMoisture = 0.0;
        this.soilMoisture = [0.0, 0.0, 0.0];
        this.heaterState = false;
        this.windowState = false;
        this.mistingState = false;
        this.wateringState = false;

        this.tcw = new TCW(ip, port);
    }

    updateSystem() {
        this.indoorTemperature = this.tcw.readIndoorTemperature();
        this.indoorMoisture = this.tcw.readIndoorMoisture();
        this.soilMoisture[0] = this.tcw.readSoilMoisture("1");
        this.soilMoisture[1] = this.tcw.readSoilMoisture("2");
        this.soilMoisture[2] = this.tcw.readSoilMoisture("3");
        this.heaterState = this.tcw.getHeaterState();
        this.windowState = this.tcw.getWindowState();
        this.mistingState = this.tcw.getMistingState();
        this.wateringState = this.tcw.getWateringState();
    }

    getMeanSoilMoisture() {}
}

module.exports=RegulationManager;