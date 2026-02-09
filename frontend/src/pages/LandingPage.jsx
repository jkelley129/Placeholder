export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo">
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 6, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 'bold'
          }}>D</div>
          DataPulse
        </div>
        <div className="nav-links">
          <button className="btn-secondary" onClick={() => onNavigate('login')}>Sign In</button>
          <button className="btn-primary" onClick={() => onNavigate('register')}>Get Started Free</button>
        </div>
      </nav>

      <section className="hero">
        <h1>Analytics that drive real business growth</h1>
        <p>
          Track KPIs, visualize trends, and get AI-powered insights.
          DataPulse helps you make data-driven decisions in minutes, not months.
        </p>
        <div className="cta-buttons">
          <button className="btn-primary" onClick={() => onNavigate('register')}>
            Start Free Trial
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('register')}>
            View Demo →
          </button>
        </div>
      </section>

      <section className="features">
        <h2>Everything you need to understand your data</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">📊</div>
            <h3>Real-Time Dashboards</h3>
            <p>Build beautiful, interactive dashboards that update in real-time. Drag and drop widgets to customize your view.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🤖</div>
            <h3>AI-Powered Insights</h3>
            <p>Our AI automatically detects anomalies, trends, and opportunities. Get actionable recommendations delivered to you.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>5-Minute Setup</h3>
            <p>Connect your data sources and start getting insights immediately. No complex configuration or data engineering required.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🔗</div>
            <h3>API-First Design</h3>
            <p>Full REST API for custom integrations. Send events from any platform, language, or framework with our SDKs.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🔒</div>
            <h3>Enterprise Security</h3>
            <p>SOC 2 compliant with role-based access control, SSO, and audit logs. Your data is encrypted at rest and in transit.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📈</div>
            <h3>Scale Without Limits</h3>
            <p>Process millions of events per second. Our infrastructure scales automatically with your business growth.</p>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <h2>Simple, transparent pricing</h2>
        <p className="subtitle">Start free, scale as you grow. No hidden fees.</p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h3>Starter</h3>
            <div className="price">$49<span>/mo</span></div>
            <p className="description">Perfect for small teams getting started with analytics.</p>
            <ul>
              <li>3 dashboards</li>
              <li>5 data sources</li>
              <li>100K events/month</li>
              <li>7-day data retention</li>
              <li>Email support</li>
            </ul>
            <button className="btn-secondary" onClick={() => onNavigate('register')}>Get Started</button>
          </div>
          <div className="pricing-card popular">
            <h3>Growth</h3>
            <div className="price">$199<span>/mo</span></div>
            <p className="description">For growing companies that need more power.</p>
            <ul>
              <li>Unlimited dashboards</li>
              <li>20 data sources</li>
              <li>1M events/month</li>
              <li>30-day data retention</li>
              <li>Priority support</li>
              <li>Team collaboration</li>
            </ul>
            <button className="btn-primary" onClick={() => onNavigate('register')}>Start Free Trial</button>
          </div>
          <div className="pricing-card">
            <h3>Business</h3>
            <div className="price">$499<span>/mo</span></div>
            <p className="description">Advanced features for data-driven organizations.</p>
            <ul>
              <li>Everything in Growth</li>
              <li>AI-powered insights</li>
              <li>10M events/month</li>
              <li>90-day data retention</li>
              <li>Custom integrations</li>
              <li>Dedicated support</li>
            </ul>
            <button className="btn-secondary" onClick={() => onNavigate('register')}>Contact Sales</button>
          </div>
        </div>
      </section>

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
        <p>© 2025 DataPulse. All rights reserved. | Privacy Policy | Terms of Service</p>
      </footer>
    </div>
  );
}
