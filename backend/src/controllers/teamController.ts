import { Request, Response, NextFunction } from 'express';
import { query, withTransaction } from '../config/db';
import { Team, TeamMember } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';

export async function listTeams(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { mine, search } = req.query;
    const currentUserId = req.user?.user_id;

    let sql = `
      SELECT t.team_id, t.team_name, t.captain_id, t.created_at,
             cap.username AS captain_username, cap.email AS captain_email,
             COUNT(DISTINCT tm.user_id) AS member_count
      FROM Teams t
      JOIN Users cap ON cap.user_id = t.captain_id
      LEFT JOIN TeamMembers tm ON tm.team_id = t.team_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (mine === 'true' && currentUserId) {
      sql += ' AND t.team_id IN (SELECT team_id FROM TeamMembers WHERE user_id = ?)';
      params.push(currentUserId);
    }

    if (search) {
      sql += ' AND t.team_name LIKE ?';
      params.push(`%${(search as string).trim()}%`);
    }

    sql += ' GROUP BY t.team_id ORDER BY t.team_name ASC';

    const teams = await query<Team[]>(sql, params);

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    if (isNaN(teamId)) {
      res.status(400).json({ success: false, message: 'Invalid team ID.' });
      return;
    }

    // Team header details
    const teams = await query<Team[]>(
      `SELECT t.team_id, t.team_name, t.captain_id, t.created_at,
              cap.username AS captain_username, cap.email AS captain_email
       FROM Teams t
       JOIN Users cap ON cap.user_id = t.captain_id
       WHERE t.team_id = ?`,
      [teamId]
    );

    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    const team = teams[0];

    // Team members roster query (Matching page 17 of project document)
    const membersSql = `
      SELECT tm.team_id, tm.user_id, tm.member_role, tm.joined_at,
             u.username, u.email, u.country,
             (u.user_id = t.captain_id) AS is_captain
      FROM Teams t
      JOIN TeamMembers tm ON tm.team_id = t.team_id
      JOIN Users u ON u.user_id = tm.user_id
      WHERE t.team_id = ?
      ORDER BY is_captain DESC, tm.joined_at ASC
    `;
    const members = await query<TeamMember[]>(membersSql, [teamId]);

    // Team tournament registration history
    const registrationsSql = `
      SELECT r.registration_id, r.tournament_id, r.registration_date, r.status,
             t.title AS tournament_title, g.game_name, tr.participation_type
      FROM Registrations r
      JOIN Tournaments t ON t.tournament_id = r.tournament_id
      JOIN Games g ON g.game_id = t.game_id
      LEFT JOIN TournamentRules tr ON tr.tournament_id = t.tournament_id
      WHERE r.team_id = ?
      ORDER BY r.registration_date DESC
    `;
    const registrations = await query(registrationsSql, [teamId]);

    const isUserCaptain = req.user?.user_id === team.captain_id;
    const isUserMember = members.some((m) => m.user_id === req.user?.user_id);

    res.json({
      success: true,
      team,
      members,
      registrations,
      user_permissions: {
        is_captain: isUserCaptain,
        is_member: isUserMember,
        can_manage: isUserCaptain || req.user?.role === 'admin'
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { team_name } = req.body;
    const captainId = req.user?.user_id;

    if (!team_name || team_name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Team name must be at least 2 characters long.'
      });
      return;
    }

    if (!captainId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Atomically create team and insert captain into TeamMembers
    const newTeamId = await withTransaction(async (conn) => {
      const [teamResult]: any = await conn.execute(
        'INSERT INTO Teams (team_name, captain_id) VALUES (?, ?)',
        [team_name.trim(), captainId]
      );

      const teamId = teamResult.insertId;

      await conn.execute(
        'INSERT INTO TeamMembers (team_id, user_id, member_role) VALUES (?, ?, ?)',
        [teamId, captainId, 'Captain']
      );

      return teamId;
    });

    res.status(201).json({
      success: true,
      message: 'Team created successfully.',
      team_id: newTeamId,
      team_name: team_name.trim()
    });
  } catch (err) {
    next(err);
  }
}

export async function addTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const { user_id, username, member_role } = req.body;
    const currentUserId = req.user?.user_id;

    if (isNaN(teamId)) {
      res.status(400).json({ success: false, message: 'Invalid team ID.' });
      return;
    }

    // Verify team exists and requester is captain or admin
    const teams = await query<Team[]>('SELECT captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    if (teams[0].captain_id !== currentUserId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the team captain can add members.' });
      return;
    }

    // Resolve target user
    let targetUserId = user_id;
    if (!targetUserId && username) {
      const users = await query<any[]>('SELECT user_id FROM Users WHERE username = ?', [username.trim()]);
      if (users.length === 0) {
        res.status(404).json({ success: false, message: `User "${username}" not found.` });
        return;
      }
      targetUserId = users[0].user_id;
    }

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'Please specify user_id or username to add.' });
      return;
    }

    // Check if already in this team
    const existing = await query<any[]>(
      'SELECT user_id FROM TeamMembers WHERE team_id = ? AND user_id = ?',
      [teamId, targetUserId]
    );

    if (existing.length > 0) {
      res.status(409).json({ success: false, message: 'User is already a member of this team.' });
      return;
    }

    await query(
      'INSERT INTO TeamMembers (team_id, user_id, member_role) VALUES (?, ?, ?)',
      [teamId, targetUserId, member_role || 'Starter']
    );

    res.status(201).json({
      success: true,
      message: 'Member added to team successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function removeTeamMember(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const targetUserId = parseInt(req.params.userId as string, 10);
    const currentUserId = req.user?.user_id;

    if (isNaN(teamId) || isNaN(targetUserId)) {
      res.status(400).json({ success: false, message: 'Invalid team or user ID.' });
      return;
    }

    const teams = await query<Team[]>('SELECT captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    const captainId = teams[0].captain_id;

    // Check permissions: captain can remove anyone except themselves; player can leave themselves
    const isCaptain = currentUserId === captainId;
    const isSelf = currentUserId === targetUserId;
    const isAdmin = req.user?.role === 'admin';

    if (!isCaptain && !isSelf && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to remove this member.' });
      return;
    }

    // Captain cannot leave directly without transferring captaincy or deleting team
    if (targetUserId === captainId) {
      res.status(400).json({
        success: false,
        message: 'Captain cannot leave team. Transfer captaincy to another member first or disband the team.'
      });
      return;
    }

    await query('DELETE FROM TeamMembers WHERE team_id = ? AND user_id = ?', [teamId, targetUserId]);

    res.json({
      success: true,
      message: isSelf ? 'You have left the team.' : 'Member removed from team successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const targetUserId = parseInt(req.params.userId as string, 10);
    const { member_role } = req.body;
    const currentUserId = req.user?.user_id;

    if (!member_role) {
      res.status(400).json({ success: false, message: 'Role is required.' });
      return;
    }

    const teams = await query<Team[]>('SELECT captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    if (teams[0].captain_id !== currentUserId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only team captain can change roles.' });
      return;
    }

    // If role changed to Captain, transfer captaincy in both Teams and TeamMembers
    if (member_role.toLowerCase() === 'captain') {
      await withTransaction(async (conn) => {
        // Demote previous captain in TeamMembers to Starter
        await conn.execute(
          'UPDATE TeamMembers SET member_role = ? WHERE team_id = ? AND user_id = ?',
          ['Starter', teamId, teams[0].captain_id]
        );
        // Promote new captain in TeamMembers
        await conn.execute(
          'UPDATE TeamMembers SET member_role = ? WHERE team_id = ? AND user_id = ?',
          ['Captain', teamId, targetUserId]
        );
        // Update captain_id in Teams
        await conn.execute('UPDATE Teams SET captain_id = ? WHERE team_id = ?', [targetUserId, teamId]);
      });

      res.json({
        success: true,
        message: 'Captaincy transferred successfully.'
      });
      return;
    }

    await query(
      'UPDATE TeamMembers SET member_role = ? WHERE team_id = ? AND user_id = ?',
      [member_role, teamId, targetUserId]
    );

    res.json({
      success: true,
      message: 'Member role updated successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const currentUserId = req.user?.user_id;

    const teams = await query<Team[]>('SELECT captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    if (teams[0].captain_id !== currentUserId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only team captain can disband the team.' });
      return;
    }

    await query('DELETE FROM Teams WHERE team_id = ?', [teamId]);

    res.json({
      success: true,
      message: 'Team disbanded successfully.'
    });
  } catch (err) {
    next(err);
  }
}
