/**
 * Forbedret skjemahåndtering for mortalitet-applikasjonen
 * Denne filen erstatter den originale skjemahåndteringen med en som fungerer.
 */

(function() {
    // Vent til DOM er lastet
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('mortForm');
        if (!form) {
            console.error('Kunne ikke finne skjemaet (mortForm)');
            return;
        }

        console.log('Erstatter skjemahåndtering med fungerende versjon');
        
        // Erstatt skjemaets standard submit handler
        form.addEventListener('submit', handleFormSubmit, true);
        
        // Legg til en ekstra knapp for sikkerhetsskyld
        const submitBtn = document.getElementById('saveBtn');
        if (submitBtn) {
            const directBtn = document.createElement('button');
            directBtn.type = 'button'; // Viktig - ikke submit
            directBtn.className = 'btn btn-primary';
            directBtn.style.marginLeft = '10px';
            directBtn.textContent = 'Lagre (forbedret)';
            submitBtn.insertAdjacentElement('afterend', directBtn);
            
            // Legg til click-handler
            directBtn.addEventListener('click', handleFormSubmit);
            
            console.log('Lagt til forbedret lagreknapp');
        }
    });
    
    // Håndterer innsending av skjemaet
    function handleFormSubmit(event) {
        event.preventDefault();
        
        console.log('Håndterer skjemainnsending med forbedret kode');
        
        // Hent alle relevante skjemaverdier
        const data = collectFormData();
        
        // Valider data
        if (!validateFormData(data)) {
            return;
        }
        
        // Vis laster-indikator
        const loader = showLoader();
        
        // Send data til API
        fetch('api/debug-api.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            hideLoader(loader);
            handleApiResponse(result);
        })
        .catch(error => {
            hideLoader(loader);
            console.error('API-feil:', error);
            showAlert('Tilkoblingsfeil - kunne ikke lagre registreringen', 'error');
        });
    }
    
    // Samler inn alle data fra skjemaet
    function collectFormData() {
        return {
            patientId: document.getElementById('patientId').value,
            patientAge: parseInt(document.getElementById('patientAge').value) || 65,
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
    }
    
    // Validerer skjemadata
    function validateFormData(data) {
        const requiredFields = [
            { field: 'patientId', name: 'Pasient ID' },
            { field: 'patientGender', name: 'Kjønn' },
            { field: 'patientResidence', name: 'Bosted' },
            { field: 'deathDate', name: 'Dødsdato' },
            { field: 'primaryCauseDesc', name: 'Primær dødsårsak' },
            { field: 'primaryCauseCode', name: 'ICD-kode' },
            { field: 'deathContext', name: 'Dødssammenheng' }
        ];
        
        let isValid = true;
        let missingFields = [];
        
        requiredFields.forEach(item => {
            if (!data[item.field]) {
                missingFields.push(item.name);
                isValid = false;
            }
        });
        
        if (!isValid) {
            showAlert('Vennligst fyll ut følgende felt: ' + missingFields.join(', '), 'error');
        }
        
        return isValid;
    }
    
    // Viser lasteindicator
    function showLoader() {
        const loader = document.createElement('div');
        loader.className = 'alert alert-info';
        loader.textContent = 'Lagrer registrering...';
        
        const container = document.querySelector('.form-group:last-child');
        if (container) {
            container.appendChild(loader);
        }
        
        return loader;
    }
    
    // Skjuler lasteindicator
    function hideLoader(loader) {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
    
    // Håndterer API-respons
    function handleApiResponse(result) {
        console.log('API-respons:', result);
        
        if (result.success) {
            showAlert(`Registrering lagret! ID: ${result.recordId}`, 'success');
            
            // Spør om brukeren vil nullstille skjemaet
            if (confirm('Registreringen ble lagret! Vil du nullstille skjemaet?')) {
                document.getElementById('mortForm').reset();
            }
        } else {
            showAlert(`Feil ved lagring: ${result.error || 'Ukjent feil'}`, 'error');
        }
    }
    
    // Viser en melding til brukeren
    function showAlert(message, type = 'success') {
        const alertsContainer = document.getElementById('alerts');
        if (!alertsContainer) {
            console.error('Alerts-container ikke funnet');
            alert(message);
            return;
        }
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.textContent = message;
        alertsContainer.appendChild(alertElement);
        
        // Fjern meldingen etter 5 sekunder
        setTimeout(() => {
            alertElement.remove();
        }, 5000);
    }
    
    // Forbedrer ICD-kodesøket
    function enhanceIcdSearch() {
        // Vent til DOM er ferdig lastet
        window.addEventListener('load', function() {
            const searchButtons = [
                document.getElementById('searchPrimaryCodeBtn'),
                document.getElementById('searchSecondaryCodeBtn'),
                document.getElementById('searchUnderlyingCodeBtn')
            ];
            
            searchButtons.forEach(function(btn) {
                if (!btn) return;
                
                btn.addEventListener('click', function() {
                    const targetField = this.getAttribute('data-target');
                    console.log(`Forbedret ICD-søk for ${targetField}`);
                    
                    // Vent på at modalen er åpen
                    setTimeout(function() {
                        // Finn result-container
                        const resultsContainer = document.getElementById('icdSearchResults');
                        if (!resultsContainer) return;
                        
                        // Legg til event listener til resultatlisten
                        resultsContainer.addEventListener('click', function(e) {
                            const item = e.target.closest('.icd-result-item');
                            if (!item) return;
                            
                            const codeElement = item.querySelector('.icd-code');
                            if (!codeElement) return;
                            
                            const code = codeElement.textContent;
                            if (!code) return;
                            
                            // Oppdater inputfeltet direkte
                            const inputField = document.getElementById(targetField);
                            if (inputField) {
                                inputField.value = code;
                                console.log(`Satt ${targetField} til ${code}`);
                            }
                        });
                    }, 300);
                });
            });
        });
    }
    
    // Aktiver forbedret ICD-søk
    enhanceIcdSearch();
    
    console.log('Forbedret skjemahåndtering lastet');
})();