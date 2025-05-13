import React, { useState } from "react";
import Navbar from "../dashboard/navbar/Navbar";
import Footer from "../dashboard/footer/Footer";
import "./BasePurge.css";

const BasePurge = () => {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  // FRONTEND : BasePurge.jsx
const handlePurge = async () => {
    setMessage("");
    setErrorMessage("");
  
    if (!password) {
      setErrorMessage("Veuillez entrer le mot de passe.");
      return;
    }
  
    const confirm = window.confirm(
      "Êtes-vous sûr de vouloir purger la base de données ? Cette action est irréversible."
    );
  
    if (!confirm) return;
  
    setLoading(true);
  
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Vous devez être connecté.");
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch("http://192.168.65.74:3001/gest/basePurge", {
        method: "POST", // important: POST pour pouvoir passer un body
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password }), // envoi du mot de passe saisi
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage("Base de données purgée avec succès.");
        setPassword("");
      } else {
        setErrorMessage(data.message || "Échec de la purge.");
      }
    } catch (err) {
      setErrorMessage("Erreur serveur.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="body_base_purge">
      <main>
        <div className="container_base_purge">
          <h1>Purger la base de données</h1>
          <p className="warning-text">
            ⚠️ Cette action supprimera définitivement les données sélectionnées.
          </p>

          <input
            type="password"
            placeholder="Mot de passe admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
          />

          <button
            className="purge-btn"
            onClick={handlePurge}
            disabled={loading || !password}
          >
            {loading ? "Purge en cours..." : "Purger la base"}
          </button>

          {errorMessage && <p className="message error">{errorMessage}</p>}
          {message && <p className="message success">{message}</p>}
        </div>
      </main>
      <Footer />
      <Navbar />
    </div>
  );
};

export default BasePurge;
