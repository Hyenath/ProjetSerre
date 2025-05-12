import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../dashboard/navbar/Navbar";
import Footer from "../dashboard/footer/Footer";
import "./UpdateUser.css";

const UpdateUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    mail: "",
    firstname: "",
    lastname: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Indicateur de chargement
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Vous devez être connecté.");
        navigate("/"); // Rediriger vers la page de connexion si pas de token
        return;
      }

      try {
        const response = await fetch("http://192.168.65.74:3001/auth/getUser", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Passer le token dans l'en-tête
          },
        });

        const data = await response.json();

        if (response.ok) {
          setFormData({
            username: data.username || "",
            mail: data.mail || "",
            firstname: data.firstname || "",
            lastname: data.lastname || "",
            password: "", // Ne pas pré-remplir le mot de passe
          });
        } else {
          setErrorMessage(data.message || "Erreur de récupération des données.");
          if (response.status === 401) {
            localStorage.removeItem("token");
            navigate("/"); // Rediriger vers la page de connexion si le token est invalide
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        setErrorMessage("Erreur serveur.");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Activer l'indicateur de chargement

    // Validation du mot de passe si nécessaire
    if (formData.password && (formData.password.length < 6 || formData.password.length > 20)) {
      setErrorMessage("Le mot de passe doit être entre 6 et 20 caractères.");
      setIsLoading(false); // Désactiver l'indicateur de chargement
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setErrorMessage("Vous devez être connecté.");
      setIsLoading(false); // Désactiver l'indicateur de chargement
      return;
    }

    try {
      const response = await fetch("http://192.168.65.74:3001/auth/updateUser", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Ajouter le token ici
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Profil mis à jour avec succès !");
        setTimeout(() => {
          navigate("/profile"); // Rediriger vers la page de profil après la mise à jour
        }, 2000);
      } else {
        setErrorMessage(data.message || "Erreur lors de la mise à jour.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      setErrorMessage("Erreur serveur.");
    } finally {
      setIsLoading(false); // Désactiver l'indicateur de chargement après la requête
    }
  };

  const isFormValid = formData.password && (formData.password.length >= 6 && formData.password.length <= 20);

  return (
    <div className="body_update_user">
      <main>
        <div className="container_update_user">
          <h1>Modifier mes informations</h1>
          <form onSubmit={handleSubmit} className="form-container">
            <input
              type="text"
              name="username"
              placeholder="Nom d'utilisateur"
              value={formData.username}
              onChange={handleChange}
              className="form-input"
            />
            <input
              type="text"
              name="lastname"
              placeholder="Nom"
              value={formData.lastname}
              onChange={handleChange}
              className="form-input"
            />
            <input
              type="text"
              name="firstname"
              placeholder="Prénom"
              value={formData.firstname}
              onChange={handleChange}
              className="form-input"
            />
            <input
              type="email"
              name="mail"
              placeholder="Email"
              value={formData.mail}
              onChange={handleChange}
              className="form-input"
            />
            <input
              type="password"
              name="password"
              placeholder="Nouveau mot de passe"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
            {formData.password && (
              <small className="password-requirements">
                Le mot de passe doit comporter entre 6 et 20 caractères.
              </small>
            )}
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={!isFormValid || isLoading} // Désactiver le bouton si le formulaire n'est pas valide ou en cours de soumission
            >
              {isLoading ? "Mise à jour..." : "Mettre à jour"}
            </button>
          </form>
          {errorMessage && <p className="message error">{errorMessage}</p>}
          {message && <p className="message success">{message}</p>}
        </div>
      </main>
      <Footer />
      <Navbar />
    </div>
  );
};

export default UpdateUser;
