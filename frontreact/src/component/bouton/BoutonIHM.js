import React, { useState, useEffect } from "react";
import "./BoutonIHM.css"; // Fichier CSS pour le style

const BoutonIHM = ({ label, apiEndpoint, apiEtat, initialColor = "blue" }) => {
  const [color, setColor] = useState(initialColor);
  const [texteEtat, setTexteEtat] = useState("...");

  useEffect(() => {
    const fetchEtatInitial = async () => {
      try {
        const response = await fetch(apiEtat, { method: "GET" });
        const data = await response.json();
  
        if (data.Etat === true) {
          setColor("green");
          setTexteEtat("Ouvert");
        } else {
          setColor("red");
          setTexteEtat("Fermé");
        }
      } catch (error) {
        console.error("Erreur d'init :", error);
        setColor("red");
        setTexteEtat("Erreur");
      }
    };
  
    fetchEtatInitial();
  }, [apiEtat]);
  
  const handleClick = async () => {
    try {
      const response = await fetch(apiEndpoint, { method: "GET" });
      const data = await response.json();
  
      if (data.Etat === true) {
        setColor("green");
        setTexteEtat("Ouvert");
      } else {
        setColor("red");
        setTexteEtat("Fermé");
      }
    } catch (error) {
      console.error(`Erreur API ${label} :`, error);
      setColor("red");
      setTexteEtat("Erreur");
    }
  };
  return (
    <button
      className="bouton-ihm"
      style={{ backgroundColor: color }}
      onClick={handleClick}
    >
      {label} - {texteEtat}
    </button>
  );
};

export default BoutonIHM;