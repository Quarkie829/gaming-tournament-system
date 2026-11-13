import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 5: Match Scheduling, Results, Disputes & Corrections Tests', () => {
  let adminToken = '';
  let playerToken = '';
  let outsiderToken = '';
  let testTournId: number;
  let otherTournId: number;
  let testMatchId: number;
  let reg1Id: number;
  let reg2Id: number;
  let outsiderRegId: number;
  let createdDisputeId: number;

  beforeAll(async () => {
    // Admin login
    const adminRes = await request(app).post('/api/auth/login').send({ login: 'admin', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Solo Player login (user 9: soloplayer1)
    const pRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer1', password: 'Password123!' });
    playerToken = pRes.body.token;

    // Outsider Player login (user 10: soloplayer2)
    const outRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer2', password: 'Password123!' });
    outsiderToken = outRes.body.token;

    // Create a dedicated tournament for this test suite
    const tournRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 1, // Valorant
        title: `Match Test Tournament ${Date.now()}`,
        format: 'Single Elimination',
        start_date: '2026-12-01 10:00:00',
        end_date: '2026-12-05 20:00:00',
        registration_deadline: '2026-11-30 23:59:59',
        entry_fee: 100.00,
        max_participants: 8,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1
      });
    testTournId = tournRes.body.tournament_id;

    // Create another tournament to test cross-tournament validation
    const otherRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 2,
        title: `Other Tournament ${Date.now()}`,
        format: 'Single Elimination',
        start_date: '2026-12-01 10:00:00',
        end_date: '2026-12-05 20:00:00',
        registration_deadline: '2026-11-30 23:59:59',
        entry_fee: 50.00,
        max_participants: 8,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1
      });
    otherTournId = otherRes.body.tournament_id;

    // Register user 9 and user 11 in testTournId, and approve them
    const r1 = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ tournament_id: testTournId });
    reg1Id = r1.body.registration_id;
    await request(app).patch(`/api/registrations/${reg1Id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'Approved' });

    // Login as soloplayer3 (user 11)
    const p3Res = await request(app).post('/api/auth/login').send({ login: 'soloplayer3', password: 'Password123!' });
    const r2 = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${p3Res.body.token}`)
      .send({ tournament_id: testTournId });
    reg2Id = r2.body.registration_id;
    await request(app).patch(`/api/registrations/${reg2Id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'Approved' });

    // Register outsider (user 10) in otherTournId
    const rOut = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ tournament_id: otherTournId });
    outsiderRegId = rOut.body.registration_id;
    await request(app).patch(`/api/registrations/${outsiderRegId}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'Approved' });
  });

  afterAll(async () => {
    if (testMatchId) await pool.query('DELETE FROM Matches WHERE match_id = ?', [testMatchId]);
    if (reg1Id) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [reg1Id]);
    if (reg2Id) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [reg2Id]);
    if (outsiderRegId) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [outsiderRegId]);
    if (testTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [testTournId]);
    if (otherTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [otherTournId]);
  });

  it('should prevent non-admin player from creating a match (403)', async () => {
    const res = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        tournament_id: testTournId,
        round_name: 'Round of 8',
        match_number: 1,
        scheduled_time: '2026-12-01 11:00:00'
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to create a match', async () => {
    const res = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournament_id: testTournId,
        round_name: 'Quarterfinals',
        match_number: 1,
        scheduled_time: '2026-12-01 12:00:00',
        status: 'Scheduled'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.match_id).toBeDefined();
    testMatchId = res.body.match_id;
  });

  it('should reject duplicate match number within the same round (409)', async () => {
    const res = await request(app)
      .post('/api/matches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournament_id: testTournId,
        round_name: 'Quarterfinals',
        match_number: 1, // Duplicate
        scheduled_time: '2026-12-01 14:00:00'
      });

    expect(res.status).toBe(409);
  });

  it('should reject assigning participant from a different tournament (trigger check)', async () => {
    const res = await request(app)
      .post(`/api/matches/${testMatchId}/participants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration_id: outsiderRegId, // Belongs to otherTournId
        slot_number: 1
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('different tournament');
  });

  it('should allow admin to assign approved participants to match slots', async () => {
    // Slot 1
    const res1 = await request(app)
      .post(`/api/matches/${testMatchId}/participants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration_id: reg1Id,
        slot_number: 1
      });
    expect(res1.status).toBe(201);

    // Slot 2
    const res2 = await request(app)
      .post(`/api/matches/${testMatchId}/participants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration_id: reg2Id,
        slot_number: 2
      });
    expect(res2.status).toBe(201);

    // Verify slots in database
    const [rows]: any = await pool.query(
      'SELECT slot_number, registration_id FROM MatchParticipants WHERE match_id = ? ORDER BY slot_number ASC',
      [testMatchId]
    );
    expect(rows.length).toBe(2);
    expect(rows[0].slot_number).toBe(1);
    expect(rows[1].slot_number).toBe(2);
  });

  it('should allow admin to record match results', async () => {
    const res = await request(app)
      .post(`/api/matches/${testMatchId}/results`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        results: [
          { registration_id: reg1Id, score: 13, outcome: 'Win' },
          { registration_id: reg2Id, score: 9, outcome: 'Loss' }
        ],
        mark_completed: true
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify results in database
    const [results]: any = await pool.query(
      'SELECT score, outcome FROM MatchResults WHERE match_id = ? AND registration_id = ?',
      [testMatchId, reg1Id]
    );
    expect(results[0].score).toBe(13);
    expect(results[0].outcome).toBe('Win');
  });

  it('should reject dispute by a non-participant of the match (403)', async () => {
    const res = await request(app)
      .post(`/api/matches/${testMatchId}/disputes`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        reason: 'Unauthorized dispute attempt'
      });

    expect(res.status).toBe(403);
  });

  it('should allow match participant to raise a dispute', async () => {
    const res = await request(app)
      .post(`/api/matches/${testMatchId}/disputes`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        reason: 'Opponent connection glitch during round 20 overtime'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.dispute_id).toBeDefined();
    createdDisputeId = res.body.dispute_id;

    // Verify dispute in database
    const [disputes]: any = await pool.query('SELECT status FROM MatchDisputes WHERE dispute_id = ?', [createdDisputeId]);
    expect(disputes[0].status).toBe('Open');
  });

  it('should allow admin to review dispute and update status', async () => {
    const res = await request(app)
      .patch(`/api/matches/disputes/${createdDisputeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Under Review' });

    expect(res.status).toBe(200);

    const [disputes]: any = await pool.query('SELECT status FROM MatchDisputes WHERE dispute_id = ?', [createdDisputeId]);
    expect(disputes[0].status).toBe('Under Review');
  });

  it('should allow admin to record a result correction with audit preservation', async () => {
    const res = await request(app)
      .post(`/api/matches/${testMatchId}/corrections`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        registration_id: reg1Id,
        new_score: 14, // Corrected from 13 to 14
        dispute_id: createdDisputeId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.correction_id).toBeDefined();

    // Verify ResultCorrections row
    const [corrections]: any = await pool.query(
      'SELECT old_score, new_score FROM ResultCorrections WHERE match_id = ? AND registration_id = ?',
      [testMatchId, reg1Id]
    );
    expect(corrections.length).toBe(1);
    expect(corrections[0].old_score).toBe(13);
    expect(corrections[0].new_score).toBe(14);

    // Verify dispute resolved
    const [disputes]: any = await pool.query('SELECT status FROM MatchDisputes WHERE dispute_id = ?', [createdDisputeId]);
    expect(disputes[0].status).toBe('Resolved');
  });
});
