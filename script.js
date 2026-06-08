// URL de ton API Google Apps Script (Remplace par ton URL finale "Déployer en tant qu'application Web")
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/xxxx/exec"; 

// Stockage local des données collectées pendant la session
let localDatabase = [];

// Sélection des éléments du DOM
const surveyForm = document.getElementById('om-survey-form');
const tableBody = document.getElementById('table-body');
const counterDisplay = document.getElementById('counter');
const tableViewSection = document.getElementById('table-view-section');
const btnToggleTable = document.getElementById('btn-toggle-table');
const btnShowForm = document.getElementById('btn-show-form');
const btnDownloadCsv = document.getElementById('btn-download-csv');

// 1. ÉVÉNEMENT : Soumission du formulaire
surveyForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Empêche le rechargement de la page

    // Création de l'objet contenant toutes les réponses en respectant tes variables
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
        suggestions: document.getElementById('suggestions').value
    };

    // Ajout dans notre tableau local de session
    localDatabase.push(formData);

    // Mise à jour de l'interface visuelle (Tableau et Compteur)
    appendRowToTable(formData);
    updateCounter();

    // ENVOI SÉCURISÉ VERS GOOGLE SHEETS
    sendDataToGoogleSheets(formData);

    // Réinitialisation du formulaire pour le client suivant
    surveyForm.reset();
    alert("Entrée enregistrée avec succès !");
});

// 2. FONCTION : Ajouter dynamiquement une ligne au tableau HTML dans l'ordre des variables
function appendRowToTable(data, index) {
    const row = document.createElement('tr');
    // On lui donne un identifiant unique basé sur son index dans le tableau local
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
        <td><span class="badge-${data.y_utilisation}">${data.y_utilisation}</span></td>
        <td>${data.frequence}</td>
        <td>${data.x1}/5</td>
        <td>${data.x2}/5</td>
        <td>${data.x3}/5</td>
        <td>${data.x4}/5</td>
        <td>${data.x5}/5</td>
        <td>${data.x6}/5</td>
        <td class="text-truncate" title="${cleanSuggestions}">${cleanSuggestions}</td>
        <td>
            <button type="button" class="btn-action btn-edit" onclick="editRow(${index})">✏️</button>
            <button type="button" class="btn-action btn-delete" onclick="deleteRow(${index})">❌</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// 3. FONCTION : Mettre à jour le compteur de la barre latérale
function updateCounter() {
    counterDisplay.textContent = localDatabase.length;
}

// 4. ACTION : Afficher / Masquer le tableau des données
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

// 5. FONCTION : Envoi asynchrone des données vers Google Sheets via Fetch API
function sendDataToGoogleSheets(data) {
    // On utilise URLSearchParams pour envoyer les variables au format classique de formulaire (POST/GET)
    const urlParams = new URLSearchParams(data);

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Évite les blocages de sécurité liés au Cross-Origin (CORS)
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: urlParams.toString()
    })
    .then(() => console.log("Données envoyées avec succès à Google Sheets."))
    .catch(error => console.error("Erreur lors de l'envoi Google Sheets : ", error));
}

// 6. ACTION : Génération et téléchargement instantané du fichier CSV
btnDownloadCsv.addEventListener('click', function() {
    if (localDatabase.length === 0) {
        alert("Aucune donnée à télécharger pour le moment.");
        return;
    }

    // Définition des en-têtes du fichier CSV (les noms de tes colonnes sous Excel/R)
    const headers = ["sexe", "age_cat", "instruction", "profession", "revenu_cat", "localisation", "telephone", "y_utilisation", "frequence", "x1", "x2", "x3", "x4", "x5", "x6", "suggestions"];
    
    // Construction des lignes de données (séparateur point-virgule pour une compatibilité Excel française)
    const csvRows = [];
    csvRows.push(headers.join(';'));

    for (const row of localDatabase) {
        const values = headers.map(header => {
            // Échapper les guillemets et nettoyer le texte pour éviter de casser le CSV
            let value = row[header] ? row[header].toString() : "";
            value = value.replace(/"/g, '""'); 
            return `"${value}"`;
        });
        csvRows.push(values.join(';'));
    }

    const csvContent = "\uFEFF" + csvRows.join('\n'); // \uFEFF gère correctement les accents (UTF-8) sous Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Téléchargement automatique
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Donnies_OrangeMoney_Yatenga_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});
