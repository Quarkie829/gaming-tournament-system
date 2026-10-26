import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 4: Registration Management & Constraint Tests', () => {
  let adminToken = '';
  let soloPlayerToken = '';
  let captainToken = '';
  let nonCaptainToken = '';

  let soloTournId: number;
  let teamTournId: number;
  let createdTeamId: number;
  let soloRegId: number;
  let teamRegId: number;

  beforeAll(async () => {
    // Admin login
    const adminRes = await request(app).post('/api/auth/login').send({ login: 'admin', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Solo Player login (user 12)
    const soloRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer4', password: 'Password123!' });
    soloPlayerToken = soloRes.body.token;

    // Captain login (user 5: s1mple_king, captain of NAVI Reborn, team_id 2)
    const capRes = await request(app).post('/api/auth/login').send({ login: 's1mple_king', password: 'Password123!' });
    captainToken = capRes.body.token;

    // Non-captain login (user 6: b1t_pro, member of team 2)
    const nonCapRes = await request(app).post('/api/auth/login').send({ login: 'b1t_pro', password: 'Password123!' });
    nonCaptainToken = nonCapRes.body.token;

    // Create a fresh open Solo tournament
    const tourn1Res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 4, // Tekken 8
        title: `Tekken Test Tournament ${Date.now()}`,
        format: 'Double Elimination',
        start_date: '2026-11-20 10:00:00',
        end_date: '2026-11-25 18:00:00',
        registration_deadline: '2026-11-19 23:59:59',
        entry_fee: 15.00,
        max_participants: 16,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1
      });
    soloTournId = tourn1Res.body.tournament_id;

    // Create a fresh open Team tournament
    const tourn2Res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 2, // CS2
        title: `CS2 Major Test ${Date.now()}`,
        format: 'Single Elimination',
        start_date: '2026-11-20 10:00:00',
        end_date: '2026-11-25 18:00:00',
        registration_deadline: '2026-11-19 23:59:59',
        entry_fee: 50.00,
        max_participants: 8,
        status: 'Open',
        participation_type: 'Team',
        team_size: 2 // minimum 2 players
      });
    teamTournId = tourn2Res.body.tournament_id;

    // Create a dedicated team for this test
    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${captainToken}`)
      .send({ team_name: `Test Squad ${Date.now()}` });
    createdTeamId = teamRes.body.team_id;

    // Add b1t_pro so roster has 2 players
    await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({ username: 'b1t_pro', member_role: 'Starter' });
  });

  afterAll(async () => {
    if (soloRegId) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [soloRegId]);
    if (teamRegId) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [teamRegId]);
    if (soloTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [soloTournId]);
    if (teamTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [teamTournId]);
    if (createdTeamId) await pool.query('DELETE FROM Teams WHERE team_id = ?', [createdTeamId]);
  });

  it('should allow solo player to register for a Solo tournament', async () => {
    const res = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${soloPlayerToken}`)
      .send({ tournament_id: soloTournId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.registration_id).toBeDefined();
    soloRegId = res.body.registration_id;

    // Verify row satisfies exclusive-arc constraint in database
    const [rows]: any = await pool.query(
      'SELECT user_id, team_id, status FROM Registrations WHERE registration_id = ?',
      [soloRegId]
    );
    expect(rows.length).toBe(1);
    expect(rows[0].user_id).not.toBeNull();
    expect(rows[0].team_id).toBeNull();
    expect(rows[0].status).toBe('Pending');
  });

  it('should reject duplicate solo registration for the same tournament (409)', async () => {
    const res = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${soloPlayerToken}`)
      .send({ tournament_id: soloTournId });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject solo registration in a Team tournament', async () => {
    const res = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${soloPlayerToken}`)
      .send({ tournament_id: teamTournId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Team');
  });

  it('should allow captain to register team in a Team tournament', async () => {
    const res = await request(app)
      .post('/api/registrations/team')
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        tournament_id: teamTournId,
        team_id: createdTeamId
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    teamRegId = res.body.registration_id;

    // Verify row satisfies exclusive-arc constraint
    const [rows]: any = await pool.query(
      'SELECT user_id, team_id, status FROM Registrations WHERE registration_id = ?',
      [teamRegId]
    );
    expect(rows[0].user_id).toBeNull();
    expect(rows[0].team_id).toBe(createdTeamId);
  });

  it('should reject team registration by a non-captain (403)', async () => {
    const res = await request(app)
      .post('/api/registrations/team')
      .set('Authorization', `Bearer ${nonCaptainToken}`)
      .send({
        tournament_id: teamTournId,
        team_id: createdTeamId
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to review and approve a registration', async () => {
    const res = await request(app)
      .patch(`/api/registrations/${soloRegId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Approved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [rows]: any = await pool.query('SELECT status FROM Registrations WHERE registration_id = ?', [soloRegId]);
    expect(rows[0].status).toBe('Approved');
  });

  it('should allow player to cancel their registration without row deletion (history preserved)', async () => {
    const res = await request(app)
      .patch(`/api/registrations/${soloRegId}/cancel`)
      .set('Authorization', `Bearer ${soloPlayerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify row still exists in DB with status Cancelled
    const [rows]: any = await pool.query('SELECT status FROM Registrations WHERE registration_id = ?', [soloRegId]);
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('Cancelled');
  });
});
