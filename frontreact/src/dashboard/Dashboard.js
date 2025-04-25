import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import BoutonIHM from "../component/bouton/BoutonIHM";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import "./css/Style.css";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [temperatureData, setTemperatureData] = useState([]);
  const navigate = useNavigate();

  // Vérification de l'authentification
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/check-token", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré");
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        setErrorMessage("Erreur de connexion au serveur.");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Récupération des données de température depuis le backend
  useEffect(() => {
    const fetchTemperatureData = async () => {
      try {
        const response = await fetch("http://192.168.65.74:3001/indoor-temperature");
        const data = await response.json();
  
        setTemperatureData(data); // plus besoin de formatter à nouveau
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      }
    };
  
    fetchTemperatureData();
  }, []);

  const [eauType, setEauType] = useState([]);

  useEffect(() => {
    const fetchWaterConso = async () => {
      try {
        const response = await fetch("http://192.168.65.74:3001/water-conso");
        const data = await response.json();
  
        const total = data.rain + data.tap;
  
        // Évite une division par zéro
        if (total === 0) {
          setEauType([
            { name: 'Eau de pluie', value: 0 },
            { name: 'Eau courante', value: 0 },
          ]);
          return;
        }
  
        const rainPercent = Math.round((data.rain / total) * 100);
        const tapPercent = 100 - rainPercent;
  
        setEauType([
          { name: 'Eau de pluie', value: rainPercent },
          { name: 'Eau courante', value: tapPercent },
        ]);
      } catch (error) {
        console.error("Erreur récupération consommation d'eau :", error);
      }
    };
  
    fetchWaterConso();
  }, []);

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div>
      <Navbar />
      <main>
        <div className="container">
          <h1>Bienvenue sur le tableau de bord de la serre</h1>
          <p>Voici un aperçu des statistiques de la température intérieur</p>

          {/* Graphique de la température */}
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                <YAxis tick={{ fill: "#399196" }} />
                <Tooltip contentStyle={{ backgroundColor: "#FFF", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }} />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="température" fill="#399196" radius={[10, 10, 0, 0]} barSize={50} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique de consommation d'eau */}
          <div className="dashboard">
            <h1>Graphe de la consommation d'eau</h1>
            <PieChart width={300} height={300}>
              <Pie
                data={eauType}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                innerRadius={50} outerRadius={80}
                fill="#8884d8" paddingAngle={5}
              >
                {eauType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
        </div>

          {/* Interface de contrôle */}
          {isAuthenticated && (
            <div>
              <h1>🔧 Interface de contrôle</h1>
              <BoutonIHM label="Vasistas" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
              <BoutonIHM label="Brumisation" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
              <BoutonIHM label="Arrosage" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
              <BoutonIHM label="Electrovanne Pluie" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
              <BoutonIHM label="Electrovanne Courante" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
              <BoutonIHM label="Chauffage" apiEndpoint="http://192.168.65.74:3001/test-vasistas" apiEtat="http://192.168.65.74:3001/etat-vasistas" />
            </div>
          )}

          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
