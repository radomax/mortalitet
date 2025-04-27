// Forbedret API-integrasjon for Mortalitet applikasjonen
// Inkluder denne i index.html etter de andre JavaScript-filene

// Legg til en knapp for direkte registrering rett under den eksisterende "Lagre registrering"-knappen
(function() {
    // Finn saveBtn
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) {
        console.error('Kunne ikke finne saveBtn, avbryter forbedret registrering');
        return;
    }
    
    // Opprett ny knapp
    const directRegisterBtn = document.createElement('button');
    directRegisterBtn.type = 'button'; // Viktig! Ikke submit
    directRegisterBtn.className = 'btn btn-primary';
    directRegisterBtn.id = 'directRegisterBtn';
    directRegisterBtn.style.marginLeft = '10px';
    directRegisterBtn.textContent = 'Registrer direkte (feilsikker)';
    
    // Legg til knappen etter saveBtn
    saveBtn.insertAdjacentElement('afterend', directRegisterBtn);
    
    // Legg til event listener for ny knapp
    directRegisterBtn.addEventListener('click', directRegister);
    
    console.log('Forbedret registreringsknapp lagt til');
})();

// Funksjon for å registrere direkte
function directRegister() {
    console.log('Direkte registrering...');
    
    // Samle data fra skjemaet
    const data = {
        patientId: document.getElementById('patientId').value || 'TEST' + Math.floor(Math.random() * 10000),
        patientAge: parseInt(document.getElementById('patientAge').value || 65),
        patientGender: document.getElementById('patientGender').value || 'male',
        patientResidence: document.getElementById('patientResidence').value || 'Oslo',
        deathDate: document.getElementById('deathDate').value || new Date().toISOString().split('T')[0],
        primaryCauseDesc: document.getElementById('primaryCauseDesc').value || 'Hjerteinfarkt',
        primaryCauseCode: document.getElementById('primaryCauseCode').value || 'I21.9',
        secondaryCauseDesc: document.getElementById('secondaryCauseDesc').value || '',
        secondaryCauseCodes: document.getElementById('secondaryCauseCodes').value || '',
        underlyingCauseDesc: document.getElementById('underlyingCauseDesc').value || '',
        underlyingCauseCodes: document.getElementById('underlyingCauseCodes').value || '',
        deathContext: document.getElementById('deathContext').value || 'natural',
        autopsyPerformed: document.getElementById('autopsyPerformed').value || 'no',
        additionalInfo: document.getElementById('additionalInfo').value || 'Registrert med forbedret API'
    };
    
    console.log('Sender data:', data);
    
    // Vis indikator
    const statusDiv = document.createElement('div');
    statusDiv.className = 'alert alert-info';
    statusDiv.textContent = 'Sender registrering...';
    document.querySelector('.form-group:last-child').appendChild(statusDiv);
    
    // Send data
    fetch('api/debug-api.php?action=register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('API-respons:', result);
        
        if (result.success) {
            statusDiv.className = 'alert alert-success';
            statusDiv.textContent = `Registrering vellykket! ID: ${result.recordId}`;
            
            // Nullstill skjemaet på vellykket registrering
            if (confirm('Registreringen var vellykket! Vil du nullstille skjemaet?')) {
                document.getElementById('mortForm').reset();
            }
            
            // Fjern statusmelding etter 5 sekunder
            setTimeout(() => {
                statusDiv.remove();
            }, 5000);
        } else {
            statusDiv.className = 'alert alert-danger';
            statusDiv.textContent = `Feil ved registrering: ${result.error || 'Ukjent feil'}`;
        }
    })
    .catch(error => {
        console.error('Tilkoblingsfeil:', error);
        statusDiv.className = 'alert alert-danger';
        statusDiv.textContent = 'Tilkoblingsfeil - kunne ikke lagre registreringen';
    });
}

// Fikse ICD-kode henting (valgfritt, kan brukes hvis nødvendig)
function fixIcdCodeSearch() {
    // Finn alle ICD-kode søkeknapper
    const searchButtons = [
        document.getElementById('searchPrimaryCodeBtn'),
        document.getElementById('searchSecondaryCodeBtn'),
        document.getElementById('searchUnderlyingCodeBtn')
    ];
    
    // For hver knapp, legg til en event listener som setter verdien etter søket
    searchButtons.forEach(btn => {
        if (!btn) return;
        
        // Legg til en data-fixed attributt for å unngå doble event listeners
        if (btn.getAttribute('data-fixed')) return;
        btn.setAttribute('data-fixed', 'true');
        
        // Legg til event listener
        btn.addEventListener('click', function() {
            const targetField = this.getAttribute('data-target');
            console.log(`Forbedret ICD-søk åpnet for ${targetField}`);
            
            // Vent på at modal er åpen, så finn resultat-containeren
            setTimeout(() => {
                const results = document.getElementById('icdSearchResults');
                if (!results) return;
                
                // Legg til event listener på resultat-containeren
                results.addEventListener('click', function(e) {
                    const item = e.target.closest('.icd-result-item');
                    if (!item) return;
                    
                    const code = item.querySelector('.icd-code')?.textContent;
                    if (!code) return;
                    
                    // Vent litt for å la andre event handlers kjøre først
                    setTimeout(() => {
                        console.log(`Setter ${targetField} til ${code}`);
                        document.getElementById(targetField).value = code;
                    }, 100);
                });
            }, 500);
        });
    });
    
    console.log('ICD-kode søk forbedret');
}

// Aktiver forbedring av ICD-kode søk
fixIcdCodeSearch();

console.log('Forbedret API-integrasjon lastet');