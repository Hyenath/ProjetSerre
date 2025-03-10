import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import du fichier CSS

const Navbar = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h1>Tableau de Bord</h1>
      </div>
      <ul className="sidebar-menu">
        <li><Link to="/dashboard">🏠 Accueil</Link></li>
        <li><Link to="/profile">👤 Profil</Link></li>
        <li><Link to="/settings">⚙️ Paramètres</Link></li>
        <li><Link to="/" onClick={() => localStorage.removeItem("token")}>🚪 Déconnexion</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
