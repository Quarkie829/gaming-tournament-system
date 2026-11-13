-- =====================================================================
-- GAMING TOURNAMENT MANAGEMENT SYSTEM
-- Seed Data (MySQL 8.0)
-- Covers all users, games, tournaments, rules, teams, and registrations
-- =====================================================================

USE gaming_tournament_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE ResultCorrections;
TRUNCATE TABLE MatchDisputes;
TRUNCATE TABLE TournamentSponsors;
TRUNCATE TABLE Sponsors;
TRUNCATE TABLE Prizes;
TRUNCATE TABLE Payments;
TRUNCATE TABLE MatchResults;
TRUNCATE TABLE MatchParticipants;
TRUNCATE TABLE Matches;
TRUNCATE TABLE Registrations;
TRUNCATE TABLE TeamMembers;
TRUNCATE TABLE Teams;
TRUNCATE TABLE TournamentRules;
TRUNCATE TABLE Tournaments;
TRUNCATE TABLE Games;
TRUNCATE TABLE Users;

SET FOREIGN_KEY_CHECKS = 1;

-- Password for all seed users is 'Password123!'
-- Hashed using bcrypt (cost 10): $2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG

-- 1. USERS
INSERT INTO Users (user_id, username, email, password_hash, country, role, created_at) VALUES
(1, 'admin', 'admin@tournament.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'India', 'admin', NOW()),
(2, 'priyanshu', 'priyanshu@tournament.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'India', 'admin', NOW()),
(3, 'shroud_jr', 'shroud@stream.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Canada', 'player', NOW()),
(4, 'tenz_god', 'tenz@valorant.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Canada', 'player', NOW()),
(5, 's1mple_king', 's1mple@cs2.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Ukraine', 'player', NOW()),
(6, 'b1t_pro', 'b1t@cs2.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Ukraine', 'player', NOW()),
(7, 'faker_legend', 'faker@t1.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'South Korea', 'player', NOW()),
(8, 'keria_star', 'keria@t1.gg', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'South Korea', 'player', NOW()),
(9, 'soloplayer1', 'solo1@gamer.com', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'India', 'player', NOW()),
(10, 'soloplayer2', 'solo2@gamer.com', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'USA', 'player', NOW()),
(11, 'soloplayer3', 'solo3@gamer.com', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Germany', 'player', NOW()),
(12, 'soloplayer4', 'solo4@gamer.com', '$2a$10$n9O7KlM.FU7QvvzeGL/EF.eSJAd1Q.M1QV9MwQzAO7F5s2EIeO/vG', 'Japan', 'player', NOW());

-- 2. GAMES
INSERT INTO Games (game_id, game_name, genre, platform, publisher) VALUES
(1, 'Valorant', 'Tactical FPS', 'PC', 'Riot Games'),
(2, 'Counter-Strike 2', 'FPS', 'PC', 'Valve Corporation'),
(3, 'League of Legends', 'MOBA', 'PC', 'Riot Games'),
(4, 'Tekken 8', 'Fighting', 'PC, PS5, Xbox Series X', 'Bandai Namco'),
(5, 'Rocket League', 'Sports / Vehicular', 'PC, Console', 'Psyonix / Epic Games'),
(6, 'Apex Legends', 'Battle Royale', 'PC, Console', 'Electronic Arts');

-- 3. TOURNAMENTS
-- Note: Dates are future relative to current context or current timeline
INSERT INTO Tournaments (tournament_id, game_id, title, format, start_date, end_date, registration_deadline, entry_fee, max_participants, status) VALUES
(1, 1, 'Valorant Champions Invitational 2026', 'Double Elimination', '2026-11-15 10:00:00', '2026-11-20 22:00:00', '2026-11-14 23:59:59', 50.00, 8, 'Open'),
(2, 2, 'CS2 Global Showdown 2026', 'Single Elimination', '2026-11-25 12:00:00', '2026-11-30 20:00:00', '2026-11-24 23:59:59', 100.00, 16, 'Open'),
(3, 3, 'League of Legends Rift Masters', 'Round Robin', '2026-12-05 14:00:00', '2026-12-10 22:00:00', '2026-12-04 23:59:59', 0.00, 10, 'Upcoming'),
(4, 4, 'Tekken 8 King of the Iron Fist Cup', 'Double Elimination', '2026-11-10 11:00:00', '2026-11-12 19:00:00', '2026-11-09 23:59:59', 20.00, 32, 'Open'),
(5, 5, 'Rocket League 1v1 Aerial Clash', 'Single Elimination', '2026-11-18 16:00:00', '2026-11-19 22:00:00', '2026-11-17 23:59:59', 15.00, 16, 'Open'),
(6, 6, 'Apex Legends Autumn Solo Blitz', 'Battle Royale Points', '2026-10-01 10:00:00', '2026-10-05 20:00:00', '2026-09-30 23:59:59', 10.00, 20, 'Open');

-- 4. TOURNAMENTRULES
INSERT INTO TournamentRules (rule_id, tournament_id, participation_type, team_size, min_age, region_restriction, rules_text) VALUES
(1, 1, 'Team', 5, 16, 'Global', 'Standard competitive 5v5 rulebook. Best of 3 matches, final Best of 5. Vanguard anti-cheat required.'),
(2, 2, 'Team', 5, 16, 'Global', 'Standard MR12 competitive CS2 rules. Valve Anti-Cheat enforced. Server location: Frankfurt & Mumbai.'),
(3, 3, 'Team', 5, 16, 'Asia-Pacific', 'Summoners Rift 5v5 Tournament Draft. No substitute switching mid-match without referee approval.'),
(4, 4, 'Solo', 1, 13, 'Global', '1v1 Double Elimination. 60-second rounds, first to 3 rounds wins a game. First to 3 games wins match.'),
(5, 5, 'Solo', 1, 13, 'Global', '1v1 Soccar default settings. 5-minute matches with golden goal overtime.'),
(6, 6, 'Solo', 1, 16, 'Global', 'Solo drop points format based on kills and survival placement.');

-- 5. TEAMS
INSERT INTO Teams (team_id, team_name, captain_id, created_at) VALUES
(1, 'Sentinels Elite', 3, NOW()),
(2, 'NAVI Reborn', 5, NOW()),
(3, 'T1 Prodigies', 7, NOW()),
(4, 'Cloud9 Thunder', 9, NOW());

-- 6. TEAMMEMBERS
INSERT INTO TeamMembers (team_id, user_id, member_role, joined_at) VALUES
(1, 3, 'Captain', NOW()),
(1, 4, 'Starter', NOW()),
(1, 10, 'Starter', NOW()),
(2, 5, 'Captain', NOW()),
(2, 6, 'Starter', NOW()),
(2, 11, 'Starter', NOW()),
(3, 7, 'Captain', NOW()),
(3, 8, 'Starter', NOW()),
(3, 12, 'Starter', NOW()),
(4, 9, 'Captain', NOW()),
(4, 10, 'Substitute', NOW());

-- 7. REGISTRATIONS
-- Tournament 1 (Valorant - Team):
INSERT INTO Registrations (registration_id, tournament_id, user_id, team_id, registration_date, status) VALUES
(1, 1, NULL, 1, '2026-10-20 12:00:00', 'Approved'),
(2, 1, NULL, 2, '2026-10-21 14:00:00', 'Approved'),
(3, 1, NULL, 3, '2026-10-22 15:30:00', 'Pending'),
(4, 1, NULL, 4, '2026-10-23 09:15:00', 'Pending');

-- Tournament 4 (Tekken 8 - Solo):
INSERT INTO Registrations (registration_id, tournament_id, user_id, team_id, registration_date, status) VALUES
(5, 4, 3, NULL, '2026-10-22 10:00:00', 'Approved'),
(6, 4, 9, NULL, '2026-10-22 11:30:00', 'Approved'),
(7, 4, 10, NULL, '2026-10-23 16:45:00', 'Pending'),
(8, 4, 11, NULL, '2026-10-24 18:20:00', 'Pending');

-- Tournament 5 (Rocket League - Solo):
INSERT INTO Registrations (registration_id, tournament_id, user_id, team_id, registration_date, status) VALUES
(9, 5, 7, NULL, '2026-10-23 11:00:00', 'Approved'),
(10, 5, 12, NULL, '2026-10-24 12:30:00', 'Approved');

-- Tournament 6 (Completed Tournament):
INSERT INTO Registrations (registration_id, tournament_id, user_id, team_id, registration_date, status) VALUES
(11, 6, 9, NULL, '2026-09-25 10:00:00', 'Approved'),
(12, 6, 10, NULL, '2026-09-26 11:00:00', 'Approved');

-- 8. MATCHES (For Tournament 1)
INSERT INTO Matches (match_id, tournament_id, round_name, match_number, scheduled_time, status) VALUES
(1, 1, 'Quarterfinals', 1, '2026-11-15 11:00:00', 'Scheduled'),
(2, 1, 'Quarterfinals', 2, '2026-11-15 14:00:00', 'Scheduled');

-- 9. MATCHPARTICIPANTS
INSERT INTO MatchParticipants (match_id, registration_id, slot_number) VALUES
(1, 1, 1),
(1, 2, 2);

-- 10. MATCHRESULTS (Sample completed match for testing standings query)
INSERT INTO MatchResults (match_id, registration_id, score, outcome, recorded_at) VALUES
(1, 1, 2, 'Win', '2026-11-15 13:00:00'),
(1, 2, 1, 'Loss', '2026-11-15 13:00:00');

-- 11. PAYMENTS
INSERT INTO Payments (payment_id, registration_id, amount, payment_method, payment_status, transaction_reference, paid_at) VALUES
(1, 1, 50.00, 'Credit Card', 'Success', 'TXN_VAL_001_SENTINELS', '2026-10-20 12:05:00'),
(2, 2, 50.00, 'PayPal', 'Success', 'TXN_VAL_002_NAVI', '2026-10-21 14:05:00'),
(3, 3, 50.00, 'UPI', 'Pending', 'TXN_VAL_003_T1', '2026-10-22 15:35:00');

-- 12. PRIZES
INSERT INTO Prizes (prize_id, tournament_id, placement, prize_amount, description, awarded_registration_id) VALUES
(1, 1, 1, 5000.00, 'Grand Champion Trophy & Cash', NULL),
(2, 1, 2, 2500.00, 'Runner-up Silver Medal & Cash', NULL),
(3, 1, 3, 1000.00, 'Third Place Bronze Medal & Cash', NULL),
(4, 4, 1, 1500.00, 'Tekken King Title & Cash', NULL),
(5, 4, 2, 750.00, 'Runner Up Cash Prize', NULL);

-- 13. SPONSORS
INSERT INTO Sponsors (sponsor_id, sponsor_name, contact_email, country) VALUES
(1, 'Razer Gaming Gear', 'partnerships@razer.com', 'USA'),
(2, 'Red Bull Esports', 'esports@redbull.com', 'Austria'),
(3, 'HyperX Peripherals', 'events@hyperx.com', 'USA');

-- 14. TOURNAMENTSPONSORS
INSERT INTO TournamentSponsors (tournament_id, sponsor_id, contribution_amount, sponsored_on) VALUES
(1, 1, 10000.00, '2026-10-01'),
(1, 2, 15000.00, '2026-10-05'),
(2, 3, 8000.00, '2026-10-10');

-- 15. MATCHDISPUTES
INSERT INTO MatchDisputes (dispute_id, match_id, registration_id, reason, status, raised_at) VALUES
(1, 1, 2, 'Score discrepancy on Map 2 overtime round count', 'Resolved', '2026-11-15 13:15:00');

-- 16. RESULTCORRECTIONS
INSERT INTO ResultCorrections (correction_id, match_id, registration_id, dispute_id, old_score, new_score, corrected_at) VALUES
(1, 1, 2, 1, 0, 1, '2026-11-15 13:45:00');

-- Conclude historical tournaments and award prize
UPDATE Tournaments SET status = 'Completed' WHERE tournament_id = 6;
UPDATE Prizes SET awarded_registration_id = 1 WHERE prize_id = 1;


