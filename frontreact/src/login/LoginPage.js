import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import './Style.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Hook pour la navigation
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [points, setPoints] = useState([]);

  // Générer des points brillants à des positions aléatoires
  useEffect(() => {
    const generatePoints = () => {
      const newPoints = [];
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * 50;  // Position horizontale (en pourcentage)
        const y = Math.random() * 50;  // Position verticale (en pourcentage)
        newPoints.push({ x, y });
      }
      setPoints(newPoints);
    };

    generatePoints();
  }, []);

  // Fonction pour gérer le submit du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorMessage('Veuillez remplir tous les champs');
      return;
    }

    const userData = { username, password };

    // Envoi des données au serveur avec fetch
    fetch('http://192.168.65.74:3001/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erreur du serveur');
        }
        return response.json();
      })
      .then((data) => {
        if (data.message === 'Connexion réussie') {
          // Stockage du token dans localStorage
          localStorage.setItem('token', data.token); // Stocke le token dans le localStorage

          navigate("/dashboard"); // Redirection vers Dashboard
        } else {
          setErrorMessage(data.message);
        }
      })
      .catch((error) => {
        console.error('Erreur:', error);
        setErrorMessage('Erreur de connexion, veuillez réessayer');
      });
  };

  // Fonction pour basculer l'affichage du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div style={{ backgroundImage: 'url(images/bg.jpg)', height: '100vh' }} className="js-fullheight">
      
      <div className="user-access">
        <button className="btn btn-secondary" onClick={() => navigate("/dashboard")}>Accéder en tant qu'utilisateur</button>
      </div>

      <section className="ftco-section">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-4">
              <div className="login-wrap p-0">

                <h3 className="mb-4 text-center">Login</h3>
                {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
                <form onSubmit={handleSubmit} id="login-form" className="signin-form">
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nom d'utilisateur"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Mot de passe"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      toggle="#password-field"
                      className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} field-icon toggle-password`}
                      onClick={togglePasswordVisibility}
                    ></span>
                  </div>
                  <div className="form-group">
                    <button type="submit" className="form-control btn btn-primary submit px-3">
                      Connexion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
      </section>

      {/* Générer des points brillants à des positions spécifiques */}
      {points.map((point, index) => (
        <div
          key={index}
          className="sparkle"
          style={{
            top: `${point.y}%`,
            left: `${point.x}%`,
          }}
        />
      ))}
    </div>
  );
};

export default LoginPage;
