const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../models/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/analytics/events - Ingest analytics events (API key or JWT auth)
router.post('/events', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events must be a non-empty array' });
    }

    if (events.length > 1000) {
      return res.status(400).json({ error: 'Maximum 1000 events per batch' });
    }

    const insert = db.prepare(`
      INSERT INTO events (id, org_id, name, properties, user_identifier, session_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertBatch = db.transaction((eventList) => {
      for (const event of eventList) {
        insert.run(
          uuidv4(),
          req.user.orgId,
          event.name,
          JSON.stringify(event.properties || {}),
          event.user_id || null,
          event.session_id || null,
          event.timestamp || new Date().toISOString()
        );
      }
    });

    insertBatch(events);

    res.status(201).json({ message: `${events.length} events ingested successfully` });
  } catch (err) {
    console.error('Event ingestion error:', err);
    res.status(500).json({ error: 'Failed to ingest events' });
  }
});

// GET /api/analytics/query - Query analytics data
router.get('/query', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const { event_name, start_date, end_date, group_by } = req.query;

    let query = 'SELECT';
    const params = [req.user.orgId];

    if (group_by === 'day') {
      query += " date(timestamp) as date, COUNT(*) as count FROM events WHERE org_id = ?";
    } else if (group_by === 'hour') {
      query += " strftime('%Y-%m-%d %H:00', timestamp) as date, COUNT(*) as count FROM events WHERE org_id = ?";
    } else {
      query += " name, COUNT(*) as count FROM events WHERE org_id = ?";
    }

    if (event_name) {
      query += ' AND name = ?';
      params.push(event_name);
    }

    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    if (group_by === 'day' || group_by === 'hour') {
      query += ' GROUP BY date ORDER BY date';
    } else {
      query += ' GROUP BY name ORDER BY count DESC';
    }

    const results = db.prepare(query).all(...params);
    res.json({ data: results });
  } catch (err) {
    console.error('Analytics query error:', err);
    res.status(500).json({ error: 'Failed to query analytics' });
  }
});

// GET /api/analytics/insights - AI-powered insights
router.get('/insights', authenticate, (req, res) => {
  try {
    const db = getDatabase();

    // Get event summary
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE org_id = ?').get(req.user.orgId);

    const topEvents = db.prepare(`
      SELECT name, COUNT(*) as count
      FROM events WHERE org_id = ?
      GROUP BY name ORDER BY count DESC LIMIT 5
    `).all(req.user.orgId);

    const recentTrend = db.prepare(`
      SELECT date(timestamp) as date, COUNT(*) as count
      FROM events WHERE org_id = ? AND timestamp >= date('now', '-7 days')
      GROUP BY date(timestamp) ORDER BY date
    `).all(req.user.orgId);

    // Generate insights based on data patterns
    const insights = [];

    if (totalEvents.count === 0) {
      insights.push({
        type: 'info',
        title: 'Get Started',
        description: 'Start sending events to see analytics insights. Use the API to track user actions, page views, and custom events.',
        priority: 'high'
      });
    } else {
      // Trend analysis
      if (recentTrend.length >= 2) {
        const lastDay = recentTrend[recentTrend.length - 1]?.count || 0;
        const prevDay = recentTrend[recentTrend.length - 2]?.count || 0;
        const change = prevDay > 0 ? ((lastDay - prevDay) / prevDay * 100).toFixed(1) : 0;

        if (change > 20) {
          insights.push({
            type: 'positive',
            title: 'Traffic Surge Detected',
            description: `Event volume increased by ${change}% compared to the previous day. Investigate what's driving this growth.`,
            priority: 'high'
          });
        } else if (change < -20) {
          insights.push({
            type: 'warning',
            title: 'Traffic Drop Alert',
            description: `Event volume decreased by ${Math.abs(change)}% compared to the previous day. Check for potential issues.`,
            priority: 'high'
          });
        }
      }

      // Top events insight
      if (topEvents.length > 0) {
        insights.push({
          type: 'info',
          title: 'Most Popular Event',
          description: `"${topEvents[0].name}" is your most tracked event with ${topEvents[0].count} occurrences.`,
          priority: 'medium'
        });
      }

      // Volume insight
      insights.push({
        type: 'info',
        title: 'Event Volume Summary',
        description: `You've tracked ${totalEvents.count} total events across ${topEvents.length} event types.`,
        priority: 'low'
      });
    }

    res.json({
      insights,
      summary: {
        total_events: totalEvents.count,
        top_events: topEvents,
        recent_trend: recentTrend
      }
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

module.exports = router;
