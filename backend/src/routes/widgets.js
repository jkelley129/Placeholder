const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

// PUT /api/widgets/:id - Update a widget
router.put('/:id', (req, res) => {
  try {
    const db = getDatabase();
    const { title, type, config, position_x, position_y, width, height } = req.body;

    // Verify widget belongs to user's org
    const widget = db.prepare(`
      SELECT w.* FROM widgets w
      JOIN dashboards d ON w.dashboard_id = d.id
      WHERE w.id = ? AND d.org_id = ?
    `).get(req.params.id, req.user.orgId);

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (type !== undefined) { updates.push('type = ?'); values.push(type); }
    if (config !== undefined) { updates.push('config = ?'); values.push(JSON.stringify(config)); }
    if (position_x !== undefined) { updates.push('position_x = ?'); values.push(position_x); }
    if (position_y !== undefined) { updates.push('position_y = ?'); values.push(position_y); }
    if (width !== undefined) { updates.push('width = ?'); values.push(width); }
    if (height !== undefined) { updates.push('height = ?'); values.push(height); }
    updates.push("updated_at = datetime('now')");

    if (updates.length > 1) {
      values.push(req.params.id);
      db.prepare(`UPDATE widgets SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM widgets WHERE id = ?').get(req.params.id);
    res.json({ widget: { ...updated, config: JSON.parse(updated.config || '{}') } });
  } catch (err) {
    console.error('Update widget error:', err);
    res.status(500).json({ error: 'Failed to update widget' });
  }
});

// DELETE /api/widgets/:id - Delete a widget
router.delete('/:id', (req, res) => {
  try {
    const db = getDatabase();

    const widget = db.prepare(`
      SELECT w.id FROM widgets w
      JOIN dashboards d ON w.dashboard_id = d.id
      WHERE w.id = ? AND d.org_id = ?
    `).get(req.params.id, req.user.orgId);

    if (!widget) {
      return res.status(404).json({ error: 'Widget not found' });
    }

    db.prepare('DELETE FROM widgets WHERE id = ?').run(req.params.id);
    res.json({ message: 'Widget deleted successfully' });
  } catch (err) {
    console.error('Delete widget error:', err);
    res.status(500).json({ error: 'Failed to delete widget' });
  }
});

module.exports = router;
