import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import "./css/Style.css";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch("http://192.168.65.74:3001/check-token", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré");
          localStorage.removeItem("token");
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        setErrorMessage("Erreur de connexion au serveur.");
      }
    };

    checkAuth();
  }, [navigate]);

  if (!isAuthenticated) {
    return <div>{errorMessage && <p>{errorMessage}</p>}</div>;
  }

  // Données pour le graphique
  const data = [
    { name: "Jan", utilisateurs: 120 },
    { name: "Fév", utilisateurs: 150 },
    { name: "Mar", utilisateurs: 180 },
    { name: "Avr", utilisateurs: 220 },
    { name: "Mai", utilisateurs: 260 },
    { name: "Juin", utilisateurs: 300 },
  ];

  const eau_type = [
    { name: 'Eau de pluie', value: 75 },
    { name: 'Eau courante', value: 25 },
  ];

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div>
      <Navbar />
      <main>
        <div className="container">
          <h1>Bienvenue sur le tableau de bord de la serre</h1>
          <p>Voici un aperçu des statistiques de fréquentation.</p>

          {/* Graphique amélioré */}
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#399196" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#399196" stopOpacity={0.2} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                <YAxis tick={{ fill: "#399196" }} />
                <Tooltip contentStyle={{ backgroundColor: "#FFF", borderRadius: "10px", boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }} />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="utilisateurs" fill="#399196" radius={[10, 10, 0, 0]} barSize={50} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dashboard">
            <h1>Graphe de la consommation d'eau</h1>
            <PieChart width={300} height={300}>
            <Pie
              data={eau_type}
              dataKey="value"
              nameKey="name"
              cx="50%"  // Centrage du graphique
              cy="50%"
              innerRadius={50} // Rayon intérieur pour un graphique en anneau
              outerRadius={80} // Rayon extérieur
              fill="#8884d8"
              paddingAngle={5}
            >
              {eau_type.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
            </PieChart>
          </div>

      </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;