import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { UserProfile } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = parseInt(req.params.id as string, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID.' });
      return;
    }

    const users = await query<UserProfile[]>(
      'SELECT user_id, username, email, country, role, created_at FROM Users WHERE user_id = ?',
      [userId]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Also get team memberships
    const teams = await query(
      `SELECT t.team_id, t.team_name, tm.member_role, tm.joined_at, (t.captain_id = tm.user_id) AS is_captain
       FROM TeamMembers tm
       JOIN Teams t ON t.team_id = tm.team_id
       WHERE tm.user_id = ?`,
      [userId]
    );

    // Also get user registrations
    const registrations = await query(
      `SELECT r.registration_id, r.tournament_id, r.status, r.registration_date,
              t.title AS tournament_title, g.game_name, tr.participation_type
       FROM Registrations r
       JOIN Tournaments t ON t.tournament_id = r.tournament_id
       JOIN Games g ON g.game_id = t.game_id
       LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
       WHERE r.user_id = ?
       ORDER BY r.registration_date DESC`,
      [userId]
    );

    res.json({
      success: true,
      user: users[0],
      teams,
      registrations
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.user_id;
    const targetUserId = parseInt(req.params.id as string, 10);

    if (isNaN(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid user ID.' });
      return;
    }

    // Only self or admin can update profile
    if (req.user?.role !== 'admin' && currentUserId !== targetUserId) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this profile.' });
      return;
    }

    const { username, email, country, password } = req.body;

    const updates: string[] = [];
    const params: any[] = [];

    if (username && username.trim().length >= 3) {
      updates.push('username = ?');
      params.push(username.trim());
    }

    if (email && email.trim().length >= 5) {
      updates.push('email = ?');
      params.push(email.trim().toLowerCase());
    }

    if (country) {
      updates.push('country = ?');
      params.push(country.trim());
    }

    if (password && password.length >= 6) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      updates.push('password_hash = ?');
      params.push(hash);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
      return;
    }

    params.push(targetUserId);
    await query(`UPDATE Users SET ${updates.join(', ')} WHERE user_id = ?`, params);

    const updated = await query<UserProfile[]>(
      'SELECT user_id, username, email, country, role, created_at FROM Users WHERE user_id = ?',
      [targetUserId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated[0]
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string;
    let sql = 'SELECT user_id, username, email, country, role, created_at FROM Users';
    const params: any[] = [];

    if (search) {
      sql += ' WHERE username LIKE ? OR email LIKE ?';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += ' ORDER BY username ASC LIMIT 50';

    const users = await query<UserProfile[]>(sql, params);
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    next(err);
  }
}
