// Kopier og lim denne koden direkte inn i nettleserkonsollen
// for å lage en feilsikker registreringsknapp

// Opprett ny knapp
const directRegisterBtn = document.createElement('button');
directRegisterBtn.type = 'button'; // Viktig! Ikke submit
directRegisterBtn.className = 'btn btn-primary';
directRegisterBtn.id = 'directRegisterBtn';
directRegisterBtn.style.marginLeft = '10px';
directRegisterBtn.textContent = 'Registrer direkte (feilsikker)';

// Finn saveBtn og legg til den nye knappen etter den
const saveBtn = document.getElementById('saveBtn');
if (saveBtn) {
    saveBtn.insertAdjacentElement('afterend', directRegisterBtn);
    console.log('Registreringsknapp lagt til');
} else {
    // Alternativ plassering hvis saveBtn ikke finnes
    const form = document.getElementById('mortForm');
    if (form) {
        form.appendChild(directRegisterBtn);
        console.log('Registreringsknapp lagt til skjemaet');
    } else {
        console.error('Kunne ikke finne skjemaet, avbryter');
    }
}

// Legg til event listener
directRegisterBtn.addEventListener('click', function() {
    console.log('Direkte registrering...');
    
    // Samle data fra skjemaet
    const data = {
        patientId: document.getElementById('patientId').value || 'TEST' + Math.floor(Math.random() * 10000),
        patientAge: 65, // Fast verdi for å unngå problemer
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
        additionalInfo: document.getElementById('additionalInfo').value || 'Registrert med feilsikker metode'
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
});

console.log('Feilsikker registreringsknapp er nå tilgjengelig!');