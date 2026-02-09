const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticate, generateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', validate({
  email: { required: true, type: 'email' },
  name: { required: true, minLength: 2, maxLength: 100 },
  password: { required: true, minLength: 8, maxLength: 128 },
  company: { required: false, maxLength: 200 }
}), async (req, res) => {
  try {
    const db = getDatabase();
    const { email, name, password, company } = req.body;

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userId = uuidv4();
    const orgId = uuidv4();
    const orgName = company || `${name}'s Organization`;

    // Create organization and user in a transaction
    const createUser = db.transaction(() => {
      db.prepare('INSERT INTO organizations (id, name) VALUES (?, ?)').run(orgId, orgName);
      db.prepare('INSERT INTO users (id, email, name, password_hash, company, role) VALUES (?, ?, ?, ?, ?, ?)').run(userId, email, name, passwordHash, company || null, 'admin');
      db.prepare('INSERT INTO org_members (user_id, org_id, role) VALUES (?, ?, ?)').run(userId, orgId, 'owner');

      // Create a default dashboard
      const dashboardId = uuidv4();
      db.prepare('INSERT INTO dashboards (id, org_id, name, description, created_by) VALUES (?, ?, ?, ?, ?)').run(dashboardId, orgId, 'My First Dashboard', 'Get started by adding widgets to track your KPIs', userId);
    });

    createUser();

    // Generate token
    const token = generateToken({ id: userId, email, orgId });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: userId, email, name, company, role: 'admin' }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', validate({
  email: { required: true, type: 'email' },
  password: { required: true }
}), async (req, res) => {
  try {
    const db = getDatabase();
    const { email, password } = req.body;

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user's organization
    const membership = db.prepare('SELECT org_id FROM org_members WHERE user_id = ?').get(user.id);

    // Generate token
    const token = generateToken({ id: user.id, email: user.email, orgId: membership?.org_id });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT id, email, name, company, role, created_at FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const membership = db.prepare(`
      SELECT o.id, o.name, o.plan, om.role as member_role
      FROM organizations o
      JOIN org_members om ON o.id = om.org_id
      WHERE om.user_id = ?
    `).get(req.user.id);

    res.json({
      user,
      organization: membership || null
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
