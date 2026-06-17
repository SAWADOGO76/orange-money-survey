const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwqym7w-sgurKNmg0ctorgUI1HWVsT9ef1ZSy8QYDMLPw7cSfKtrPFQotId1GunaxOxSw/exec";

let localDatabase = [];

// Éléments du DOM
const surveyForm = document.getElementById('om-survey-form');
const tableBody = document.getElementById('table-body');
const counterDisplay = document.getElementById('counter');
const tableViewSection = document.getElementById('table-view-section');
const btnToggleTable = document.getElementById('btn-toggle-table');
const btnShowForm = document.getElementById('btn-show-form');
const btnDownloadCsv = document.getElementById('btn-download-csv');

// 1. CHARGEMENT AUTOMATIQUE DES DONNÉES AU DÉMARRAGE
window.addEventListener('DOMContentLoaded', () => {
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="17" style="text-align:center; color:#f16e00; font-weight:bold;">Chargement des données existantes...</td></tr>';
    }

    // Appel au Google Script (doGet) pour récupérer l'historique
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = ''; // On vide le message de chargement
            
            if (data && data.length > 0) {
                // Remplir la base locale et mettre à jour le tableau
                localDatabase = data;
                refreshTable();
            } else {
                tableBody.innerHTML = '<tr><td colspan="17" style="text-align:center;">Aucune donnée enregistrée pour le moment.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erreur lors du chargement initial :', error);
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="17" style="text-align:center; color:red; font-weight:bold;">Erreur de connexion au serveur de données.</td></tr>';
            }
        });

    // Lancer une synchronisation automatique au démarrage si l'appareil est connecté
    if (navigator.onLine) {
        synchroniserDonneesHorsLigne();
    }
});

// 2. SOUMISSION DU FORMULAIRE
surveyForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // Récupération des données du formulaire
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

    // Ajout immédiat au tableau visuel pour l'enquêteur
    localDatabase.push(formData);
    refreshTable();

    // Routage intelligent selon l'état de la connexion Internet
    if (navigator.onLine) {
        sendDataToGoogleSheets(formData);
        alert("Enquête enregistrée et envoyée à Google Sheets avec succès !");
    } else {
        mettreEnFileDattenteHorsLigne(formData);
    }

    // Réinitialisation du formulaire pour l'enquête suivante
    surveyForm.reset();
});

// 3. FONCTIONS DE COMMUNICATION ET DE SAUVEGARDE
function sendDataToGoogleSheets(data) {
    // Utilisation de URLSearchParams pour garantir le remplissage complet de toutes les colonnes
    const urlParams = new URLSearchParams(data);
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams.toString()
    })
    .then(() => console.log("Données transmises avec succès à Google Sheets."))
    .catch(err => {
        console.error("Échec de l'envoi en direct, bascule en mémoire locale :", err);
        mettreEnFileDattenteHorsLigne(data);
    });
}

function mettreEnFileDattenteHorsLigne(donnees) {
    let fileAttente = JSON.parse(localStorage.getItem('enquetes_hors_ligne')) || [];
    fileAttente.push(donnees);
    localStorage.setItem('enquetes_hors_ligne', JSON.stringify(fileAttente));
    
    alert("⚠️ Mode hors-ligne actif : L'enquête a été sécurisée localement sur cet appareil. Elle s'enverra toute seule dès le retour d'Internet.");
}

function synchroniserDonneesHorsLigne() {
    let fileAttente = JSON.parse(localStorage.getItem('enquetes_hors_ligne')) || [];
    
    if (fileAttente.length === 0) return;
    
    console.log(`📡 Réseau détecté ! Envoi de ${fileAttente.length} enquête(s) stockée(s) hors-ligne...`);
    
    // Préparer les envois au bon format pour remplir toutes les colonnes
    let promesses = fileAttente.map(donnees => {
        const urlParams = new URLSearchParams(donnees);
        return fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: urlParams.toString()
        });
    });
    
    Promise.all(promesses)
        .then(() => {
            alert(`✅ Formidable ! Les ${fileAttente.length} enquête(s) prises hors-ligne ont été synchronisées avec succès.`);
            localStorage.removeItem('enquetes_hors_ligne');
            // Recharger proprement pour afficher les nouvelles lignes synchronisées avec l'horodatage serveur
            setTimeout(() => { location.reload(); }, 1000);
        })
        .catch(erreur => console.error("Erreur lors de la synchronisation automatique :", erreur));
}

// Écouter les changements d'état du réseau (Connexion retrouvée sur le terrain)
window.addEventListener('online', synchroniserDonneesHorsLigne);

// 4. GESTION DU TABLEAU ET DES ACTIONS (MODIFIER / SUPPRIMER)
function appendRowToTable(data, index) {
    const row = document.createElement('tr');
    row.id = `row-${index}`;
    
    const cleanSuggestions = (data.suggestions || "Aucune").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    row.innerHTML = `
        <td>${data.sexe || ''}</td>
        <td>${data.age_cat || ''}</td>
        <td>${data.instruction || ''}</td>
        <td>${data.profession || ''}</td>
        <td>${data.revenu_cat || ''}</td>
        <td>${data.localisation || ''}</td>
        <td>${data.telephone || ''}</td>
        <td><strong>${data.y_utilisation || ''}</strong></td>
        <td>${data.frequence || ''}</td>
        <td>${data.x1 || 0}/5</td>
        <td>${data.x2 || 0}/5</td>
        <td>${data.x3 || 0}/5</td>
        <td>${data.x4 || 0}/5</td>
        <td>${data.x5 || 0}/5</td>
        <td>${data.x6 || 0}/5</td>
        <td class="text-truncate" title="${cleanSuggestions}">${cleanSuggestions}</td>
        <td>
            <button type="button" style="background:none; border:none; cursor:pointer; font-size:16px;" onclick="editRow(${index})">✏️</button>
            <button type="button" style="background:none; border:none; cursor:pointer; font-size:16px;" onclick="deleteRow(${index})">❌</button>
        </td>
    `;
    tableBody.appendChild(row);
}

function refreshTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    localDatabase.forEach((data, index) => {
        appendRowToTable(data, index);
    });
    if (counterDisplay) {
        counterDisplay.textContent = localDatabase.length;
    }
}

function deleteRow(index) {
    if (confirm("Voulez-vous vraiment supprimer cette ligne ?")) {
        localDatabase.splice(index, 1);
        refreshTable();
    }
}

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
    
    // Basculer automatiquement sur la vue formulaire pour corriger
    surveyForm.classList.remove('hidden');
    tableViewSection.classList.add('hidden');
    btnShowForm.classList.add('active');
    btnToggleTable.classList.remove('active');
}

// 5. NAVIGATION DE L'INTERFACE
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

// 6. TÉLÉCHARGEMENT CSV SECURISÉ
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
