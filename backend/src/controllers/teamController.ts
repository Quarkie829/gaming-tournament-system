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

    let userRequest: any = null;
    let teamRequests: any[] = [];

    if (req.user) {
      const currentUserId = req.user.user_id;
      const userReqs = await query<any[]>(
        "SELECT * FROM TeamJoinRequests WHERE team_id = ? AND user_id = ? AND status = 'Pending' LIMIT 1",
        [teamId, currentUserId]
      );
      if (userReqs.length > 0) {
        userRequest = userReqs[0];
      }

      if (isUserCaptain || req.user?.role === 'admin') {
        teamRequests = await query<any[]>(
          `SELECT tr.*, u.username, u.email, u.country
           FROM TeamJoinRequests tr
           JOIN Users u ON u.user_id = tr.user_id
           WHERE tr.team_id = ? AND tr.status = 'Pending'
           ORDER BY tr.created_at DESC`,
          [teamId]
        );
      }
    }

    res.json({
      success: true,
      team,
      members,
      registrations,
      requests: teamRequests,
      user_request: userRequest,
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

    // Check tournament conflict: player cannot be added if team is in an active tournament where player is in another team
    const conflicts = await query<any[]>(
      `SELECT t.title AS tournament_title, t_other.team_name
       FROM Registrations r_this
       JOIN Tournaments t ON t.tournament_id = r_this.tournament_id
       JOIN Registrations r_other ON r_other.tournament_id = r_this.tournament_id
       JOIN TeamMembers tm_other ON tm_other.team_id = r_other.team_id
       JOIN Teams t_other ON t_other.team_id = tm_other.team_id
       WHERE r_this.team_id = ?
         AND r_other.team_id != ?
         AND tm_other.user_id = ?
         AND r_this.status IN ('Approved', 'Pending')
         AND r_other.status IN ('Approved', 'Pending')
         AND t.status IN ('Open', 'Ongoing', 'Upcoming')`,
      [teamId, teamId, targetUserId]
    );

    if (conflicts.length > 0) {
      res.status(409).json({
        success: false,
        message: `Cannot add player: User is already competing in active tournament "${conflicts[0].tournament_title}" with team "${conflicts[0].team_name}". Players cannot be on multiple teams in the same tournament.`
      });
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

// ==========================================
// TEAM JOIN REQUESTS & INVITATIONS
// ==========================================

export async function requestToJoinTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (isNaN(teamId)) {
      res.status(400).json({ success: false, message: 'Invalid team ID.' });
      return;
    }

    // Verify team exists
    const teams = await query<any[]>('SELECT team_id, team_name, captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    // Check if already in the team
    const members = await query<any[]>('SELECT user_id FROM TeamMembers WHERE team_id = ? AND user_id = ?', [teamId, userId]);
    if (members.length > 0) {
      res.status(400).json({ success: false, message: 'You are already a member of this team.' });
      return;
    }

    // Check if user already has a pending join request or invitation
    const existing = await query<any[]>(
      "SELECT request_id, type FROM TeamJoinRequests WHERE team_id = ? AND user_id = ? AND status = 'Pending'",
      [teamId, userId]
    );
    if (existing.length > 0) {
      const typeDesc = existing[0].type === 'Invitation'
        ? 'You have a pending invitation to join this team! Check your profile to accept.'
        : 'You already have a pending join request for this team.';
      res.status(409).json({ success: false, message: typeDesc });
      return;
    }

    const insertResult: any = await query(
      "INSERT INTO TeamJoinRequests (team_id, user_id, type, member_role, status, created_at) VALUES (?, ?, 'Request', 'Starter', 'Pending', NOW())",
      [teamId, userId]
    );

    res.status(201).json({
      success: true,
      message: `Join request submitted to team "${teams[0].team_name}". Waiting for captain approval.`,
      request_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function invitePlayerToTeam(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);
    const { username, user_id, member_role } = req.body;
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Verify team and captain permissions
    const teams = await query<any[]>('SELECT team_id, team_name, captain_id FROM Teams WHERE team_id = ?', [teamId]);
    if (teams.length === 0) {
      res.status(404).json({ success: false, message: 'Team not found.' });
      return;
    }

    if (teams[0].captain_id !== currentUserId && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Only the team captain can invite players.' });
      return;
    }

    // Resolve target user
    let targetUserId = user_id;
    let targetUsername = username;
    if (!targetUserId && username) {
      const users = await query<any[]>('SELECT user_id, username FROM Users WHERE username = ?', [username.trim()]);
      if (users.length === 0) {
        res.status(404).json({ success: false, message: `User "${username}" not found.` });
        return;
      }
      targetUserId = users[0].user_id;
      targetUsername = users[0].username;
    }

    if (!targetUserId) {
      res.status(400).json({ success: false, message: 'Please specify username or user_id to invite.' });
      return;
    }

    // Check if already in this team
    const members = await query<any[]>('SELECT user_id FROM TeamMembers WHERE team_id = ? AND user_id = ?', [teamId, targetUserId]);
    if (members.length > 0) {
      res.status(409).json({ success: false, message: `Player "${targetUsername}" is already a member of this team.` });
      return;
    }

    // Check if already has a pending invitation or request
    const existing = await query<any[]>(
      "SELECT request_id, type FROM TeamJoinRequests WHERE team_id = ? AND user_id = ? AND status = 'Pending'",
      [teamId, targetUserId]
    );

    if (existing.length > 0) {
      if (existing[0].type === 'Request') {
        // Player already requested to join! Accept the request directly
        await withTransaction(async (conn) => {
          await conn.execute(
            'INSERT INTO TeamMembers (team_id, user_id, member_role, joined_at) VALUES (?, ?, ?, NOW())',
            [teamId, targetUserId, member_role || 'Starter']
          );
          await conn.execute(
            "UPDATE TeamJoinRequests SET status = 'Accepted', member_role = ? WHERE request_id = ?",
            [member_role || 'Starter', existing[0].request_id]
          );
        });
        res.status(200).json({
          success: true,
          message: `Player "${targetUsername}" had a pending join request which was approved! Player is now in roster.`
        });
        return;
      } else {
        res.status(409).json({ success: false, message: `An invitation has already been sent to "${targetUsername}".` });
        return;
      }
    }

    const insertResult: any = await query(
      "INSERT INTO TeamJoinRequests (team_id, user_id, type, member_role, status, created_at) VALUES (?, ?, 'Invitation', ?, 'Pending', NOW())",
      [teamId, targetUserId, member_role || 'Starter']
    );

    res.status(201).json({
      success: true,
      message: `Invitation sent to "${targetUsername}". Waiting for player to accept.`,
      request_id: insertResult.insertId
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeamRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const teamId = parseInt(req.params.id as string, 10);

    if (isNaN(teamId)) {
      res.status(400).json({ success: false, message: 'Invalid team ID.' });
      return;
    }

    const sql = `
      SELECT tr.request_id, tr.team_id, tr.user_id, tr.type, tr.member_role, tr.status, tr.created_at,
             u.username, u.email, u.country
      FROM TeamJoinRequests tr
      JOIN Users u ON u.user_id = tr.user_id
      WHERE tr.team_id = ?
      ORDER BY tr.created_at DESC
    `;

    const requests = await query<any[]>(sql, [teamId]);

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTeamRequests(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.user_id;
    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // Invitations sent to me
    const invitations = await query<any[]>(
      `SELECT tr.request_id, tr.team_id, tr.user_id, tr.type, tr.member_role, tr.status, tr.created_at,
              t.team_name, t.captain_id, cap.username AS captain_username
       FROM TeamJoinRequests tr
       JOIN Teams t ON t.team_id = tr.team_id
       JOIN Users cap ON cap.user_id = t.captain_id
       WHERE tr.user_id = ? AND tr.type = 'Invitation'
       ORDER BY tr.created_at DESC`,
      [currentUserId]
    );

    // Requests sent by me
    const sentRequests = await query<any[]>(
      `SELECT tr.request_id, tr.team_id, tr.user_id, tr.type, tr.member_role, tr.status, tr.created_at,
              t.team_name, t.captain_id, cap.username AS captain_username
       FROM TeamJoinRequests tr
       JOIN Teams t ON t.team_id = tr.team_id
       JOIN Users cap ON cap.user_id = t.captain_id
       WHERE tr.user_id = ? AND tr.type = 'Request'
       ORDER BY tr.created_at DESC`,
      [currentUserId]
    );

    res.json({
      success: true,
      invitations,
      sent_requests: sentRequests
    });
  } catch (err) {
    next(err);
  }
}

export async function respondToRequest(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = parseInt(req.params.requestId as string, 10);
    const { action } = req.body; // 'accept' | 'decline' | 'cancel'
    const currentUserId = req.user?.user_id;

    if (!currentUserId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (!['accept', 'decline', 'cancel'].includes(action)) {
      res.status(400).json({ success: false, message: 'Action must be "accept", "decline", or "cancel".' });
      return;
    }

    const rows = await query<any[]>(
      `SELECT tr.*, t.team_name, t.captain_id, u.username
       FROM TeamJoinRequests tr
       JOIN Teams t ON t.team_id = tr.team_id
       JOIN Users u ON u.user_id = tr.user_id
       WHERE tr.request_id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: 'Join request / invitation not found.' });
      return;
    }

    const reqData = rows[0];

    if (reqData.status !== 'Pending') {
      res.status(400).json({ success: false, message: `This request has already been ${reqData.status.toLowerCase()}.` });
      return;
    }

    const isCaptain = currentUserId === reqData.captain_id;
    const isTargetUser = currentUserId === reqData.user_id;
    const isAdmin = req.user?.role === 'admin';

    // Permission rules:
    // If Invitation: target user accepts/declines; captain can cancel.
    // If Request: captain accepts/declines; target user can cancel.
    if (reqData.type === 'Invitation') {
      if (action === 'cancel' && !isCaptain && !isAdmin) {
        res.status(403).json({ success: false, message: 'Only team captain can cancel this invitation.' });
        return;
      }
      if ((action === 'accept' || action === 'decline') && !isTargetUser && !isAdmin) {
        res.status(403).json({ success: false, message: 'Only the invited player can accept or decline this invitation.' });
        return;
      }
    } else {
      // Request
      if (action === 'cancel' && !isTargetUser && !isAdmin) {
        res.status(403).json({ success: false, message: 'Only the requesting player can cancel this request.' });
        return;
      }
      if ((action === 'accept' || action === 'decline') && !isCaptain && !isAdmin) {
        res.status(403).json({ success: false, message: 'Only the team captain can accept or decline join requests.' });
        return;
      }
    }

    if (action === 'accept') {
      // 1. Check tournament conflict: player cannot join team if team is in an active tournament where player is in another team
      const conflicts = await query<any[]>(
        `SELECT t.title AS tournament_title, t_other.team_name
         FROM Registrations r_this
         JOIN Tournaments t ON t.tournament_id = r_this.tournament_id
         JOIN Registrations r_other ON r_other.tournament_id = r_this.tournament_id
         JOIN TeamMembers tm_other ON tm_other.team_id = r_other.team_id
         JOIN Teams t_other ON t_other.team_id = tm_other.team_id
         WHERE r_this.team_id = ?
           AND r_other.team_id != ?
           AND tm_other.user_id = ?
           AND r_this.status IN ('Approved', 'Pending')
           AND r_other.status IN ('Approved', 'Pending')
           AND t.status IN ('Open', 'Ongoing', 'Upcoming')`,
        [reqData.team_id, reqData.team_id, reqData.user_id]
      );

      if (conflicts.length > 0) {
        res.status(409).json({
          success: false,
          message: `Cannot accept: Player "${reqData.username}" is already competing in active tournament "${conflicts[0].tournament_title}" with team "${conflicts[0].team_name}". Players cannot be on multiple teams in the same tournament.`
        });
        return;
      }

      await withTransaction(async (conn) => {
        // Check if already in team
        const [mem]: any = await conn.execute(
          'SELECT user_id FROM TeamMembers WHERE team_id = ? AND user_id = ?',
          [reqData.team_id, reqData.user_id]
        );
        if (mem.length === 0) {
          await conn.execute(
            'INSERT INTO TeamMembers (team_id, user_id, member_role, joined_at) VALUES (?, ?, ?, NOW())',
            [reqData.team_id, reqData.user_id, reqData.member_role || 'Starter']
          );
        }

        await conn.execute("UPDATE TeamJoinRequests SET status = 'Accepted' WHERE request_id = ?", [requestId]);
        // Cancel any other pending request/invitation between this user and this team
        await conn.execute(
          "UPDATE TeamJoinRequests SET status = 'Cancelled' WHERE team_id = ? AND user_id = ? AND request_id != ? AND status = 'Pending'",
          [reqData.team_id, reqData.user_id, requestId]
        );
      });

      res.json({
        success: true,
        message: `Player "${reqData.username}" is now a member of "${reqData.team_name}".`
      });
      return;
    }

    const newStatus = action === 'decline' ? 'Declined' : 'Cancelled';
    await query('UPDATE TeamJoinRequests SET status = ? WHERE request_id = ?', [newStatus, requestId]);

    res.json({
      success: true,
      message: `Request successfully ${newStatus.toLowerCase()}.`
    });
  } catch (err) {
    next(err);
  }
}
