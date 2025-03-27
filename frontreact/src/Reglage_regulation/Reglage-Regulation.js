import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../dashboard/navbar/Navbar";
import Footer from "../dashboard/footer/Footer";
import "./reglage.css";

const Regulation = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState(null);
  const [newValues, setNewValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://192.168.65.74:3001/check-token", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        console.log("🔑 Données auth :", data); // 🔎 Debug auth

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré");
          localStorage.removeItem("token");
          navigate("/dashboard");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("❌ Erreur de vérification du token:", error);
        setErrorMessage("Erreur de connexion au serveur.");
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("http://192.168.65.74:3001/getRegParam");
        const data = await response.json();
        console.log("📦 Données reçues :", data); // 🔎 Debug paramètres

        if (data.success && data.result.length > 0) {
          console.log("⚙️ Paramètres chargés :", data.result[0]); // Vérification
          setSettings(data.result[0]); 
        } else {
          setSettings(null);
        }
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des paramètres :", error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setNewValues({ ...newValues, [field]: value });
  };

  const handleSave = async (field) => {
    if (!newValues[field]) return;

    console.log("Données envoyées : ", { [field]: newValues[field] }); // 🔎 Debug envoi

    try {
      const response = await fetch("http://192.168.65.74:3001/updateRegParam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: newValues[field] })
      });

      if (response.ok) {
        setSettings({ ...settings, [field]: newValues[field] });
        setEditingField(null);
        console.log(`✅ ${field} mis à jour avec succès !`);
      } else {
        console.error("❌ Erreur lors de la mise à jour du paramètre");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'envoi des données :", error);
    }
  };

  if (!isAuthenticated) {
    return <div>{errorMessage && <p>{errorMessage}</p>}</div>;
  }

  return (
    <>
      <Navbar setIsAuthenticated={setIsAuthenticated} />
      <div className="settings-container">
        <h2>📊 Paramètres de la serre</h2>
        {settings ? (
          <ul>
            {Object.entries(settings).map(([key, value]) => (
              <li key={key}>
                <strong>{key.replace(/_/g, " ")} :</strong>
                {isAuthenticated === true && editingField === key ? (
                  <>
                    <input
                      type="number"
                      value={newValues[key] || value}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    <button
                      onClick={() => handleSave(key)}
                      className="save-btn"
                    >
                      💾 Sauvegarder
                    </button>
                    <button
                      onClick={() => setEditingField(null)}
                      className="cancel-btn"
                    >
                      ❌ Annuler
                    </button>
                  </>
                ) : (
                  <span
                    onClick={() => {
                      if (isAuthenticated === true) {
                        console.log(`🖊️ Modification de : ${key}`);
                        setEditingField(key);
                      }
                    }}
                    className={isAuthenticated ? "editable" : ""}
                  >
                    {value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="loading">🔄 Chargement des paramètres...</p>
        )}
      </div>
      <Footer />
    </>
  );
};


export default Regulation;
