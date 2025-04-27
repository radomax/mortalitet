// API-integrasjon for Mortalitet applikasjonen
// Denne filen bør inkluderes i index.html etter hovedscriptet

// Konfigurer API-endepunkter
const API_ENDPOINTS = {
    register: 'api/debug-api.php?action=register',
    getRecords: 'api/debug-api.php?action=getRecords',
    test: 'api/debug-api.php?action=test',
    showTables: 'api/debug-api.php?action=showTables'
};

// Hovedfunksjon for API-integrasjon
document.addEventListener('DOMContentLoaded', function() {
    console.log('API-integrasjon lastet');
    
    // Test API-tilkobling
    testApiConnection();
    
    // Koble til registreringsskjemaet hvis det finnes
    setupRegistrationForm();
    
    // Legg til en knapp for å vise databasetabeller
    addDebugButtons();
});

// Test API-tilkoblingen
function testApiConnection() {
    fetch(API_ENDPOINTS.test, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true, clientTimestamp: new Date().toISOString() })
    })
    .then(response => response.json())
    .then(data => {
        console.log('✅ API-tilkobling fungerer:', data);
    })
    .catch(error => {
        console.error('❌ API-tilkobling feilet:', error);
    });
}

// Koble til registreringsskjemaet
function setupRegistrationForm() {
    const form = document.getElementById('mortForm');
    if (!form) {
        console.log('Registreringsskjema ikke funnet');
        return;
    }
    
    console.log('Setter opp API-integrasjon for registreringsskjema');
    
    // Erstatt standard skjemahåndtering
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        
        console.log('📝 Skjema sendt - håndterer via API');
        
        // Samle inn skjemadata direkte fra feltene
        const formData = {
            patientId: document.getElementById('patientId').value,
            patientAge: parseInt(document.getElementById('patientAge').value),
            patientGender: document.getElementById('patientGender').value,
            patientResidence: document.getElementById('patientResidence').value,
            deathDate: document.getElementById('deathDate').value,
            primaryCauseDesc: document.getElementById('primaryCauseDesc').value,
            primaryCauseCode: document.getElementById('primaryCauseCode').value,
            secondaryCauseDesc: document.getElementById('secondaryCauseDesc').value,
            secondaryCauseCodes: document.getElementById('secondaryCauseCodes').value,
            underlyingCauseDesc: document.getElementById('underlyingCauseDesc').value,
            underlyingCauseCodes: document.getElementById('underlyingCauseCodes').value,
            deathContext: document.getElementById('deathContext').value,
            autopsyPerformed: document.getElementById('autopsyPerformed').value,
            additionalInfo: document.getElementById('additionalInfo').value
        };
        
        // Valider viktige felt
        if (!formData.patientId || !formData.patientGender || !formData.deathDate || 
            !formData.primaryCauseCode || !formData.deathContext) {
            showAlert('Vennligst fyll ut alle påkrevde felt', 'error');
            console.error('Validering feilet: Mangler påkrevde felt', formData);
            return;
        }
        
        console.log('Sender følgende data til API:', formData);
        
        // Send data til API
        fetch(API_ENDPOINTS.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('API-respons:', data);
            
            if (data.success) {
                showAlert(`Registrering lagret med ID: ${data.recordId}`, 'success');
                
                // Nullstill skjemaet
                form.reset();
                
                // Oppdater registreringslisten hvis den vises
                if (document.getElementById('recordsTable')) {
                    loadRecords();
                }
            } else {
                showAlert(`Feil: ${data.error || 'Ukjent feil'}`, 'error');
                console.error('API returnerte feil:', data);
            }
        })
        .catch(error => {
            showAlert('Tilkoblingsfeil - kunne ikke lagre registrering', 'error');
            console.error('Feil ved API-kall:', error);
        });
    });
}

// Last inn registreringer for visning i tabell
function loadRecords() {
    console.log('Laster registreringer fra API');
    
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) {
        console.error('Registreringstabell ikke funnet');
        return;
    }
    
    // Vis lasteindikatoren
    const loader = document.getElementById('recordsLoader');
    if (loader) loader.style.display = 'block';
    
    fetch(API_ENDPOINTS.getRecords)
    .then(response => response.json())
    .then(data => {
        console.log('Mottok registreringer fra API:', data);
        
        if (loader) loader.style.display = 'none';
        
        if (data.success && data.records) {
            displayRecords(data.records);
        } else {
            tbody.innerHTML = '<tr><td colspan="7">Ingen registreringer funnet eller feil ved henting</td></tr>';
            console.error('Feil ved henting av registreringer:', data.error || 'Ukjent feil');
        }
    })
    .catch(error => {
        if (loader) loader.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="7">Tilkoblingsfeil</td></tr>';
        console.error('Feil ved API-kall for registreringer:', error);
    });
}

// Vis registreringer i tabellen
function displayRecords(records) {
    const tbody = document.querySelector('#recordsTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Ingen registreringer funnet</td></tr>';
        return;
    }
    
    records.forEach(record => {
        const row = document.createElement('tr');
        
        // Formater dato for visning
        const deathDate = new Date(record.death_date);
        const formattedDate = deathDate.toLocaleDateString('nb-NO');
        
        // Oversett kjønn til norsk
        const gender = record.patient_gender === 'male' ? 'Mann' : 
                       record.patient_gender === 'female' ? 'Kvinne' : 'Annet';
        
        row.innerHTML = `
            <td>${record.patient_id}</td>
            <td>${formattedDate}</td>
            <td>${record.patient_age}</td>
            <td>${gender}</td>
            <td>${record.primary_cause_desc || ''}</td>
            <td>${record.primary_cause_code || ''}</td>
            <td>
                <button class="btn btn-secondary btn-sm" data-action="view" data-id="${record.record_id}">Vis</button>
                <button class="btn btn-warning btn-sm" data-action="edit" data-id="${record.record_id}">Rediger</button>
                <button class="btn btn-danger btn-sm" data-action="delete" data-id="${record.record_id}">Slett</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Legg til event listeners for handlingsknapper
    document.querySelectorAll('#recordsTable button[data-action]').forEach(button => {
        button.addEventListener('click', function() {
            const action = this.getAttribute('data-action');
            const recordId = this.getAttribute('data-id');
            
            console.log(`Handling: ${action} for registrering #${recordId}`);
            
            if (action === 'view') {
                viewRecord(recordId);
            } else if (action === 'edit') {
                editRecord(recordId);
            } else if (action === 'delete') {
                deleteRecord(recordId);
            }
        });
    });
}

// Legg til testknapper
function addDebugButtons() {
    const alertsContainer = document.getElementById('alerts');
    if (!alertsContainer) return;
    
    // Opprett debug-seksjonen
    const debugSection = document.createElement('div');
    debugSection.className = 'debug-tools';
    debugSection.style.marginBottom = '20px';
    debugSection.innerHTML = `
        <h4>Debug-verktøy</h4>
        <div style="display: flex; gap: 10px;">
            <button id="testApiBtn" class="btn btn-secondary">Test API</button>
            <button id="showTablesBtn" class="btn btn-secondary">Vis databasetabeller</button>
            <button id="forceReloadBtn" class="btn btn-secondary">Last registreringer</button>
        </div>
        <div id="debugResult" style="margin-top: 10px; padding: 10px; background-color: #f7f7f7; border-radius: 4px; display: none;"></div>
    `;
    
    // Sett inn før alerts-container
    alertsContainer.parentNode.insertBefore(debugSection, alertsContainer);
    
    // Legg til event listeners
    document.getElementById('testApiBtn').addEventListener('click', function() {
        testApiConnection();
        showAlert('API-test kjørt, sjekk konsollen for resultater', 'success');
    });
    
    document.getElementById('showTablesBtn').addEventListener('click', function() {
        fetch(API_ENDPOINTS.showTables)
        .then(response => response.json())
        .then(data => {
            console.log('Tabelldata:', data);
            
            if (data.success) {
                const debugResult = document.getElementById('debugResult');
                debugResult.style.display = 'block';
                
                let html = '<h5>Databasetabeller</h5><table style="width:100%; border-collapse: collapse;">';
                html += '<tr><th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Tabell</th><th style="text-align:left; padding:8px; border-bottom:1px solid #ddd;">Antall rader</th></tr>';
                
                for (const [table, count] of Object.entries(data.tables)) {
                    html += `<tr><td style="padding:8px; border-bottom:1px solid #ddd;">${table}</td><td style="padding:8px; border-bottom:1px solid #ddd;">${count}</td></tr>`;
                }
                
                html += '</table>';
                debugResult.innerHTML = html;
            } else {
                showAlert(`Feil: ${data.error || 'Ukjent feil'}`, 'error');
            }
        })
        .catch(error => {
            console.error('Feil ved henting av tabelldata:', error);
            showAlert('Tilkoblingsfeil - kunne ikke hente tabelldata', 'error');
        });
    });
    
    document.getElementById('forceReloadBtn').addEventListener('click', function() {
        if (typeof loadRecords === 'function') {
            loadRecords();
            showAlert('Laster registreringer på nytt...', 'info');
        } else {
            console.log('loadRecords-funksjonen er ikke tilgjengelig');
            showAlert('Kan ikke laste registreringer, bruker du riktig side?', 'warning');
        }
    });
}

// Vis et alert-melding til brukeren
function showAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('alerts');
    if (!alertsContainer) {
        console.error('Alerts-container ikke funnet');
        console.log('MELDING:', message, 'Type:', type);
        return;
    }
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertsContainer.appendChild(alertElement);
    
    // Fjern melding etter 5 sekunder
    setTimeout(() => {
        alertElement.remove();
    }, 5000);
}

// Eksporter funksjoner som kan brukes fra konsollen
window.mortalitetDebug = {
    testApi: testApiConnection,
    loadRecords: loadRecords,
    showTables: () => document.getElementById('showTablesBtn').click(),
    registerMockData: () => {
        // Eksempel på registrering av testdata
        const mockData = {
            patientId: 'TEST' + Math.floor(Math.random() * 10000),
            patientAge: 70 + Math.floor(Math.random() * 20),
            patientGender: Math.random() > 0.5 ? 'male' : 'female',
            patientResidence: 'Oslo',
            deathDate: new Date().toISOString().split('T')[0],
            primaryCauseDesc: 'Akutt hjerteinfarkt',
            primaryCauseCode: 'I21.9',
            secondaryCauseDesc: 'Diabetes mellitus type 2',
            secondaryCauseCodes: 'E11.9',
            underlyingCauseDesc: '',
            underlyingCauseCodes: '',
            deathContext: 'natural',
            autopsyPerformed: 'no',
            additionalInfo: 'Testregistrering fra konsoll'
        };
        
        fetch(API_ENDPOINTS.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Testregistrering resultat:', data);
            if (data.success) {
                showAlert(`Testregistrering vellykket! ID: ${data.recordId}`, 'success');
            } else {
                showAlert(`Testregistrering feilet: ${data.error || 'Ukjent feil'}`, 'error');
            }
        })
        .catch(error => {
            console.error('Feil ved testregistrering:', error);
        });
    }
};

console.log('%c🔍 Mortalitet API-integrasjon lastet', 'font-size: 14px; font-weight: bold; color: #2c5282;');
console.log('Du kan bruke følgende kommandoer i konsollen:');
console.log('- window.mortalitetDebug.testApi() - Test API-tilkobling');
console.log('- window.mortalitetDebug.showTables() - Vis databasetabeller');
console.log('- window.mortalitetDebug.registerMockData() - Registrer testdata');
console.log('- window.mortalitetDebug.loadRecords() - Last inn registreringer på nytt');