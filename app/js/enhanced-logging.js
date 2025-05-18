// Denne filen må inkluderes i index.html etter originale JavaScript-filer
// Legg til denne linjen før </body>:
// <script src="js/enhanced-logging.js"></script>

(function() {
    console.log('Diagnostikk-logging aktivert for Mortalitet-applikasjonen');
    console.log('---------------------------------------------------------');
    
    // Vis informasjon om miljøet
    console.log('Miljøinformasjon:', {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
    });

    // Utvidet logging av form-hendelser
    if (document.getElementById('mortForm')) {
        const form = document.getElementById('mortForm');
        
        console.log('Registreringsskjema funnet:', form);
        
        // Sporing av skjemainnsending
        form.addEventListener('submit', function(event) {
            console.group('📝 SKJEMAINNSENDING STARTET');
            console.log('Tidspunkt:', new Date().toISOString());
            
            // Samle alle form-data
            const formData = new FormData(form);
            const formDataObj = {};
            
            formData.forEach((value, key) => {
                formDataObj[key] = value;
            });
            
            console.log('Form-data som sendes:', formDataObj);
            
            // Vis ICD-koder spesifikt
            console.log('ICD-koder:', {
                primaryCode: document.getElementById('primaryCauseCode')?.value,
                secondaryCodes: document.getElementById('secondaryCauseCodes')?.value,
                underlyingCodes: document.getElementById('underlyingCauseCodes')?.value
            });
            
            console.groupEnd();
        });
        
        // Original saveBtn click handler
        const originalSaveBtn = document.getElementById('saveBtn');
        if (originalSaveBtn) {
            const originalClickHandler = originalSaveBtn.onclick;
            
            originalSaveBtn.onclick = function(event) {
                console.group('🔄 LAGRE-KNAPP KLIKKET');
                console.log('Tidspunkt:', new Date().toISOString());
                
                // Kall den originale handleren hvis den finnes
                if (typeof originalClickHandler === 'function') {
                    console.log('Kaller original onclick-handler');
                    return originalClickHandler.call(this, event);
                }
                
                console.groupEnd();
            };
        }
    }
    
    // Overvåk AJAX-forespørsler
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url) {
        this._method = method;
        this._url = url;
        return originalXHROpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.send = function(data) {
        const xhr = this;
        
        console.group(`🌐 AJAX-FORESPØRSEL: ${xhr._method} ${xhr._url}`);
        console.log('Tidspunkt:', new Date().toISOString());
        console.log('Data sendt:', data ? JSON.parse(data) : 'Ingen data');
        
        // Spor respons
        this.addEventListener('load', function() {
            console.log('Respons status:', xhr.status);
            try {
                const responseData = JSON.parse(xhr.responseText);
                console.log('Respons data:', responseData);
                
                if (responseData.error) {
                    console.error('API-FEIL:', responseData.error);
                }
                
                if (responseData.success) {
                    console.log('✅ VELLYKKET API-KALL:', responseData.message || 'Ingen melding');
                }
            } catch (e) {
                console.log('Responstekst:', xhr.responseText.substring(0, 500) + 
                           (xhr.responseText.length > 500 ? '...' : ''));
            }
            console.groupEnd();
        });
        
        // Spor feil
        this.addEventListener('error', function() {
            console.error('❌ AJAX-feil:', {
                status: xhr.status,
                statusText: xhr.statusText
            });
            console.groupEnd();
        });
        
        return originalXHRSend.apply(this, arguments);
    };
    
    // Spor navigering mellom seksjoner
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const originalClickHandler = link.onclick;
        
        link.onclick = function(event) {
            console.log(`📌 Navigerer til: ${this.getAttribute('data-target') || this.textContent}`);
            
            if (typeof originalClickHandler === 'function') {
                return originalClickHandler.call(this, event);
            }
        };
    });
    
    // Logge brukerinnlogging
    const loginButton = document.getElementById('loginButton');
    if (loginButton) {
        const originalLoginHandler = loginButton.onclick;
        
        loginButton.onclick = function(event) {
            console.group('🔑 INNLOGGINGSFORSØK');
            console.log('Brukernavn:', document.getElementById('username')?.value);
            console.log('Rolle valgt:', document.getElementById('role')?.value);
            
            if (typeof originalLoginHandler === 'function') {
                return originalLoginHandler.call(this, event);
            }
            
            console.groupEnd();
        };
    }
    
    // Spesifikk debugging for visualiseringskomponenten
    const updateVizBtn = document.getElementById('updateVizBtn');
    if (updateVizBtn) {
        const originalHandler = updateVizBtn.onclick;
        
        updateVizBtn.onclick = function(event) {
            console.group('📊 OPPDATERER VISUALISERING');
            console.log('Tidspunkt:', new Date().toISOString());
            console.log('Visualiseringstype:', document.getElementById('vizChartType')?.value);
            console.log('Tidsområde:', document.getElementById('vizTimeRange')?.value);
            console.log('Kategori:', document.getElementById('vizCategory')?.value);
            
            if (typeof originalHandler === 'function') {
                return originalHandler.call(this, event);
            }
            
            console.groupEnd();
        };
    }
    
    // Logger funksjonalitet for å finne ICD-koder
    const searchButtons = [
        document.getElementById('searchPrimaryCodeBtn'),
        document.getElementById('searchSecondaryCodeBtn'),
        document.getElementById('searchUnderlyingCodeBtn')
    ];
    
    searchButtons.forEach(btn => {
        if (btn) {
            const originalHandler = btn.onclick;
            
            btn.onclick = function(event) {
                console.group('🔍 SØKER ETTER ICD-KODE');
                console.log('Søkeknapp:', btn.id);
                console.log('Målfelt:', btn.getAttribute('data-target'));
                
                if (typeof originalHandler === 'function') {
                    return originalHandler.call(this, event);
                }
                
                console.groupEnd();
            };
        }
    });
    
    // Sporer når en ICD-kode velges
    const searchResults = document.getElementById('icdSearchResults');
    if (searchResults) {
        searchResults.addEventListener('click', function(event) {
            const item = event.target.closest('.icd-result-item');
            if (item) {
                console.log('✓ ICD-kode valgt:', {
                    code: item.querySelector('.icd-code')?.textContent,
                    description: item.textContent.replace(item.querySelector('.icd-code')?.textContent || '', '').trim(),
                    targetField: searchResults.getAttribute('data-target')
                });
            }
        });
    }
    
    // Legg til global feilhåndtering
    window.addEventListener('error', function(event) {
        console.error('❌ GLOBAL FEIL:', {
            message: event.message,
            source: event.filename,
            lineNo: event.lineno,
            colNo: event.colno,
            error: event.error
        });
    });
    
    console.log('Diagnostikk-logging er nå aktiv. Sjekk konsollen for all aktivitet.');
    console.log('---------------------------------------------------------');
})();