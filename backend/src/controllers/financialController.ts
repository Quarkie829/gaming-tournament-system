import { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../config/db';
import { Payment, Prize, Sponsor, TournamentSponsor } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

// ==========================================
// PAYMENTS (Module 6A)
// ==========================================

export async function listPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, payment_status } = req.query;
    const currentUserId = req.user?.user_id;
    const isAdmin = req.user?.role === 'admin';

    let sql = `
      SELECT p.payment_id, p.registration_id, p.amount, p.payment_method,
             p.payment_status, p.transaction_reference, p.paid_at,
             t.tournament_id, t.title AS tournament_title,
             r.user_id, r.team_id,
             COALESCE(u.username, tm.team_name) AS entrant_name
      FROM Payments p
      JOIN Registrations r ON r.registration_id = p.registration_id
      JOIN Tournaments t ON t.tournament_id = r.tournament_id
      LEFT JOIN Users u ON u.user_id = r.user_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (!isAdmin) {
      sql += ' AND (r.user_id = ? OR tm.captain_id = ? OR tm.team_id IN (SELECT team_id FROM TeamMembers WHERE user_id = ?))';
      params.push(currentUserId, currentUserId, currentUserId);
    }

    if (tournament_id) {
      sql += ' AND t.tournament_id = ?';
      params.push(parseInt(tournament_id as string, 10));
    }

    if (payment_status) {
      sql += ' AND p.payment_status = ?';
      params.push(payment_status);
    }

    sql += ' ORDER BY p.paid_at DESC';

    const payments = await query<Payment[]>(sql, params);

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (err) {
    next(err);
  }
}

export async function createPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { registration_id, amount, payment_method, transaction_reference } = req.body;
    const currentUserId = req.user?.user_id;
    const isAdmin = req.user?.role === 'admin';

    if (!registration_id || amount === undefined || !payment_method) {
      res.status(400).json({
        success: false,
        message: 'registration_id, amount, and payment_method are required.'
      });
      return;
    }

    const regId = parseInt(registration_id, 10);
    const amountNum = parseFloat(amount);

    if (amountNum < 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be non-negative.' });
      return;
    }

    // Verify registration exists & permissions
    const regs = await query<any[]>(
      `SELECT r.registration_id, r.user_id, r.team_id, tm.captain_id
       FROM Registrations r
       LEFT JOIN Teams tm ON tm.team_id = r.team_id
       WHERE r.registration_id = ?`,
      [regId]
    );

    if (regs.length === 0) {
      res.status(404).json({ success: false, message: 'Registration not found.' });
      return;
    }

    const reg = regs[0];
    const isOwner = reg.user_id === currentUserId || reg.captain_id === currentUserId;
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to submit payment for this registration.' });
      return;
    }

    const ref = transaction_reference?.trim() || `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const insertResult: any = await query(
      `INSERT INTO Payments (registration_id, amount, payment_method, payment_status, transaction_reference, paid_at)
       VALUES (?, ?, ?, 'Success', ?, NOW())`,
      [regId, amountNum, payment_method.trim(), ref]
    );

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      payment_id: insertResult.insertId,
      transaction_reference: ref
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePaymentStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const paymentId = parseInt(req.params.id as string, 10);
    const { payment_status } = req.body;

    const allowed = ['Pending', 'Success', 'Failed', 'Refunded'];
    if (!allowed.includes(payment_status)) {
      res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
      return;
    }

    await query('UPDATE Payments SET payment_status = ? WHERE payment_id = ?', [payment_status, paymentId]);

    res.json({
      success: true,
      message: `Payment status updated to "${payment_status}".`
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// PRIZES (Module 6B)
// ==========================================

export async function listPrizes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = req.query.tournament_id ? parseInt(req.query.tournament_id as string, 10) : null;

    let sql = `
      SELECT pz.prize_id, pz.tournament_id, pz.placement, pz.prize_amount, pz.description,
             pz.awarded_registration_id,
             t.title AS tournament_title,
             COALESCE(u.username, tm.team_name) AS winner_name
      FROM Prizes pz
      JOIN Tournaments t ON t.tournament_id = pz.tournament_id
      LEFT JOIN Registrations r ON r.registration_id = pz.awarded_registration_id
      LEFT JOIN Users u ON u.user_id = r.user_id
      LEFT JOIN Teams tm ON tm.team_id = r.team_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tournamentId) {
      sql += ' AND pz.tournament_id = ?';
      params.push(tournamentId);
    }

    sql += ' ORDER BY pz.tournament_id ASC, pz.placement ASC';

    const prizes = await query<Prize[]>(sql, params);

    res.json({
      success: true,
      count: prizes.length,
      prizes
    });
  } catch (err) {
    next(err);
  }
}

export async function createPrize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { tournament_id, placement, prize_amount, description } = req.body;

    if (!tournament_id || placement === undefined || prize_amount === undefined) {
      res.status(400).json({
        success: false,
        message: 'tournament_id, placement, and prize_amount are required.'
      });
      return;
    }

    const insertResult: any = await query(
      `INSERT INTO Prizes (tournament_id, placement, prize_amount, description, awarded_registration_id)
       VALUES (?, ?, ?, ?, NULL)`,
      [
        parseInt(tournament_id, 10),
        parseInt(placement, 10),
        parseFloat(prize_amount),
        description?.trim() || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Prize tier created successfully.',
      prize_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePrize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const prizeId = parseInt(req.params.id as string, 10);
    const { placement, prize_amount, description } = req.body;

    if (isNaN(prizeId)) {
      res.status(400).json({ success: false, message: 'Invalid prize ID.' });
      return;
    }

    await query(
      `UPDATE Prizes
       SET placement = ?, prize_amount = ?, description = ?
       WHERE prize_id = ?`,
      [parseInt(placement, 10), parseFloat(prize_amount), description?.trim() || null, prizeId]
    );

    res.json({
      success: true,
      message: 'Prize details updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function awardPrize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const prizeId = parseInt(req.params.id as string, 10);
    const { awarded_registration_id } = req.body;

    if (isNaN(prizeId)) {
      res.status(400).json({ success: false, message: 'Invalid prize ID.' });
      return;
    }

    const targetRegId = awarded_registration_id ? parseInt(awarded_registration_id, 10) : null;

    if (targetRegId) {
      // Validate registration belongs to this tournament
      const [prize]: any = await query('SELECT tournament_id FROM Prizes WHERE prize_id = ?', [prizeId]);
      if (!prize) {
        res.status(404).json({ success: false, message: 'Prize not found.' });
        return;
      }

      const [reg]: any = await query('SELECT tournament_id FROM Registrations WHERE registration_id = ?', [targetRegId]);
      if (!reg) {
        res.status(404).json({ success: false, message: 'Registration not found.' });
        return;
      }

      if (prize.tournament_id !== reg.tournament_id) {
        res.status(400).json({
          success: false,
          message: 'Cross-tournament violation: Awarded registration belongs to a different tournament.'
        });
        return;
      }
    }

    await query('UPDATE Prizes SET awarded_registration_id = ? WHERE prize_id = ?', [targetRegId, prizeId]);

    res.json({
      success: true,
      message: targetRegId ? 'Prize successfully awarded to winner!' : 'Prize unassigned.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deletePrize(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const prizeId = parseInt(req.params.id as string, 10);
    if (isNaN(prizeId)) {
      res.status(400).json({ success: false, message: 'Invalid prize ID.' });
      return;
    }

    await query('DELETE FROM Prizes WHERE prize_id = ?', [prizeId]);

    res.json({
      success: true,
      message: 'Prize deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// SPONSORS & TOURNAMENT SPONSORS (Module 6C & 6D)
// ==========================================

export async function listSponsors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sql = `
      SELECT s.sponsor_id, s.sponsor_name, s.contact_email, s.country,
             COUNT(ts.tournament_id) AS tournament_count,
             COALESCE(SUM(ts.contribution_amount), 0) AS total_contribution
      FROM Sponsors s
      LEFT JOIN TournamentSponsors ts ON ts.sponsor_id = s.sponsor_id
      GROUP BY s.sponsor_id
      ORDER BY s.sponsor_name ASC
    `;

    const sponsors = await query<Sponsor[]>(sql);

    res.json({
      success: true,
      count: sponsors.length,
      sponsors
    });
  } catch (err) {
    next(err);
  }
}

export async function createSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { sponsor_name, contact_email, country } = req.body;

    if (!sponsor_name || !sponsor_name.trim()) {
      res.status(400).json({ success: false, message: 'Sponsor name is required.' });
      return;
    }

    const insertResult: any = await query(
      'INSERT INTO Sponsors (sponsor_name, contact_email, country) VALUES (?, ?, ?)',
      [sponsor_name.trim(), contact_email?.trim() || null, country?.trim() || 'Global']
    );

    res.status(201).json({
      success: true,
      message: 'Sponsor created successfully.',
      sponsor_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sponsorId = parseInt(req.params.id as string, 10);
    const { sponsor_name, contact_email, country } = req.body;

    if (isNaN(sponsorId) || !sponsor_name || !sponsor_name.trim()) {
      res.status(400).json({ success: false, message: 'Valid sponsor ID and name are required.' });
      return;
    }

    await query(
      'UPDATE Sponsors SET sponsor_name = ?, contact_email = ?, country = ? WHERE sponsor_id = ?',
      [sponsor_name.trim(), contact_email?.trim() || null, country?.trim() || 'Global', sponsorId]
    );

    res.json({
      success: true,
      message: 'Sponsor updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const sponsorId = parseInt(req.params.id as string, 10);
    if (isNaN(sponsorId)) {
      res.status(400).json({ success: false, message: 'Invalid sponsor ID.' });
      return;
    }

    await query('DELETE FROM Sponsors WHERE sponsor_id = ?', [sponsorId]);

    res.json({
      success: true,
      message: 'Sponsor deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function listTournamentSponsors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.tournamentId as string, 10);
    if (isNaN(tournamentId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament ID.' });
      return;
    }

    const sql = `
      SELECT ts.tournament_id, ts.sponsor_id, ts.contribution_amount, ts.sponsored_on,
             s.sponsor_name, s.contact_email, s.country
      FROM TournamentSponsors ts
      JOIN Sponsors s ON s.sponsor_id = ts.sponsor_id
      WHERE ts.tournament_id = ?
      ORDER BY ts.contribution_amount DESC
    `;

    const sponsors = await query<TournamentSponsor[]>(sql, [tournamentId]);

    res.json({
      success: true,
      count: sponsors.length,
      sponsors
    });
  } catch (err) {
    next(err);
  }
}

export async function addTournamentSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.tournamentId as string, 10);
    const { sponsor_id, contribution_amount, sponsored_on } = req.body;

    if (isNaN(tournamentId) || !sponsor_id || contribution_amount === undefined) {
      res.status(400).json({
        success: false,
        message: 'tournament_id, sponsor_id, and contribution_amount are required.'
      });
      return;
    }

    const amountNum = parseFloat(contribution_amount) || 0;
    if (amountNum < 0) {
      res.status(400).json({ success: false, message: 'Contribution amount must be non-negative.' });
      return;
    }

    const dateVal = sponsored_on ? sponsored_on.substring(0, 10) : new Date().toISOString().substring(0, 10);

    await query(
      `INSERT INTO TournamentSponsors (tournament_id, sponsor_id, contribution_amount, sponsored_on)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE contribution_amount = VALUES(contribution_amount), sponsored_on = VALUES(sponsored_on)`,
      [tournamentId, parseInt(sponsor_id, 10), amountNum, dateVal]
    );

    res.status(201).json({
      success: true,
      message: 'Sponsor attached to tournament successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function removeTournamentSponsor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tournamentId = parseInt(req.params.tournamentId as string, 10);
    const sponsorId = parseInt(req.params.sponsorId as string, 10);

    if (isNaN(tournamentId) || isNaN(sponsorId)) {
      res.status(400).json({ success: false, message: 'Invalid tournament or sponsor ID.' });
      return;
    }

    await query(
      'DELETE FROM TournamentSponsors WHERE tournament_id = ? AND sponsor_id = ?',
      [tournamentId, sponsorId]
    );

    res.json({
      success: true,
      message: 'Sponsor removed from tournament.'
    });
  } catch (err) {
    next(err);
  }
}
