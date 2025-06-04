const TCW = require('./TCW241');

class RegulationManager {
    constructor(tcw) {
        this.indoorTemperature = 0.0;
        this.indoorMoisture = 0.0;
        this.soilMoisture = [0.0, 0.0, 0.0];
        this.heaterState = false;
        this.windowState = false;
        this.mistingState = false;
        this.wateringState = false;
        
        this.tcw = tcw;
    }
    
    async updateSystem() {
        const tempResult = await this.tcw.readIndoorTemperature();
        this.indoorTemperature = tempResult.success ? parseFloat(tempResult.temperature) : 0.0;
        
        // Idem pour les autres capteurs
        const soil1 = await this.tcw.readSoilMoisture("1");
        const soil2 = await this.tcw.readSoilMoisture("2");
        const soil3 = await this.tcw.readSoilMoisture("3");
        
        this.soilMoisture[0] = parseFloat(soil1.taux_humidite || 0);
        this.soilMoisture[1] = parseFloat(soil2.taux_humidite || 0);
        this.soilMoisture[2] = parseFloat(soil3.taux_humidite || 0);
        
        this.heaterState = await this.tcw.getHeaterState();
        this.windowState = await this.tcw.getWindowState();
        this.mistingState = await this.tcw.getMistingState();
        this.wateringState = await this.tcw.getWateringState();
    }
    
    getMeanSoilMoisture() {
        const mean = (this.soilMoisture[0] + this.soilMoisture[1] + this.soilMoisture[2]) / 3;
        return mean;
    }
}

module.exports = RegulationManager;