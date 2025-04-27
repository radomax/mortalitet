-- Opprett standard administrator-bruker-- MySQL Database Schema for Mortalitet (Dødsårsaksregistrering)
-- Denne SQL-filen oppretter nødvendige tabeller for dødsårsaksregistrering

-- Opprett database (Kjør dette først)
CREATE DATABASE IF NOT EXISTS mortalitet CHARACTER SET utf8mb4 COLLATE utf8mb4_norwegian_ci;
USE mortalitet;

-- Brukertabell for autentisering og autorisasjon
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Lagrer passordhash, ikke klartekst
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    email VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    institution VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Referansetabell for ICD-koder
CREATE TABLE icd_codes (
    code_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    parent_code VARCHAR(10) NULL, -- For hierarkisk struktur
    icd_chapter VARCHAR(10) NULL, -- Kapittelkode (f.eks. I00-I99)
    is_active BOOLEAN DEFAULT TRUE,
    INDEX (code),
    INDEX (parent_code),
    INDEX (icd_chapter)
);

-- Hovedtabell for dødsregistreringer
CREATE TABLE death_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(50) NOT NULL,
    patient_age INT NOT NULL,
    patient_gender ENUM('male', 'female', 'other') NOT NULL,
    patient_residence VARCHAR(100) NOT NULL,
    death_date DATE NOT NULL,
    death_context ENUM('natural', 'accident', 'suicide', 'homicide', 'unknown') NOT NULL,
    autopsy_performed ENUM('yes', 'no') NOT NULL DEFAULT 'no',
    registered_by INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_by INT NULL,
    last_updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    additional_info TEXT NULL,
    FOREIGN KEY (registered_by) REFERENCES users(user_id),
    FOREIGN KEY (last_updated_by) REFERENCES users(user_id),
    INDEX (patient_id),
    INDEX (death_date),
    INDEX (death_context)
);

-- Tabell for registrering av dødsårsaker (én registrering kan ha flere dødsårsaker)
CREATE TABLE death_causes (
    cause_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    cause_type ENUM('primary', 'secondary', 'underlying') NOT NULL,
    icd_code VARCHAR(10) NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (record_id) REFERENCES death_records(record_id) ON DELETE CASCADE,
    FOREIGN KEY (icd_code) REFERENCES icd_codes(code),
    INDEX (record_id),
    INDEX (cause_type),
    INDEX (icd_code)
);

-- Tabell for revisjonerhistorikk
CREATE TABLE record_revisions (
    revision_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    revision_type ENUM('create', 'update', 'delete') NOT NULL,
    revision_data JSON NOT NULL, -- Lagrer en JSON-representasjon av registreringen på revisjonstidspunktet
    revised_by INT NOT NULL,
    revised_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revision_notes TEXT NULL,
    FOREIGN KEY (record_id) REFERENCES death_records(record_id) ON DELETE CASCADE,
    FOREIGN KEY (revised_by) REFERENCES users(user_id),
    INDEX (record_id),
    INDEX (revised_at)
);

-- Tabell for kontaktforespørsler
CREATE TABLE contact_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject ENUM('question', 'correction', 'tech', 'other') NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(user_id),
    INDEX (submitted_at),
    INDEX (is_resolved)
);

-- Tabell for systemlogg
CREATE TABLE system_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    log_type ENUM('info', 'warning', 'error', 'security') NOT NULL,
    log_message TEXT NOT NULL,
    log_source VARCHAR(50) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    INDEX (log_type),
    INDEX (created_at)
);

-- Procedyre for å slette gamle registreringer (for eksempel eldre enn 25 år)
DELIMITER //
CREATE PROCEDURE purge_old_records(IN years_threshold INT)
BEGIN
    DECLARE cutoff_date DATE;
    SET cutoff_date = DATE_SUB(CURRENT_DATE(), INTERVAL years_threshold YEAR);
    
    START TRANSACTION;
    
    -- Logg hvilke registreringer som blir slettet
    INSERT INTO system_logs (log_type, log_message, log_source)
    SELECT 'info', 
           CONCAT('Purged old record: ', record_id, ' (', patient_id, ')'), 
           'purge_procedure'
    FROM death_records
    WHERE death_date < cutoff_date;
    
    -- Slett registreringene (cascade vil slette relaterte oppføringer i death_causes)
    DELETE FROM death_records WHERE death_date < cutoff_date;
    
    COMMIT;
END //
DELIMITER ;

-- Procedyre for månedlig tidsserie-statistikk
DELIMITER //
CREATE PROCEDURE generate_time_series_statistics(
    IN num_months INT,
    IN cause_filter VARCHAR(10) -- Kan være NULL for alle dødsårsaker
)
BEGIN
    DECLARE start_date DATE;
    SET start_date = DATE_SUB(CURRENT_DATE(), INTERVAL num_months MONTH);
    
    -- Generer tidsserie-data (antall per måned)
    SELECT 
        DATE_FORMAT(death_date, '%Y-%m') AS month,
        DATE_FORMAT(death_date, '%b %Y') AS month_name,
        COUNT(*) AS count
    FROM death_records dr
    WHERE 
        death_date >= start_date
        AND (
            cause_filter IS NULL
            OR EXISTS (
                SELECT 1 FROM death_causes dc 
                WHERE dc.record_id = dr.record_id 
                AND dc.icd_code LIKE CONCAT(cause_filter, '%')
            )
        )
    GROUP BY month, month_name
    ORDER BY month;
END //
DELIMITER ;

-- Opprett standard administrator-bruker (passord bør endres etter installasjon)
INSERT INTO users (username, password, role, email, full_name, institution)
VALUES (
    'admin', 
    '$2y$10$u.cT9KWnJOTc2YpEkAF4b.dz41EjdgW3DoKbP5cWwDUaXhMT3yjSm', -- Passordhash for 'admin123'
    'admin',
    'admin@mortalitet.no',
    'System Administrator',
    'Folkehelseinstituttet'
);

-- Fyll inn noen standard ICD-koder (kapitler)
INSERT INTO icd_codes (code, description, parent_code, icd_chapter, is_active) VALUES
('A00-B99', 'Visse infeksjonssykdommer og parasittsykdommer', NULL, 'A00-B99', TRUE),
('C00-D48', 'Svulster', NULL, 'C00-D48', TRUE),
('D50-D89', 'Sykdommer i blod og bloddannende organer og visse tilstander som angår immunsystemet', NULL, 'D50-D89', TRUE),
('E00-E90', 'Endokrine sykdommer, ernæringssykdommer og metabolske forstyrrelser', NULL, 'E00-E90', TRUE),
('F00-F99', 'Psykiske lidelser og atferdsforstyrrelser', NULL, 'F00-F99', TRUE),
('G00-G99', 'Sykdommer i nervesystemet', NULL, 'G00-G99', TRUE),
('H00-H59', 'Sykdommer i øyet og øyets omgivelser', NULL, 'H00-H59', TRUE),
('H60-H95', 'Sykdommer i øre og ørebensknute', NULL, 'H60-H95', TRUE),
('I00-I99', 'Sykdommer i sirkulasjonssystemet', NULL, 'I00-I99', TRUE),
('J00-J99', 'Sykdommer i åndedrettssystemet', NULL, 'J00-J99', TRUE),
('K00-K93', 'Sykdommer i fordøyelsessystemet', NULL, 'K00-K93', TRUE),
('L00-L99', 'Sykdommer i hud og underhud', NULL, 'L00-L99', TRUE),
('M00-M99', 'Sykdommer i muskel-skjelettsystemet og bindevev', NULL, 'M00-M99', TRUE),
('N00-N99', 'Sykdommer i urin- og kjønnsorganene', NULL, 'N00-N99', TRUE),
('O00-O99', 'Svangerskap, fødsel og barseltid', NULL, 'O00-O99', TRUE),
('P00-P96', 'Visse tilstander som oppstår i perinatalperioden', NULL, 'P00-P96', TRUE),
('Q00-Q99', 'Medfødte misdannelser, deformiteter og kromosomavvik', NULL, 'Q00-Q99', TRUE),
('R00-R99', 'Symptomer, tegn og unormale kliniske funn og laboratoriefunn, ikke klassifisert annet sted', NULL, 'R00-R99', TRUE),
('S00-T98', 'Skader, forgiftninger og visse andre konsekvenser av ytre årsaker', NULL, 'S00-T98', TRUE),
('V01-Y98', 'Ytre årsaker til sykdommer, skader og dødsfall', NULL, 'V01-Y98', TRUE),
('Z00-Z99', 'Faktorer som har betydning for helsetilstand og kontakt med helsetjenesten', NULL, 'Z00-Z99', TRUE),
('U00-U99', 'Koder for spesielle formål', NULL, 'U00-U99', TRUE);

-- Legg til noen vanlige dødsårsaker
INSERT INTO icd_codes (code, description, parent_code, icd_chapter, is_active) VALUES
('I21', 'Akutt hjerteinfarkt', NULL, 'I00-I99', TRUE),
('I21.0', 'Akutt transmuralt hjerteinfarkt i fremre vegg', 'I21', 'I00-I99', TRUE),
('I21.1', 'Akutt transmuralt hjerteinfarkt i nedre vegg', 'I21', 'I00-I99', TRUE),
('I21.2', 'Akutt transmuralt hjerteinfarkt med annen lokalisasjon', 'I21', 'I00-I99', TRUE),
('I21.3', 'Akutt transmuralt hjerteinfarkt med uspesifisert lokalisasjon', 'I21', 'I00-I99', TRUE),
('I21.4', 'Akutt subendokardialt infarkt', 'I21', 'I00-I99', TRUE),
('I21.9', 'Uspesifisert akutt hjerteinfarkt', 'I21', 'I00-I99', TRUE),
('I25', 'Kronisk iskemisk hjertesykdom', NULL, 'I00-I99', TRUE),
('I50', 'Hjertesvikt', NULL, 'I00-I99', TRUE),
('I63', 'Hjerneinfarkt', NULL, 'I00-I99', TRUE),
('I64', 'Hjerneslag, ikke spesifisert som blødning eller infarkt', NULL, 'I00-I99', TRUE),
('C34', 'Ondartet svulst i bronkie og lunge', NULL, 'C00-D48', TRUE),
('C34.9', 'Uspesifisert ondartet svulst i bronkie og lunge', 'C34', 'C00-D48', TRUE),
('C50', 'Ondartet svulst i bryst', NULL, 'C00-D48', TRUE),
('J44', 'Annen kronisk obstruktiv lungesykdom', NULL, 'J00-J99', TRUE),
('J44.9', 'Uspesifisert kronisk obstruktiv lungesykdom', 'J44', 'J00-J99', TRUE),
('E11', 'Diabetes mellitus type 2', NULL, 'E00-E90', TRUE),
('E11.9', 'Diabetes mellitus type 2 uten komplikasjoner', 'E11', 'E00-E90', TRUE),
('F10', 'Psykiske lidelser og atferdsforstyrrelser som skyldes bruk av alkohol', NULL, 'F00-F99', TRUE),
('F10.2', 'Alkoholavhengighetssyndrom', 'F10', 'F00-F99', TRUE),
('G30', 'Alzheimers sykdom', NULL, 'G00-G99', TRUE),
('G30.9', 'Uspesifisert Alzheimers sykdom', 'G30', 'G00-G99', TRUE),
('X60-X84', 'Villet egenskade', NULL, 'V01-Y98', TRUE),
('V01-V99', 'Transportulykker', NULL, 'V01-Y98', TRUE);

-- Indekser for ytelse
CREATE INDEX idx_death_date ON death_records(death_date);
CREATE INDEX idx_icd_code ON death_causes(icd_code);
CREATE INDEX idx_cause_type ON death_causes(cause_type);
CREATE INDEX idx_patient_age ON death_records(patient_age);
CREATE INDEX idx_patient_gender ON death_records(patient_gender);
CREATE INDEX idx_patient_residence ON death_records(patient_residence);

-- Sett opp vyer for vanlige spørringer
CREATE VIEW view_recent_deaths AS
SELECT dr.record_id, dr.patient_id, dr.patient_age, dr.patient_gender, dr.death_date, 
       dr.death_context, dc.icd_code, dc.description
FROM death_records dr
JOIN death_causes dc ON dr.record_id = dc.record_id AND dc.cause_type = 'primary'
WHERE dr.death_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY dr.death_date DESC;

CREATE VIEW view_top_causes AS
SELECT dc.icd_code, ic.description, COUNT(*) as count
FROM death_causes dc
JOIN death_records dr ON dc.record_id = dr.record_id
JOIN icd_codes ic ON dc.icd_code = ic.code
WHERE dc.cause_type = 'primary'
GROUP BY dc.icd_code, ic.description
ORDER BY count DESC
LIMIT 10;

-- Trigger for å logge endringer
DELIMITER //
CREATE TRIGGER log_death_record_changes
AFTER UPDATE ON death_records
FOR EACH ROW
BEGIN
    INSERT INTO system_logs (log_type, log_message, log_source, user_id)
    VALUES ('info', 
            CONCAT('Record ID ', NEW.record_id, ' updated by user ID ', NEW.last_updated_by),
            'database_trigger',
            NEW.last_updated_by);
    
    -- Lagre revisjon
    INSERT INTO record_revisions (record_id, revision_type, revision_data, revised_by)
    VALUES (NEW.record_id, 
            'update', 
            JSON_OBJECT(
                'patient_id', NEW.patient_id, 
                'patient_age', NEW.patient_age, 
                'patient_gender', NEW.patient_gender, 
                'death_date', NEW.death_date,
                'death_context', NEW.death_context
            ),
            NEW.last_updated_by);
END //
DELIMITER ;

-- Trigger for å validere ICD-koder ved innsetting
DELIMITER //
CREATE TRIGGER validate_icd_code
BEFORE INSERT ON death_causes
FOR EACH ROW
BEGIN
    DECLARE valid_code INT;
    
    -- Sjekk om koden eksisterer i icd_codes tabellen
    SELECT COUNT(*) INTO valid_code FROM icd_codes WHERE code = NEW.icd_code AND is_active = TRUE;
    
    -- Hvis koden ikke eksisterer, gi feilmelding
    IF valid_code = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ugyldig ICD-kode';
    END IF;
END //
DELIMITER ;

-- Kommentarer om sikkerhet og GDPR-hensyn
/*
SIKKERHETSMERKNAD:
1. Denne databasen inneholder sensitiv helseinformasjon og må behandles i samsvar med GDPR og norsk helselovgivning
2. Implementer følgende sikkerhetstiltak:
   - Kryptering av data i hvile
   - TLS/SSL for all datatransport
   - Brannmur og adgangskontroll til databaseserveren
   - Jevnlig sikkerhetskopiering
   - Logging av all tilgang til databasen
3. Passordet til admin-brukeren må endres umiddelbart etter installasjon
4. Alle brukere bør ha 2-faktor autentisering
5. Regelmessig gjennomgang av brukerrettigheter

GDPR-HENSYN:
1. Registrer kun nødvendige personopplysninger i henhold til formålet
2. Implementer rutiner for sletting av data i henhold til oppbevaringsregler
3. Dokumenter databehandlingen i en databehandleravtale
4. Ha prosedyrer for å håndtere innsynsforespørsler
5. Utfør risiko- og sårbarhetsanalyse før produksjonssetting
*/

-- Procedyre for å eksportere/rapportere data basert på kriterier
DELIMITER //
CREATE PROCEDURE export_data(
    IN from_date DATE,
    IN to_date DATE,
    IN icd_category VARCHAR(10),
    IN include_demographics BOOLEAN,
    IN include_primary BOOLEAN,
    IN include_secondary BOOLEAN,
    IN include_underlying BOOLEAN,
    IN include_additional BOOLEAN
)
BEGIN
    -- Valider datoer
    IF to_date IS NULL THEN
        SET to_date = CURRENT_DATE();
    END IF;
    
    -- Bygg dynamisk SQL basert på inklusjonsparametere
    SET @sql = 'SELECT dr.record_id, dr.death_date';
    
    IF include_demographics THEN
        SET @sql = CONCAT(@sql, ', dr.patient_age, dr.patient_gender, dr.patient_residence');
    END IF;
    
    -- Primær dødsårsak er alltid inkludert
    SET @sql = CONCAT(@sql, ', 
        (SELECT dc.icd_code FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "primary" LIMIT 1) AS primary_cause_code,
        (SELECT dc.description FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "primary" LIMIT 1) AS primary_cause_desc');
    
    IF include_secondary THEN
        SET @sql = CONCAT(@sql, ',
            (SELECT GROUP_CONCAT(dc.icd_code SEPARATOR ", ") FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "secondary") AS secondary_cause_codes,
            (SELECT GROUP_CONCAT(dc.description SEPARATOR "; ") FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "secondary") AS secondary_cause_desc');
    END IF;
    
    IF include_underlying THEN
        SET @sql = CONCAT(@sql, ',
            (SELECT GROUP_CONCAT(dc.icd_code SEPARATOR ", ") FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "underlying") AS underlying_cause_codes,
            (SELECT GROUP_CONCAT(dc.description SEPARATOR "; ") FROM death_causes dc WHERE dc.record_id = dr.record_id AND dc.cause_type = "underlying") AS underlying_cause_desc');
    END IF;
    
    IF include_additional THEN
        SET @sql = CONCAT(@sql, ', dr.death_context, dr.autopsy_performed, dr.additional_info');
    END IF;
    
    -- Fra- og JOIN-klausuler
    SET @sql = CONCAT(@sql, ' FROM death_records dr WHERE dr.death_date BETWEEN ? AND ?');
    
    -- Filtrering på ICD-kategori
    IF icd_category IS NOT NULL AND icd_category != '' THEN
        SET @sql = CONCAT(@sql, ' AND EXISTS (
            SELECT 1 FROM death_causes dc 
            WHERE dc.record_id = dr.record_id 
            AND dc.icd_code LIKE CONCAT(?, "%")
        )');
    END IF;
    
    -- Sortering
    SET @sql = CONCAT(@sql, ' ORDER BY dr.death_date DESC');
    
    -- Forbered og kjør spørring
    PREPARE stmt FROM @sql;
    
    IF icd_category IS NOT NULL AND icd_category != '' THEN
        SET @p1 = from_date;
        SET @p2 = to_date;
        SET @p3 = icd_category;
        EXECUTE stmt USING @p1, @p2, @p3;
    ELSE
        SET @p1 = from_date;
        SET @p2 = to_date;
        EXECUTE stmt USING @p1, @p2;
    END IF;
    
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Procedyre for å generere statistikk for visualisering
DELIMITER //
CREATE PROCEDURE generate_death_statistics(
    IN from_date DATE,
    IN to_date DATE,
    IN grouping_type VARCHAR(20) -- 'icd_chapter', 'cause_type', 'age', 'gender'
)
BEGIN
    -- Valider datoer
    IF to_date IS NULL THEN
        SET to_date = CURRENT_DATE();
    END IF;
    
    -- Statistikk etter ICD-kapittel
    IF grouping_type = 'icd_chapter' THEN
        SELECT 
            ic.icd_chapter AS category_code,
            (SELECT description FROM icd_codes WHERE code = ic.icd_chapter LIMIT 1) AS category_name,
            COUNT(DISTINCT dr.record_id) AS count
        FROM death_records dr
        JOIN death_causes dc ON dr.record_id = dc.record_id AND dc.cause_type = 'primary'
        JOIN icd_codes ic ON dc.icd_code = ic.code
        WHERE dr.death_date BETWEEN from_date AND to_date
        GROUP BY ic.icd_chapter
        ORDER BY count DESC;
    
    -- Statistikk etter årsakstype (naturlig, ulykke, etc.)
    ELSEIF grouping_type = 'cause_type' THEN
        SELECT 
            death_context AS category_code,
            CASE 
                WHEN death_context = 'natural' THEN 'Naturlig død'
                WHEN death_context = 'accident' THEN 'Ulykke'
                WHEN death_context = 'suicide' THEN 'Selvmord'
                WHEN death_context = 'homicide' THEN 'Drap'
                ELSE 'Ukjent'
            END AS category_name,
            COUNT(*) AS count
        FROM death_records
        WHERE death_date BETWEEN from_date AND to_date
        GROUP BY death_context
        ORDER BY count DESC;
    
    -- Statistikk etter aldersgruppe
    ELSEIF grouping_type = 'age' THEN
        SELECT 
            CASE 
                WHEN patient_age < 10 THEN '0-9'
                WHEN patient_age < 20 THEN '10-19'
                WHEN patient_age < 30 THEN '20-29'
                WHEN patient_age < 40 THEN '30-39'
                WHEN patient_age < 50 THEN '40-49'
                WHEN patient_age < 60 THEN '50-59'
                WHEN patient_age < 70 THEN '60-69'
                WHEN patient_age < 80 THEN '70-79'
                WHEN patient_age < 90 THEN '80-89'
                ELSE '90+'
            END AS category_code,
            CASE 
                WHEN patient_age < 10 THEN '0-9 år'
                WHEN patient_age < 20 THEN '10-19 år'
                WHEN patient_age < 30 THEN '20-29 år'
                WHEN patient_age < 40 THEN '30-39 år'
                WHEN patient_age < 50 THEN '40-49 år'
                WHEN patient_age < 60 THEN '50-59 år'
                WHEN patient_age < 70 THEN '60-69 år'
                WHEN patient_age < 80 THEN '70-79 år'
                WHEN patient_age < 90 THEN '80-89 år'
                ELSE '90+ år'
            END AS category_name,
            COUNT(*) AS count
        FROM death_records
        WHERE death_date BETWEEN from_date AND to_date
        GROUP BY category_code
        ORDER BY 
            CASE category_code
                WHEN '0-9' THEN 1
                WHEN '10-19' THEN 2
                WHEN '20-29' THEN 3
                WHEN '30-39' THEN 4
                WHEN '40-49' THEN 5
                WHEN '50-59' THEN 6
                WHEN '60-69' THEN 7
                WHEN '70-79' THEN 8
                WHEN '80-89' THEN 9
                ELSE 10
            END;
    
    -- Statistikk etter kjønn
    ELSEIF grouping_type = 'gender' THEN
        SELECT 
            patient_gender AS category_code,
            CASE 
                WHEN patient_gender = 'male' THEN 'Menn'
                WHEN patient_gender = 'female' THEN 'Kvinner'
                ELSE 'Annet'
            END AS category_name,
            COUNT(*) AS count
        FROM death_records
        WHERE death_date BETWEEN from_date AND to_date
        GROUP BY patient_gender
        ORDER BY count DESC;
    
    -- Ukjent grupperingstype
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ukjent grupperingstype';
    END IF;