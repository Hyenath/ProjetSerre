import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <h1>Tableau de Bord</h1>
        <ul>
          <li><Link to="/dashboard">Accueil</Link></li>
          <li><Link to="/profile">Profil</Link></li>
          <li><Link to="/settings">Paramètres</Link></li>
          <li><Link to="/" onClick={() => localStorage.removeItem("token")}>Déconnexion</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
