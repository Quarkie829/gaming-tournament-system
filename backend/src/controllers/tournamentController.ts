import { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../config/db';
import { Tournament, TournamentRule, Registration } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export async function listTournaments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { game_id, status, participation_type, search } = req.query;

    let sql = `
      SELECT t.tournament_id, t.game_id, t.title, t.format, t.start_date, t.end_date,
             t.registration_deadline, t.entry_fee, t.max_participants, t.status,
             g.game_name, g.genre, g.platform,
             tr.rule_id, tr.participation_type, tr.team_size, tr.min_age, tr.region_restriction,
             COUNT(CASE WHEN r.status IN ('Approved', 'Pending') THEN 1 END) AS registered_count
      FROM Tournaments t
      JOIN Games g ON g.game_id = t.game_id
      LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
      LEFT JOIN Registrations r ON r.tournament_id = t.tournament_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (game_id) {
      sql += ' AND t.game_id = ?';
      params.push(parseInt(game_id as string, 10));
    }

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (participation_type) {
      sql += ' AND tr.participation_type = ?';
      params.push(participation_type);
    }

    if (search) {
      sql += ' AND (t.title LIKE ? OR t.format LIKE ? OR g.game_name LIKE ?)';
      const term = `%${(search as string).trim()}%`;
      params.push(term, term, term);
    }

    sql += ` GROUP BY t.tournament_id, tr.rule_id
             ORDER BY t.start_date ASC`;

    const tournaments = await query(sql, params);

    res.json({
      success: true,
      count: tournaments.length,
      tournaments
    });
  } catch (err) {
    next(err);
  }
}

export async function getTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    if (isNaN(tournamentId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament ID.' });
      return;
    }

    const sql = `
      SELECT t.*, g.game_name, g.genre, g.platform, g.publisher,
             tr.rule_id, tr.participation_type, tr.team_size, tr.min_age, tr.region_restriction, tr.rules_text,
             COUNT(CASE WHEN r.status IN ('Approved', 'Pending') THEN 1 END) AS registered_count
      FROM Tournaments t
      JOIN Games g ON g.game_id = t.game_id
      LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
      LEFT JOIN Registrations r ON r.tournament_id = t.tournament_id
      WHERE t.tournament_id = ?
      GROUP BY t.tournament_id, tr.rule_id
    `;

    const tournaments = await query(sql, [tournamentId]);

    if (tournaments.length === 0) {
      res.status(404).json({ success: false, message: 'Tournament not found.' });
      return;
    }

    const tournament = tournaments[0];

    // Fetch existing registrations for this tournament
    const registrationsSql = `
      SELECT r.registration_id, r.tournament_id, r.user_id, r.team_id, r.registration_date, r.status,
             u.username, u.country AS user_country,
             tm.team_name, cap.username AS captain_name
      FROM Registrations r
      LEFT JOIN Users u ON u.user_id = r.user_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      LEFT JOIN Users cap ON cap.user_id = tm.captain_id
      WHERE r.tournament_id = ?
      ORDER BY r.registration_date ASC
    `;
    const registrations = await query(registrationsSql, [tournamentId]);

    // Check user eligibility if authenticated
    let userEligibility: any = null;
    if (req.user) {
      const userId = req.user.user_id;

      // Check if user has registered solo
      const userSoloReg = registrations.find((r: any) => r.user_id === userId && r.status !== 'Cancelled');

      // Fetch teams captained by this user
      const captainedTeams = await query<any[]>(
        `SELECT t.team_id, t.team_name, COUNT(tm.user_id) AS member_count
         FROM Teams t
         LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
         WHERE t.captain_id = ?
         GROUP BY t.team_id`,
        [userId]
      );

      // Check which captained teams are already registered
      const teamsWithStatus = captainedTeams.map((team) => {
        const teamReg = registrations.find((r: any) => r.team_id === team.team_id && r.status !== 'Cancelled');
        return {
          ...team,
          is_registered: !!teamReg,
          registration_status: teamReg ? teamReg.status : null,
          meets_size_requirement: team.member_count >= (tournament.team_size || 1)
        };
      });

      const now = new Date();
      const deadline = new Date(tournament.registration_deadline);
      const isDeadlinePassed = now > deadline;
      const isFull = tournament.registered_count >= tournament.max_participants;
      const isOpen = tournament.status === 'Open';

      userEligibility = {
        can_register_solo: tournament.participation_type === 'Solo' && !userSoloReg && !isDeadlinePassed && !isFull && isOpen,
        is_registered_solo: !!userSoloReg,
        user_solo_status: userSoloReg ? userSoloReg.status : null,
        captained_teams: teamsWithStatus,
        is_deadline_passed: isDeadlinePassed,
        is_full: isFull,
        is_open: isOpen
      };
    }

    res.json({
      success: true,
      tournament,
      registrations,
      user_eligibility: userEligibility
    });
  } catch (err) {
    next(err);
  }
}

export async function createTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      game_id,
      title,
      format,
      start_date,
      end_date,
      registration_deadline,
      entry_fee,
      max_participants,
      status,
      participation_type,
      team_size,
      min_age,
      region_restriction,
      rules_text
    } = req.body;

    if (!game_id || !title || !format || !start_date || !end_date || !registration_deadline || !participation_type) {
      res.status(400).json({
        success: false,
        message: 'Missing required tournament fields: game_id, title, format, dates, participation_type.'
      });
      return;
    }

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const regDeadline = new Date(registration_deadline);

    if (endDate < startDate) {
      res.status(400).json({
        success: false,
        message: 'End date must be greater than or equal to start date.'
      });
      return;
    }

    if (regDeadline > startDate) {
      res.status(400).json({
        success: false,
        message: 'Registration deadline must be before or on the tournament start date.'
      });
      return;
    }

    const finalTeamSize = participation_type === 'Solo' ? 1 : Math.max(1, parseInt(team_size, 10) || 5);

    // Atomically insert Tournament and TournamentRules in a single transaction
    const createdTournamentId = await withTransaction(async (conn) => {
      const [tournResult]: any = await conn.execute(
        `INSERT INTO Tournaments (game_id, title, format, start_date, end_date, registration_deadline, entry_fee, max_participants, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parseInt(game_id, 10),
          title.trim(),
          format.trim(),
          start_date,
          end_date,
          registration_deadline,
          parseFloat(entry_fee) || 0.0,
          parseInt(max_participants, 10) || 16,
          status || 'Upcoming'
        ]
      );

      const tournamentId = tournResult.insertId;

      await conn.execute(
        `INSERT INTO TournamentRules (tournament_id, participation_type, team_size, min_age, region_restriction, rules_text)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          tournamentId,
          participation_type,
          finalTeamSize,
          min_age ? parseInt(min_age, 10) : null,
          region_restriction?.trim() || 'Global',
          rules_text?.trim() || null
        ]
      );

      return tournamentId;
    });

    res.status(201).json({
      success: true,
      message: 'Tournament and rules created successfully.',
      tournament_id: createdTournamentId
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    if (isNaN(tournamentId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament ID.' });
      return;
    }

    const {
      game_id,
      title,
      format,
      start_date,
      end_date,
      registration_deadline,
      entry_fee,
      max_participants,
      status,
      participation_type,
      team_size,
      min_age,
      region_restriction,
      rules_text
    } = req.body;

    await withTransaction(async (conn) => {
      await conn.execute(
        `UPDATE Tournaments
         SET game_id = ?, title = ?, format = ?, start_date = ?, end_date = ?,
             registration_deadline = ?, entry_fee = ?, max_participants = ?, status = ?
         WHERE tournament_id = ?`,
        [
          parseInt(game_id, 10),
          title.trim(),
          format.trim(),
          start_date,
          end_date,
          registration_deadline,
          parseFloat(entry_fee) || 0.0,
          parseInt(max_participants, 10) || 16,
          status,
          tournamentId
        ]
      );

      const finalTeamSize = participation_type === 'Solo' ? 1 : Math.max(1, parseInt(team_size, 10) || 5);

      await conn.execute(
        `UPDATE TournamentRules
         SET participation_type = ?, team_size = ?, min_age = ?, region_restriction = ?, rules_text = ?
         WHERE tournament_id = ?`,
        [
          participation_type,
          finalTeamSize,
          min_age ? parseInt(min_age, 10) : null,
          region_restriction?.trim() || null,
          rules_text?.trim() || null,
          tournamentId
        ]
      );
    });

    res.json({
      success: true,
      message: 'Tournament and rules updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTournamentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    const allowed = ['Upcoming', 'Open', 'Ongoing', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    await query('UPDATE Tournaments SET status = ? WHERE tournament_id = ?', [status, tournamentId]);

    res.json({
      success: true,
      message: `Tournament status updated to ${status}.`
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTournament(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.id as string, 10);
    if (isNaN(tournamentId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament ID.' });
      return;
    }

    await query('DELETE FROM Tournaments WHERE tournament_id = ?', [tournamentId]);

    res.json({
      success: true,
      message: 'Tournament deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getTournamentStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Total counts
    const counts = await query<any[]>(`
      SELECT
        (SELECT COUNT(*) FROM Tournaments) AS total_tournaments,
        (SELECT COUNT(*) FROM Tournaments WHERE status = 'Open') AS open_tournaments,
        (SELECT COUNT(*) FROM Users) AS total_users,
        (SELECT COUNT(*) FROM Teams) AS total_teams,
        (SELECT COUNT(*) FROM Registrations WHERE status = 'Approved') AS approved_registrations,
        (SELECT COUNT(*) FROM Registrations WHERE status = 'Pending') AS pending_registrations
    `);

    // 2. Solo vs Team breakdown (Matches PDF query from section 13)
    const breakdown = await query(`
      SELECT t.title,
             SUM(r.user_id IS NOT NULL) AS solo_entries,
             SUM(r.team_id IS NOT NULL) AS team_entries
      FROM Tournaments t
      JOIN Registrations r ON r.tournament_id = t.tournament_id
      WHERE r.status <> 'Cancelled'
      GROUP BY t.tournament_id, t.title
    `);

    res.json({
      success: true,
      metrics: counts[0],
      registration_breakdown: breakdown
    });
  } catch (err) {
    next(err);
  }
}
