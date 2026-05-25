document.addEventListener("DOMContentLoaded", () => {
    let baseDonneesCollectees = JSON.parse(localStorage.getItem("om_survey_data")) || [];

    // Éléments UI
    const form = document.getElementById("om-survey-form");
    const tableViewSection = document.getElementById("table-view-section");
    const counterDisplay = document.getElementById("counter");
    const mainTitle = document.getElementById("main-title");

    // Boutons de navigation
    const btnShowForm = document.getElementById("btn-show-form");
    const btnToggleTable = document.getElementById("btn-toggle-table");
    const btnDownload = document.getElementById("btn-download-csv");
    const tableBody = document.getElementById("table-body");

    // Initialisation du compteur
    counterDisplay.textContent = baseDonneesCollectees.length;

    // NAVIGATION : Clic sur "Formulaire Collecte" -> On montre le formulaire, ON CACHE LE TABLEAU
    btnShowForm.addEventListener("click", (e) => {
        e.preventDefault();
        form.classList.remove("hidden");
        tableViewSection.classList.add("hidden"); // Cache strictement le tableau
        
        btnShowForm.classList.add("active");
        btnToggleTable.classList.remove("active");
        mainTitle.textContent = "Étude d'Adoption Orange Money";
    });

    // NAVIGATION : Clic sur "Données collectées" -> On montre le tableau, ON CACHE LE FORMULAIRE
    btnToggleTable.addEventListener("click", (e) => {
        e.preventDefault();
        form.classList.add("hidden"); // Cache strictement le formulaire
        tableViewSection.classList.remove("hidden"); // Montre le tableau
        
        btnToggleTable.classList.add("active");
        btnShowForm.classList.remove("active");
        mainTitle.textContent = "Registre des Données Collectées";
        
        mettreAJourTableau(); // Génère les lignes du tableau
    });

    // Fonction pour dessiner le tableau
    function mettreAJourTableau() {
        tableBody.innerHTML = "";
        if (baseDonneesCollectees.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="13" style="text-align:center; color:#9ca3af; padding:20px;">Aucune donnée enregistrée pour le moment.</td></tr>`;
            return;
        }

        const donneesInversees = [...baseDonneesCollectees].reverse();
        donneesInversees.forEach((ligne) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${ligne.sexe}</td>
                <td>${ligne.age_cat}</td>
                <td>${ligne.instruction}</td>
                <td>${ligne.profession}</td>
                <td>${ligne.localisation}</td>
                <td style="font-weight:bold; color:${ligne.y_utilisation === '1' ? '#059669' : '#dc2626'}">${ligne.y_utilisation}</td>
                <td><span class="badge-likert">${ligne.x1_utilite}</span></td>
                <td><span class="badge-likert">${ligne.x2_facilite}</span></td>
                <td><span class="badge-likert">${ligne.x3_confiance}</span></td>
                <td><span class="badge-likert">${ligne.x4_influence}</span></td>
                <td><span class="badge-likert">${ligne.x5_cout}</span></td>
                <td><span class="badge-likert">${ligne.x6_conditions}</span></td>
                <td class="text-truncate" title="${ligne.recommandations}">${ligne.recommandations}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Enregistrement du formulaire
    form.addEventListener("submit", (e) => {
        e.preventDefault(); 

        let texteRecommandations = document.getElementById("suggestions").value;
        texteRecommandations = texteRecommandations.replace(/[\r\n]+/g, " ").replace(/;/g, ",");

        const nouvelleEntree = {
            sexe: document.getElementById("sexe").value,
            age_cat: document.getElementById("age_cat").value,
            instruction: document.getElementById("instruction").value,
            profession: document.getElementById("profession").value,
            revenu_cat: document.getElementById("revenu_cat").value,
            localisation: document.getElementById("localisation").value,
            telephone: document.getElementById("telephone").value,
            x1_utilite: document.getElementById("x1").value,
            x2_facilite: document.getElementById("x2").value,
            x3_confiance: document.getElementById("x3").value,
            x4_influence: document.getElementById("x4").value,
            x5_cout: document.getElementById("x5").value,
            x6_conditions: document.getElementById("x6").value,
            y_utilisation: document.getElementById("y_utilisation").value,
            frequence: document.getElementById("frequence").value,
            recommandations: texteRecommandations || "Aucune"
        };

        baseDonneesCollectees.push(nouvelleEntree);
        localStorage.setItem("om_survey_data", JSON.stringify(baseDonneesCollectees));
        counterDisplay.textContent = baseDonneesCollectees.length;

        form.reset();
        alert("Données enregistrées avec succès !");
    });

    // Téléchargement du fichier CSV
    btnDownload.addEventListener("click", () => {
        if (baseDonneesCollectees.length === 0) {
            alert("Aucune donnée collectée pour le moment.");
            return;
        }

        const entetes = [
            "sexe", "age_cat", "instruction", "profession", "revenu_cat", 
            "localisation", "telephone", "X1_utilite", "X2_facilite", 
            "X3_confiance", "X4_influence", "X5_cout", "X6_conditions", 
            "Y_utilisation", "frequence", "recommandations"
        ];

        let contenuCSV = "\uFEFF"; 
        contenuCSV += entetes.join(";") + "\n";

        baseDonneesCollectees.forEach(ligne => {
            const valeursLigne = entetes.map(cle => {
                const cleObjet = cle.toLowerCase();
                return ligne[cleObjet];
            });
            contenuCSV += valeursLigne.join(";") + "\n";
        });

        const blob = new Blob([contenuCSV], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const lienTelechargement = document.createElement("a");
        lienTelechargement.href = url;
        
        const dateDuJour = new Date().toISOString().split('T')[0];
        lienTelechargement.setAttribute("download", `collecte_orange_money_${dateDuJour}.csv`);
        
        document.body.appendChild(lienTelechargement);
        lienTelechargement.click();
        document.body.removeChild(lienTelechargement);

        if(confirm("Voulez-vous vider la mémoire locale de l'application ?")) {
            localStorage.removeItem("om_survey_data");
            baseDonneesCollectees = [];
            counterDisplay.textContent = 0;
            
            // Rebasculer automatiquement sur le formulaire propre
            btnShowForm.click();
            alert("Mémoire réinitialisée.");
        }
    });
});