import React, { useState } from "react";
import Navbar from "../dashboard/navbar/Navbar";
import Footer from "../dashboard/footer/Footer";
import "./BasePurge.css";

const BasePurge = () => {
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Vous devez être connecté.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://192.168.65.74:3001/admin/purge", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Base de données purgée avec succès.");
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
          <button
            className="purge-btn"
            onClick={handlePurge}
            disabled={loading}
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
