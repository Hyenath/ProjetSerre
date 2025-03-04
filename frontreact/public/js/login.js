document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById('login-form');
    
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
  
      // Vérifier que les éléments sont bien trouvés avant d'accéder à leurs valeurs
      const usernameField = document.getElementById('username');
      const passwordField = document.getElementById('password');
  
      // Si l'un des champs est null, cela signifie que l'élément n'est pas encore chargé
      if (!usernameField || !passwordField) {
        alert('Impossible de trouver les champs de formulaire');
        return;
      }
  
      // Récupérer les valeurs du formulaire
      const username = usernameField.value;
      const password = passwordField.value;
  
      // Vérifier que les champs ne sont pas vides
      if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
      }
  
      // Créer un objet avec les données à envoyer
      const userData = {
        username: username,
        password: password
      };
  
      // Envoyer les données au serveur via fetch
      fetch('http://192.168.65.74:3001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
        .then(response => {
          // Vérifier si la réponse est un JSON
          if (!response.ok) {
            throw new Error('Erreur du serveur');
          }
          return response.json();  // Si la réponse est ok, la transformer en JSON
        })
        .then(data => {
          if (data.message === 'Connexion réussie') {
            alert('Connexion réussie');
            localStorage.setItem('token', data.token);
            window.location.href = 'index.html';
          } else {
            alert(data.message); 
          }
        })
        .catch(error => {
          console.error('Erreur:', error);
          alert('Erreur de connexion, veuillez réessayer');
        });
    });
  });