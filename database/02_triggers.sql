-- =====================================================================
-- GAMING TOURNAMENT MANAGEMENT SYSTEM
-- Triggers Definition (MySQL 8.0)
-- Enforces cross-table integrity rules per project specification
-- =====================================================================

USE gaming_tournament_db;

DELIMITER $$

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS trg_before_insert_registration$$
DROP TRIGGER IF EXISTS trg_before_update_registration$$
DROP TRIGGER IF EXISTS trg_before_insert_match_participant$$
DROP TRIGGER IF EXISTS trg_before_insert_prize$$
DROP TRIGGER IF EXISTS trg_before_update_prize$$

-- TRIGGER 1: Check registration deadline, status, participation type, and max participants
CREATE TRIGGER trg_before_insert_registration
BEFORE INSERT ON Registrations
FOR EACH ROW
BEGIN
    DECLARE v_status ENUM('Upcoming', 'Open', 'Ongoing', 'Completed', 'Cancelled');
    DECLARE v_deadline DATETIME;
    DECLARE v_max_participants INT;
    DECLARE v_participation_type ENUM('Solo', 'Team');
    DECLARE v_current_count INT;

    -- Fetch tournament details
    SELECT status, registration_deadline, max_participants
    INTO v_status, v_deadline, v_max_participants
    FROM Tournaments
    WHERE tournament_id = NEW.tournament_id;

    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Tournament does not exist.';
    END IF;

    -- Enforce tournament open status
    IF v_status NOT IN ('Upcoming', 'Open') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Registration is closed: Tournament is not accepting new registrations.';
    END IF;

    -- Enforce registration deadline
    IF NEW.registration_date > v_deadline THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Registration deadline has already passed for this tournament.';
    END IF;

    -- Fetch tournament rules for participation type
    SELECT participation_type
    INTO v_participation_type
    FROM TournamentRules
    WHERE tournament_id = NEW.tournament_id;

    -- Check participation type alignment
    IF v_participation_type = 'Solo' AND NEW.user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid entrant: This tournament requires a Solo (User) registration.';
    END IF;

    IF v_participation_type = 'Team' AND NEW.team_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid entrant: This tournament requires a Team registration.';
    END IF;

    -- Check participant capacity
    SELECT COUNT(*)
    INTO v_current_count
    FROM Registrations
    WHERE tournament_id = NEW.tournament_id
      AND status IN ('Approved', 'Pending');

    IF v_current_count >= v_max_participants THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Registration limit reached: Tournament capacity is full.';
    END IF;
END$$

-- TRIGGER 2: Prevent modifying registration entrant to violate tournament rules
CREATE TRIGGER trg_before_update_registration
BEFORE UPDATE ON Registrations
FOR EACH ROW
BEGIN
    DECLARE v_participation_type ENUM('Solo', 'Team');

    IF NEW.tournament_id <> OLD.tournament_id OR NEW.user_id <> OLD.user_id OR NEW.team_id <> OLD.team_id THEN
        SELECT participation_type
        INTO v_participation_type
        FROM TournamentRules
        WHERE tournament_id = NEW.tournament_id;

        IF v_participation_type = 'Solo' AND NEW.user_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid entrant: This tournament requires a Solo (User) registration.';
        END IF;

        IF v_participation_type = 'Team' AND NEW.team_id IS NULL THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid entrant: This tournament requires a Team registration.';
        END IF;
    END IF;
END$$

-- TRIGGER 3: Enforce that MatchParticipants must belong to the tournament where match is scheduled
CREATE TRIGGER trg_before_insert_match_participant
BEFORE INSERT ON MatchParticipants
FOR EACH ROW
BEGIN
    DECLARE v_match_tournament INT;
    DECLARE v_reg_tournament INT;

    SELECT tournament_id INTO v_match_tournament
    FROM Matches WHERE match_id = NEW.match_id;

    SELECT tournament_id INTO v_reg_tournament
    FROM Registrations WHERE registration_id = NEW.registration_id;

    IF v_match_tournament <> v_reg_tournament THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cross-tournament violation: Participant registration belongs to a different tournament.';
    END IF;
END$$

-- TRIGGER 4: Enforce that awarded registration for a prize belongs to the tournament offering the prize
CREATE TRIGGER trg_before_insert_prize
BEFORE INSERT ON Prizes
FOR EACH ROW
BEGIN
    DECLARE v_reg_tournament INT;
    IF NEW.awarded_registration_id IS NOT NULL THEN
        SELECT tournament_id INTO v_reg_tournament
        FROM Registrations WHERE registration_id = NEW.awarded_registration_id;

        IF v_reg_tournament IS NULL OR v_reg_tournament <> NEW.tournament_id THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cross-tournament violation: Awarded registration belongs to a different tournament.';
        END IF;
    END IF;
END$$

CREATE TRIGGER trg_before_update_prize
BEFORE UPDATE ON Prizes
FOR EACH ROW
BEGIN
    DECLARE v_reg_tournament INT;
    IF NEW.awarded_registration_id IS NOT NULL THEN
        SELECT tournament_id INTO v_reg_tournament
        FROM Registrations WHERE registration_id = NEW.awarded_registration_id;

        IF v_reg_tournament IS NULL OR v_reg_tournament <> NEW.tournament_id THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cross-tournament violation: Awarded registration belongs to a different tournament.';
        END IF;
    END IF;
END$$

DELIMITER ;
