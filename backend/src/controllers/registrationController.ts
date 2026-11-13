import { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../config/db';
import { Registration, RegistrationStatus } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export async function registerSolo(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const tournamentId = parseInt(req.body.tournament_id, 10);
    const { payment_method, transaction_reference } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (isNaN(tournamentId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament ID.' });
      return;
    }

    // Execute within transaction with row locking to prevent race conditions on capacity
    const registrationId = await withTransaction(async (conn) => {
      // 1. Lock and fetch tournament info
      const [tournaments]: any = await conn.execute(
        `SELECT t.tournament_id, t.title, t.status, t.entry_fee, t.registration_deadline, t.max_participants,
                tr.participation_type
         FROM Tournaments t
         LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
         WHERE t.tournament_id = ? FOR UPDATE`,
        [tournamentId]
      );

      if (tournaments.length === 0) {
        const error: any = new Error('Tournament does not exist.');
        error.statusCode = 404;
        throw error;
      }

      const tourn = tournaments[0];
      const entryFeeNum = parseFloat(tourn.entry_fee) || 0;

      // 2. Validate participation type
      if (tourn.participation_type !== 'Solo') {
        const error: any = new Error('This tournament is configured for Team participation, not Solo.');
        error.statusCode = 400;
        throw error;
      }

      // 3. Validate status
      if (tourn.status !== 'Open') {
        const error: any = new Error(`Registration is not available: Tournament is currently "${tourn.status}".`);
        error.statusCode = 400;
        throw error;
      }

      // 4. Validate registration deadline
      const now = new Date();
      const deadline = new Date(tourn.registration_deadline);
      if (now > deadline) {
        const error: any = new Error('Registration deadline has already passed for this tournament.');
        error.statusCode = 400;
        throw error;
      }

      // 5. Check if already registered
      const [existingRegs]: any = await conn.execute(
        'SELECT registration_id, status FROM Registrations WHERE tournament_id = ? AND user_id = ?',
        [tournamentId, userId]
      );

      if (existingRegs.length > 0) {
        const prev = existingRegs[0];
        if (prev.status !== 'Cancelled') {
          const error: any = new Error(`You have already registered for this tournament (Status: ${prev.status}).`);
          error.statusCode = 409;
          throw error;
        } else {
          // Re-activate cancelled registration back to Pending
          await conn.execute(
            'UPDATE Registrations SET status = ?, registration_date = NOW() WHERE registration_id = ?',
            ['Pending', prev.registration_id]
          );

          // If entry fee > 0 and payment method provided, record payment atomically
          if (entryFeeNum > 0 && payment_method) {
            const ref = transaction_reference?.trim() || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            await conn.execute(
              `INSERT INTO Payments (registration_id, amount, payment_method, payment_status, transaction_reference, paid_at)
               VALUES (?, ?, ?, 'Success', ?, NOW())`,
              [prev.registration_id, entryFeeNum, payment_method.trim(), ref]
            );
          }

          return prev.registration_id;
        }
      }

      // 6. Check participant limit
      const [countResult]: any = await conn.execute(
        `SELECT COUNT(*) AS active_count
         FROM Registrations
         WHERE tournament_id = ? AND status IN ('Approved', 'Pending')`,
        [tournamentId]
      );

      if (countResult[0].active_count >= tourn.max_participants) {
        const error: any = new Error('Tournament has reached maximum capacity.');
        error.statusCode = 400;
        throw error;
      }

      // 7. Insert solo registration (user_id populated, team_id NULL)
      const [insertResult]: any = await conn.execute(
        'INSERT INTO Registrations (tournament_id, user_id, team_id, status, registration_date) VALUES (?, ?, NULL, ?, NOW())',
        [tournamentId, userId, 'Pending']
      );
      const newRegId = insertResult.insertId;

      // If entry fee > 0 and payment method provided, record payment atomically
      if (entryFeeNum > 0 && payment_method) {
        const ref = transaction_reference?.trim() || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await conn.execute(
          `INSERT INTO Payments (registration_id, amount, payment_method, payment_status, transaction_reference, paid_at)
           VALUES (?, ?, ?, 'Success', ?, NOW())`,
          [newRegId, entryFeeNum, payment_method.trim(), ref]
        );
      }

      return newRegId;
    });

    res.status(201).json({
      success: true,
      message: 'Solo registration submitted successfully! Status: Pending review.',
      registration_id: registrationId
    });
  } catch (err) {
    next(err);
  }
}

export async function registerTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const tournamentId = parseInt(req.body.tournament_id, 10);
    const teamId = parseInt(req.body.team_id, 10);
    const { payment_method, transaction_reference } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (isNaN(tournamentId) || isNaN(teamId)) {
      res.status(400).json({ success: false, message: 'Valid tournament_id and team_id are required.' });
      return;
    }

    // Execute within transaction with row locking
    const registrationId = await withTransaction(async (conn) => {
      // 1. Verify user is captain of the team
      const [teams]: any = await conn.execute(
        'SELECT team_id, team_name, captain_id FROM Teams WHERE team_id = ?',
        [teamId]
      );

      if (teams.length === 0) {
        const error: any = new Error('Team does not exist.');
        error.statusCode = 404;
        throw error;
      }

      if (teams[0].captain_id !== userId && req.user?.role !== 'admin') {
        const error: any = new Error('Only the team captain can register the team for a tournament.');
        error.statusCode = 403;
        throw error;
      }

      // 2. Lock and fetch tournament info & rules
      const [tournaments]: any = await conn.execute(
        `SELECT t.tournament_id, t.title, t.status, t.entry_fee, t.registration_deadline, t.max_participants,
                tr.participation_type, tr.team_size
         FROM Tournaments t
         LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
         WHERE t.tournament_id = ? FOR UPDATE`,
        [tournamentId]
      );

      if (tournaments.length === 0) {
        const error: any = new Error('Tournament does not exist.');
        error.statusCode = 404;
        throw error;
      }

      const tourn = tournaments[0];
      const entryFeeNum = parseFloat(tourn.entry_fee) || 0;

      // 3. Validate participation type
      if (tourn.participation_type !== 'Team') {
        const error: any = new Error('This tournament is configured for Solo players, not Teams.');
        error.statusCode = 400;
        throw error;
      }

      // 4. Validate status
      if (tourn.status !== 'Open') {
        const error: any = new Error(`Registration is not available: Tournament is currently "${tourn.status}".`);
        error.statusCode = 400;
        throw error;
      }

      // 5. Validate deadline
      const now = new Date();
      const deadline = new Date(tourn.registration_deadline);
      if (now > deadline) {
        const error: any = new Error('Registration deadline has already passed for this tournament.');
        error.statusCode = 400;
        throw error;
      }

      // 6. Validate team member size requirement
      const [membersCount]: any = await conn.execute(
        'SELECT COUNT(*) AS count FROM TeamMembers WHERE team_id = ?',
        [teamId]
      );

      const requiredSize = tourn.team_size || 1;
      if (membersCount[0].count < requiredSize) {
        const error: any = new Error(`Team does not meet minimum roster size. Required: ${requiredSize} players, current roster: ${membersCount[0].count}.`);
        error.statusCode = 400;
        throw error;
      }

      // 7. Check if team already registered
      const [existingRegs]: any = await conn.execute(
        'SELECT registration_id, status FROM Registrations WHERE tournament_id = ? AND team_id = ?',
        [tournamentId, teamId]
      );

      if (existingRegs.length > 0) {
        const prev = existingRegs[0];
        if (prev.status !== 'Cancelled') {
          const error: any = new Error(`Team "${teams[0].team_name}" is already registered (Status: ${prev.status}).`);
          error.statusCode = 409;
          throw error;
        } else {
          // Re-activate cancelled registration back to Pending
          await conn.execute(
            'UPDATE Registrations SET status = ?, registration_date = NOW() WHERE registration_id = ?',
            ['Pending', prev.registration_id]
          );

          // If entry fee > 0 and payment method provided, record payment atomically
          if (entryFeeNum > 0 && payment_method) {
            const ref = transaction_reference?.trim() || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            await conn.execute(
              `INSERT INTO Payments (registration_id, amount, payment_method, payment_status, transaction_reference, paid_at)
               VALUES (?, ?, ?, 'Success', ?, NOW())`,
              [prev.registration_id, entryFeeNum, payment_method.trim(), ref]
            );
          }

          return prev.registration_id;
        }
      }

      // 8. Check capacity limit
      const [countResult]: any = await conn.execute(
        `SELECT COUNT(*) AS active_count
         FROM Registrations
         WHERE tournament_id = ? AND status IN ('Approved', 'Pending')`,
        [tournamentId]
      );

      if (countResult[0].active_count >= tourn.max_participants) {
        const error: any = new Error('Tournament has reached maximum team capacity.');
        error.statusCode = 400;
        throw error;
      }

      // 9. Insert team registration (team_id populated, user_id NULL)
      const [insertResult]: any = await conn.execute(
        'INSERT INTO Registrations (tournament_id, user_id, team_id, status, registration_date) VALUES (?, NULL, ?, ?, NOW())',
        [tournamentId, teamId, 'Pending']
      );
      const newRegId = insertResult.insertId;

      // If entry fee > 0 and payment method provided, record payment atomically
      if (entryFeeNum > 0 && payment_method) {
        const ref = transaction_reference?.trim() || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await conn.execute(
          `INSERT INTO Payments (registration_id, amount, payment_method, payment_status, transaction_reference, paid_at)
           VALUES (?, ?, ?, 'Success', ?, NOW())`,
          [newRegId, entryFeeNum, payment_method.trim(), ref]
        );
      }

      return newRegId;
    });

    res.status(201).json({
      success: true,
      message: 'Team registration submitted successfully! Status: Pending review.',
      registration_id: registrationId
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRegistrations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Retrieve both direct solo registrations AND team registrations where user is captain or member
    const sql = `
      SELECT r.registration_id, r.tournament_id, r.user_id, r.team_id, r.registration_date, r.status,
             t.title AS tournament_title, t.format, t.start_date, t.end_date, t.entry_fee, t.status AS tournament_status,
             g.game_name,
             tr.participation_type,
             tm.team_name,
             cap.username AS captain_username,
             (r.user_id = ? OR tm.captain_id = ?) AS can_cancel,
             (SELECT p.payment_status FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS payment_status,
             (SELECT p.transaction_reference FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS payment_reference,
             (SELECT p.amount FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS paid_amount
      FROM Registrations r
      JOIN Tournaments t ON t.tournament_id = r.tournament_id
      JOIN Games g ON g.game_id = t.game_id
      LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      LEFT JOIN Users cap ON cap.user_id = tm.captain_id
      WHERE r.user_id = ?
         OR r.team_id IN (SELECT team_id FROM TeamMembers WHERE user_id = ?)
      ORDER BY r.registration_date DESC
    `;

    const registrations = await query<Registration[]>(sql, [userId, userId, userId, userId]);

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    next(err);
  }
}

export async function listAllRegistrations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, status, type } = req.query;

    let sql = `
      SELECT r.registration_id, r.tournament_id, r.user_id, r.team_id, r.registration_date, r.status,
             t.title AS tournament_title, t.format, t.status AS tournament_status, t.entry_fee,
             g.game_name,
             tr.participation_type,
             u.username AS player_username, u.email AS player_email, u.country AS player_country,
             tm.team_name, cap.username AS captain_username,
             (SELECT p.payment_status FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS payment_status,
             (SELECT p.transaction_reference FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS payment_reference,
             (SELECT p.amount FROM Payments p WHERE p.registration_id = r.registration_id AND p.payment_status = 'Success' LIMIT 1) AS paid_amount
      FROM Registrations r
      JOIN Tournaments t ON t.tournament_id = r.tournament_id
      JOIN Games g ON g.game_id = t.game_id
      LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
      LEFT JOIN Users u ON u.user_id = r.user_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      LEFT JOIN Users cap ON cap.user_id = tm.captain_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tournament_id) {
      sql += ' AND r.tournament_id = ?';
      params.push(parseInt(tournament_id as string, 10));
    }

    if (status) {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (type === 'Solo') {
      sql += ' AND r.user_id IS NOT NULL';
    } else if (type === 'Team') {
      sql += ' AND r.team_id IS NOT NULL';
    }

    sql += ' ORDER BY r.registration_date DESC';

    const registrations = await query(sql, params);

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRegistrationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const registrationId = parseInt(req.params.id as string, 10);
    const { status, waive_fee } = req.body;

    const allowed: RegistrationStatus[] = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
    if (!allowed.includes(status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    const reg = await query<Registration[]>('SELECT * FROM Registrations WHERE registration_id = ?', [registrationId]);
    if (reg.length === 0) {
      res.status(404).json({ success: false, message: 'Registration record not found.' });
      return;
    }

    const tournamentId = reg[0].tournament_id;
    const tourn = await query<any[]>(
      'SELECT tournament_id, title, entry_fee, max_participants FROM Tournaments WHERE tournament_id = ?',
      [tournamentId]
    );

    if (tourn.length === 0) {
      res.status(404).json({ success: false, message: 'Tournament not found.' });
      return;
    }

    const entryFee = parseFloat(tourn[0].entry_fee) || 0;

    // If approving, verify entry fee payment has been made (unless administrator explicitly waives fee)
    if (status === 'Approved' && entryFee > 0 && !waive_fee) {
      const payments = await query<any[]>(
        "SELECT payment_id, amount, payment_status, transaction_reference FROM Payments WHERE registration_id = ? AND payment_status = 'Success'",
        [registrationId]
      );

      if (payments.length === 0) {
        res.status(400).json({
          success: false,
          requires_payment: true,
          entry_fee: entryFee,
          message: `Cannot approve registration: Required entry fee of ₹${entryFee.toLocaleString('en-IN')} has not been paid. Entrant must pay or administrator must explicitly waive fee.`
        });
        return;
      }
    }

    // If approving, check if tournament limit has been reached
    if (status === 'Approved') {
      const approvedCount = await query<any[]>(
        "SELECT COUNT(*) AS count FROM Registrations WHERE tournament_id = ? AND status = 'Approved'",
        [tournamentId]
      );

      if (approvedCount[0].count >= tourn[0].max_participants) {
        res.status(400).json({
          success: false,
          message: 'Cannot approve: Tournament max participant limit has already been reached.'
        });
        return;
      }
    }

    await query('UPDATE Registrations SET status = ? WHERE registration_id = ?', [status, registrationId]);

    res.json({
      success: true,
      message: `Registration status updated to "${status}".`
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelRegistration(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const registrationId = parseInt(req.params.id as string, 10);
    const userId = req.user?.user_id;

    if (isNaN(registrationId)) {
      res.status(400).json({ success: false, message: 'Invalid registration ID.' });
      return;
    }

    const regs = await query<any[]>(
      `SELECT r.*, tm.captain_id
       FROM Registrations r
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       WHERE r.registration_id = ?`,
      [registrationId]
    );

    if (regs.length === 0) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const reg = regs[0];

    // Check authorization: must be either the solo user, the team captain, or an admin
    const isOwner = reg.user_id === userId;
    const isCaptain = reg.captain_id === userId;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isCaptain && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this registration.' });
      return;
    }

    // Per document specification page 6 & 14:
    // "Cancelled entries are deleted, losing history? Status columns (Pending/Approved/Rejected/Cancelled) keep every record. Rows are never deleted; status columns change instead."
    await query('UPDATE Registrations SET status = ? WHERE registration_id = ?', ['Cancelled', registrationId]);

    res.json({
      success: true,
      message: 'Registration successfully cancelled. History record preserved.'
    });
  } catch (err) {
    next(err);
  }
}
