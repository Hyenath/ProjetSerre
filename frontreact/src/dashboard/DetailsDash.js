import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend
} from "recharts";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import "./css/DetailsStyle.css";

const DetailsDash = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Données
  const [temperatureExte, setTemperatureExte] = useState([{ name: "Extérieur", température: 0 }]);
  const [eauType, setEauType] = useState([]);
  const [regulationParams, setRegulationParams] = useState([]);

  // 🔐 Vérification du token au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Aucun token trouvé. Veuillez vous connecter.");
        navigate("/dashboard"); // ou page login selon ton routing
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

  // 📊 Récupération des données seulement si authentifié
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTemperature = async () => {
      try {
        const res = await fetch("http://192.168.65.74:3001/serre/outdoor-temperature");
        const data = await res.json();
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setTemperatureExte([{ name: latest.name, température: latest.température }]);
        }
      } catch (err) {
        console.error("Erreur température :", err);
      }
    };

    const fetchWater = async () => {
      try {
        const res = await fetch("http://192.168.65.74:3001/serre/water-conso");
        const data = await res.json();
        const total = data.rain + data.tap;
        setEauType([
          { name: "Eau de pluie", value: total ? data.rain : 0 },
          { name: "Eau courante", value: total ? data.tap : 0 },
        ]);
      } catch (err) {
        console.error("Erreur conso eau :", err);
      }
    };

    const fetchRegulationParams = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("http://192.168.65.74:3001/gest/getRegParam", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.success && data.result.length > 0) {
          const rawParams = data.result[0];
          const transformed = Object.entries(rawParams).map(([key, value]) => ({
            param: key.replace(/_/g, " "),
            value: Number(value),
          }));
          setRegulationParams(transformed);
        }
      } catch (err) {
        console.error("Erreur paramètres régulation :", err);
      }
    };

    fetchTemperature();
    fetchWater();
    fetchRegulationParams();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="unauthorized">
        <p>{errorMessage || "🔐 Vérification en cours..."}</p>
      </div>
    );
  }

  const pieColors = ["#4fc3f7", "#81c784"];

  return (
    <div className="body">
      <div className="details-container">
        <Navbar />
        <main className="details-main">
          <h1 className="details-title">📊 Détails des données</h1>

          <section className="section-card">
            <h2>🌡 Température extérieure actuelle</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={temperatureExte}>
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="température" stroke="#ff9800" strokeWidth={3} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="section-card">
            <h2>🚰 Répartition de l'eau utilisée</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eauType}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {eauType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </section>

          <section className="section-card">
            <h2>⚙️ Paramètres de régulation</h2>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart outerRadius={150} data={regulationParams}>
                <PolarGrid />
                <PolarAngleAxis dataKey="param" />
                <PolarRadiusAxis />
                <Radar
                  name="Valeur"
                  dataKey="value"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </section>

          <div className="back-button-wrapper">
            <button className="back-button" onClick={() => navigate(-1)}>
              Revenir en arrière
            </button>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DetailsDash;
