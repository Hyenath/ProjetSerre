import React, { useEffect, useState } from "react";

export default function SerreInfo({ onTemperatureChange }) {
  const [data, setData] = useState({
    temperature_interieure: '--',
    temperature_exterieure: '--',
    humidite_interieure: '--',
    humidite_sol_1: '--',
    humidite_sol_2: '--',
    humidite_sol_3: '--',
    arrosage: false,
    brumisation: false,
  });

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');

    socket.onmessage = (event) => {
      const newData = JSON.parse(event.data);
      setData(newData);

      // Envoi au parent
      if (onTemperatureChange && newData.temperature_exterieure !== '--') {
        onTemperatureChange(parseFloat(newData.temperature_exterieure));
      }
    };

    socket.onclose = () => {
      console.warn('WebSocket fermé');
    };

    return () => socket.close();
  }, [onTemperatureChange]);

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-bold">Données de la serre 🌱</h2>
      <div>🌡️ Température intérieure : {data.temperature_interieure} °C</div>
      <div>🌡️ Température extérieure : {data.temperature_exterieure} °C</div>
      <div>💧 Humidité intérieure : {data.humidite_interieure} %</div>
      <div>🌱 Humidité sol 1 : {data.humidite_sol_1} %</div>
      <div>🌱 Humidité sol 2 : {data.humidite_sol_2} %</div>
      <div>🌱 Humidité sol 3 : {data.humidite_sol_3} %</div>
      <div>🚿 Arrosage : {data.arrosage ? 'Activé' : 'Désactivé'}</div>
      <div>💨 Brumisation : {data.brumisation ? 'Activée' : 'Désactivée'}</div>
    </div>
  );
}
