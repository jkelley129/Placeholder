const request = require('supertest');
const { createApp } = require('../src/index');
const { initDatabase, closeDatabase } = require('../src/models/database');
const path = require('path');
const fs = require('fs');

let app;
let dbPath;

beforeAll(() => {
  // Use a temp database for tests
  dbPath = path.join(__dirname, `test-${Date.now()}.db`);
  initDatabase(dbPath);
  app = createApp();
});

afterAll(() => {
  closeDatabase();
  // Clean up test database
  try {
    fs.unlinkSync(dbPath);
    fs.unlinkSync(dbPath + '-wal');
    fs.unlinkSync(dbPath + '-shm');
  } catch (e) { /* ignore */ }
});

describe('Health Check', () => {
  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('1.0.0');
  });
});

describe('Authentication', () => {
  const testUser = {
    email: 'test@datapulse.io',
    name: 'Test User',
    password: 'securePassword123!',
    company: 'Test Corp'
  };

  it('POST /api/auth/register should create a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('POST /api/auth/register should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
  });

  it('POST /api/auth/register should validate required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad' });

    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login should authenticate valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('POST /api/auth/login should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me should return user profile with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.organization).toBeDefined();
  });

  it('GET /api/auth/me should reject requests without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Dashboards', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@datapulse.io', password: 'securePassword123!' });
    token = loginRes.body.token;
  });

  it('GET /api/dashboards should list dashboards', async () => {
    const res = await request(app)
      .get('/api/dashboards')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.dashboards)).toBe(true);
    // Should have the default dashboard from registration
    expect(res.body.dashboards.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/dashboards should create a new dashboard', async () => {
    const res = await request(app)
      .post('/api/dashboards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sales Dashboard', description: 'Track sales KPIs' });

    expect(res.status).toBe(201);
    expect(res.body.dashboard.name).toBe('Sales Dashboard');
  });

  it('GET /api/dashboards/:id should return dashboard details', async () => {
    const listRes = await request(app)
      .get('/api/dashboards')
      .set('Authorization', `Bearer ${token}`);

    const dashboardId = listRes.body.dashboards[0].id;

    const res = await request(app)
      .get(`/api/dashboards/${dashboardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.dashboard.id).toBe(dashboardId);
    expect(Array.isArray(res.body.widgets)).toBe(true);
  });

  it('PUT /api/dashboards/:id should update dashboard', async () => {
    const listRes = await request(app)
      .get('/api/dashboards')
      .set('Authorization', `Bearer ${token}`);

    const dashboardId = listRes.body.dashboards[0].id;

    const res = await request(app)
      .put(`/api/dashboards/${dashboardId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Dashboard' });

    expect(res.status).toBe(200);
    expect(res.body.dashboard.name).toBe('Updated Dashboard');
  });

  it('DELETE /api/dashboards/:id should delete dashboard', async () => {
    const createRes = await request(app)
      .post('/api/dashboards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });

    const res = await request(app)
      .delete(`/api/dashboards/${createRes.body.dashboard.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('Analytics', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@datapulse.io', password: 'securePassword123!' });
    token = loginRes.body.token;
  });

  it('POST /api/analytics/events should ingest events', async () => {
    const res = await request(app)
      .post('/api/analytics/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        events: [
          { name: 'page_view', properties: { page: '/home' } },
          { name: 'button_click', properties: { button: 'signup' } },
          { name: 'page_view', properties: { page: '/pricing' } }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('3 events');
  });

  it('POST /api/analytics/events should reject empty events', async () => {
    const res = await request(app)
      .post('/api/analytics/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ events: [] });

    expect(res.status).toBe(400);
  });

  it('GET /api/analytics/query should return analytics data', async () => {
    const res = await request(app)
      .get('/api/analytics/query')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/analytics/insights should return insights', async () => {
    const res = await request(app)
      .get('/api/analytics/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.insights)).toBe(true);
    expect(res.body.summary).toBeDefined();
    expect(res.body.summary.total_events).toBeGreaterThan(0);
  });
});

describe('Data Sources', () => {
  let token;

  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@datapulse.io', password: 'securePassword123!' });
    token = loginRes.body.token;
  });

  it('POST /api/datasources should create a data source', async () => {
    const res = await request(app)
      .post('/api/datasources')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Production DB', type: 'postgresql' });

    expect(res.status).toBe(201);
    expect(res.body.datasource.name).toBe('Production DB');
    expect(res.body.datasource.type).toBe('postgresql');
  });

  it('POST /api/datasources should reject invalid type', async () => {
    const res = await request(app)
      .post('/api/datasources')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad Source', type: 'invalid_type' });

    expect(res.status).toBe(400);
  });

  it('GET /api/datasources should list data sources', async () => {
    const res = await request(app)
      .get('/api/datasources')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.datasources)).toBe(true);
    expect(res.body.datasources.length).toBeGreaterThan(0);
  });

  it('DELETE /api/datasources/:id should delete a data source', async () => {
    const createRes = await request(app)
      .post('/api/datasources')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete', type: 'csv' });

    const res = await request(app)
      .delete(`/api/datasources/${createRes.body.datasource.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
