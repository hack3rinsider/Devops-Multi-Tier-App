import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

function App() {
  const [users, setUsers] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [reports, setReports] = React.useState([]);
  const [logs, setLogs] = React.useState([]);
  const [metrics, setMetrics] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const [authMode, setAuthMode] = React.useState('login');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [token, setToken] = React.useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = React.useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isLoading, setIsLoading] = React.useState(false);

  const [worker, setWorker] = React.useState({
    pendingJobs: 0,
    processedJobs: 0,
    failedJobs: 0,
    lastJob: '-',
    activity: []
  });
  const [cacheInfo, setCacheInfo] = React.useState(null);
  const [lbResult, setLbResult] = React.useState(null);
  const [health, setHealth] = React.useState({});
  const [reportStats, setReportStats] = React.useState({});
  const [lastUpdated, setLastUpdated] = React.useState('');

  async function login() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Network error');
    }
    setIsLoading(false);
  }

  async function registerUser() {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    alert(data.message || data.error);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setCurrentUser(null);
  }

  async function loadAll() {
    const auth = { Authorization: `Bearer ${token}` };
    
    try {
      const [usersData, tasksData, reportsData, logsData, metricsData, workerData, healthData, statsData] = await Promise.all([
        fetch("/api/database/users", { headers: auth }).then(r => r.json()).catch(() => []),
        fetch("/api/database/tasks", { headers: auth }).then(r => r.json()).catch(() => []),
        fetch("/api/database/reports", { headers: auth }).then(r => r.json()).catch(() => []),
        fetch("/api/database/audit_logs").then(r => r.json()).catch(() => []),
        fetch("/api/metrics", { headers: auth }).then(r => r.json()).catch(() => []),
        fetch("/api/worker/info").then(r => r.json()).catch(() => ({})),
        fetch("/api/system/health").then(r => r.json()).catch(() => ({})),
        fetch("/api/reports/stats").then(r => r.json()).catch(() => ({}))
      ]);
      
      setUsers(usersData);
      setTasks(tasksData);
      setReports(reportsData);
      setLogs(logsData);
      setMetrics(metricsData);
      setWorker(workerData);
      setHealth(healthData);
      setReportStats(statsData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Load error:", e);
    }
  }

  async function generateReport() {
    await fetch("/api/reports/generate", { method: "POST" });
    setTimeout(loadAll, 1000);
  }

  async function testCache() {
    const result = await fetch("/api/cache/tasks").then(r => r.json());
    setCacheInfo(result);
  }

  async function clearCache() {
    await fetch("/api/cache/clear", { method: "POST" });
    setCacheInfo(null);
  }

  async function testLoadBalancer() {
    const result = await fetch("/task-test").then(r => r.json());
    setLbResult(result);
  }

  React.useEffect(() => {
    if (token) {
      loadAll();
      const timer = setInterval(loadAll, 15000);
      return () => clearInterval(timer);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <div className="login-title">⚡ DevOps Control Center</div>
          <div className="login-subtitle">Enterprise System Management Platform</div>
          
          <div className="input-group">
            <input type="text" placeholder="👤 Username" value={username} onChange={e => setUsername(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && login()} />
          </div>
          <div className="input-group">
            <input type="password" placeholder="🔒 Password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && login()} />
          </div>
          
          <div className="button-group">
            {authMode === 'login' ? 
              <button className="btn btn-primary" onClick={login} disabled={isLoading}>{isLoading ? '⏳...' : '🚀 Login'}</button> :
              <button className="btn btn-primary" onClick={registerUser}>📝 Register</button>
            }
            <button className="btn btn-secondary" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? '✨ Create Account' : '🔑 Back to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const cacheHits = metrics.find(m => m.metric_name === 'cache_hits')?.metric_value || 0;
  const cacheMisses = metrics.find(m => m.metric_name === 'cache_misses')?.metric_value || 0;
  const totalCache = cacheHits + cacheMisses;
  const hitRate = totalCache > 0 ? ((cacheHits / totalCache) * 100).toFixed(1) : 0;

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'workers', icon: '⚙️', label: 'Workers' },
    { id: 'cache', icon: '🚀', label: 'Cache' },
    { id: 'loadbalancer', icon: '⚖️', label: 'Load Balancer' },
    { id: 'reports', icon: '📄', label: 'Reports' },
    { id: 'logs', icon: '📝', label: 'Audit Logs' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>DevOps Control</h2>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '5px' }}>{currentUser?.username} • {currentUser?.role}</p>
        </div>
        {navItems.map(item => (
          <div key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', background: activeTab === item.id ? 'rgba(102,126,234,0.15)' : 'transparent', borderLeft: activeTab === item.id ? '3px solid #667eea' : '3px solid transparent' }}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
        <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', cursor: 'pointer', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span>🚪</span>
          <span>Logout</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: '260px', padding: '24px 32px' }}>
        <div className="dashboard-header">
          <div className="header-title">
            <h1>{navItems.find(i => i.id === activeTab)?.label || 'Dashboard'}</h1>
            <div className="header-badge">🟢 System Operational • Last updated: {lastUpdated || '-'}</div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={loadAll}>🔄 Refresh</button>
          </div>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{users.length}</div><div className="stat-label">Users</div></div>
              <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{reports.length}</div><div className="stat-label">Reports</div></div>
              <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{reportStats.queued || 0}</div><div className="stat-label">Queued</div></div>
              <div className="stat-card"><div className="stat-icon">✅</div><div className="stat-value">{reportStats.completed || 0}</div><div className="stat-label">Completed</div></div>
              <div className="stat-card"><div className="stat-icon">💾</div><div className="stat-value">{hitRate}%</div><div className="stat-label">Cache Hit Rate</div></div>
            </div>

            <div className="section-card">
              <div className="section-title">🏥 System Health</div>
              <div className="health-grid">
                {Object.entries(health).map(([key, val]) => (
                  <div key={key} className="health-item">
                    <div className="health-status">{val === 'UP' ? '🟢' : val === 'DOWN' ? '🔴' : '⚪'}</div>
                    <div>{key.toUpperCase()}</div>
                    <small>{val === 'UP' ? 'Healthy' : val === 'DOWN' ? 'Down' : 'Unknown'}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="section-title">👥 Users ({users.length})</div>
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>ID</th><th>Username</th><th>Role</th></tr></thead>
                  <tbody>{users.map(u => <tr key={u.id}><td>{u.id}</td><td>👤 {u.username}</td><td>{u.role === 'admin' ? '👑 Admin' : '👤 User'}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* WORKERS TAB */}
        {activeTab === 'workers' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{worker.pendingJobs || 0}</div><div className="stat-label">Pending Jobs</div></div>
              <div className="stat-card"><div className="stat-value">{worker.processedJobs || 0}</div><div className="stat-label">Processed</div></div>
              <div className="stat-card"><div className="stat-value">{worker.failedJobs || 0}</div><div className="stat-label">Failed</div></div>
            </div>
            
            <div className="section-card">
              <div className="section-title">📋 Queue Status</div>
              <div style={{ marginBottom: '15px' }}><strong>Queued:</strong> {reportStats.queued || 0} | <strong>Processing:</strong> {reportStats.processing || 0} | <strong>Completed:</strong> {reportStats.completed || 0} | <strong>Failed:</strong> {reportStats.failed || 0}</div>
              <button className="btn btn-primary" onClick={generateReport}>📄 Generate Report</button>
            </div>

            <div className="section-card">
              <div className="section-title">📜 Worker Activity Timeline</div>
              <div className="timeline">
                {(worker.activity || []).slice(-10).map((a, i) => (
                  <div key={i} className="timeline-item"><div className="timeline-time">{a.time}</div><div>{a.message}</div></div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* CACHE TAB */}
        {activeTab === 'cache' && (
          <>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value">{cacheHits}</div><div className="stat-label">Cache Hits</div></div>
              <div className="stat-card"><div className="stat-value">{cacheMisses}</div><div className="stat-label">Cache Misses</div></div>
              <div className="stat-card"><div className="stat-value">{hitRate}%</div><div className="stat-label">Hit Rate</div></div>
            </div>

            <div className="section-card">
              <div className="section-title">🚀 Redis Cache Operations</div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                <button className="btn btn-primary" onClick={testCache}>🔍 Load Cached Tasks</button>
                <button className="btn btn-secondary" onClick={clearCache}>🗑️ Clear Cache</button>
              </div>
              {cacheInfo && (
                <div className="info-box">
                  <h3>{cacheInfo.cache === 'HIT' ? '🟢 CACHE HIT' : '🟡 CACHE MISS'}</h3>
                  <p>Source: {cacheInfo.source} | Response: {cacheInfo.responseTime}ms</p>
                  <p>{cacheInfo.cache === 'HIT' ? 'Served from Redis' : 'Loaded from PostgreSQL'}</p>
                </div>
              )}
            </div>

            <div className="section-card">
              <div className="section-title">📊 Cache Metrics</div>
              <div className="table-wrapper">
                <table><tbody>{metrics.map(m => <tr key={m.id}><td>📊 {m.metric_name}</td><td><strong>{m.metric_value}</strong></td></tr>)}</tbody></table>
              </div>
            </div>
          </>
        )}

        {/* LOAD BALANCER TAB */}
        {activeTab === 'loadbalancer' && (
          <div className="section-card">
            <div className="section-title">⚖️ NGINX Load Balancer (Round Robin)</div>
            <button className="btn btn-primary" onClick={testLoadBalancer}>🎯 Send Test Request</button>
            {lbResult && (
              <div className="info-box" style={{ marginTop: '20px' }}>
                <p><strong>📍 Instance:</strong> {lbResult.service}</p>
                <p><strong>⚙️ Strategy:</strong> Round Robin</p>
                <p><strong>🏥 Status:</strong> <span className="status-badge status-up">Healthy</span></p>
                <p><strong>⏰ Time:</strong> {lbResult.timestamp}</p>
                <hr style={{ margin: '15px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
                <small>🔄 Click multiple times - traffic distributes between task-service-1 and task-service-2</small>
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="section-card">
            <div className="section-title">📊 Reports ({reports.length})</div>
            <button className="btn btn-primary" onClick={generateReport} style={{ marginBottom: '20px' }}>📄 Generate New Report</button>
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table>
                <thead><tr><th>ID</th><th>Report Name</th><th>Status</th></tr></thead>
                <tbody>{reports.map(r => <tr key={r.id}><td>{r.id}</td><td>📄 {r.report_name}</td><td><span className={`status-badge ${r.status === 'completed' ? 'status-completed' : 'status-pending'}`}>{r.status === 'completed' ? '✅ Completed' : '⏳ Pending'}</span></td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="section-card">
            <div className="section-title">📝 Audit Logs</div>
            <div className="table-wrapper" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table>
                <thead><tr><th>ID</th><th>Action</th><th>Details</th></tr></thead>
                <tbody>{logs.map(l => <tr key={l.id}><td>{l.id}</td><td>🔐 {l.action}</td><td>{l.details}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Architecture (shows on all tabs at bottom) */}
        <div className="section-card">
          <div className="section-title">🏗️ System Architecture</div>
          <div className="architecture-flow">
{`Browser → NGINX (LB) → Gateway → Auth/Task Services → Redis/RabbitMQ → Worker → PostgreSQL`}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
