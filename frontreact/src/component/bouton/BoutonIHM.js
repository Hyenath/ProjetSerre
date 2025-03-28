import React, { useState } from "react";
import "./BoutonIHM.css"; // Fichier CSS pour le style

const BoutonIHM = ({ label, apiEndpoint, initialColor = "blue" }) => {
  const [color, setColor] = useState(initialColor);

  const handleClick = async () => {
    try {
      // Changement de couleur temporaire pour indiquer l'action
      setColor("gray");

      // Envoi de la requête à l'API (GET car pas de JSON à l'envoi)
      const response = await fetch(apiEndpoint, { method: "GET" });

      if (!response.ok) {
        throw new Error("Erreur lors de la requête API");
      }

      const data = await response.json();

      // Vérification du JSON de retour
      if (data.Vasistas === "true") {
        setColor("green"); // ✅ Succès → couleur verte
        console.log(`✅ ${label} activé avec succès`);
      } else {
        setColor("red"); // ❌ Réponse incorrecte → couleur rouge
        console.warn(`⚠️ Réponse inattendue de l'API pour ${label}`);
      }
    } catch (error) {
      setColor("red"); // ❌ Erreur de connexion ou serveur
      console.error(`❌ Erreur lors de l'action ${label} :`, error);
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
