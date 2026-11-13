import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 6: Payments, Prizes, Sponsors & Contributions Tests', () => {
  let adminToken = '';
  let playerToken = '';
  let otherPlayerToken = '';
  let testTournId: number;
  let otherTournId: number;
  let testRegId: number;
  let otherRegId: number;
  let createdPrizeId: number;
  let createdSponsorId: number;
  let createdPaymentId: number;

  beforeAll(async () => {
    // Admin login
    const adminRes = await request(app).post('/api/auth/login').send({ login: 'admin', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Solo Player login (user 9: soloplayer1)
    const pRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer1', password: 'Password123!' });
    playerToken = pRes.body.token;

    // Other player login (user 10: soloplayer2)
    const oRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer2', password: 'Password123!' });
    otherPlayerToken = oRes.body.token;

    // Create a dedicated tournament for this test suite
    const tournRes = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 3, // League of Legends
        title: `Finance Test Tournament ${Date.now()}`,
        format: 'Single Elimination',
        start_date: '2026-12-15 10:00:00',
        end_date: '2026-12-20 20:00:00',
        registration_deadline: '2026-12-14 23:59:59',
        entry_fee: 500.00,
        max_participants: 8,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1
      });
    testTournId = tournRes.body.tournament_id;

    // Other tournament to test cross-tournament prize check
    const otherT = await request(app)
      .post('/api/tournaments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        game_id: 4,
        title: `Other Finance Tournament ${Date.now()}`,
        format: 'Single Elimination',
        start_date: '2026-12-15 10:00:00',
        end_date: '2026-12-20 20:00:00',
        registration_deadline: '2026-12-14 23:59:59',
        entry_fee: 250.00,
        max_participants: 8,
        status: 'Open',
        participation_type: 'Solo',
        team_size: 1
      });
    otherTournId = otherT.body.tournament_id;

    // Register user 9 into testTournId
    const regRes = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ tournament_id: testTournId });
    testRegId = regRes.body.registration_id;

    // Register user 10 into otherTournId
    const oReg = await request(app)
      .post('/api/registrations/solo')
      .set('Authorization', `Bearer ${otherPlayerToken}`)
      .send({ tournament_id: otherTournId });
    otherRegId = oReg.body.registration_id;
  });

  afterAll(async () => {
    if (createdPaymentId) await pool.query('DELETE FROM Payments WHERE payment_id = ?', [createdPaymentId]);
    if (createdPrizeId) await pool.query('DELETE FROM Prizes WHERE prize_id = ?', [createdPrizeId]);
    if (createdSponsorId) {
      await pool.query('DELETE FROM TournamentSponsors WHERE sponsor_id = ?', [createdSponsorId]);
      await pool.query('DELETE FROM Sponsors WHERE sponsor_id = ?', [createdSponsorId]);
    }
    if (testRegId) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [testRegId]);
    if (otherRegId) await pool.query('DELETE FROM Registrations WHERE registration_id = ?', [otherRegId]);
    if (testTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [testTournId]);
    if (otherTournId) await pool.query('DELETE FROM Tournaments WHERE tournament_id = ?', [otherTournId]);
  });

  it('should record an entry fee payment in INR for a registration', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        registration_id: testRegId,
        amount: 500.00,
        payment_method: 'UPI',
        transaction_reference: `UPI_TEST_${Date.now()}`
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.payment_id).toBeDefined();
    createdPaymentId = res.body.payment_id;

    // Verify payment in database
    const [rows]: any = await pool.query('SELECT amount, payment_status FROM Payments WHERE payment_id = ?', [createdPaymentId]);
    expect(Number(rows[0].amount)).toBe(500.00);
    expect(rows[0].payment_status).toBe('Success');
  });

  it('should reject non-owner from recording payment for another player (403)', async () => {
    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${otherPlayerToken}`)
      .send({
        registration_id: testRegId, // Belongs to user 9, not user 10
        amount: 500.00,
        payment_method: 'Card'
      });

    expect(res.status).toBe(403);
  });

  it('should allow admin to update payment status', async () => {
    const res = await request(app)
      .patch(`/api/payments/${createdPaymentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payment_status: 'Refunded' });

    expect(res.status).toBe(200);

    const [rows]: any = await pool.query('SELECT payment_status FROM Payments WHERE payment_id = ?', [createdPaymentId]);
    expect(rows[0].payment_status).toBe('Refunded');
  });

  it('should allow admin to define tournament prize with amount in INR', async () => {
    const res = await request(app)
      .post('/api/prizes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournament_id: testTournId,
        placement: 1,
        prize_amount: 15000.00,
        description: 'First Place Winner Cash Trophy'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.prize_id).toBeDefined();
    createdPrizeId = res.body.prize_id;

    const [rows]: any = await pool.query('SELECT prize_amount FROM Prizes WHERE prize_id = ?', [createdPrizeId]);
    expect(Number(rows[0].prize_amount)).toBe(15000.00);
  });

  it('should reject duplicate prize placement for the same tournament (409)', async () => {
    const res = await request(app)
      .post('/api/prizes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tournament_id: testTournId,
        placement: 1, // Duplicate 1st place
        prize_amount: 7500.00,
        description: 'Duplicate 1st prize'
      });

    expect(res.status).toBe(409);
  });

  it('should reject awarding prize to a registration from a different tournament (cross-tournament trigger)', async () => {
    const res = await request(app)
      .patch(`/api/prizes/${createdPrizeId}/award`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        awarded_registration_id: otherRegId // Belongs to otherTournId
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('different tournament');
  });

  it('should allow admin to award prize to a valid tournament participant', async () => {
    const res = await request(app)
      .patch(`/api/prizes/${createdPrizeId}/award`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        awarded_registration_id: testRegId
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [rows]: any = await pool.query('SELECT awarded_registration_id FROM Prizes WHERE prize_id = ?', [createdPrizeId]);
    expect(rows[0].awarded_registration_id).toBe(testRegId);
  });

  it('should allow admin to create a sponsor', async () => {
    const res = await request(app)
      .post('/api/sponsors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sponsor_name: `Monster Energy India ${Date.now()}`,
        contact_email: 'esports@monster.in',
        country: 'India'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.sponsor_id).toBeDefined();
    createdSponsorId = res.body.sponsor_id;
  });

  it('should allow admin to attach sponsor to tournament with contribution in INR', async () => {
    const res = await request(app)
      .post(`/api/tournaments/${testTournId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sponsor_id: createdSponsorId,
        contribution_amount: 50000.00,
        sponsored_on: '2026-12-01'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const [rows]: any = await pool.query(
      'SELECT contribution_amount FROM TournamentSponsors WHERE tournament_id = ? AND sponsor_id = ?',
      [testTournId, createdSponsorId]
    );
    expect(Number(rows[0].contribution_amount)).toBe(50000.00);
  });
});
