import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 2: Game & Tournament Management Tests', () => {
  let adminToken = '';
  let playerToken = '';
  let createdGameId: number;
  let createdTournamentId: number;

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ login: 'admin', password: 'Password123!' });
    adminToken = adminLogin.body.token;

    // Login as player
    const playerLogin = await request(app)
      .post('/api/auth/login')
      .send({ login: 'soloplayer1', password: 'Password123!' });
    playerToken = playerLogin.body.token;
  });

  afterAll(async () => {
    // Cleanup created test tournament and game
    if (createdTournamentId) {
      await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [createdTournamentId]);
    }
    if (createdGameId) {
      await pool.query('DELETE FROM Games WHERE game_id = ?', [createdGameId]);
    }
  });

  it('should prevent non-admin player from creating a game (RBAC 403)', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        game_name: 'Test Game Unauthorized',
        genre: 'Action',
        platform: 'PC',
        publisher: 'Indie'
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to create a new game', async () => {
    const res = await request(app)
      .post('/api/games')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_name: `Dota 2 Championship Edition ${Date.now()}`,
        genre: 'MOBA',
        platform: 'PC',
        publisher: 'Valve'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.game.game_id).toBeDefined();
    createdGameId = res.body.game.game_id;
  });

  it('should list games', async () => {
    const res = await request(app).get('/api/games');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.games)).toBe(true);
    expect(res.body.games.length).toBeGreaterThan(0);
  });

  it('should reject tournament creation with invalid dates (end < start)', async () => {
    const res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: createdGameId,
        title: 'Invalid Date Tournament',
        format: 'Single Elimination',
        start_date: '2026-11-20 10:00:00',
        end_date: '2026-11-15 10:00:00', // Invalid: before start
        registration_deadline: '2026-11-14 10:00:00',
        entry_fee: 10,
        max_participants: 8,
        participation_type: 'Solo'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin to create a valid tournament with rules', async () => {
    const res = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: createdGameId,
        title: `Winter Clash ${Date.now()}`,
        format: 'Double Elimination',
        start_date: '2026-12-10 10:00:00',
        end_date: '2026-12-15 22:00:00',
        registration_deadline: '2026-12-08 23:59:59',
        entry_fee: 25.00,
        max_participants: 16,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1,
        min_age: 14,
        region_restriction: 'Global',
        rules_text: 'Fair play rules apply.'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.tournament_id).toBeDefined();
    createdTournamentId = res.body.tournament_id;
  });

  it('should get tournament details with rules and user eligibility', async () => {
    const res = await request(app)
      .get(`/api/tournaments/${createdTournamentId}`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tournament.tournament_id).toBe(createdTournamentId);
    expect(res.body.tournament.participation_type).toBe('Solo');
    expect(res.body.user_eligibility).toBeDefined();
    expect(res.body.user_eligibility.can_register_solo).toBe(true);
  });
});
