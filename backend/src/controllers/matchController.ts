import { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../config/db';
import { Match, MatchParticipantDetail, MatchResult, MatchDispute, ResultCorrection } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export async function listMatches(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, round_name, status } = req.query;

    let sql = `
      SELECT m.match_id, m.tournament_id, m.round_name, m.match_number, m.scheduled_time, m.status,
             t.title AS tournament_title, g.game_name
      FROM Matches m
      JOIN Tournaments t ON t.tournament_id = m.tournament_id
      JOIN Games g ON g.game_id = t.game_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tournament_id) {
      sql += ' AND m.tournament_id = ?';
      params.push(parseInt(tournament_id as string, 10));
    }

    if (round_name) {
      sql += ' AND m.round_name = ?';
      params.push(round_name);
    }

    if (status) {
      sql += ' AND m.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY m.tournament_id ASC, m.scheduled_time ASC, m.match_number ASC';

    const matches = await query<Match[]>(sql, params);

    // If matches exist, fetch participants with their results for each match
    if (matches.length > 0) {
      const matchIds = matches.map((m) => m.match_id);
      const placeholders = matchIds.map(() => '?').join(',');

      const participantsSql = `
        SELECT mp.match_id, mp.registration_id, mp.slot_number,
               r.user_id, r.team_id,
               u.username, tm.team_name,
               COALESCE(u.username, tm.team_name) AS entrant_name,
               mr.score, mr.outcome, mr.recorded_at
        FROM MatchParticipants mp
        JOIN Registrations r ON r.registration_id = mp.registration_id
        LEFT JOIN Users u ON u.user_id = r.user_id
        LEFT JOIN Teams tm ON tm.team_id = r.team_id
        LEFT JOIN MatchResults mr ON mr.match_id = mp.match_id AND mr.registration_id = mp.registration_id
        WHERE mp.match_id IN (${placeholders})
        ORDER BY mp.slot_number ASC
      `;

      const participants = await query<MatchParticipantDetail[]>(participantsSql, matchIds);

      const map = new Map<number, MatchParticipantDetail[]>();
      participants.forEach((p) => {
        if (!map.has(p.match_id)) {
          map.set(p.match_id, []);
        }
        map.get(p.match_id)!.push(p);
      });

      matches.forEach((m) => {
        m.participants = map.get(m.match_id) || [];
      });
    }

    res.json({
      success: true,
      count: matches.length,
      matches
    });
  } catch (err) {
    next(err);
  }
}

export async function getMatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    if (isNaN(matchId)) {
      res.status(400).json({ success: false, message: 'Invalid match ID.' });
      return;
    }

    const matches = await query<Match[]>(
      `SELECT m.*, t.title AS tournament_title, t.format, g.game_name
       FROM Matches m
       JOIN Tournaments t ON t.tournament_id = m.tournament_id
       JOIN Games g ON g.game_id = t.game_id
       WHERE m.match_id = ?`,
      [matchId]
    );

    if (matches.length === 0) {
      res.status(404).json({ success: false, message: 'Match not found.' });
      return;
    }

    const match = matches[0];

    // Participants & Results
    const participants = await query<MatchParticipantDetail[]>(
      `SELECT mp.match_id, mp.registration_id, mp.slot_number,
              r.user_id, r.team_id,
              u.username, tm.team_name,
              COALESCE(u.username, tm.team_name) AS entrant_name,
              mr.score, mr.outcome, mr.recorded_at
       FROM MatchParticipants mp
       JOIN Registrations r ON r.registration_id = mp.registration_id
       LEFT JOIN Users u ON u.user_id = r.user_id
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       LEFT JOIN MatchResults mr ON mr.match_id = mp.match_id AND mr.registration_id = mp.registration_id
       WHERE mp.match_id = ?
       ORDER BY mp.slot_number ASC`,
      [matchId]
    );

    match.participants = participants;

    // Disputes on this match
    const disputes = await query<MatchDispute[]>(
      `SELECT md.*, COALESCE(u.username, tm.team_name) AS entrant_name
       FROM MatchDisputes md
       JOIN Registrations r ON r.registration_id = md.registration_id
       LEFT JOIN Users u ON u.user_id = r.user_id
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       WHERE md.match_id = ?
       ORDER BY md.raised_at DESC`,
      [matchId]
    );

    // Corrections on this match
    const corrections = await query<ResultCorrection[]>(
      `SELECT rc.*, COALESCE(u.username, tm.team_name) AS entrant_name
       FROM ResultCorrections rc
       JOIN Registrations r ON r.registration_id = rc.registration_id
       LEFT JOIN Users u ON u.user_id = r.user_id
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       WHERE rc.match_id = ?
       ORDER BY rc.corrected_at DESC`,
      [matchId]
    );

    // Check if the current logged in user is a participant of this match
    let isUserParticipant = false;
    let userRegistrationId: number | null = null;
    if (req.user) {
      const currentUserId = req.user.user_id;
      for (const p of participants) {
        if (p.user_id === currentUserId) {
          isUserParticipant = true;
          userRegistrationId = p.registration_id;
          break;
        } else if (p.team_id) {
          // Check if current user belongs to this team
          const [teamCheck]: any = await query(
            'SELECT user_id FROM TeamMembers WHERE team_id = ? AND user_id = ?',
            [p.team_id, currentUserId]
          );
          if (teamCheck) {
            isUserParticipant = true;
            userRegistrationId = p.registration_id;
            break;
          }
        }
      }
    }

    res.json({
      success: true,
      match,
      disputes,
      corrections,
      user_participant: {
        is_participant: isUserParticipant,
        registration_id: userRegistrationId
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createMatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, round_name, match_number, scheduled_time, status } = req.body;

    if (!tournament_id || !round_name || match_number === undefined || !scheduled_time) {
      res.status(400).json({
        success: false,
        message: 'Missing required match fields: tournament_id, round_name, match_number, scheduled_time.'
      });
      return;
    }

    const insertResult: any = await query(
      `INSERT INTO Matches (tournament_id, round_name, match_number, scheduled_time, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        parseInt(tournament_id, 10),
        round_name.trim(),
        parseInt(match_number, 10),
        scheduled_time,
        status || 'Scheduled'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Match created successfully.',
      match_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { round_name, match_number, scheduled_time, status } = req.body;

    if (isNaN(matchId)) {
      res.status(400).json({ success: false, message: 'Invalid match ID.' });
      return;
    }

    await query(
      `UPDATE Matches
       SET round_name = ?, match_number = ?, scheduled_time = ?, status = ?
       WHERE match_id = ?`,
      [round_name.trim(), parseInt(match_number, 10), scheduled_time, status, matchId]
    );

    res.json({
      success: true,
      message: 'Match updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMatchStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    const allowed = ['Scheduled', 'Live', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    await query('UPDATE Matches SET status = ? WHERE match_id = ?', [status, matchId]);

    res.json({
      success: true,
      message: `Match status updated to "${status}".`
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMatch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    if (isNaN(matchId)) {
      res.status(400).json({ success: false, message: 'Invalid match ID.' });
      return;
    }

    await query('DELETE FROM Matches WHERE match_id = ?', [matchId]);

    res.json({
      success: true,
      message: 'Match deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function addParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { registration_id, slot_number } = req.body;

    if (isNaN(matchId) || !registration_id || slot_number === undefined) {
      res.status(400).json({
        success: false,
        message: 'Valid match_id, registration_id, and slot_number are required.'
      });
      return;
    }

    // Verify match exists
    const matches = await query<any[]>('SELECT tournament_id FROM Matches WHERE match_id = ?', [matchId]);
    if (matches.length === 0) {
      res.status(404).json({ success: false, message: 'Match not found.' });
      return;
    }

    // Verify registration exists and is Approved
    const regs = await query<any[]>(
      'SELECT tournament_id, status FROM Registrations WHERE registration_id = ?',
      [registration_id]
    );

    if (regs.length === 0) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    if (regs[0].tournament_id !== matches[0].tournament_id) {
      res.status(400).json({
        success: false,
        message: 'Cross-tournament violation: Participant registration belongs to a different tournament.'
      });
      return;
    }

    if (regs[0].status !== 'Approved') {
      res.status(400).json({
        success: false,
        message: `Only Approved registrations can be assigned to matches (Current status: ${regs[0].status}).`
      });
      return;
    }

    await query(
      'INSERT INTO MatchParticipants (match_id, registration_id, slot_number) VALUES (?, ?, ?)',
      [matchId, registration_id, parseInt(slot_number, 10)]
    );

    res.status(201).json({
      success: true,
      message: 'Participant assigned to match slot successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function removeParticipant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const registrationId = parseInt(req.params.registrationId as string, 10);

    if (isNaN(matchId) || isNaN(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid match or registration ID.' });
      return;
    }

    await query(
      'DELETE FROM MatchParticipants WHERE match_id = ? AND registration_id = ?',
      [matchId, registrationId]
    );

    res.json({
      success: true,
      message: 'Participant removed from match slot.'
    });
  } catch (err) {
    next(err);
  }
}

export async function recordResults(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { results, mark_completed } = req.body;

    if (isNaN(matchId) || !Array.isArray(results) || results.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Must provide an array of results with registration_id, score, and outcome.'
      });
      return;
    }

    await withTransaction(async (conn) => {
      for (const item of results) {
        const { registration_id, score, outcome } = item;
        const validOutcomes = ['Win', 'Loss', 'Draw', 'Forfeit'];
        if (!validOutcomes.includes(outcome)) {
          const err: any = new Error(`Outcome must be one of: ${validOutcomes.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }

        // Verify participant is in MatchParticipants
        const [parts]: any = await conn.execute(
          'SELECT 1 FROM MatchParticipants WHERE match_id = ? AND registration_id = ?',
          [matchId, registration_id]
        );

        if (parts.length === 0) {
          const err: any = new Error(`Registration #${registration_id} is not an assigned participant of Match #${matchId}.`);
          err.statusCode = 400;
          throw err;
        }

        // Insert or update MatchResults
        await conn.execute(
          `INSERT INTO MatchResults (match_id, registration_id, score, outcome, recorded_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE score = VALUES(score), outcome = VALUES(outcome), recorded_at = NOW()`,
          [matchId, registration_id, parseInt(score, 10) || 0, outcome]
        );
      }

      if (mark_completed) {
        await conn.execute('UPDATE Matches SET status = ? WHERE match_id = ?', ['Completed', matchId]);
      }
    });

    res.json({
      success: true,
      message: 'Match results recorded successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function raiseDispute(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { reason, registration_id } = req.body;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (isNaN(matchId) || !reason || !reason.trim()) {
      res.status(400).json({ success: false, message: 'Match ID and dispute reason are required.' });
      return;
    }

    // Determine and verify the participant registration ID
    let targetRegistrationId = registration_id ? parseInt(registration_id, 10) : null;

    if (!targetRegistrationId) {
      // Find registration for current user or their captained team
      const participants = await query<any[]>(
        `SELECT mp.registration_id, r.user_id, r.team_id, tm.captain_id
         FROM MatchParticipants mp
         JOIN Registrations r ON r.registration_id = mp.registration_id
         LEFT JOIN Teams tm ON tm.team_id = r.team_id
         WHERE mp.match_id = ?`,
        [matchId]
      );

      for (const p of participants) {
        if (p.user_id === currentUserId || p.captain_id === currentUserId) {
          targetRegistrationId = p.registration_id;
          break;
        }
      }
    }

    if (!targetRegistrationId) {
      res.status(403).json({
        success: false,
        message: 'Only registered participants of this match are authorized to raise a dispute.'
      });
      return;
    }

    // Verify targetRegistrationId belongs to match
    const check = await query<any[]>(
      'SELECT 1 FROM MatchParticipants WHERE match_id = ? AND registration_id = ?',
      [matchId, targetRegistrationId]
    );

    if (check.length === 0) {
      res.status(403).json({
        success: false,
        message: 'Dispute participant is not assigned to this match.'
      });
      return;
    }

    const insertResult: any = await query(
      `INSERT INTO MatchDisputes (match_id, registration_id, reason, status, raised_at)
       VALUES (?, ?, ?, 'Open', NOW())`,
      [matchId, targetRegistrationId, reason.trim()]
    );

    res.status(201).json({
      success: true,
      message: 'Dispute submitted successfully and placed in review queue.',
      dispute_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function listDisputes(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, status } = req.query;
    const currentUserId = req.user?.user_id;
    const isAdmin = req.user?.role === 'admin';

    let sql = `
      SELECT md.dispute_id, md.match_id, md.registration_id, md.reason, md.status, md.raised_at,
             m.round_name, m.match_number, m.tournament_id,
             t.title AS tournament_title,
             COALESCE(u.username, tm.team_name) AS entrant_name,
             u.user_id, tm.captain_id
      FROM MatchDisputes md
      JOIN Matches m ON m.match_id = md.match_id
      JOIN Tournaments t ON t.tournament_id = m.tournament_id
      JOIN Registrations r ON r.registration_id = md.registration_id
      LEFT JOIN Users u ON u.user_id = r.user_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      // Non-admins only view disputes where they are the participant or captain
      sql += ' AND (r.user_id = ? OR tm.captain_id = ? OR tm.team_id IN (SELECT team_id FROM TeamMembers WHERE user_id = ?))';
      params.push(currentUserId, currentUserId, currentUserId);
    }

    if (tournament_id) {
      sql += ' AND m.tournament_id = ?';
      params.push(parseInt(tournament_id as string, 10));
    }

    if (status) {
      sql += ' AND md.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY md.raised_at DESC';

    const disputes = await query<MatchDispute[]>(sql, params);

    res.json({
      success: true,
      count: disputes.length,
      disputes
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDisputeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const disputeId = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    const allowed = ['Open', 'Under Review', 'Resolved', 'Rejected'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    await query('UPDATE MatchDisputes SET status = ? WHERE dispute_id = ?', [status, disputeId]);

    res.json({
      success: true,
      message: `Dispute status updated to "${status}".`
    });
  } catch (err) {
    next(err);
  }
}

export async function correctResult(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    const { registration_id, new_score, dispute_id } = req.body;

    if (isNaN(matchId) || !registration_id || new_score === undefined) {
      res.status(400).json({
        success: false,
        message: 'match_id, registration_id, and new_score are required.'
      });
      return;
    }

    const regId = parseInt(registration_id, 10);
    const newScoreNum = parseInt(new_score, 10);

    if (newScoreNum < 0) {
      res.status(400).json({ success: false, message: 'Score must be non-negative.' });
      return;
    }

    const correctionId = await withTransaction(async (conn) => {
      // 1. Fetch current score
      const [currentResults]: any = await conn.execute(
        'SELECT score FROM MatchResults WHERE match_id = ? AND registration_id = ?',
        [matchId, regId]
      );

      if (currentResults.length === 0) {
        const err: any = new Error('No recorded result found for this match participant to correct.');
        err.statusCode = 404;
        throw err;
      }

      const oldScore = currentResults[0].score;

      // 2. Insert ResultCorrections audit record
      const [corrResult]: any = await conn.execute(
        `INSERT INTO ResultCorrections (match_id, registration_id, dispute_id, old_score, new_score, corrected_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [matchId, regId, dispute_id ? parseInt(dispute_id, 10) : null, oldScore, newScoreNum]
      );

      // 3. Update MatchResults table
      await conn.execute(
        'UPDATE MatchResults SET score = ?, recorded_at = NOW() WHERE match_id = ? AND registration_id = ?',
        [newScoreNum, matchId, regId]
      );

      // 4. If dispute_id was supplied, update dispute status to Resolved
      if (dispute_id) {
        await conn.execute(
          'UPDATE MatchDisputes SET status = ? WHERE dispute_id = ?',
          ['Resolved', parseInt(dispute_id, 10)]
        );
      }

      return corrResult.insertId;
    });

    res.json({
      success: true,
      message: 'Result correction recorded and audit history preserved.',
      correction_id: correctionId
    });
  } catch (err) {
    next(err);
  }
}

export async function getMatchCorrections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const matchId = parseInt(req.params.id as string, 10);
    if (isNaN(matchId)) {
      res.status(400).json({ success: false, message: 'Invalid match ID.' });
      return;
    }

    const corrections = await query<ResultCorrection[]>(
      `SELECT rc.*, COALESCE(u.username, tm.team_name) AS entrant_name
       FROM ResultCorrections rc
       JOIN Registrations r ON r.registration_id = rc.registration_id
       LEFT JOIN Users u ON u.user_id = r.user_id
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       WHERE rc.match_id = ?
       ORDER BY rc.corrected_at DESC`,
      [matchId]
    );

    res.json({
      success: true,
      count: corrections.length,
      corrections
    });
  } catch (err) {
    next(err);
  }
}
