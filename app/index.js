     // DATABASE MODEL (MOCK) - I VIRKELIGHETEN VIL DETTE HÅNDTERES AV MYSQL BACKEND
     let deathRecords = [];
     let currentUser = null;
     let icdCodes = [
         { code: "A00-B99", description: "Visse infeksjonssykdommer og parasittsykdommer" },
         { code: "C00-D48", description: "Svulster" },
         { code: "D50-D89", description: "Sykdommer i blod og bloddannende organer og visse tilstander som angår immunsystemet" },
         { code: "E00-E90", description: "Endokrine sykdommer, ernæringssykdommer og metabolske forstyrrelser" },
         { code: "F00-F99", description: "Psykiske lidelser og atferdsforstyrrelser" },
         { code: "G00-G99", description: "Sykdommer i nervesystemet" },
         { code: "H00-H59", description: "Sykdommer i øyet og øyets omgivelser" },
         { code: "H60-H95", description: "Sykdommer i øre og ørebensknute" },
         { code: "I00-I99", description: "Sykdommer i sirkulasjonssystemet" },
         { code: "J00-J99", description: "Sykdommer i åndedrettssystemet" },
         { code: "K00-K93", description: "Sykdommer i fordøyelsessystemet" },
         { code: "L00-L99", description: "Sykdommer i hud og underhud" },
         { code: "M00-M99", description: "Sykdommer i muskel-skjelettsystemet og bindevev" },
         { code: "N00-N99", description: "Sykdommer i urin- og kjønnsorganene" },
         { code: "O00-O99", description: "Svangerskap, fødsel og barseltid" },
         { code: "P00-P96", description: "Visse tilstander som oppstår i perinatalperioden" },
         { code: "Q00-Q99", description: "Medfødte misdannelser, deformiteter og kromosomavvik" },
         { code: "R00-R99", description: "Symptomer, tegn og unormale kliniske funn og laboratoriefunn, ikke klassifisert annet sted" },
         { code: "S00-T98", description: "Skader, forgiftninger og visse andre konsekvenser av ytre årsaker" },
         { code: "V01-Y98", description: "Ytre årsaker til sykdommer, skader og dødsfall" },
         { code: "Z00-Z99", description: "Faktorer som har betydning for helsetilstand og kontakt med helsetjenesten" },
         { code: "U00-U99", description: "Koder for spesielle formål" },
         // Mer detaljerte koder for vanlige dødsårsaker
         { code: "I21", description: "Akutt hjerteinfarkt" },
         { code: "I21.0", description: "Akutt transmuralt hjerteinfarkt i fremre vegg" },
         { code: "I21.1", description: "Akutt transmuralt hjerteinfarkt i nedre vegg" },
         { code: "I21.2", description: "Akutt transmuralt hjerteinfarkt med annen lokalisasjon" },
         { code: "I21.3", description: "Akutt transmuralt hjerteinfarkt med uspesifisert lokalisasjon" },
         { code: "I21.4", description: "Akutt subendokardialt infarkt" },
         { code: "I21.9", description: "Uspesifisert akutt hjerteinfarkt" },
         { code: "I25", description: "Kronisk iskemisk hjertesykdom" },
         { code: "I50", description: "Hjertesvikt" },
         { code: "I60-I69", description: "Hjernekarsykdommer" },
         { code: "C34", description: "Ondartet svulst i bronkie og lunge" },
         { code: "C34.9", description: "Uspesifisert ondartet svulst i bronkie og lunge" },
         { code: "C50", description: "Ondartet svulst i bryst" },
         { code: "J44", description: "Annen kronisk obstruktiv lungesykdom" },
         { code: "J44.9", description: "Uspesifisert kronisk obstruktiv lungesykdom" },
         { code: "E11", description: "Diabetes mellitus type 2" },
         { code: "E11.9", description: "Diabetes mellitus type 2 uten komplikasjoner" },
         { code: "F10", description: "Psykiske lidelser og atferdsforstyrrelser som skyldes bruk av alkohol" },
         { code: "F10.2", description: "Alkoholavhengighetssyndrom" },
         { code: "G30", description: "Alzheimers sykdom" },
         { code: "G30.9", description: "Uspesifisert Alzheimers sykdom" },
         { code: "X60-X84", description: "Villet egenskade" },
         { code: "V01-V99", description: "Transportulykker" }
     ];

     // UTILITY FUNCTIONS
     // Generer unik ID
     function generateUniqueId() {
         return Math.random().toString(36).substr(2, 9);
     }

     // Vise meldinger til brukeren
     function showAlert(message, type = 'success') {
         const alertsContainer = document.getElementById('alerts');
         const alertElement = document.createElement('div');
         alertElement.className = `alert alert-${type}`;
         alertElement.textContent = message;
         alertsContainer.appendChild(alertElement);

         // Fjern melding etter 5 sekunder
         setTimeout(() => {
             alertElement.remove();
         }, 5000);
     }

     // Formater dato til norsk format
     function formatDate(dateString) {
         const date = new Date(dateString);
         return date.toLocaleDateString('nb-NO', {
             day: '2-digit',
             month: '2-digit',
             year: 'numeric'
         });
     }

     // EVENT LISTENERS
     document.addEventListener('DOMContentLoaded', function() {
         // Navigasjon
         const navLinks = document.querySelectorAll('.nav-link');
         const tabContents = document.querySelectorAll('.tab-content');
         
         navLinks.forEach(link => {
             link.addEventListener('click', function(e) {
                 e.preventDefault();
                 const targetId = this.getAttribute('data-target') + 'Section';
                 
                 // Skjul alle seksjoner
                 tabContents.forEach(content => {
                     content.classList.remove('active');
                 });
                 
                 // Vis valgt seksjon
                 document.getElementById(targetId).classList.add('active');
                 
                 // Oppdater aktiv lenke
                 navLinks.forEach(navLink => {
                     navLink.classList.remove('active');
                 });
                 this.classList.add('active');
             });
         });

         // Modal håndtering
         const modalTriggers = document.querySelectorAll('[data-modal]');
         const modalClosers = document.querySelectorAll('.modal-close, .modal-close-btn');
         
         modalTriggers.forEach(trigger => {
             trigger.addEventListener('click', function() {
                 const modalId = this.getAttribute('data-modal');
                 document.getElementById(modalId).style.display = 'flex';
             });
         });
         
         modalClosers.forEach(closer => {
             closer.addEventListener('click', function() {
                 const modal = this.closest('.modal-backdrop');
                 modal.style.display = 'none';
             });
         });

         // Login modal
         document.getElementById('loginLink').addEventListener('click', function(e) {
             e.preventDefault();
             document.getElementById('loginModal').style.display = 'flex';
         });

         // Login funksjonalitet
         document.getElementById('loginButton').addEventListener('click', function() {
             const username = document.getElementById('username').value;
             const password = document.getElementById('password').value;
             const role = document.getElementById('role').value;
             
             if (username && password) {
                 // Simulerer en login-prosess
                 currentUser = {
                     username: username,
                     role: role
                 };
                 
                 document.getElementById('loginModal').style.display = 'none';
                 showAlert(`Innlogget som ${username} (${role === 'admin' ? 'Administrator' : 'Bruker'})`);
                 
                 // Vis admin-lenke hvis bruker er admin
                 if (role === 'admin') {
                     // Legg til admin-lenke i navigasjonen hvis den ikke finnes fra før
                     if (!document.querySelector('.nav-link[data-target="recordList"]')) {
                         const navUl = document.querySelector('nav ul');
                         const adminLi = document.createElement('li');
                         const adminLink = document.createElement('a');
                         adminLink.href = '#';
                         adminLink.className = 'nav-link';
                         adminLink.setAttribute('data-target', 'recordList');
                         adminLink.textContent = 'Administrer';
                         adminLi.appendChild(adminLink);
                         navUl.insertBefore(adminLi, document.getElementById('loginLink').parentElement);
                         
                         // Legg til event listener for den nye lenken
                         adminLink.addEventListener('click', function(e) {
                             e.preventDefault();
                             const targetId = this.getAttribute('data-target') + 'Section';
                             
                             tabContents.forEach(content => {
                                 content.classList.remove('active');
                             });
                             
                             document.getElementById(targetId).classList.add('active');
                             
                             navLinks.forEach(navLink => {
                                 navLink.classList.remove('active');
                             });
                             this.classList.add('active');
                             
                             // Last inn registreringer
                             loadRecords();
                         });
                     }
                 }
                 
                 // Endre login-lenken til logout
                 document.getElementById('loginLink').textContent = 'Logg ut';
                 document.getElementById('loginLink').removeEventListener('click', loginHandler);
                 document.getElementById('loginLink').addEventListener('click', logoutHandler);
             } else {
                 showAlert('Vennligst fyll ut alle feltene', 'error');
             }
         });

         function loginHandler(e) {
             e.preventDefault();
             document.getElementById('loginModal').style.display = 'flex';
         }

         function logoutHandler(e) {
             e.preventDefault();
             currentUser = null;
             showAlert('Du er nå logget ut');
             
             // Fjern admin-lenke hvis den finnes
             const adminLink = document.querySelector('.nav-link[data-target="recordList"]');
             if (adminLink) {
                 adminLink.parentElement.remove();
             }
             
             // Gå tilbake til registrering-siden
             navLinks[0].click();
             
             // Endre logout-lenken tilbake til login
             document.getElementById('loginLink').textContent = 'Logg inn';
             document.getElementById('loginLink').removeEventListener('click', logoutHandler);
             document.getElementById('loginLink').addEventListener('click', loginHandler);
         }
         
         // Håndtering av ICD kode-søk
         document.getElementById('searchPrimaryCodeBtn').addEventListener('click', function() {
             openIcdSearch('primaryCauseCode');
         });
         
         document.getElementById('searchSecondaryCodeBtn').addEventListener('click', function() {
             openIcdSearch('secondaryCauseCodes');
         });
         
         document.getElementById('searchUnderlyingCodeBtn').addEventListener('click', function() {
             openIcdSearch('underlyingCauseCodes');
         });

         function openIcdSearch(targetField) {
             document.getElementById('icdSearchModal').style.display = 'flex';
             document.getElementById('icdSearchInput').value = '';
             document.getElementById('icdSearchResults').innerHTML = '';
             document.getElementById('icdSearchInput').focus();
             
             // Lagre mål-felt for søkeresultatet
             document.getElementById('icdSearchResults').setAttribute('data-target', targetField);
             
             // Last inn alle koder
             showIcdSearchResults(icdCodes);
         }
         
         // Søk i ICD koder
         document.getElementById('icdSearchInput').addEventListener('input', function() {
             const searchTerm = this.value.toLowerCase();
             const filteredCodes = icdCodes.filter(code => 
                 code.code.toLowerCase().includes(searchTerm) || 
                 code.description.toLowerCase().includes(searchTerm)
             );
             
             showIcdSearchResults(filteredCodes);
         });
         
         function showIcdSearchResults(codes) {
             const resultsContainer = document.getElementById('icdSearchResults');
             resultsContainer.innerHTML = '';
             
             if (codes.length === 0) {
                 resultsContainer.innerHTML = '<p>Ingen resultater funnet</p>';
                 return;
             }
             
             const ul = document.createElement('ul');
             ul.className = 'icd-results-list';
             
             codes.forEach(code => {
                 const li = document.createElement('li');
                 li.className = 'icd-result-item';
                 li.innerHTML = `<span class="icd-code">${code.code}</span>: ${code.description}`;
                 
                 li.addEventListener('click', function() {
                     const targetField = resultsContainer.getAttribute('data-target');
                     
                     if (targetField === 'primaryCauseCode') {
                         document.getElementById(targetField).value = code.code;
                     } else {
                         // For sekundære og underliggende årsaker, legg til koden i listen
                         const currentValue = document.getElementById(targetField).value;
                         if (currentValue && !currentValue.includes(code.code)) {
                             document.getElementById(targetField).value = currentValue + ', ' + code.code;
                         } else {
                             document.getElementById(targetField).value = code.code;
                         }
                     }
                     
                     document.getElementById('icdSearchModal').style.display = 'none';
                 });
                 
                 ul.appendChild(li);
             });
             
             resultsContainer.appendChild(ul);
         }

         // Lagre registrering
         document.getElementById('mortForm').addEventListener('submit', function(e) {
             e.preventDefault();
             
             // Valider form
             const patientId = document.getElementById('patientId').value;
             const patientAge = document.getElementById('patientAge').value;
             const patientGender = document.getElementById('patientGender').value;
             const patientResidence = document.getElementById('patientResidence').value;
             const deathDate = document.getElementById('deathDate').value;
             const primaryCauseDesc = document.getElementById('primaryCauseDesc').value;
             const primaryCauseCode = document.getElementById('primaryCauseCode').value;
             
             if (!patientId || !patientAge || !patientGender || !patientResidence || 
                 !deathDate || !primaryCauseDesc || !primaryCauseCode) {
                 showAlert('Vennligst fyll ut alle påkrevde felt', 'error');
                 return;
             }
             
             // Valider ICD-kode
             const icdCodeValid = icdCodes.some(code => 
                 primaryCauseCode === code.code || 
                 code.code.includes('-') && isCodeInRange(primaryCauseCode, code.code)
             );
             
             if (!icdCodeValid) {
                 showAlert('Ugyldig primær ICD-kode. Vennligst velg en kode fra søkefunksjonen.', 'warning');
                 return;
             }

             // Opprett ny registrering
             const newRecord = {
                 id: generateUniqueId(),
                 patientId: patientId,
                 patientAge: parseInt(patientAge),
                 patientGender: patientGender,
                 patientResidence: patientResidence,
                 deathDate: deathDate,
                 primaryCauseDesc: primaryCauseDesc,
                 primaryCauseCode: primaryCauseCode,
                 secondaryCauseDesc: document.getElementById('secondaryCauseDesc').value,
                 secondaryCauseCodes: document.getElementById('secondaryCauseCodes').value,
                 underlyingCauseDesc: document.getElementById('underlyingCauseDesc').value,
                 underlyingCauseCodes: document.getElementById('underlyingCauseCodes').value,
                 deathContext: document.getElementById('deathContext').value,
                 autopsyPerformed: document.getElementById('autopsyPerformed').value,
                 additionalInfo: document.getElementById('additionalInfo').value,
                 registered: new Date().toISOString(),
                 registeredBy: currentUser ? currentUser.username : 'Ukjent bruker'
             };
             
             // Legg til i databasen (i virkeligheten ville dette være en API-forespørsel til MySQL)
             deathRecords.push(newRecord);
             
             // Vis bekreftelse
             showAlert('Registrering lagret');
             
             // Nullstill skjemaet
             this.reset();
         });

         // Hjelpefunksjon for å sjekke om en kode er innenfor et område (f.eks. I00-I99)
         function isCodeInRange(code, range) {
             if (!range.includes('-')) return false;
             
             const [start, end] = range.split('-');
             // Fjern eventuelle tall for å sammenligne bokstavprefiks
             const codePrefix = code.replace(/[0-9]/g, '');
             const startPrefix = start.replace(/[0-9]/g, '');
             const endPrefix = end.replace(/[0-9]/g, '');
             
             // Hvis bokstavprefiks er forskjellig, er koden ikke i området
             if (codePrefix !== startPrefix || codePrefix !== endPrefix) return false;
             
             // Hent tallverdiene
             const codeNum = parseInt(code.replace(/[A-Z]/g, ''));
             const startNum = parseInt(start.replace(/[A-Z]/g, ''));
             const endNum = parseInt(end.replace(/[A-Z]/g, ''));
             
             return codeNum >= startNum && codeNum <= endNum;
         }

         // Kontaktskjema
         document.getElementById('contactForm').addEventListener('submit', function(e) {
             e.preventDefault();
             
             // Simuler sending av kontaktskjema
             showAlert('Takk for din henvendelse! Vi vil kontakte deg så snart som mulig.');
             this.reset();
         });

         // Eksportfunksjonalitet
         document.getElementById('exportDataBtn').addEventListener('click', function() {
             // Simuler eksport av data
             document.getElementById('downloadSection').style.display = 'block';
             showAlert('Dataeksport er klar for nedlasting');
         });

         document.getElementById('downloadBtn').addEventListener('click', function() {
             // Simuler nedlasting
             showAlert('Nedlastingen har startet');
         });

         // Visualisering
         document.getElementById('updateVizBtn').addEventListener('click', function() {
             updateVisualization();
         });

         function updateVisualization() {
             // Vis lasteindikatoren
             document.getElementById('vizLoader').style.display = 'block';
             
             // Simuler lasting
             setTimeout(() => {
                 // Skjul lasteindikatoren
                 document.getElementById('vizLoader').style.display = 'none';
                 
                 // Opprett eksempeldata for visualisering
                 const vizType = document.getElementById('vizChartType').value;
                 const vizCategory = document.getElementById('vizCategory').value;
                 
                 if (deathRecords.length === 0) {
                     // Opprett eksempeldata hvis ingen registreringer finnes
                     createSampleData();
                 }
                 
                 // Lag visualisering basert på valgt kategori
                 let data;
                 if (vizCategory === 'icdChapter') {
                     data = aggregateByIcdChapter(deathRecords);
                 } else if (vizCategory === 'causeType') {
                     data = aggregateByCauseType(deathRecords);
                 } else if (vizCategory === 'age') {
                     data = aggregateByAge(deathRecords);
                 } else {
                     data = aggregateByGender(deathRecords);
                 }
                 
                 // Kall relevant visualiseringsfunksjon
                 if (vizType === 'bar') {
                     createBarChart(data);
                 } else if (vizType === 'pie') {
                     createPieChart(data);
                 } else {
                     createLineChart(data);
                 }
                 
                 // Oppdater tabellen
                 updateStatsTable(data);
             }, 1000);
         }

         // Opprett eksempeldata
         function createSampleData() {
             const causes = [
                 { code: "I21.9", desc: "Akutt hjerteinfarkt" },
                 { code: "C34.9", desc: "Lungekreft" },
                 { code: "J44.9", desc: "KOLS" },
                 { code: "I50.9", desc: "Hjertesvikt" },
                 { code: "G30.9", desc: "Alzheimers sykdom" },
                 { code: "E11.9", desc: "Type 2 diabetes" },
                 { code: "C50.9", desc: "Brystkreft" },
                 { code: "I63.9", desc: "Hjerneslag" },
                 { code: "F10.2", desc: "Alkoholavhengighet" },
                 { code: "V89.9", desc: "Trafikkulykke" }
             ];
             
             const secondaryCauses = [
                 { code: "I10", desc: "Hypertensjon" },
                 { code: "E11.9", desc: "Type 2 diabetes" },
                 { code: "F17.2", desc: "Nikotinavhengighet" },
                 { code: "I25.9", desc: "Iskemisk hjertesykdom" }
             ];
             
             const underlyingCauses = [
                 { code: "E66.9", desc: "Fedme" },
                 { code: "F10.1", desc: "Skadelig bruk av alkohol" },
                 { code: "Z72.0", desc: "Tobakksbruk" }
             ];
             
             const residences = [
                 "Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", 
                 "Kristiansand", "Bodø", "Ålesund", "Drammen", "Tønsberg"
             ];
             
             // Opprett 100 tilfeldige registreringer
             for (let i = 0; i < 100; i++) {
                 const deathDate = new Date();
                 deathDate.setDate(deathDate.getDate() - Math.floor(Math.random() * 365));
                 
                 const age = 40 + Math.floor(Math.random() * 55); // Alder mellom 40 og 95
                 const gender = Math.random() > 0.5 ? 'male' : 'female';
                 
                 const primaryCause = causes[Math.floor(Math.random() * causes.length)];
                 const hasSecondaryCause = Math.random() > 0.3;
                 const secondaryCause = hasSecondaryCause ? 
                     secondaryCauses[Math.floor(Math.random() * secondaryCauses.length)] : null;
                 
                 const hasUnderlyingCause = Math.random() > 0.5;
                 const underlyingCause = hasUnderlyingCause ?
                     underlyingCauses[Math.floor(Math.random() * underlyingCauses.length)] : null;
                 
                 const residence = residences[Math.floor(Math.random() * residences.length)];
                 
                 const deathContext = ['natural', 'accident', 'suicide', 'homicide', 'unknown'];
                 const contextWeight = [0.8, 0.1, 0.05, 0.03, 0.02]; // Vekter for fordeling
                 
                 let context = 'natural';
                 const rand = Math.random();
                 let cumWeight = 0;
                 for (let j = 0; j < contextWeight.length; j++) {
                     cumWeight += contextWeight[j];
                     if (rand < cumWeight) {
                         context = deathContext[j];
                         break;
                     }
                 }
                 
                 deathRecords.push({
                     id: generateUniqueId(),
                     patientId: 'P' + (10000 + i),
                     patientAge: age,
                     patientGender: gender,
                     patientResidence: residence,
                     deathDate: deathDate.toISOString().split('T')[0],
                     primaryCauseDesc: primaryCause.desc,
                     primaryCauseCode: primaryCause.code,
                     secondaryCauseDesc: secondaryCause ? secondaryCause.desc : "",
                     secondaryCauseCodes: secondaryCause ? secondaryCause.code : "",
                     underlyingCauseDesc: underlyingCause ? underlyingCause.desc : "",
                     underlyingCauseCodes: underlyingCause ? underlyingCause.code : "",
                     deathContext: context,
                     autopsyPerformed: Math.random() > 0.7 ? "yes" : "no",
                     additionalInfo: "",
                     registered: new Date().toISOString(),
                     registeredBy: "System"
                 });
             }
         }

         // Aggreger data for visualisering
         function aggregateByIcdChapter(records) {
             const chapters = {
                 "A00-B99": "Infeksjonssykdommer",
                 "C00-D48": "Svulster",
                 "D50-D89": "Blodsykdommer",
                 "E00-E90": "Endokrine sykdommer",
                 "F00-F99": "Psykiske lidelser",
                 "G00-G99": "Nervesystemet",
                 "H00-H59": "Øyesykdommer",
                 "H60-H95": "Øresykdommer",
                 "I00-I99": "Hjerte- og karsykdommer",
                 "J00-J99": "Luftveissykdommer",
                 "K00-K93": "Fordøyelsessykdommer",
                 "L00-L99": "Hudsykdommer",
                 "M00-M99": "Muskel/skjelett",
                 "N00-N99": "Urinveier/kjønnsorganer",
                 "O00-O99": "Svangerskap/fødsel",
                 "P00-P96": "Perinatalperioden",
                 "Q00-Q99": "Medfødte misdannelser",
                 "R00-R99": "Symptomer/unormale funn",
                 "S00-T98": "Skader og forgiftninger",
                 "V01-Y98": "Ytre årsaker",
                 "Z00-Z99": "Faktorer som påvirker helsestatus",
                 "U00-U99": "Spesielle formål"
             };

             // Initialiser teller for hvert kapittel
             const counts = {};
             Object.keys(chapters).forEach(chapter => {
                 counts[chapter] = 0;
             });

             // Tell forekomster
             records.forEach(record => {
                 const code = record.primaryCauseCode;
                 const prefix = code.split('.')[0]; // Fjern eventuell underkode
                 
                 for (const chapterRange in chapters) {
                     if (isCodeInRange(prefix, chapterRange)) {
                         counts[chapterRange]++;
                         break;
                     }
                 }
             });

             // Konverter til array med navn og format for diagrammer
             return Object.keys(counts)
                 .filter(key => counts[key] > 0) // Fjern tomme kategorier
                 .map(key => ({
                     name: chapters[key],
                     value: counts[key],
                     code: key
                 }))
                 .sort((a, b) => b.value - a.value); // Sorter etter antall
         }

         function aggregateByCauseType(records) {
             const types = {
                 "natural": "Naturlig død",
                 "accident": "Ulykke",
                 "suicide": "Selvmord",
                 "homicide": "Drap",
                 "unknown": "Ukjent"
             };

             // Initialiser tellere
             const counts = {};
             Object.keys(types).forEach(type => {
                 counts[type] = 0;
             });

             // Tell forekomster
             records.forEach(record => {
                 counts[record.deathContext]++;
             });

             // Konverter til array format
             return Object.keys(counts)
                 .map(key => ({
                     name: types[key],
                     value: counts[key],
                     code: key
                 }))
                 .sort((a, b) => b.value - a.value);
         }

         function aggregateByAge(records) {
             const ageGroups = {
                 "0-9": "0-9 år",
                 "10-19": "10-19 år",
                 "20-29": "20-29 år",
                 "30-39": "30-39 år",
                 "40-49": "40-49 år",
                 "50-59": "50-59 år",
                 "60-69": "60-69 år",
                 "70-79": "70-79 år",
                 "80-89": "80-89 år",
                 "90+": "90+ år"
             };

             // Initialiser tellere
             const counts = {};
             Object.keys(ageGroups).forEach(group => {
                 counts[group] = 0;
             });

             // Tell forekomster
             records.forEach(record => {
                 const age = record.patientAge;
                 let ageGroup = "90+";
                 
                 if (age < 10) ageGroup = "0-9";
                 else if (age < 20) ageGroup = "10-19";
                 else if (age < 30) ageGroup = "20-29";
                 else if (age < 40) ageGroup = "30-39";
                 else if (age < 50) ageGroup = "40-49";
                 else if (age < 60) ageGroup = "50-59";
                 else if (age < 70) ageGroup = "60-69";
                 else if (age < 80) ageGroup = "70-79";
                 else if (age < 90) ageGroup = "80-89";
                 
                 counts[ageGroup]++;
             });

             // Konverter til array format
             return Object.keys(counts)
                 .map(key => ({
                     name: ageGroups[key],
                     value: counts[key],
                     code: key
                 }));
         }

         function aggregateByGender(records) {
             const genders = {
                 "male": "Menn",
                 "female": "Kvinner",
                 "other": "Annet"
             };

             // Initialiser tellere
             const counts = {};
             Object.keys(genders).forEach(gender => {
                 counts[gender] = 0;
             });

             // Tell forekomster
             records.forEach(record => {
                 counts[record.patientGender]++;
             });

             // Konverter til array format
             return Object.keys(counts)
                 .map(key => ({
                     name: genders[key],
                     value: counts[key],
                     code: key
                 }))
                 .sort((a, b) => b.value - a.value);
         }

         // Visualiseringsfunksjoner (forenklet implementasjon)
         function createBarChart(data) {
             const chartContainer = document.getElementById('chartContainer');
             chartContainer.innerHTML = '';
             
             // Sett opp canvas for diagram
             const canvas = document.createElement('canvas');
             canvas.width = chartContainer.offsetWidth;
             canvas.height = chartContainer.offsetHeight;
             chartContainer.appendChild(canvas);
             
             const ctx = canvas.getContext('2d');
             const totalHeight = canvas.height - 60;
             const barWidth = Math.min(50, (canvas.width - 100) / data.length);
             const spacing = 10;
             const maxValue = Math.max(...data.map(item => item.value));
             
             // Tegn y-akse
             ctx.beginPath();
             ctx.moveTo(50, 10);
             ctx.lineTo(50, totalHeight + 30);
             ctx.stroke();
             
             // Tegn x-akse
             ctx.beginPath();
             ctx.moveTo(50, totalHeight + 30);
             ctx.lineTo(canvas.width - 20, totalHeight + 30);
             ctx.stroke();
             
             // Bestem farger
             const colors = [
                 '#4299e1', '#3182ce', '#2b6cb0', '#2c5282',
                 '#2a4365', '#ebf8ff', '#bee3f8', '#90cdf4',
                 '#63b3ed', '#4299e1', '#3182ce', '#2b6cb0',
                 '#2c5282', '#2a4365', '#ebf8ff', '#bee3f8',
                 '#90cdf4', '#63b3ed', '#4299e1', '#3182ce'
             ];
             
             // Tegn søyler
             data.forEach((item, index) => {
                 const x = 60 + index * (barWidth + spacing);
                 const barHeight = (item.value / maxValue) * totalHeight;
                 const y = totalHeight + 30 - barHeight;
                 
                 // Tegn søyle
                 ctx.fillStyle = colors[index % colors.length];
                 ctx.fillRect(x, y, barWidth, barHeight);
                 
                 // Legg til verdi over søylen
                 ctx.fillStyle = '#4a5568';
                 ctx.font = '12px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText(item.value, x + barWidth / 2, y - 5);
                 
                 // Legg til etiketter under x-aksen
                 ctx.fillText(item.name.substring(0, 10) + (item.name.length > 10 ? '...' : ''), 
                     x + barWidth / 2, totalHeight + 45);
             });
             
             // Legg til legend
             updateChartLegend(data, colors);
         }

         function createPieChart(data) {
             const chartContainer = document.getElementById('chartContainer');
             chartContainer.innerHTML = '';
             
             // Sett opp canvas for diagram
             const canvas = document.createElement('canvas');
             canvas.width = chartContainer.offsetWidth;
             canvas.height = chartContainer.offsetHeight;
             chartContainer.appendChild(canvas);
             
             const ctx = canvas.getContext('2d');
             const centerX = canvas.width / 2;
             const centerY = canvas.height / 2;
             const radius = Math.min(centerX, centerY) - 20;
             
             // Beregn total sum
             const total = data.reduce((sum, item) => sum + item.value, 0);
             
             // Bestem farger
             const colors = [
                 '#4299e1', '#3182ce', '#2b6cb0', '#2c5282',
                 '#2a4365', '#ebf8ff', '#bee3f8', '#90cdf4',
                 '#63b3ed', '#4299e1', '#3182ce', '#2b6cb0',
                 '#2c5282', '#2a4365', '#ebf8ff', '#bee3f8',
                 '#90cdf4', '#63b3ed', '#4299e1', '#3182ce'
             ];
             
             let startAngle = 0;
             
             // Tegn sektorer
             data.forEach((item, index) => {
                 const sliceAngle = (2 * Math.PI * item.value) / total;
                 const endAngle = startAngle + sliceAngle;
                 
                 ctx.beginPath();
                 ctx.fillStyle = colors[index % colors.length];
                 ctx.moveTo(centerX, centerY);
                 ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                 ctx.closePath();
                 ctx.fill();
                 
                 // Legg til etiketter for store nok sektorer
                 if (sliceAngle > 0.2) {
                     const labelAngle = startAngle + sliceAngle / 2;
                     const labelRadius = radius * 0.7;
                     const labelX = centerX + labelRadius * Math.cos(labelAngle);
                     const labelY = centerY + labelRadius * Math.sin(labelAngle);
                     
                     ctx.fillStyle = 'white';
                     ctx.font = 'bold 14px Arial';
                     ctx.textAlign = 'center';
                     ctx.textBaseline = 'middle';
                     ctx.fillText(item.value, labelX, labelY);
                 }
                 
                 startAngle = endAngle;
             });
             
             // Legg til legend
             updateChartLegend(data, colors);
         }

         function createLineChart(data) {
             // For linjedata, vi må ha tidsserie-data
             // Dette er bare en forenklet demo
             const chartContainer = document.getElementById('chartContainer');
             chartContainer.innerHTML = '';
             
             // Sett opp canvas for diagram
             const canvas = document.createElement('canvas');
             canvas.width = chartContainer.offsetWidth;
             canvas.height = chartContainer.offsetHeight;
             chartContainer.appendChild(canvas);
             
             const ctx = canvas.getContext('2d');
             const totalHeight = canvas.height - 60;
             const totalWidth = canvas.width - 100;
             
             // Konverter data for tidsserie (demo for dødsfall per måned)
             const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];
             const timeData = [];
             
             // Opprett tilfeldige data for måneder
             let total = 0;
             data.forEach(item => {
                 total += item.value;
             });
             
             for (let i = 0; i < 12; i++) {
                 timeData.push({
                     name: months[i],
                     value: Math.round(total / 12 * (0.8 + Math.random() * 0.4))
                 });
             }
             
             // Finn maksverdi
             const maxValue = Math.max(...timeData.map(item => item.value));
             
             // Tegn y-akse
             ctx.beginPath();
             ctx.moveTo(50, 10);
             ctx.lineTo(50, totalHeight + 30);
             ctx.stroke();
             
             // Tegn x-akse
             ctx.beginPath();
             ctx.moveTo(50, totalHeight + 30);
             ctx.lineTo(canvas.width - 20, totalHeight + 30);
             ctx.stroke();
             
             // Tegn linjen
             ctx.beginPath();
             ctx.strokeStyle = '#3182ce';
             ctx.lineWidth = 3;
             
             timeData.forEach((item, index) => {
                 const x = 60 + index * (totalWidth / 11);
                 const y = totalHeight + 30 - (item.value / maxValue) * totalHeight;
                 
                 if (index === 0) {
                     ctx.moveTo(x, y);
                 } else {
                     ctx.lineTo(x, y);
                 }
                 
                 // Tegn datapunkter
                 ctx.fillStyle = '#3182ce';
                 ctx.beginPath();
                 ctx.arc(x, y, 4, 0, 2 * Math.PI);
                 ctx.fill();
                 
                 // Legg til verdier
                 ctx.fillStyle = '#4a5568';
                 ctx.font = '12px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText(item.value, x, y - 15);
                 
                 // Legg til x-etiketter
                 ctx.fillText(item.name, x, totalHeight + 45);
             });
             
             ctx.stroke();
             
             // Legg til legend
             const legendDiv = document.getElementById('chartLegend');
             legendDiv.innerHTML = '';
             legendDiv.innerHTML = '<div class="legend-item"><span class="legend-color" style="background-color: #3182ce;"></span> Antall dødsfall per måned</div>';
         }

         function updateChartLegend(data, colors) {
             const legendDiv = document.getElementById('chartLegend');
             legendDiv.innerHTML = '';
             
             data.forEach((item, index) => {
                 const legendItem = document.createElement('div');
                 legendItem.className = 'legend-item';
                 legendItem.innerHTML = `
                     <span class="legend-color" style="background-color: ${colors[index % colors.length]};"></span>
                     ${item.name}: ${item.value}
                 `;
                 legendDiv.appendChild(legendItem);
             });
         }

         function updateStatsTable(data) {
             const statsTable = document.getElementById('statsTable');
             const tbody = statsTable.querySelector('tbody');
             tbody.innerHTML = '';
             
             // Beregn total
             const total = data.reduce((sum, item) => sum + item.value, 0);
             
             // Legg til hver rad
             data.forEach(item => {
                 const row = document.createElement('tr');
                 const percentage = ((item.value / total) * 100).toFixed(1);
                 
                 row.innerHTML = `
                     <td>${item.name}</td>
                     <td>${item.value}</td>
                     <td>${percentage}%</td>
                 `;
                 
                 tbody.appendChild(row);
             });
             
             // Legg til totalrad
             const totalRow = document.createElement('tr');
             totalRow.innerHTML = `
                 <td><strong>Totalt</strong></td>
                 <td><strong>${total}</strong></td>
                 <td><strong>100.0%</strong></td>
             `;
             tbody.appendChild(totalRow);
         }

         // Funksjonalitet for administrasjon av registreringer
         function loadRecords() {
             // Vis lasteindikatoren
             document.getElementById('recordsLoader').style.display = 'block';
             
             // Simuler lasting
             setTimeout(() => {
                 // Skjul lasteindikatoren
                 document.getElementById('recordsLoader').style.display = 'none';
                 
                 // Vis registreringer
                 displayRecords(deathRecords);
             }, 500);
         }

         function displayRecords(records) {
             const tbody = document.querySelector('#recordsTable tbody');
             tbody.innerHTML = '';
             
             if (records.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="7">Ingen registreringer funnet</td></tr>';
                 return;
             }
             
             records.forEach(record => {
                 const row = document.createElement('tr');
                 
                 row.innerHTML = `
                     <td>${record.patientId}</td>
                     <td>${formatDate(record.deathDate)}</td>
                     <td>${record.patientAge}</td>
                     <td>${record.patientGender === 'male' ? 'Mann' : record.patientGender === 'female' ? 'Kvinne' : 'Annet'}</td>
                     <td>${record.primaryCauseDesc}</td>
                     <td>${record.primaryCauseCode}</td>
                     <td>
                         <button class="btn btn-secondary btn-sm" data-action="view" data-id="${record.id}">Vis</button>
                         <button class="btn btn-warning btn-sm" data-action="edit" data-id="${record.id}">Rediger</button>
                         <button class="btn btn-danger btn-sm" data-action="delete" data-id="${record.id}">Slett</button>
                     </td>
                 `;
                 
                 tbody.appendChild(row);
             });
             
             // Legg til event listeners for handlingsknapper
             document.querySelectorAll('#recordsTable button[data-action]').forEach(button => {
                 button.addEventListener('click', function() {
                     const action = this.getAttribute('data-action');
                     const recordId = this.getAttribute('data-id');
                     
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

         function viewRecord(recordId) {
             const record = deathRecords.find(r => r.id === recordId);
             if (!record) {
                 showAlert('Registrering ikke funnet', 'error');
                 return;
             }
             
             // Her kunne man vist detaljert informasjon i en modal
             alert(`Detaljert visning for registrering ${recordId} (${record.primaryCauseDesc})`);
         }

         function editRecord(recordId) {
             const record = deathRecords.find(r => r.id === recordId);
             if (!record) {
                 showAlert('Registrering ikke funnet', 'error');
                 return;
             }
             
             // Her kunne man åpnet registreringsskjemaet med forhåndsutfylte data
             alert(`Redigerer registrering ${recordId} (${record.primaryCauseDesc})`);
         }

         function deleteRecord(recordId) {
             if (confirm('Er du sikker på at du vil slette denne registreringen?')) {
                 const index = deathRecords.findIndex(r => r.id === recordId);
                 if (index !== -1) {
                     deathRecords.splice(index, 1);
                     showAlert('Registrering slettet');
                     loadRecords(); // Oppdater visningen
                 } else {
                     showAlert('Registrering ikke funnet', 'error');
                 }
             }
         }

         // Søk i registreringer
         document.getElementById('searchRecordsBtn').addEventListener('click', function() {
             const searchTerm = document.getElementById('searchRecords').value.toLowerCase();
             
             if (!searchTerm) {
                 displayRecords(deathRecords);
                 return;
             }
             
             const filteredRecords = deathRecords.filter(record => 
                 record.patientId.toLowerCase().includes(searchTerm) ||
                 record.primaryCauseCode.toLowerCase().includes(searchTerm) ||
                 record.primaryCauseDesc.toLowerCase().includes(searchTerm)
             );
             
             displayRecords(filteredRecords);
         });

         // Initialiser visningen
         createSampleData();
         updateVisualization();
     });