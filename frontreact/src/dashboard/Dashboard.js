import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fonction pour vérifier le token
    const checkAuth = async () => {
      const token = localStorage.getItem("token"); // On récupère le token dans le localStorage

      if (!token) {
        setErrorMessage("Token manquant. Veuillez vous connecter.");
        navigate("/"); // Redirige vers la page de connexion si pas de token
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/check-token", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`, // Envoie le token dans l'en-tête de la requête
          },
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
          setErrorMessage(data.message || "Token invalide ou expiré");
          localStorage.removeItem("token"); // Supprime le token si invalide
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

    checkAuth(); // Appel de la fonction au chargement de la page
  }, [navigate]);

  // Si l'utilisateur n'est pas authentifié, on ne montre pas le dashboard
  if (!isAuthenticated) {
    return <div>{errorMessage && <p>{errorMessage}</p>}</div>;
  }

  return (
    <div>
      <h1>Bienvenue sur le Dashboard !</h1>
      <p>Contenu sécurisé accessible uniquement si authentifié.</p>
    </div>
  );
};

export default Dashboard;
