import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../dashboard/navbar/Navbar";
import Footer from "../dashboard/footer/Footer";
import "./new_user.css";

const NewUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    lastname: "",
    firstname: "",
    mail: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
            navigate("/dashboard");
          }
  
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Erreur de vérification du token:", error);
          setErrorMessage("Erreur de connexion au serveur.");
          navigate("/");
        }
      };

      checkAuth();
    }, [navigate]);

    if (!isAuthenticated) {
        return <div>{errorMessage && <p>{errorMessage}</p>}</div>;
      }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://192.168.65.74:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Utilisateur créé avec succès !");
        setTimeout(() => navigate("/dashboard"), 2000); // Redirection après 2s
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setMessage("Une erreur est survenue, veuillez réessayer.");
    }
  };

  return (
    <div className="body_new_user">
    <div>
      <Navbar />
      <main>
        <div className="container_new_user">
          <h1>Créer un Nouvel Utilisateur</h1>
          <form onSubmit={handleSubmit} className="form-container">
            <input
              type="text"
              name="username"
              placeholder="Nom d'utilisateur"
              value={formData.username}
              onChange={handleChange}
              required
              className="form-input"
            />
            <input
              type="text"
              name="lastname"
              placeholder="Nom"
              value={formData.lastname}
              onChange={handleChange}
              required
              className="form-input"
            />
            <input
              type="text"
              name="firstname"
              placeholder="Prénom"
              value={formData.firstname}
              onChange={handleChange}
              required
              className="form-input"
            />
            <input
              type="email"
              name="mail"
              placeholder="Email"
              value={formData.mail}
              onChange={handleChange}
              required
              className="form-input"
            />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
            <button type="submit" className="submit-btn">Créer</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      </main>
      <Footer />
    </div>
    </div>
  );
};

export default NewUser;