-- =====================================================================
-- GAMING TOURNAMENT MANAGEMENT SYSTEM
-- Schema Definition (MySQL 8.0)
-- Matches Project Specification Relational Schema in 3NF
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gaming_tournament_db;
USE gaming_tournament_db;

-- Disable foreign key checks during schema drops/rebuilds
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS ResultCorrections;
DROP TABLE IF EXISTS MatchDisputes;
DROP TABLE IF EXISTS TournamentSponsors;
DROP TABLE IF EXISTS Sponsors;
DROP TABLE IF EXISTS Prizes;
DROP TABLE IF EXISTS Payments;
DROP TABLE IF EXISTS MatchResults;
DROP TABLE IF EXISTS MatchParticipants;
DROP TABLE IF EXISTS Matches;
DROP TABLE IF EXISTS Registrations;
DROP TABLE IF EXISTS TeamMembers;
DROP TABLE IF EXISTS Teams;
DROP TABLE IF EXISTS TournamentRules;
DROP TABLE IF EXISTS Tournaments;
DROP TABLE IF EXISTS Games;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    role ENUM('player', 'admin') NOT NULL DEFAULT 'player',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. GAMES
CREATE TABLE Games (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL UNIQUE,
    genre VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    publisher VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- 3. TOURNAMENTS
CREATE TABLE Tournaments (
    tournament_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    format VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    registration_deadline DATETIME NOT NULL,
    entry_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    max_participants INT NOT NULL DEFAULT 16,
    status ENUM('Upcoming', 'Open', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
    FOREIGN KEY (game_id) REFERENCES Games(game_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_tournament_dates CHECK (end_date >= start_date AND registration_deadline <= start_date),
    CONSTRAINT chk_tournament_fee CHECK (entry_fee >= 0),
    CONSTRAINT chk_tournament_max_participants CHECK (max_participants >= 2)
) ENGINE=InnoDB;

-- 4. TOURNAMENTRULES (1:1 with Tournaments)
CREATE TABLE TournamentRules (
    rule_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL UNIQUE,
    participation_type ENUM('Solo', 'Team') NOT NULL,
    team_size INT NOT NULL DEFAULT 1,
    min_age INT DEFAULT NULL,
    region_restriction VARCHAR(100) DEFAULT NULL,
    rules_text TEXT,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_team_size CHECK (team_size >= 1)
) ENGINE=InnoDB;

-- 5. TEAMS
CREATE TABLE Teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    captain_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (captain_id) REFERENCES Users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. TEAMMEMBERS
CREATE TABLE TeamMembers (
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    member_role VARCHAR(50) NOT NULL DEFAULT 'Member',
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6B. TEAMJOINREQUESTS (Invitations & Join Requests)
CREATE TABLE IF NOT EXISTS TeamJoinRequests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('Invitation', 'Request') NOT NULL,
    member_role VARCHAR(50) NOT NULL DEFAULT 'Starter',
    status ENUM('Pending', 'Accepted', 'Declined', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. REGISTRATIONS
CREATE TABLE Registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    user_id INT NULL,
    team_id INT NULL,
    registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Pending', 'Approved', 'Rejected', 'Cancelled') NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (team_id) REFERENCES Teams(team_id),
    UNIQUE KEY uq_tourn_user (tournament_id, user_id),
    UNIQUE KEY uq_tourn_team (tournament_id, team_id),
    CONSTRAINT chk_one_entrant CHECK ((user_id IS NULL) <> (team_id IS NULL))
) ENGINE=InnoDB;

-- 8. MATCHES
CREATE TABLE Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    round_name VARCHAR(50) NOT NULL,
    match_number INT NOT NULL,
    scheduled_time DATETIME NOT NULL,
    status ENUM('Scheduled', 'Live', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uq_match_round (tournament_id, round_name, match_number)
) ENGINE=InnoDB;

-- 9. MATCHPARTICIPANTS
CREATE TABLE MatchParticipants (
    match_id INT NOT NULL,
    registration_id INT NOT NULL,
    slot_number INT NOT NULL,
    PRIMARY KEY (match_id, registration_id),
    FOREIGN KEY (match_id) REFERENCES Matches(match_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id) ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY uq_match_slot (match_id, slot_number)
) ENGINE=InnoDB;

-- 10. MATCHRESULTS
CREATE TABLE MatchResults (
    match_id INT NOT NULL,
    registration_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    outcome ENUM('Win', 'Loss', 'Draw', 'Forfeit') NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (match_id, registration_id),
    FOREIGN KEY (match_id, registration_id) REFERENCES MatchParticipants(match_id, registration_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_match_score CHECK (score >= 0)
) ENGINE=InnoDB;

-- 11. PAYMENTS
CREATE TABLE Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    registration_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status ENUM('Pending', 'Success', 'Failed', 'Refunded') NOT NULL DEFAULT 'Pending',
    transaction_reference VARCHAR(100) NOT NULL UNIQUE,
    paid_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES Registrations(registration_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_payment_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

-- 12. PRIZES
CREATE TABLE Prizes (
    prize_id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    placement INT NOT NULL,
    prize_amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    awarded_registration_id INT NULL,
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (awarded_registration_id) REFERENCES Registrations(registration_id) ON UPDATE CASCADE ON DELETE SET NULL,
    UNIQUE KEY uq_tournament_placement (tournament_id, placement),
    CONSTRAINT chk_prize_amount CHECK (prize_amount >= 0)
) ENGINE=InnoDB;

-- 13. SPONSORS
CREATE TABLE Sponsors (
    sponsor_id INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_name VARCHAR(100) NOT NULL UNIQUE,
    contact_email VARCHAR(100),
    country VARCHAR(50)
) ENGINE=InnoDB;

-- 14. TOURNAMENTSPONSORS
CREATE TABLE TournamentSponsors (
    tournament_id INT NOT NULL,
    sponsor_id INT NOT NULL,
    contribution_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    sponsored_on DATE NOT NULL,
    PRIMARY KEY (tournament_id, sponsor_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournaments(tournament_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (sponsor_id) REFERENCES Sponsors(sponsor_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_contribution_amount CHECK (contribution_amount >= 0)
) ENGINE=InnoDB;

-- 15. MATCHDISPUTES
CREATE TABLE MatchDisputes (
    dispute_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    registration_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    status ENUM('Open', 'Under Review', 'Resolved', 'Rejected') NOT NULL DEFAULT 'Open',
    raised_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id, registration_id) REFERENCES MatchParticipants(match_id, registration_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. RESULTCORRECTIONS
CREATE TABLE ResultCorrections (
    correction_id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    registration_id INT NOT NULL,
    dispute_id INT NULL,
    old_score INT NOT NULL,
    new_score INT NOT NULL,
    corrected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id, registration_id) REFERENCES MatchResults(match_id, registration_id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (dispute_id) REFERENCES MatchDisputes(dispute_id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_scores_non_negative CHECK (old_score >= 0 AND new_score >= 0)
) ENGINE=InnoDB;
