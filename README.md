# Om prosjektet 
Mortalitet er et komplett system for standardisert registrering og analyse av dødsårsaker basert på WHOs internasjonale klassifikasjonssystem (ICD). Løsningen gir helsepersonell et effektivt digitalt verktøy for koding av dødsårsaker, som sikrer konsistent datainnsamling for folkehelseforskning og internasjonal sammenligning.

![image](https://github.com/user-attachments/assets/fe807be4-440f-4a67-ae3c-d61b124df3f8)


# Hovedfunksjoner

Standardisert registrering av dødsårsaker med ICD-kodesystemet
Intelligent ICD-kodesøk med automatiske forslag basert på beskrivelser
Validering i henhold til WHOs retningslinjer for koding av dødsårsaker
Omfattende datavisualisering med grafer og statistikk
Eksportfunksjonalitet for videre analyse (CSV, JSON)
Rollebasert tilgangskontroll for sikker databehandling
Responsivt design som fungerer på alle enheter

# Teknisk implementasjon
Systemet er bygget med moderne webteknikker og er designet for enkel integrering i eksisterende helsesystemer:

Frontend: HTML5, CSS3, vanilla JavaScript
Backend: PHP for API-tjenester
Database: MySQL for pålitelig datalagring
Docker-basert for enkel installasjon og distribusjon
API-dokumentasjon for integrasjon med tredjeparts systemer

![image](https://github.com/user-attachments/assets/eb6206e5-b7d5-4e48-940e-27a6cadc7c73)


# Personvern og sikkerhet
Mortalitet er utviklet med fokus på personvern og datasikkerhet i henhold til GDPR. 

# Installasjon og oppsett
Mortalitet kan enkelt settes opp med Docker:
```
git clone https://github.com/radomax/mortalitet.git
cd mortalitet
docker-compose up -d
```
Applikasjonen vil være tilgjengelig på http://localhost:3011 med phpMyAdmin på http://localhost:3012 for databaseadministrasjon.

![image](https://github.com/user-attachments/assets/5fca3e9c-6e2d-4045-b9d3-f6ad16107c76)

