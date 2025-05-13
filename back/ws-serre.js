const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket Server en écoute sur ws://localhost:8080");

function getFakeData() {
    return JSON.stringify({
        temperature_interieure: (10 + Math.random() * 5).toFixed(1),
        temperature_exterieure: (8 + Math.random() * 5).toFixed(1),
        humidite_interieure: (40 + Math.random() * 10).toFixed(1),
        humidite_sol_1: (30 + Math.random() * 10).toFixed(1),
        humidite_sol_2: (30 + Math.random() * 10).toFixed(1),
        humidite_sol_3: (30 + Math.random() * 10).toFixed(1),
        arrosage: Math.random() > 0.5,
        brumisation: Math.random() > 0.5,
    });
}

wss.on('connection', (ws) => {

    const interval = setInterval(() => {
        ws.send(getFakeData());
    }, 1000);

    ws.on('close', () => {
        clearInterval(interval);
    });
});
