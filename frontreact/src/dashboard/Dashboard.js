import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./footer/Footer";
import  "./css/Style.css";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Vérification du token d'authentification
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Token manquant. Veuillez vous connecter.");
        navigate("/"); // Redirige vers la page de connexion si pas de token
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/check-token", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré");
          localStorage.removeItem("token");
          navigate("/"); // Redirige vers la page de connexion
          return;
        }

        // Si le token est valide
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Erreur de vérification du token:", error);
        setErrorMessage("Erreur de connexion au serveur.");
        navigate("/"); // Redirige vers la page de connexion en cas d'erreur
      }
    };

    checkAuth();
  }, [navigate]);

  if (!isAuthenticated) {
    return <div>{errorMessage && <p>{errorMessage}</p>}</div>;
  }

  return (
    <div>
      <Navbar />
      <main>
        <div className="container">
          <h1>Bienvenue sur le Dashboard !</h1>
          <p>Contenu sécurisé accessible uniquement si authentifié.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
