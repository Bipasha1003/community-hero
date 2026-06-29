// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Report from './pages/Report';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';

// ── Design tokens (matches Landing.jsx) ──────────────────────────────────────
const INDIA_BLUE = '#1a3c6e';
const SAFFRON    = '#FF6B00';
const BORDER_COL = '#D8DEE9';

function AshokaChakra() {
  return (
    <svg width="30" height="30" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke={INDIA_BLUE} strokeWidth="3" />
      <circle cx="40" cy="40" r="8"  fill={INDIA_BLUE} />
      <circle cx="40" cy="40" r="4"  fill="#fff" />
      {Array.from({ length: 24 }, (_, i) => i * 15).map((deg) => {
        const rad = deg * Math.PI / 180;
        return (
          <line key={deg}
            x1={40 + 10 * Math.cos(rad)} y1={40 + 10 * Math.sin(rad)}
            x2={40 + 33 * Math.cos(rad)} y2={40 + 33 * Math.sin(rad)}
            stroke={INDIA_BLUE} strokeWidth="1.8"
          />
        );
      })}
      {[0, 90, 180, 270].map((deg) => {
        const rad = deg * Math.PI / 180;
        return <circle key={deg} cx={40 + 36 * Math.cos(rad)} cy={40 + 36 * Math.sin(rad)} r="2.5" fill={SAFFRON} />;
      })}
    </svg>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function AppNav() {
  const role  = localStorage.getItem('role');
  const email = localStorage.getItem('email');
  const displayName = localStorage.getItem('displayName');

  const handleLogout = () => {
    ['token', 'role', 'email', 'uid', 'displayName'].forEach(k => localStorage.removeItem(k));
    window.location.href = '/login';
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
        .ch-nav-signout:hover { border-color: ${INDIA_BLUE} !important; color: ${INDIA_BLUE} !important; }
        .ch-nav-report:hover  { background: #b34d00 !important; }

        @media (max-width: 600px) {
          .ch-app-nav-inner { padding: 8px 12px !important; gap: 8px !important; }
          .ch-nav-email     { display: none !important; }
          .ch-nav-brand-name { font-size: 14px !important; }
          .ch-nav-report    { padding: 7px 12px !important; font-size: 12px !important; }
          .ch-nav-signout   { padding: 6px 10px !important; font-size: 12px !important; }
        }
      `}</style>

      {/* Tricolor top accent */}
      <div style={{ display: 'flex', height: 4 }}>
        <span style={{ flex: 1, background: SAFFRON }} />
        <span style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }} />
        <span style={{ flex: 1, background: '#046A38' }} />
      </div>

      <nav style={navS.nav}>
        <div style={navS.inner} className="ch-app-nav-inner">
          {/* Brand */}
          <a href="/" style={navS.brand}>
            <div style={navS.chakraWrap}><AshokaChakra /></div>
            <div>
              <div style={navS.brandName} className="ch-nav-brand-name">Community Hero</div>
              <div style={navS.brandSub}>Civic Issue Portal</div>
            </div>
          </a>

          {/* Right side */}
          <div style={navS.right}>
            {/* Role badge */}
            {role && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 3,
                background: role === 'admin' ? SAFFRON : '#EEF4FF',
                color: role === 'admin' ? '#fff' : INDIA_BLUE,
                letterSpacing: '.5px', textTransform: 'uppercase',
              }}>
                {role === 'admin' ? '👑 Admin' : '🧑 Citizen'}
              </span>
            )}

            {/* Email */}
            {email && (
              <span style={navS.email} className="ch-nav-email">
                {displayName || email}
              </span>
            )}

            {/* File a report */}
            <a href="/report" className="ch-nav-report" style={navS.reportBtn}>
              + File a report
            </a>

            {/* Sign out */}
            <button onClick={handleLogout} className="ch-nav-signout" style={navS.signoutBtn}>
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

const navS = {
  nav: {
    background: '#fff',
    borderBottom: `2px solid ${INDIA_BLUE}`,
    fontFamily: "'Noto Sans', sans-serif",
  },
  inner: {
    maxWidth: 1080, margin: '0 auto',
    padding: '10px 20px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none',
  },
  chakraWrap: {
    width: 42, height: 42, background: '#f0f4ff',
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brandName: { fontSize: 16, fontWeight: 700, color: INDIA_BLUE, lineHeight: 1.2 },
  brandSub:  { fontSize: 11, color: '#6B7280', marginTop: 1 },
  right: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  email: { fontSize: 13, color: '#6B7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  reportBtn: {
    background: SAFFRON, color: '#fff',
    padding: '8px 16px', borderRadius: 4,
    fontSize: 13, fontWeight: 600, textDecoration: 'none',
    transition: 'background .2s',
  },
  signoutBtn: {
    background: '#fff', color: '#374151',
    border: `1px solid ${BORDER_COL}`,
    padding: '7px 14px', borderRadius: 4,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'all .2s',
  },
};

export default function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <div style={{ fontFamily: "'Noto Sans', sans-serif", minHeight: '100vh', background: '#F8F9FC' }}>
        {token && <AppNav />}

        <Routes>
          <Route path="/"        element={token ? <Home /> : <Landing />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/report"  element={<PrivateRoute><Report /></PrivateRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}