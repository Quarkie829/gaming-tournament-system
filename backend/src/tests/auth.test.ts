import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Module 1: Authentication & RBAC Tests', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `testuser_${timestamp}`,
    email: `testuser_${timestamp}@example.com`,
    password: 'Password123!',
    country: 'India'
  };

  afterAll(async () => {
    // Cleanup created test user
    await pool.query('DELETE FROM Users WHERE username LIKE ?', [`testuser_%`]);
  });

  it('should successfully register a new player', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.role).toBe('player');
  });

  it('should reject registration with duplicate username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUser.username,
        email: `unique_${timestamp}@example.com`,
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        login: testUser.username,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        login: testUser.username,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject access to protected /api/auth/me without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should grant access to /api/auth/me with valid Bearer token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: testUser.username, password: testUser.password });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe(testUser.username);
  });
});
