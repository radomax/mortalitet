-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: May 18, 2025 at 12:03 PM
-- Server version: 8.0.41
-- PHP Version: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mortalitet`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`mortalitetbruker`@`%` PROCEDURE `generate_time_series_statistics` (IN `num_months` INT, IN `cause_filter` VARCHAR(10))   BEGIN
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
END$$

CREATE DEFINER=`mortalitetbruker`@`%` PROCEDURE `purge_old_records` (IN `years_threshold` INT)   BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `contact_requests`
--

CREATE TABLE `contact_requests` (
  `request_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` enum('question','correction','tech','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_resolved` tinyint(1) DEFAULT '0',
  `resolved_by` int DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolution_notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `death_causes`
--

CREATE TABLE `death_causes` (
  `cause_id` int NOT NULL,
  `record_id` int NOT NULL,
  `cause_type` enum('primary','secondary','underlying') COLLATE utf8mb4_unicode_ci NOT NULL,
  `icd_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `death_causes`
--

INSERT INTO `death_causes` (`cause_id`, `record_id`, `cause_type`, `icd_code`, `description`) VALUES
(1, 1, 'primary', 'I21.9', 'Hjerteinfarkt'),
(2, 2, 'primary', 'I21.9', 'Hjerteinfarkt'),
(3, 3, 'primary', 'I21.9', 'Hjerteinfarkt'),
(6, 6, 'primary', 'I21.9', 'Hjerteinfarkt'),
(7, 7, 'primary', 'I21.9', 'Hjerteinfarkt'),
(8, 8, 'primary', 'I21.9', 'hjerne mut');

-- --------------------------------------------------------

--
-- Table structure for table `death_records`
--

CREATE TABLE `death_records` (
  `record_id` int NOT NULL,
  `patient_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_age` int NOT NULL,
  `patient_gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `patient_residence` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `death_date` date NOT NULL,
  `death_context` enum('natural','accident','suicide','homicide','unknown') COLLATE utf8mb4_unicode_ci NOT NULL,
  `autopsy_performed` enum('yes','no') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
  `registered_by` int NOT NULL,
  `registered_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated_by` int DEFAULT NULL,
  `last_updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `additional_info` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `death_records`
--

INSERT INTO `death_records` (`record_id`, `patient_id`, `patient_age`, `patient_gender`, `patient_residence`, `death_date`, `death_context`, `autopsy_performed`, `registered_by`, `registered_at`, `last_updated_by`, `last_updated_at`, `additional_info`) VALUES
(1, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-04-27 16:44:44', NULL, NULL, ''),
(2, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-05-04 00:57:43', NULL, NULL, ''),
(3, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-05-04 00:58:30', NULL, NULL, ''),
(6, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-05-04 01:07:36', NULL, NULL, ''),
(7, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-05-18 12:01:43', NULL, NULL, ''),
(8, 'P12345', 95, 'female', 'Oslo', '2025-01-15', 'natural', 'no', 1, '2025-05-18 12:02:41', NULL, NULL, 'adfasdfasdfasdfd');

-- --------------------------------------------------------

--
-- Table structure for table `icd_codes`
--

CREATE TABLE `icd_codes` (
  `code_id` int NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icd_chapter` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `icd_codes`
--

INSERT INTO `icd_codes` (`code_id`, `code`, `description`, `parent_code`, `icd_chapter`, `is_active`) VALUES
(1, 'A00-B99', 'Visse infeksjonssykdommer og parasittsykdommer', NULL, 'A00-B99', 1),
(2, 'C00-D48', 'Svulster', NULL, 'C00-D48', 1),
(3, 'D50-D89', 'Sykdommer i blod og bloddannende organer og visse tilstander som angår immunsystemet', NULL, 'D50-D89', 1),
(4, 'E00-E90', 'Endokrine sykdommer, ernæringssykdommer og metabolske forstyrrelser', NULL, 'E00-E90', 1),
(5, 'F00-F99', 'Psykiske lidelser og atferdsforstyrrelser', NULL, 'F00-F99', 1),
(6, 'G00-G99', 'Sykdommer i nervesystemet', NULL, 'G00-G99', 1),
(7, 'H00-H59', 'Sykdommer i øyet og øyets omgivelser', NULL, 'H00-H59', 1),
(8, 'H60-H95', 'Sykdommer i øre og ørebensknute', NULL, 'H60-H95', 1),
(9, 'I00-I99', 'Sykdommer i sirkulasjonssystemet', NULL, 'I00-I99', 1),
(10, 'J00-J99', 'Sykdommer i åndedrettssystemet', NULL, 'J00-J99', 1),
(11, 'K00-K93', 'Sykdommer i fordøyelsessystemet', NULL, 'K00-K93', 1),
(12, 'L00-L99', 'Sykdommer i hud og underhud', NULL, 'L00-L99', 1),
(13, 'M00-M99', 'Sykdommer i muskel-skjelettsystemet og bindevev', NULL, 'M00-M99', 1),
(14, 'N00-N99', 'Sykdommer i urin- og kjønnsorganene', NULL, 'N00-N99', 1),
(15, 'O00-O99', 'Svangerskap, fødsel og barseltid', NULL, 'O00-O99', 1),
(16, 'P00-P96', 'Visse tilstander som oppstår i perinatalperioden', NULL, 'P00-P96', 1),
(17, 'Q00-Q99', 'Medfødte misdannelser, deformiteter og kromosomavvik', NULL, 'Q00-Q99', 1),
(18, 'R00-R99', 'Symptomer, tegn og unormale kliniske funn og laboratoriefunn, ikke klassifisert annet sted', NULL, 'R00-R99', 1),
(19, 'S00-T98', 'Skader, forgiftninger og visse andre konsekvenser av ytre årsaker', NULL, 'S00-T98', 1),
(20, 'V01-Y98', 'Ytre årsaker til sykdommer, skader og dødsfall', NULL, 'V01-Y98', 1),
(21, 'Z00-Z99', 'Faktorer som har betydning for helsetilstand og kontakt med helsetjenesten', NULL, 'Z00-Z99', 1),
(22, 'U00-U99', 'Koder for spesielle formål', NULL, 'U00-U99', 1),
(23, 'I21', 'Akutt hjerteinfarkt', NULL, 'I00-I99', 1),
(24, 'I21.0', 'Akutt transmuralt hjerteinfarkt i fremre vegg', 'I21', 'I00-I99', 1),
(25, 'I21.1', 'Akutt transmuralt hjerteinfarkt i nedre vegg', 'I21', 'I00-I99', 1),
(26, 'I21.2', 'Akutt transmuralt hjerteinfarkt med annen lokalisasjon', 'I21', 'I00-I99', 1),
(27, 'I21.3', 'Akutt transmuralt hjerteinfarkt med uspesifisert lokalisasjon', 'I21', 'I00-I99', 1),
(28, 'I21.4', 'Akutt subendokardialt infarkt', 'I21', 'I00-I99', 1),
(29, 'I21.9', 'Uspesifisert akutt hjerteinfarkt', 'I21', 'I00-I99', 1),
(30, 'I25', 'Kronisk iskemisk hjertesykdom', NULL, 'I00-I99', 1),
(31, 'I50', 'Hjertesvikt', NULL, 'I00-I99', 1),
(32, 'I63', 'Hjerneinfarkt', NULL, 'I00-I99', 1),
(33, 'I64', 'Hjerneslag, ikke spesifisert som blødning eller infarkt', NULL, 'I00-I99', 1),
(34, 'C34', 'Ondartet svulst i bronkie og lunge', NULL, 'C00-D48', 1),
(35, 'C34.9', 'Uspesifisert ondartet svulst i bronkie og lunge', 'C34', 'C00-D48', 1),
(36, 'C50', 'Ondartet svulst i bryst', NULL, 'C00-D48', 1),
(37, 'J44', 'Annen kronisk obstruktiv lungesykdom', NULL, 'J00-J99', 1),
(38, 'J44.9', 'Uspesifisert kronisk obstruktiv lungesykdom', 'J44', 'J00-J99', 1),
(39, 'E11', 'Diabetes mellitus type 2', NULL, 'E00-E90', 1),
(40, 'E11.9', 'Diabetes mellitus type 2 uten komplikasjoner', 'E11', 'E00-E90', 1),
(41, 'F10', 'Psykiske lidelser og atferdsforstyrrelser som skyldes bruk av alkohol', NULL, 'F00-F99', 1),
(42, 'F10.2', 'Alkoholavhengighetssyndrom', 'F10', 'F00-F99', 1),
(43, 'G30', 'Alzheimers sykdom', NULL, 'G00-G99', 1),
(44, 'G30.9', 'Uspesifisert Alzheimers sykdom', 'G30', 'G00-G99', 1),
(45, 'X60-X84', 'Villet egenskade', NULL, 'V01-Y98', 1),
(46, 'V01-V99', 'Transportulykker', NULL, 'V01-Y98', 1);

-- --------------------------------------------------------

--
-- Table structure for table `record_revisions`
--

CREATE TABLE `record_revisions` (
  `revision_id` int NOT NULL,
  `record_id` int NOT NULL,
  `revision_type` enum('create','update','delete') COLLATE utf8mb4_unicode_ci NOT NULL,
  `revision_data` json NOT NULL,
  `revised_by` int NOT NULL,
  `revised_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `revision_notes` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `log_id` int NOT NULL,
  `log_type` enum('info','warning','error','security') COLLATE utf8mb4_unicode_ci NOT NULL,
  `log_message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `log_source` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institution` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password`, `role`, `email`, `full_name`, `institution`, `created_at`, `last_login`, `active`) VALUES
(1, 'admin', '$2y$10$u.cT9KWnJOTc2YpEkAF4b.dz41EjdgW3DoKbP5cWwDUaXhMT3yjSm', 'admin', 'admin@mortalitet.no', 'System Administrator', 'Folkehelseinstituttet', '2025-04-27 09:22:24', NULL, 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_recent_deaths`
-- (See below for the actual view)
--
CREATE TABLE `view_recent_deaths` (
`record_id` int
,`patient_id` varchar(50)
,`patient_age` int
,`patient_gender` enum('male','female','other')
,`death_date` date
,`death_context` enum('natural','accident','suicide','homicide','unknown')
,`icd_code` varchar(10)
,`description` text
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `view_top_causes`
-- (See below for the actual view)
--
CREATE TABLE `view_top_causes` (
`icd_code` varchar(10)
,`description` varchar(255)
,`count` bigint
);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `contact_requests`
--
ALTER TABLE `contact_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `resolved_by` (`resolved_by`),
  ADD KEY `submitted_at` (`submitted_at`),
  ADD KEY `is_resolved` (`is_resolved`);

--
-- Indexes for table `death_causes`
--
ALTER TABLE `death_causes`
  ADD PRIMARY KEY (`cause_id`),
  ADD KEY `record_id` (`record_id`),
  ADD KEY `cause_type` (`cause_type`),
  ADD KEY `icd_code` (`icd_code`),
  ADD KEY `idx_icd_code` (`icd_code`),
  ADD KEY `idx_cause_type` (`cause_type`);

--
-- Indexes for table `death_records`
--
ALTER TABLE `death_records`
  ADD PRIMARY KEY (`record_id`),
  ADD KEY `registered_by` (`registered_by`),
  ADD KEY `last_updated_by` (`last_updated_by`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `death_date` (`death_date`),
  ADD KEY `death_context` (`death_context`),
  ADD KEY `idx_death_date` (`death_date`),
  ADD KEY `idx_patient_age` (`patient_age`),
  ADD KEY `idx_patient_gender` (`patient_gender`),
  ADD KEY `idx_patient_residence` (`patient_residence`);

--
-- Indexes for table `icd_codes`
--
ALTER TABLE `icd_codes`
  ADD PRIMARY KEY (`code_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `code_2` (`code`),
  ADD KEY `parent_code` (`parent_code`),
  ADD KEY `icd_chapter` (`icd_chapter`);

--
-- Indexes for table `record_revisions`
--
ALTER TABLE `record_revisions`
  ADD PRIMARY KEY (`revision_id`),
  ADD KEY `revised_by` (`revised_by`),
  ADD KEY `record_id` (`record_id`),
  ADD KEY `revised_at` (`revised_at`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `log_type` (`log_type`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `contact_requests`
--
ALTER TABLE `contact_requests`
  MODIFY `request_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `death_causes`
--
ALTER TABLE `death_causes`
  MODIFY `cause_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `death_records`
--
ALTER TABLE `death_records`
  MODIFY `record_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `icd_codes`
--
ALTER TABLE `icd_codes`
  MODIFY `code_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `record_revisions`
--
ALTER TABLE `record_revisions`
  MODIFY `revision_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

-- --------------------------------------------------------

--
-- Structure for view `view_recent_deaths`
--
DROP TABLE IF EXISTS `view_recent_deaths`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mortalitetbruker`@`%` SQL SECURITY DEFINER VIEW `view_recent_deaths`  AS SELECT `dr`.`record_id` AS `record_id`, `dr`.`patient_id` AS `patient_id`, `dr`.`patient_age` AS `patient_age`, `dr`.`patient_gender` AS `patient_gender`, `dr`.`death_date` AS `death_date`, `dr`.`death_context` AS `death_context`, `dc`.`icd_code` AS `icd_code`, `dc`.`description` AS `description` FROM (`death_records` `dr` join `death_causes` `dc` on(((`dr`.`record_id` = `dc`.`record_id`) and (`dc`.`cause_type` = 'primary')))) WHERE (`dr`.`death_date` >= (curdate() - interval 30 day)) ORDER BY `dr`.`death_date` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `view_top_causes`
--
DROP TABLE IF EXISTS `view_top_causes`;

CREATE ALGORITHM=UNDEFINED DEFINER=`mortalitetbruker`@`%` SQL SECURITY DEFINER VIEW `view_top_causes`  AS SELECT `dc`.`icd_code` AS `icd_code`, `ic`.`description` AS `description`, count(0) AS `count` FROM ((`death_causes` `dc` join `death_records` `dr` on((`dc`.`record_id` = `dr`.`record_id`))) join `icd_codes` `ic` on((`dc`.`icd_code` = `ic`.`code`))) WHERE (`dc`.`cause_type` = 'primary') GROUP BY `dc`.`icd_code`, `ic`.`description` ORDER BY `count` DESC LIMIT 0, 10 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `contact_requests`
--
ALTER TABLE `contact_requests`
  ADD CONSTRAINT `contact_requests_ibfk_1` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `death_causes`
--
ALTER TABLE `death_causes`
  ADD CONSTRAINT `death_causes_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `death_records` (`record_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `death_causes_ibfk_2` FOREIGN KEY (`icd_code`) REFERENCES `icd_codes` (`code`);

--
-- Constraints for table `death_records`
--
ALTER TABLE `death_records`
  ADD CONSTRAINT `death_records_ibfk_1` FOREIGN KEY (`registered_by`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `death_records_ibfk_2` FOREIGN KEY (`last_updated_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `record_revisions`
--
ALTER TABLE `record_revisions`
  ADD CONSTRAINT `record_revisions_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `death_records` (`record_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `record_revisions_ibfk_2` FOREIGN KEY (`revised_by`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
