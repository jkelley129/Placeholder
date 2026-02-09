const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// GET /api/datasources
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const datasources = db.prepare('SELECT id, org_id, type, name, status, created_at FROM datasources WHERE org_id = ? ORDER BY created_at DESC').all(req.user.orgId);
    res.json({ datasources });
  } catch (err) {
    console.error('List datasources error:', err);
    res.status(500).json({ error: 'Failed to fetch data sources' });
  }
});

// POST /api/datasources
router.post('/', validate({
  name: { required: true, minLength: 1, maxLength: 200 },
  type: { required: true }
}), (req, res) => {
  try {
    const db = getDatabase();
    const { name, type, config } = req.body;
    const id = uuidv4();

    const validTypes = ['postgresql', 'mysql', 'csv', 'api', 'webhook', 'javascript'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    }

    db.prepare('INSERT INTO datasources (id, org_id, type, name, config) VALUES (?, ?, ?, ?, ?)').run(id, req.user.orgId, type, name, JSON.stringify(config || {}));

    const datasource = db.prepare('SELECT id, org_id, type, name, status, created_at FROM datasources WHERE id = ?').get(id);
    res.status(201).json({ datasource });
  } catch (err) {
    console.error('Create datasource error:', err);
    res.status(500).json({ error: 'Failed to create data source' });
  }
});

// DELETE /api/datasources/:id
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM datasources WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
    if (!existing) {
      return res.status(404).json({ error: 'Data source not found' });
    }

    db.prepare('DELETE FROM datasources WHERE id = ?').run(req.params.id);
    res.json({ message: 'Data source deleted successfully' });
  } catch (err) {
    console.error('Delete datasource error:', err);
    res.status(500).json({ error: 'Failed to delete data source' });
  }
});

module.exports = router;
