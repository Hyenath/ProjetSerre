import React, { useState } from "react";
import "./BoutonIHM.css"; // Import du fichier CSS pour le style

const BoutonIHM = ({ label, apiEndpoint, initialColor = "blue" }) => {
  const [color, setColor] = useState(initialColor);

  const handleClick = async () => {
    try {
      // Changement de couleur temporaire pour indiquer l'action
      setColor("gray");

      // Envoi de la requête à l'API
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: label }),
      });

      if (response.ok) {
        setColor("green"); // Succès → couleur verte
        console.log(`✅ Action réussie pour ${label}`);
      } else {
        setColor("red"); // Échec → couleur rouge
        console.error(`❌ Erreur lors de l'action ${label}`);
      }
    } catch (error) {
      setColor("red"); // Erreur de connexion
      console.error(`❌ Erreur de connexion à l'API pour ${label} :`, error);
    }

    // Retour à la couleur initiale après 2 secondes
    setTimeout(() => setColor(initialColor), 2000);
  };

  return (
    <button
      className="bouton-ihm"
      style={{ backgroundColor: color }}
      onClick={handleClick}
    >
      {label}
    </button>
  );
};

export default BoutonIHM;