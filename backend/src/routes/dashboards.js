const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

// GET /api/dashboards - List user's dashboards
router.get('/', (req, res) => {
  try {
    const db = getDatabase();
    const dashboards = db.prepare(`
      SELECT d.*, u.name as creator_name
      FROM dashboards d
      JOIN users u ON d.created_by = u.id
      WHERE d.org_id = ?
      ORDER BY d.updated_at DESC
    `).all(req.user.orgId);

    // Count widgets per dashboard
    const widgetCounts = db.prepare(`
      SELECT dashboard_id, COUNT(*) as count
      FROM widgets
      WHERE dashboard_id IN (SELECT id FROM dashboards WHERE org_id = ?)
      GROUP BY dashboard_id
    `).all(req.user.orgId);

    const countMap = {};
    widgetCounts.forEach(wc => { countMap[wc.dashboard_id] = wc.count; });

    const result = dashboards.map(d => ({
      ...d,
      widget_count: countMap[d.id] || 0
    }));

    res.json({ dashboards: result });
  } catch (err) {
    console.error('List dashboards error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// POST /api/dashboards - Create a new dashboard
router.post('/', validate({
  name: { required: true, minLength: 1, maxLength: 200 },
  description: { required: false, maxLength: 1000 }
}), (req, res) => {
  try {
    const db = getDatabase();
    const { name, description } = req.body;
    const id = uuidv4();

    db.prepare(`
      INSERT INTO dashboards (id, org_id, name, description, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user.orgId, name, description || null, req.user.id);

    const dashboard = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(id);
    res.status(201).json({ dashboard });
  } catch (err) {
    console.error('Create dashboard error:', err);
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

// GET /api/dashboards/:id - Get dashboard details
router.get('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const dashboard = db.prepare(`
      SELECT d.*, u.name as creator_name
      FROM dashboards d
      JOIN users u ON d.created_by = u.id
      WHERE d.id = ? AND d.org_id = ?
    `).get(req.params.id, req.user.orgId);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const widgets = db.prepare('SELECT * FROM widgets WHERE dashboard_id = ? ORDER BY position_y, position_x').all(req.params.id);

    res.json({
      dashboard,
      widgets: widgets.map(w => ({ ...w, config: JSON.parse(w.config || '{}') }))
    });
  } catch (err) {
    console.error('Get dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// PUT /api/dashboards/:id - Update dashboard
router.put('/:id', validate({
  name: { required: false, minLength: 1, maxLength: 200 },
  description: { required: false, maxLength: 1000 }
}), (req, res) => {
  try {
    const db = getDatabase();
    const { name, description, layout } = req.body;

    const existing = db.prepare('SELECT id FROM dashboards WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
    if (!existing) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (layout !== undefined) { updates.push('layout = ?'); values.push(JSON.stringify(layout)); }
    updates.push("updated_at = datetime('now')");

    if (updates.length > 1) {
      values.push(req.params.id);
      db.prepare(`UPDATE dashboards SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const dashboard = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(req.params.id);
    res.json({ dashboard });
  } catch (err) {
    console.error('Update dashboard error:', err);
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

// DELETE /api/dashboards/:id - Delete dashboard
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const existing = db.prepare('SELECT id FROM dashboards WHERE id = ? AND org_id = ?').get(req.params.id, req.user.orgId);
    if (!existing) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }

    db.prepare('DELETE FROM dashboards WHERE id = ?').run(req.params.id);
    res.json({ message: 'Dashboard deleted successfully' });
  } catch (err) {
    console.error('Delete dashboard error:', err);
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

module.exports = router;
