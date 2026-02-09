import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#22c55e', '#3b82f6'];

function Sidebar({ currentPage, onPageChange, onLogout, userName }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'dashboards', label: 'Dashboards', icon: '📋' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'insights', label: 'AI Insights', icon: '🤖' },
    { id: 'datasources', label: 'Data Sources', icon: '🔗' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>
          <span className="logo-icon">D</span>
          DataPulse
        </h1>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => onPageChange(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-muted)' }}>
          Signed in as
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{userName}</div>
        <button className="btn-secondary" style={{ width: '100%', fontSize: 13 }} onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

function OverviewPage() {
  const [insights, setInsights] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInsights(), api.listDashboards()])
      .then(([insightsData, dashboardsData]) => {
        setInsights(insightsData);
        setDashboards(dashboardsData.dashboards);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading overview...</div>;

  const sampleTrend = insights?.summary?.recent_trend?.length > 0
    ? insights.summary.recent_trend
    : [
        { date: '2025-01-01', count: 120 },
        { date: '2025-01-02', count: 185 },
        { date: '2025-01-03', count: 240 },
        { date: '2025-01-04', count: 198 },
        { date: '2025-01-05', count: 310 },
        { date: '2025-01-06', count: 289 },
        { date: '2025-01-07', count: 350 },
      ];

  return (
    <div>
      <div className="page-header">
        <h2>Overview</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{(insights?.summary?.total_events || 0).toLocaleString()}</div>
          <div className="stat-change positive">↑ Active tracking</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dashboards</div>
          <div className="stat-value">{dashboards.length}</div>
          <div className="stat-change positive">Ready to use</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Event Types</div>
          <div className="stat-value">{insights?.summary?.top_events?.length || 0}</div>
          <div className="stat-change positive">Being tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Insights</div>
          <div className="stat-value">{insights?.insights?.length || 0}</div>
          <div className="stat-change positive">Available now</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Event Volume (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sampleTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#f1f5f9' }}
            />
            <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorGradient)" strokeWidth={2} />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {insights?.insights?.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Latest Insights</h3>
          {insights.insights.slice(0, 3).map((insight, i) => (
            <div key={i} className="insight-card">
              <div className={`insight-icon ${insight.type}`}>
                {insight.type === 'positive' ? '📈' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div>
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardsPage() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDashboard, setNewDashboard] = useState({ name: '', description: '' });

  const loadDashboards = () => {
    api.listDashboards()
      .then(data => setDashboards(data.dashboards))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDashboards(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createDashboard(newDashboard);
      setShowCreate(false);
      setNewDashboard({ name: '', description: '' });
      loadDashboards();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;
    try {
      await api.deleteDashboard(id);
      loadDashboards();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading dashboards...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboards</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Dashboard</button>
      </div>

      {dashboards.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No dashboards yet</h3>
          <p>Create your first dashboard to start tracking KPIs</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create Dashboard</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {dashboards.map(d => (
            <div key={d.id} className="dashboard-card">
              <h3>{d.name}</h3>
              <p>{d.description || 'No description'}</p>
              <div className="meta">
                {d.widget_count} widgets • Created {new Date(d.created_at).toLocaleDateString()}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>Open</button>
                <button className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => handleDelete(d.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Dashboard</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={newDashboard.name}
                  onChange={e => setNewDashboard({ ...newDashboard, name: e.target.value })}
                  placeholder="e.g. Sales Dashboard"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newDashboard.description}
                  onChange={e => setNewDashboard({ ...newDashboard, description: e.target.value })}
                  placeholder="What does this dashboard track?"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Dashboard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalyticsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');

  useEffect(() => {
    api.queryAnalytics({ group_by: groupBy })
      .then(result => setData(result.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupBy]);

  const sampleData = data.length > 0 ? data : [
    { name: 'page_view', count: 450 },
    { name: 'button_click', count: 230 },
    { name: 'signup', count: 89 },
    { name: 'purchase', count: 45 },
    { name: 'search', count: 180 },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>Analytics</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['day', 'hour'].map(g => (
            <button
              key={g}
              className={groupBy === g ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { setGroupBy(g); setLoading(true); }}
              style={{ fontSize: 13, padding: '6px 16px' }}
            >
              By {g}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <h3>{data.length > 0 ? 'Event Distribution' : 'Sample Data (Send events to see real data)'}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sampleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey={groupBy === 'day' || groupBy === 'hour' ? 'date' : 'name'} stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {sampleData.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Event Breakdown</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((item, i) => {
                const total = sampleData.reduce((sum, d) => sum + d.count, 0);
                return (
                  <tr key={i}>
                    <td>{item.name || item.date}</td>
                    <td>{item.count.toLocaleString()}</td>
                    <td>{((item.count / total) * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getInsights()
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Analyzing your data...</div>;

  const topEvents = insights?.summary?.top_events || [];

  return (
    <div>
      <div className="page-header">
        <h2>🤖 AI Insights</h2>
      </div>

      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label">Total Events Analyzed</div>
          <div className="stat-value">{(insights?.summary?.total_events || 0).toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Insights Generated</div>
          <div className="stat-value">{insights?.insights?.length || 0}</div>
        </div>
      </div>

      {insights?.insights?.map((insight, i) => (
        <div key={i} className="insight-card">
          <div className={`insight-icon ${insight.type}`}>
            {insight.type === 'positive' ? '📈' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
          </div>
          <div>
            <h4>{insight.title}</h4>
            <p>{insight.description}</p>
            <span className={`badge ${insight.priority === 'high' ? 'active' : ''}`}
              style={{ marginTop: 8, display: 'inline-block' }}>
              {insight.priority} priority
            </span>
          </div>
        </div>
      ))}

      {topEvents.length > 0 && (
        <div className="chart-container" style={{ marginTop: 24 }}>
          <h3>Top Events</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={topEvents} dataKey="count" nameKey="name" cx="50%" cy="50%"
                outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {topEvents.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function DataSourcesPage() {
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'postgresql' });

  const loadSources = () => {
    api.listDatasources()
      .then(data => setDatasources(data.datasources))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSources(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createDatasource(newSource);
      setShowCreate(false);
      setNewSource({ name: '', type: 'postgresql' });
      loadSources();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this data source?')) return;
    try {
      await api.deleteDatasource(id);
      loadSources();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="loading">Loading data sources...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Data Sources</h2>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Add Source</button>
      </div>

      {datasources.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔗</div>
          <h3>No data sources connected</h3>
          <p>Connect a database, API, or upload a CSV to get started</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Add Data Source</button>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Connected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {datasources.map(ds => (
                <tr key={ds.id}>
                  <td style={{ fontWeight: 600 }}>{ds.name}</td>
                  <td>{ds.type}</td>
                  <td><span className={`badge ${ds.status}`}>{ds.status}</span></td>
                  <td>{new Date(ds.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-danger" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleDelete(ds.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Data Source</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Name</label>
                <input
                  value={newSource.name}
                  onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="e.g. Production Database"
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={newSource.type} onChange={e => setNewSource({ ...newSource, type: e.target.value })}>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="csv">CSV Upload</option>
                  <option value="api">REST API</option>
                  <option value="webhook">Webhook</option>
                  <option value="javascript">JavaScript SDK</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Connect Source</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <h3 style={{ marginBottom: 20 }}>Profile</h3>
        <div className="form-group">
          <label>Name</label>
          <input value={user?.name || ''} readOnly />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input value={user?.email || ''} readOnly />
        </div>
        <div className="form-group">
          <label>Company</label>
          <input value={user?.company || ''} readOnly />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Contact support to update your profile information.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
        <h3 style={{ marginBottom: 20 }}>API Key</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          Use this key to send events from your application. Include it in the Authorization header as a Bearer token.
        </p>
        <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
          Bearer {localStorage.getItem('datapulse_token')?.substring(0, 20)}...
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Quick Start Guide</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
          Send events to DataPulse using a simple HTTP POST request:
        </p>
        <pre style={{ background: 'var(--bg)', padding: 16, borderRadius: 8, fontSize: 13, overflow: 'auto' }}>
{`curl -X POST /api/analytics/events \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "events": [
      {
        "name": "page_view",
        "properties": {
          "page": "/home",
          "referrer": "google.com"
        }
      }
    ]
  }'`}
        </pre>
      </div>
    </div>
  );
}

export default function DashboardApp() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('overview');

  const renderPage = () => {
    switch (page) {
      case 'overview': return <OverviewPage />;
      case 'dashboards': return <DashboardsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'insights': return <InsightsPage />;
      case 'datasources': return <DataSourcesPage />;
      case 'settings': return <SettingsPage />;
      default: return <OverviewPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentPage={page}
        onPageChange={setPage}
        onLogout={logout}
        userName={user?.name || 'User'}
      />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
