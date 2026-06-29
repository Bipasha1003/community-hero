// frontend/src/pages/Login.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

// ── Design tokens (matches Landing.jsx) ──────────────────────────────────────
const INDIA_BLUE  = '#1a3c6e';
const SAFFRON     = '#FF6B00';
const INDIA_GREEN = '#046A38';
const OFF_WHITE   = '#F8F9FC';
const BORDER_COL  = '#D8DEE9';
const TEXT_MUTED  = '#6B7280';

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={TEXT_MUTED} strokeWidth="1.8" strokeLinecap="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke={TEXT_MUTED} strokeWidth="1.8" strokeLinecap="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="2" y1="22" x2="22" y2="2" />
    </svg>
  );
}

function AshokaChakra() {
  return (
    <svg width="34" height="34" viewBox="0 0 80 80" aria-hidden="true">
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

function TricolorBar({ height = 4 }) {
  return (
    <div style={{ display: 'flex', height }}>
      <span style={{ flex: 1, background: SAFFRON }} />
      <span style={{ flex: 1, background: '#fff', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }} />
      <span style={{ flex: 1, background: INDIA_GREEN }} />
    </div>
  );
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return; }
    setLoading(true); setError('');

    try {
      const adminRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { email, password }
      );
      if (adminRes.data.role === 'admin') {
        localStorage.setItem('token', adminRes.data.token);
        localStorage.setItem('role', 'admin');
        localStorage.setItem('email', adminRes.data.email);
        localStorage.setItem('displayName', 'Admin');
        window.location.href = '/';
        return;
      }
    } catch (_) {}

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/login`,
        { idToken }
      );
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('email', res.data.email);
      localStorage.setItem('uid', res.data.uid);
      localStorage.setItem('displayName', res.data.displayName);
      window.location.href = '/';
    } catch (err) {
      if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(err.code)) {
        setError('Incorrect email or password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Try again later.');
      } else {
        setError('Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ch-input:focus { outline: none; border-color: ${INDIA_BLUE} !important; box-shadow: 0 0 0 3px rgba(26,60,110,0.12); }
        .ch-login-link:hover { color: ${SAFFRON} !important; }
        .ch-eye-btn:hover { opacity: 0.7; }

        @media (max-width: 480px) {
          .ch-login-card { padding: 24px 18px 20px !important; margin: 16px !important; }
          .ch-login-page { padding: 0 !important; align-items: flex-start !important; }
        }
      `}</style>

      <TricolorBar height={5} />

      {/* Header strip */}
      <div style={s.headerStrip}>
        <div style={s.headerInner}>
          <div style={s.brandBlock}>
            <div style={s.ashokaWrap}><AshokaChakra /></div>
            <div>
              <div style={s.portalHi}>सामुदायिक हीरो</div>
              <div style={s.portalEn}>Community Hero</div>
              <div style={s.portalTag}>Civic Issue Reporting Portal — Government of India</div>
            </div>
          </div>
          <Link to="/register" style={s.headerBtn}>Register now</Link>
        </div>
      </div>

      {/* Main content */}
      <div style={s.pageBody} className="ch-login-page">
        <div style={s.card} className="ch-login-card">

          {/* Kicker */}
          <div style={s.kicker}>
            <span style={s.kickerLine} />
            Citizen Sign In
          </div>

          <h1 style={s.heading}>Access your case record</h1>
          <p style={s.sub}>Sign in to file a report or track one already submitted.</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <label style={s.label}>Email address</label>
          <input
            type="email"
            className="ch-input"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="your@email.com"
            style={s.input}
          />

          <label style={s.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              className="ch-input"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Your password"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...s.input, paddingRight: 42 }}
            />
            <button type="button" className="ch-eye-btn"
              onClick={() => setShowPw(p => !p)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              style={s.eyeBtn}>
              <EyeIcon open={showPw} />
            </button>
          </div>

          <button onClick={handleLogin} disabled={loading} style={s.btn(loading)}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={s.divider}><span style={s.dividerText}>New to the portal?</span></div>

          <Link to="/register" style={s.secondaryBtn}>
            Register as a citizen
          </Link>

          <p style={s.hint}>
            By signing in you agree to the{' '}
            <a href="#" className="ch-login-link" style={s.inlineLink}>Terms of Use</a>
            {' '}of this Government of India portal.
          </p>
        </div>
      </div>

      <TricolorBar height={4} />
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    fontFamily: "'Noto Sans', sans-serif",
    background: OFF_WHITE,
    display: 'flex',
    flexDirection: 'column',
  },
  headerStrip: {
    background: INDIA_BLUE,
    padding: '12px 20px',
  },
  headerInner: {
    maxWidth: 1080,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 12 },
  ashokaWrap: {
    width: 48, height: 48,
    background: '#fff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  portalHi: {
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.3,
  },
  portalEn:  { fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
  portalTag: { fontSize: 10.5, color: 'rgba(255,255,255,.55)', marginTop: 1 },
  headerBtn: {
    background: SAFFRON, color: '#fff',
    padding: '7px 16px', borderRadius: 4,
    fontSize: 13, fontWeight: 600, textDecoration: 'none',
  },

  pageBody: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    background: '#fff',
    border: `1px solid ${BORDER_COL}`,
    borderTop: `3px solid ${INDIA_BLUE}`,
    borderRadius: 6,
    padding: '32px 32px 28px',
    width: '100%',
    maxWidth: 440,
  },
  kicker: {
    fontSize: 11, fontWeight: 600, color: SAFFRON,
    letterSpacing: '1.6px', textTransform: 'uppercase',
    marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
  },
  kickerLine: {
    display: 'inline-block', width: 20, height: 2,
    background: SAFFRON, borderRadius: 1,
  },
  heading: {
    fontSize: 22, fontWeight: 700, color: INDIA_BLUE,
    margin: '0 0 6px', letterSpacing: '-.2px',
  },
  sub: { fontSize: 13.5, color: TEXT_MUTED, marginBottom: 22, lineHeight: 1.6 },
  errorBox: {
    background: '#FCEBEB', border: '1px solid #F0B4B4',
    color: '#9A2D2D', padding: '10px 14px',
    borderRadius: 4, marginBottom: 16, fontSize: 13.5,
  },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#374151', marginBottom: 6, marginTop: 16,
  },
  input: {
    width: '100%', padding: '10px 13px',
    border: `1px solid ${BORDER_COL}`, borderRadius: 4,
    fontSize: 14.5, color: '#1a1a1a',
    fontFamily: "'Noto Sans', sans-serif",
    transition: 'border-color .2s',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: 4, display: 'flex',
  },
  btn: (loading) => ({
    width: '100%', marginTop: 22,
    padding: '12px', borderRadius: 4,
    background: loading ? '#8FA8C8' : INDIA_BLUE,
    color: '#fff', border: 'none',
    fontSize: 15, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    letterSpacing: '.2px',
  }),
  divider: {
    margin: '20px 0', borderTop: `1px solid ${BORDER_COL}`,
    textAlign: 'center', position: 'relative',
  },
  dividerText: {
    position: 'relative', top: -10,
    background: '#fff', padding: '0 10px',
    fontSize: 12, color: TEXT_MUTED,
  },
  secondaryBtn: {
    display: 'block', width: '100%',
    textAlign: 'center', padding: '10px',
    border: `1.5px solid ${INDIA_BLUE}`,
    borderRadius: 4, color: INDIA_BLUE,
    fontSize: 14, fontWeight: 600,
    textDecoration: 'none',
    transition: 'background .2s',
  },
  hint: {
    marginTop: 18, fontSize: 11.5,
    color: TEXT_MUTED, textAlign: 'center', lineHeight: 1.6,
  },
  inlineLink: { color: SAFFRON, textDecoration: 'none', fontWeight: 500 },
};