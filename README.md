# Mortalitet - Docker-oppsett

Dette repoet inneholder Docker-konfigurasjon for å kjøre Mortalitet-applikasjonen med følgende komponenter:

- **Webapplikasjon**: Tilgjengelig på port 3011
- **phpMyAdmin**: Tilgjengelig på port 3012 for administrasjon av databasen
- **MySQL-database**: Kjører internt i Docker-nettverket

## Forutsetninger

Før du starter, må du ha følgende programvare installert:

- Docker (minst versjon 19.03.0)
- Docker Compose (minst versjon 1.27.0)

## Mappestruktur

```
mortalitet/
├── app/                      # Webapplikasjonens filer
│   ├── index.html            # Hovedfilen for webapplikasjonen
│   ├── api/                  # PHP API-endepunkter
│   └── includes/             # PHP-filer for backend-logikk
├── db-data/                  # Databasen lagres her (genereres automatisk)
├── apache-config.conf        # Apache-konfigurasjon
├── database-schema.sql       # Databaseskjema for MySQL
├── docker-compose.yml        # Docker Compose-konfigurasjon
├── Dockerfile.web            # Dockerfile for webserveren
└── README.md                 # Denne filen
```

## Instruksjoner for oppsett

### 1. Klone repoet

```bash
git clone [repo-url] mortalitet
cd mortalitet
```

### 2. Opprett app-mappen og kopier applikasjonsfiler

```bash
mkdir -p app/api app/includes
```

- Kopier `index.html` fil til `app/`-mappen
- Kopier eller opprett nødvendige PHP-filer i `app/api/` og `app/includes/`-mappene

### 3. Start Docker-containerne

```bash
docker-compose up -d
```

Dette vil:

1. Bygge webserver-imaget
2. Opprette en MySQL-database
3. Importere databaseskjemaet
4. Starte phpMyAdmin
5. Koble alle tjenestene sammen i et Docker-nettverk

### 4. Verifiser at alt kjører

- Webapplikasjon: http://localhost:3011
- phpMyAdmin: http://localhost:3012
  - Brukernavn: `mortalitetbruker`
  - Passord: `mortalitetpassord`

## Drift og vedlikehold

### Stoppe containerne

```bash
docker-compose down
```

### Stoppe containerne og slette volumene (dette sletter databasedataene)

```bash
docker-compose down -v
```

### Se logger

```bash
# Alle containere
docker-compose logs

# Bare webserveren
docker-compose logs web

# Følg loggene kontinuerlig
docker-compose logs -f
```

### Bygg containerne på nytt etter endringer

```bash
docker-compose build
docker-compose up -d
```

## Sikkerhetsmerknad

Dette oppsettet er konfigurert for utviklingsmiljø. For produksjonsmiljø, gjør følgende endringer:

1. Endre alle databasepassord i `docker-compose.yml`
2. Bytt ut `ENCRYPTION_KEY` i `app/includes/config.php`
3. Konfigurer SSL/TLS for webserveren
4. Begrens tilgang til phpMyAdmin via brannmur eller fjern den helt
5. Implementer backup-rutiner for databasen

## Database-innlogging

- **Root-bruker**:

  - Brukernavn: `root`
  - Passord: `rotpassord`

- **Applikasjonsbruker**:
  - Brukernavn: `mortalitetbruker`
  - Passord: `mortalitetpassord`

## Feilsøking

### Problem: Kan ikke koble til databasen

- Sjekk at MySQL-containeren kjører: `docker ps`
- Verifiser nettverkskonfigurasjon: `docker network inspect mortalitet_mortalitetnettverk`
- Sjekk databaseloggene: `docker-compose logs db`

### Problem: Webapplikasjonen viser feilmelding

- Sjekk Apache-logger: `docker-compose logs web`
- Verifiser at filene er tilgjengelige i containeren: `docker exec -it mortalitet-web ls -la /var/www/html`
- Sjekk PHP-konfigurasjon: `docker exec -it mortalitet-web php -i`

### Problem: Endringer i koden reflekteres ikke

- Sjekk at volumet er riktig montert: `docker-compose config`
- Restart web-containeren: `docker-compose restart web`
