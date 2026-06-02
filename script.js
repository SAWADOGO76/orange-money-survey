// Remplace le contenu de ton fichier script.js par ce code
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form'); // Cible ton formulaire HTML
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // Empêche le rechargement de la page
            
            // Récupération des données du formulaire
            const formData = new FormData(form);
            
            // Transformation des données en objet simple
            const data = {};
            formData.forEach((value, key) => {
                // Si le champ existe déjà (ex: cases à cocher multiples), on crée un tableau
                if (data[key]) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });

            // Conversion des tableaux en chaînes séparées par des virgules pour Excel
            for (let key in data) {
                if (Array.isArray(data[key])) {
                    data[key] = data[key].join(', ');
                }
            }

            // Message visuel pour l'utilisateur pendant l'envoi
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerText : "Envoyer";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerText = "Envoi en cours...";
            }

            // URL de ton application Web Google Apps Script
            const scriptURL = 'https://script.google.com/macros/s/AKfycbwW4-s0P1UV-vPcWInIXrK9q_kPM6UavdQ27jeOshO1R6jsQxX8MoVZ-OMUbur7XhMDTw/exec';

            // Envoi des données via la méthode POST
            fetch(scriptURL, {
                method: 'POST',
                mode: 'no-cors', // Important pour éviter les blocages CORS avec Google Apps Script
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(() => {
                // Succès de l'envoi
                alert('Merci ! Vos réponses ont été enregistrées avec succès.');
                form.reset(); // Vide le formulaire pour une nouvelle saisie
            })
            .catch(error => {
                // En cas d'erreur informatique
                console.error('Erreur lors de l\'envoi :', error);
                alert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
            })
            .finally(() => {
                // Remet le bouton à son état initial
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
            });
        });
    }
});
