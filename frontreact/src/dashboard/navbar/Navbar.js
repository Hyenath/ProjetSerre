import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css"; // Import du fichier CSS

const Navbar = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/");
  };

    // ✅ Détection de la souris dans le coin supérieur gauche
    useEffect(() => {
      const handleMouseMove = (e) => {
        if (e.clientX < 10) {
          setIsNavbarVisible(true);
        }
      };
  
      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

  return (
    <nav
    className={`sidebar ${isNavbarVisible ? "visible" : "hidden"}`}
    onMouseLeave={() => setIsNavbarVisible(false)} // Cache la navbar en quittant
  >
      <div className="sidebar-header">
        <h1>Serre de la Providence</h1>
      </div>
      <ul className="sidebar-menu">
        <li><Link to="/dashboard">🏠 Accueil</Link></li>
        {isAuthenticated && <li><Link to="/new-user">👤 Créer un utilisateur</Link></li>}
        <li><Link to="/settings">⚙️ Paramètres</Link></li>

        {/* Si l'utilisateur est connecté → bouton Déconnexion | Sinon → Connexion */}
        <li>
          {isAuthenticated ? (
            <Link to="/" onClick={handleLogout}>🚪 Déconnexion</Link>
          ) : (
            <Link to="/">🔑 Connexion</Link>
          )}
        </li>
      </ul>

      {/* Affichage de l'image uniquement si l'utilisateur est authentifié */}
      {isAuthenticated && <img src="/images/admin.png" alt="Admin" className="admin-image" />}

      {/* Affichage d'un message d'erreur si nécessaire */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </nav>
  );
};

export default Navbar;
