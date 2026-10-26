import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 3: Team Management Tests', () => {
  let captainToken = '';
  let memberToken = '';
  let otherPlayerToken = '';
  let captainId: number;
  let memberId: number;
  let otherPlayerId: number;
  let createdTeamId: number;

  beforeAll(async () => {
    // Shroud (user_id 3) as captain
    const capRes = await request(app).post('/api/auth/login').send({ login: 'shroud_jr', password: 'Password123!' });
    captainToken = capRes.body.token;
    captainId = capRes.body.user.user_id;

    // Solo1 (user_id 9)
    const memRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer1', password: 'Password123!' });
    memberToken = memRes.body.token;
    memberId = memRes.body.user.user_id;

    // Solo2 (user_id 10)
    const otherRes = await request(app).post('/api/auth/login').send({ login: 'soloplayer2', password: 'Password123!' });
    otherPlayerToken = otherRes.body.token;
    otherPlayerId = otherRes.body.user.user_id;
  });

  afterAll(async () => {
    if (createdTeamId) {
      await pool.query('DELETE FROM Teams WHERE team_id = ?', [createdTeamId]);
    }
  });

  it('should allow a player to create a team and automatically become Captain in Teams & TeamMembers', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        team_name: `Valiant Strike ${Date.now()}`
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.team_id).toBeDefined();
    createdTeamId = res.body.team_id;

    // Verify team members table has captain
    const [rows]: any = await pool.query(
      'SELECT member_role FROM TeamMembers WHERE team_id = ? AND user_id = ?',
      [createdTeamId, captainId]
    );
    expect(rows.length).toBe(1);
    expect(rows[0].member_role).toBe('Captain');
  });

  it('should return team roster with captain designation', async () => {
    const res = await request(app)
      .get(`/api/teams/${createdTeamId}`)
      .set('Authorization', `Bearer ${captainToken}`);

    expect(res.status).toBe(200);
    expect(res.body.team.team_id).toBe(createdTeamId);
    expect(res.body.members.length).toBe(1);
    expect(res.body.members[0].is_captain).toBeTruthy();
    expect(res.body.user_permissions.is_captain).toBe(true);
  });

  it('should allow captain to add a member to the team', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        user_id: memberId,
        member_role: 'Starter'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify member added
    const getRes = await request(app).get(`/api/teams/${createdTeamId}`);
    expect(getRes.body.members.length).toBe(2);
  });

  it('should prevent non-captain from adding members (403)', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        user_id: otherPlayerId,
        member_role: 'Substitute'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should reject adding a member who is already in the team (409)', async () => {
    const res = await request(app)
      .post(`/api/teams/${createdTeamId}/members`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        user_id: memberId
      });

    expect(res.status).toBe(409);
  });
});
