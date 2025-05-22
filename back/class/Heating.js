class Heating {
    constructor(state) {
        if (!Object.values(Heating.State).includes(state)) {
            throw new Error(`Invalid state: ${state}`);
        }
        this.state = state;
        console.log("État initial du chauffage :", this.state);
    }

    turnOn() {
        this.state = Heating.State.ON;
    }

    turnOff() {
        this.state = Heating.State.OFF;
    }
}

Heating.State = Object.freeze({
    ON: 'ON',
    OFF: 'OFF',
});

module.exports = Heating;
