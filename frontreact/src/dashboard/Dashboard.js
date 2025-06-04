import React, { useEffect, useState } from "react"; 
import { useNavigate, Link } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import BoutonIHM from "../component/bouton/BoutonIHM";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import "./css/Style.css";
import SerreInfo from './SerreInfo';

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [temperatureData, setTemperatureData] = useState([]);
  const navigate = useNavigate();
  const [temperatureExte, setTemperatureExte] = useState([
    { name: 'Extérieur', température: 0 },
  ]);

  const handleTemperatureChange = (temp) => {
    setTemperatureExte([{ name: 'Extérieur', température: temp }]);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/auth/check-token", {
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

  useEffect(() => {
    const fetchTemperatureData = async () => {
      try {
        const response = await fetch("http://192.168.65.74:3001/serre/etat-serre");
        const data = await response.json();
        const reversedData = data.reverse();
        setTemperatureData(reversedData);
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
        const response = await fetch("http://192.168.65.74:3001/serre/water-conso");
        const data = await response.json();

        const total = data.rain + data.tap;

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

  return (
    <div className="dashboard-body">
      <main className="main-futuristic">
        <div className="container-futuristic">
          <h1 className="title-glow">Tableau de bord de la serre</h1>
          <p className="subtitle">Visualisation en temps réel de l'état de la serre</p>

          {/* Graphique de température extérieur*/}
          <div className="chart-container futuristic">
            {temperatureData.length === 0 && (
              <p style={{ color: "#ff6b6b", textAlign: "center" }}>
                Aucune donnée disponible pour la température extérieure.
              </p>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                <YAxis tick={{ fill: "#399196" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', padding: '10px', boxShadow: '0 0 15px rgba(0, 234, 255, 0.4)' }} 
                  itemStyle={{ color: '#E0F7FA', fontFamily: 'Orbitron', fontSize: '16px' }} 
                  labelStyle={{ fontStyle: 'italic', color: '#E0F7FA' }}
                />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="température" fill="#399196" name="température exterieur" radius={[10, 10, 0, 0]} barSize={50} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>

            {isAuthenticated && (
              <div className="buttons-container">
                <BoutonIHM label="Vasistas" apiEndpoint="http://192.168.65.74:3001/serre/update-vasistas" apiEtat="http://192.168.65.74:3001/serre/vasistas" />
              </div>
            )}
          </div>

          {/* Graphique de température intérieur*/}
          <div className="chart-container futuristic">
            {temperatureData.length === 0 && (
              <p style={{ color: "#ff6b6b", textAlign: "center" }}>
                Aucune donnée disponible pour la température intérieur.
              </p>
            )}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                <YAxis tick={{ fill: "#399196" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', padding: '10px', boxShadow: '0 0 15px rgba(0, 234, 255, 0.4)' }} 
                  itemStyle={{ color: '#E0F7FA', fontFamily: 'Orbitron', fontSize: '16px' }} 
                  labelStyle={{ fontStyle: 'italic', color: '#E0F7FA' }}
                />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="températureInt" fill="#ff8c00" name="température intérieur" radius={[10, 10, 0, 0]} barSize={50} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique de l'humidité (air + sol) */}
          <div className="chart-container futuristic">
            {temperatureData.length === 0 ? (
              <p style={{ color: "#ff6b6b", textAlign: "center" }}>
                Aucune donnée d’humidité disponible pour le moment.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={temperatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                  <YAxis tick={{ fill: "#399196" }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '10px',
                      padding: '10px',
                      boxShadow: '0 0 15px rgba(0, 234, 255, 0.4)'
                    }}
                    itemStyle={{ color: '#E0F7FA', fontFamily: 'Orbitron', fontSize: '16px' }}
                    labelStyle={{ fontStyle: 'italic', color: '#E0F7FA' }}
                  />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="humidité" fill="#1CA6A3" name="Air" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="humiditéSol1" fill="#FF8C42" name="Sol 1" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="humiditéSol2" fill="#FFB703" name="Sol 2" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="humiditéSol3" fill="#D7263D" name="Sol 3" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Graphique de consommation d'eau */}
          <div className="chart-container futuristic">
            <h1 className="title-glow">Graphe de la consommation d'eau</h1>
            {temperatureData.length === 0 && (
              <p style={{ color: "#ff6b6b", textAlign: "center" }}>
                Aucune donnée disponible pour la consommation d'eau.
              </p>
            )}
            <div className="chart-and-buttons">
              <div className="chart">
                <PieChart width={300} height={300}>
                  <Pie
                    data={eauType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    fill="#8884d8" paddingAngle={5}
                    animationDuration={1000}
                  >
                    {eauType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === 'Eau de pluie' 
                          ? `rgba(0, 136, 254, ${entry.value / 100})`
                          : `rgba(0, 196, 159, ${entry.value / 100})`
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', padding: '10px', boxShadow: '0 0 15px rgba(0, 234, 255, 0.4)' }} 
                    itemStyle={{ color: '#E0F7FA', fontFamily: 'Orbitron', fontSize: '16px' }} 
                    labelStyle={{ fontStyle: 'italic', color: '#E0F7FA' }}
                  />
                  <Legend />
                </PieChart>
              </div>

              {isAuthenticated && (
                <div className="buttons-container">
                  <BoutonIHM label="Electrovanne Pluie" apiEndpoint="http://192.168.65.74:3001/serre/update-vasistas" apiEtat="http://192.168.65.74:3001/serre/vasistas" />
                  <BoutonIHM label="Electrovanne Courante" apiEndpoint="http://192.168.65.74:3001/serre/update-vasistas" apiEtat="http://192.168.65.74:3001/serre/vasistas" />
                </div>
              )}
            </div>
          </div>

          {/* Interface de contrôle */}
          {isAuthenticated && (
            <div className="control-panel">
              <h1 className="title-glow">Interface de contrôle</h1>
              <BoutonIHM label="Brumisation" apiEndpoint="http://192.168.65.74:3001/serre/update-vasistas" apiEtat="http://192.168.65.74:3001/serre/vasistas" />
              <BoutonIHM label="Arrosage" apiEndpoint="http://192.168.65.74:3001/serre/update-vasistas" apiEtat="http://192.168.65.74:3001/serre/vasistas" />
              <BoutonIHM label="Chauffage" apiEndpoint="http://192.168.65.74:3001/serre/update-heating" apiEtat="http://192.168.65.74:3001/serre/update-heating" />
            </div>
          )}

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="chart-container futuristic">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={temperatureExte} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="name" tick={{ fill: "#399196" }} />
                <YAxis tick={{ fill: "#399196" }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', borderRadius: '10px', padding: '10px', boxShadow: '0 0 15px rgba(0, 234, 255, 0.4)' }} 
                  itemStyle={{ color: '#E0F7FA', fontFamily: 'Orbitron', fontSize: '16px' }} 
                  labelStyle={{ fontStyle: 'italic', color: '#E0F7FA' }}
                />
                <Legend verticalAlign="top" align="right" />
                <Bar dataKey="température" fill="#399196" radius={[10, 10, 0, 0]} barSize={50} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <SerreInfo onTemperatureChange={handleTemperatureChange} />

          {/* Lien ajouté à la fin (Details)*/}
          {isAuthenticated && (
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <Link to="/details-dashboard" className="voir-plus-link">Voir plus en détail</Link>
          </div>
          )}
        </div>
      </main>
      <Footer />
      <Navbar />
    </div>
  );
};

export default Dashboard;
