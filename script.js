const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqym7w-sgurKNmg0ctorgUI1HWVsT9ef1ZSy8QYDMLPw7cSfKtrPFQotId1GunaxOxSw/exec"; // METS TON URL GOOGLE APPS SCRIPT ICI
// Fonction pour charger automatiquement les données du Google Sheets au démarrage
window.addEventListener('DOMContentLoaded', () => {
    // Afficher un message de chargement dans le tableau
    const tbody = document.querySelector('#tableau-donnees tbody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;">Chargement des données existantes...</td></tr>';
    }

    // Appel au Google Script pour récupérer les données
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            if (tbody) tbody.innerHTML = ''; // On vide le message de chargement
            
            // On suppose que le script renvoie un tableau d'objets
            if (data && data.length > 0) {
                data.forEach(ligne => {
                    // Ici, on appelle la fonction qui ajoute la ligne dans ton tableau
                    // Note : Assure-toi que le nom de ta fonction correspond à celle de ton code (ex: ajouterLigneTableau)
                    ajouterLigneAuTableau(ligne); 
                });
            } else {
                if (tbody) tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;">Aucune donnée enregistrée pour le moment.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement :', error);
            if (tbody) tbody.innerHTML = '<tr><td colspan="20" style="text-align:center; color:red;">Erreur de connexion au serveur.</td></tr>';
        });
});
let localDatabase = [];

// Éléments du DOM
const surveyForm = document.getElementById('om-survey-form');
const tableBody = document.getElementById('table-body');
const counterDisplay = document.getElementById('counter');
const tableViewSection = document.getElementById('table-view-section');
const btnToggleTable = document.getElementById('btn-toggle-table');
const btnShowForm = document.getElementById('btn-show-form');
const btnDownloadCsv = document.getElementById('btn-download-csv');

// Soumission du formulaire (Version intelligente avec mode Hors-ligne intégré)
surveyForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. Récupération des données du formulaire
    const formData = {
        sexe: document.getElementById('sexe').value,
        age_cat: document.getElementById('age_cat').value,
        instruction: document.getElementById('instruction').value,
        profession: document.getElementById('profession').value,
        revenu_cat: document.getElementById('revenu_cat').value,
        localisation: document.getElementById('localisation').value,
        telephone: document.getElementById('telephone').value,
        y_utilisation: document.getElementById('y_utilisation').value,
        frequence: document.getElementById('frequence').value,
        x1: document.getElementById('x1').value,
        x2: document.getElementById('x2').value,
        x3: document.getElementById('x3').value,
        x4: document.getElementById('x4').value,
        x5: document.getElementById('x5').value,
        x6: document.getElementById('x6').value,
        suggestions: document.getElementById('suggestions').value.trim() || "Aucune"
    };

    // 2. Mise à jour immédiate du tableau visuel (comme avant)
    localDatabase.push(formData);
    refreshTable();

    // 3. Gestion intelligente de l'envoi selon la connexion Internet
    if (navigator.onLine) {
        // Si connecté : on envoie à Google Sheets
        envoyerVersGoogleSheets(formData);
        alert("Entrée enregistrée et envoyée au serveur avec succès !");
    } else {
        // Si hors-ligne : on sauvegarde dans la mémoire du téléphone
        mettreEnFileDattenteHorsLigne(formData);
    }

    // 4. Réinitialisation du formulaire
    surveyForm.reset();
});

// --- EN DESSOUS, TU AJOUTES CES DEUX FONCTIONS COMPLÉMENTAIRES ---

// Fonction pour sauvegarder en mémoire locale (Hors-ligne)
function mettreEnFileDattenteHorsLigne(donnees) {
    let fileAttente = JSON.parse(localStorage.getItem('enquetes_hors_ligne')) || [];
    fileAttente.push(donnees);
    localStorage.setItem('enquetes_hors_ligne', JSON.stringify(fileAttente));
    
    alert("⚠️ Mode hors-ligne : Enquête enregistrée localement dans l'appareil. Elle sera envoyée automatiquement dès le retour d'Internet.");
}

// Fonction d'envoi vers Google Sheets
function envoyerVersGoogleSheets(donnees) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donnees)
    })
    .then(() => {
        console.log("Données synchronisées avec succès avec Google Sheets !");
    })
    .catch(erreur => {
        console.error("Échec de l'envoi direct, sauvegarde locale de secours...", erreur);
        mettreEnFileDattenteHorsLigne(donnees);
    });
}
// Génération d'une ligne dans le tableau avec les boutons d'action
function appendRowToTable(data, index) {
    const row = document.createElement('tr');
    row.id = `row-${index}`;
    
    const cleanSuggestions = data.suggestions.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    row.innerHTML = `
        <td>${data.sexe}</td>
        <td>${data.age_cat}</td>
        <td>${data.instruction}</td>
        <td>${data.profession}</td>
        <td>${data.revenu_cat}</td>
        <td>${data.localisation}</td>
        <td>${data.telephone}</td>
        <td><strong>${data.y_utilisation}</strong></td>
        <td>${data.frequence}</td>
        <td>${data.x1}/5</td>
        <td>${data.x2}/5</td>
        <td>${data.x3}/5</td>
        <td>${data.x4}/5</td>
        <td>${data.x5}/5</td>
        <td>${data.x6}/5</td>
        <td class="text-truncate" title="${cleanSuggestions}">${cleanSuggestions}</td>
        <td>
            <button type="button" style="background:none; border:none; cursor:pointer; font-size:16px;" onclick="editRow(${index})">✏️</button>
            <button type="button" style="background:none; border:none; cursor:pointer; font-size:16px;" onclick="deleteRow(${index})">❌</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Rafraîchir l'affichage complet du tableau
function refreshTable() {
    tableBody.innerHTML = "";
    localDatabase.forEach((data, index) => {
        appendRowToTable(data, index);
    });
    counterDisplay.textContent = localDatabase.length;
}

// Action de suppression
function deleteRow(index) {
    if (confirm("Voulez-vous vraiment supprimer cette ligne ?")) {
        localDatabase.splice(index, 1);
        refreshTable();
    }
}

// Action de modification
function editRow(index) {
    const data = localDatabase[index];
    
    document.getElementById('sexe').value = data.sexe;
    document.getElementById('age_cat').value = data.age_cat;
    document.getElementById('instruction').value = data.instruction;
    document.getElementById('profession').value = data.profession;
    document.getElementById('revenu_cat').value = data.revenu_cat;
    document.getElementById('localisation').value = data.localisation;
    document.getElementById('telephone').value = data.telephone;
    document.getElementById('y_utilisation').value = data.y_utilisation;
    document.getElementById('frequence').value = data.frequence;
    document.getElementById('x1').value = data.x1;
    document.getElementById('x2').value = data.x2;
    document.getElementById('x3').value = data.x3;
    document.getElementById('x4').value = data.x4;
    document.getElementById('x5').value = data.x5;
    document.getElementById('x6').value = data.x6;
    document.getElementById('suggestions').value = data.suggestions === "Aucune" ? "" : data.suggestions;

    localDatabase.splice(index, 1);
    refreshTable();
    
    // Basculer sur le formulaire
    surveyForm.classList.remove('hidden');
    tableViewSection.classList.add('hidden');
    btnShowForm.classList.add('active');
    btnToggleTable.classList.remove('active');
}

// Envoi vers Google Sheets
function sendDataToGoogleSheets(data) {
    const urlParams = new URLSearchParams(data);
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams.toString()
    })
    .then(() => console.log("Données envoyées."))
    .catch(err => console.error("Erreur d'envoi :", err));
}

// Navigation de l'interface
btnToggleTable.addEventListener('click', function() {
    tableViewSection.classList.remove('hidden');
    surveyForm.classList.add('hidden');
    btnToggleTable.classList.add('active');
    btnShowForm.classList.remove('active');
});

btnShowForm.addEventListener('click', function(e) {
    e.preventDefault();
    surveyForm.classList.remove('hidden');
    tableViewSection.classList.add('hidden');
    btnShowForm.classList.add('active');
    btnToggleTable.classList.remove('active');
});

// Téléchargement CSV
btnDownloadCsv.addEventListener('click', function() {
    if (localDatabase.length === 0) {
        alert("Aucune donnée à télécharger.");
        return;
    }
    const headers = ["sexe", "age_cat", "instruction", "profession", "revenu_cat", "localisation", "telephone", "y_utilisation", "frequence", "x1", "x2", "x3", "x4", "x5", "x6", "suggestions"];
    const csvRows = [headers.join(';')];

    for (const row of localDatabase) {
        const values = headers.map(h => `"${(row[h] || "").toString().replace(/"/g, '""').replace(/\n/g, ' ')}"` );
        csvRows.push(values.join(';'));
    }

    const blob = new Blob(["\uFEFF" + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Collecte_OM_Yatenga_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
// Fonction pour charger et afficher automatiquement les données au démarrage
window.addEventListener('DOMContentLoaded', () => {
    const tbody = document.querySelector('#tableau-donnees tbody') || document.querySelector('table tbody');
    
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="20" style="text-align:center; color:#f16e00; font-weight:bold;">Chargement des données existantes...</td></tr>';
    }

    // Appel au Google Sheets via ton URL App Script
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            if (!tbody) return;
            tbody.innerHTML = ''; // On efface le message de chargement

            if (data && data.length > 0) {
                // Parcourir chaque ligne renvoyée par le Google Sheets
                data.forEach((ligne, index) => {
                    const row = tbody.insertRow();
                    
                    // On extrait toutes les valeurs de la ligne (sauf les en-têtes)
                    const valeurs = Object.values(ligne);
                    
                    // 1. Remplissage des cellules de données
                    valeurs.forEach(valeur => {
                        const cell = row.insertCell();
                        cell.textContent = valeur;
                    });

                    // 2. Ajout de la colonne Actions avec tes boutons editRow et deleteRow
                    const cellActions = row.insertCell();
                    cellActions.style.textAlign = "center";
                    
                    // Bouton Modifier (Crayon)
                    const btnEdit = document.createElement('button');
                    btnEdit.innerHTML = '✏️';
                    btnEdit.style.marginRight = '5px';
                    btnEdit.style.cursor = 'pointer';
                    btnEdit.onclick = () => editRow(row); // Appelle ta fonction existante
                    
                    // Bouton Supprimer (X Rouge)
                    const btnDelete = document.createElement('button');
                    btnDelete.innerHTML = '❌';
                    btnDelete.style.cursor = 'pointer';
                    btnDelete.onclick = () => deleteRow(row); // Appelle ta fonction existante
                    
                    cellActions.appendChild(btnEdit);
                    cellActions.appendChild(btnDelete);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="20" style="text-align:center;">Aucune donnée enregistrée pour le moment.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement initial :', error);
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="20" style="text-align:center; color:red;">Erreur de connexion au serveur de données.</td></tr>';
            }
        });
});
// Fonction pour synchroniser les données stockées dès que le réseau revient
function synchroniserDonneesHorsLigne() {
    let fileAttente = JSON.parse(localStorage.getItem('enquetes_hors_ligne')) || [];
    
    if (fileAttente.length === 0) return; // Rien à synchroniser
    
    console.log(`📡 Connexion détectée ! Synchronisation de ${fileAttente.length} enquête(s)...`);
    
    // Envoyer chaque enquête stockée une par une
    let promesses = fileAttente.map(donnees => {
        return fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donnees)
        });
    });
    
    // Une fois que toutes les enquêtes sont envoyées
    Promise.all(promesses)
        .then(() => {
            alert(`✅ Succès : ${fileAttente.length} enquête(s) hors-ligne ont été synchronisées avec Google Sheets !`);
            localStorage.removeItem('enquetes_hors_ligne'); // On vide la mémoire locale
        })
        .catch(erreur => {
            console.error("Erreur pendant la synchronisation :", erreur);
        });
}

// Écouter les changements d'état du réseau de l'appareil
window.addEventListener('online', synchroniserDonneesHorsLigne);

// Tenter aussi une synchronisation au démarrage si on s'ouvre directement avec du réseau
window.addEventListener('DOMContentLoaded', () => {
    if (navigator.onLine) {
        synchroniserDonneesHorsLigne();
    }
});
