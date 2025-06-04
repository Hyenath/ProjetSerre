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

  //Vérifie l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Aucun token trouvé. Veuillez vous reconnecter.");
        navigate("/dashboard");
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/auth/check-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("🔐 Auth check:", data);

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré.");
          localStorage.removeItem("token");
          navigate("/dashboard");
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Erreur de vérification du token :", error);
        setErrorMessage("Erreur de connexion au serveur.");
        navigate("/dashboard");
      }
    };

    checkAuth();
  }, [navigate]);

  //Récupère les paramètres
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch("http://192.168.65.74:3001/gest/getRegParam", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        console.log("Paramètres reçus :", data);

        if (response.ok && data.success && data.result.length > 0) {
          setSettings(data.result[0]);
        } else {
          setSettings(null);
          setErrorMessage(data.message || "Impossible de charger les paramètres.");
        }
      } catch (error) {
        console.error("Erreur lors du fetch :", error);
        setErrorMessage("Erreur lors de la récupération des paramètres.");
      }
    };

    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const handleChange = (field, value) => {
    setNewValues({ ...newValues, [field]: value });
  };

  const handleSave = async (field) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("Non authentifié.");
      return;
    }

    if (!newValues[field]) return;

    try {
      const response = await fetch("http://192.168.65.74:3001/gest/updateRegParam", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: newValues[field] }),
      });

      const data = await response.json();

      if (response.ok) {
        setSettings({ ...settings, [field]: newValues[field] });
        setEditingField(null);
      } else {
        setErrorMessage(data.message || "Erreur de mise à jour.");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
      setErrorMessage("Erreur de communication avec le serveur.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="unauthorized">
        <p>{errorMessage || "Authentification en cours..."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="settings-container">
        <h2>Paramètres de la serre</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {settings ? (
          <ul>
            {Object.entries(settings).map(([key, value]) => (
              <li key={key}>
                <strong>{key.replace(/_/g, " ")} :</strong>
                {editingField === key ? (
                  <>
                    <input
                      type="number"
                      value={newValues[key] || value}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                    <button onClick={() => handleSave(key)} className="save-btn">
                      Sauvegarder
                    </button>
                    <button onClick={() => setEditingField(null)} className="cancel-btn">
                      Annuler
                    </button>
                  </>
                ) : (
                  <span onClick={() => setEditingField(key)} className="editable">
                    {value}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="loading">Chargement des paramètres...</p>
        )}
      </div>
      <Footer />
      <Navbar />
    </>
  );
};

export default Regulation;
