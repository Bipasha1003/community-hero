// frontend/src/pages/Report.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// ── Design tokens (matches Landing.jsx) ──────────────────────────────────────
const INDIA_BLUE  = '#1a3c6e';
const SAFFRON     = '#FF6B00';
const INDIA_GREEN = '#046A38';
const OFF_WHITE   = '#F8F9FC';
const BORDER_COL  = '#D8DEE9';
const TEXT_MUTED  = '#6B7280';

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

const QUICK_LOCATIONS = [
  { name: 'Park Street',   lat: '22.5523', lng: '88.3519' },
  { name: 'Salt Lake',     lat: '22.5958', lng: '88.4180' },
  { name: 'Howrah Bridge', lat: '22.5851', lng: '88.3468' },
  { name: 'New Town',      lat: '22.6270', lng: '88.4621' },
  { name: 'Jadavpur',      lat: '22.4993', lng: '88.3706' },
];

export default function Report() {
  const navigate = useNavigate();
  const [title, setTitle]   = useState('');
  const [image, setImage]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation]   = useState({ lat: null, lng: null });
  const [locStatus, setLocStatus] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [step, setStep] = useState(1); // 1 = details, 2 = location

  const detectLocation = () => {
    setLocStatus('Detecting…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude.toString();
        const lng = pos.coords.longitude.toString();
        setLocation({ lat, lng });
        setManualLat(lat); setManualLng(lng);
        setLocStatus('✓ Location detected');
      },
      () => setLocStatus('Could not detect — enter manually below')
    );
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { alert('Please enter an issue title.'); return; }
    if (!location.lat || !location.lng) {
      alert('Please provide your location before filing.'); return;
    }
    const token = localStorage.getItem('token');
    if (!token) { alert('Please log in to file a report.'); navigate('/login'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('latitude', location.lat);
      fd.append('longitude', location.lng);
      if (image) fd.append('image', image);
      await axios.post(`${process.env.REACT_APP_API_URL}/api/issues`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err) {
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.'); navigate('/login');
      } else {
        alert('Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const locationSet = !!location.lat && !!location.lng;
  const progress = step === 1 ? 50 : 100;

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ch-input:focus { outline: none; border-color: ${INDIA_BLUE} !important; box-shadow: 0 0 0 3px rgba(26,60,110,0.12); }
        .ch-quick-loc:hover { border-color: ${INDIA_BLUE} !important; color: ${INDIA_BLUE} !important; }
        .ch-file-label:hover { border-color: ${INDIA_BLUE} !important; }
        .ch-detect-btn:hover { background: ${INDIA_BLUE} !important; color: #fff !important; }

        @media (max-width: 600px) {
          .ch-report-card { padding: 20px 16px !important; margin: 0 !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          .ch-report-page { padding: 0 !important; }
          .ch-step-btns   { flex-direction: column !important; }
          .ch-quick-row   { gap: 6px !important; }
        }
      `}</style>

      <TricolorBar height={5} />

      {/* Header */}
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
          <Link to="/" style={s.headerLink}>← Back to cases</Link>
        </div>
      </div>

      <div style={s.pageBody} className="ch-report-page">
        <div style={s.card} className="ch-report-card">

          {/* Kicker + progress */}
          <div style={s.kicker}>
            <span style={s.kickerLine} />
            New Filing
          </div>
          <h1 style={s.heading}>File a community issue</h1>
          <p style={s.sub}>
            Add a title, photo, and your location. Your photo is reviewed automatically
            to detect the issue category and severity.
          </p>

          {/* Progress bar */}
          <div style={s.progressWrap}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === 1 ? INDIA_BLUE : TEXT_MUTED }}>
                Step 1: Issue details
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: step === 2 ? INDIA_BLUE : TEXT_MUTED }}>
                Step 2: Location
              </span>
            </div>
            <div style={s.progressBg}>
              <div style={{ ...s.progressFg, width: `${progress}%` }} />
            </div>
          </div>

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div>
              <div style={s.field}>
                <label style={s.label}>Issue title *</label>
                <input className="ch-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Large pothole near school gate"
                  style={s.input}
                />
                <p style={s.hint}>Be specific about the location and nature of the problem.</p>
              </div>

              <div style={s.field}>
                <label style={s.label}>Photo (recommended)</label>

                <div style={s.photoBtnRow}>
                  <label className="ch-file-label" style={s.photoBtn}>
                    📷 Take photo
                    <input type="file" accept="image/*" capture="environment"
                      onChange={handleImageChange} style={s.hiddenInput} />
                  </label>
                  <label className="ch-file-label" style={s.photoBtnGhost}>
                    🖼️ Gallery
                    <input type="file" accept="image/*"
                      onChange={handleImageChange} style={s.hiddenInput} />
                  </label>
                  {preview && (
                    <button onClick={() => { setImage(null); setPreview(null); }}
                      style={{ ...s.photoBtnGhost, color: '#9A2D2D', borderColor: '#F0B4B4' }}>
                      ✕ Remove
                    </button>
                  )}
                </div>

                {preview ? (
                  <img src={preview} alt="preview" style={s.preview} />
                ) : (
                  <div style={s.photoPlaceholder}>
                    <span style={{ fontSize: 32, opacity: .4 }}>📸</span>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>No photo added yet</span>
                  </div>
                )}

                <div style={s.aiNote}>
                  <span style={{ fontSize: 15 }}>🤖</span>
                  Photo is analysed automatically to detect issue type and severity before filing.
                </div>
              </div>

              <div style={s.stepBtns} className="ch-step-btns">
                <button onClick={() => setStep(2)}
                  disabled={!title.trim()}
                  style={s.primaryBtn(!title.trim())}>
                  Next: Add location →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Location ── */}
          {step === 2 && (
            <div>
              <div style={s.field}>
                <label style={s.label}>Detect location</label>
                <div style={s.detectRow}>
                  <button className="ch-detect-btn" onClick={detectLocation}
                    style={s.detectBtn}>
                    📍 Detect my location
                  </button>
                  {locStatus && (
                    <span style={{
                      fontSize: 13,
                      color: locationSet ? INDIA_GREEN : TEXT_MUTED,
                      fontWeight: locationSet ? 600 : 400,
                    }}>{locStatus}</span>
                  )}
                </div>
                <p style={s.hint}>Allow location access when prompted, or enter coordinates below.</p>
              </div>

              <div style={s.field}>
                <label style={s.label}>Coordinates (manual entry)</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <input className="ch-input" placeholder="Latitude (e.g. 22.5726)"
                    value={manualLat}
                    onChange={e => { setManualLat(e.target.value); setLocation(l => ({ ...l, lat: e.target.value })); }}
                    style={{ ...s.input, flex: 1, minWidth: 140 }}
                  />
                  <input className="ch-input" placeholder="Longitude (e.g. 88.3639)"
                    value={manualLng}
                    onChange={e => { setManualLng(e.target.value); setLocation(l => ({ ...l, lng: e.target.value })); }}
                    style={{ ...s.input, flex: 1, minWidth: 140 }}
                  />
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Quick locations</label>
                <p style={s.hint}>Tap a known landmark to set coordinates instantly (for demo).</p>
                <div style={s.quickRow} className="ch-quick-row">
                  {QUICK_LOCATIONS.map(loc => (
                    <button key={loc.name} className="ch-quick-loc"
                      onClick={() => {
                        setManualLat(loc.lat); setManualLng(loc.lng);
                        setLocation({ lat: loc.lat, lng: loc.lng });
                        setLocStatus(`✓ ${loc.name} selected`);
                      }}
                      style={{
                        ...s.quickBtn,
                        background: location.lat === loc.lat ? INDIA_BLUE : '#fff',
                        color: location.lat === loc.lat ? '#fff' : '#374151',
                        borderColor: location.lat === loc.lat ? INDIA_BLUE : BORDER_COL,
                      }}>
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location preview */}
              {locationSet && (
                <div style={s.locPreview}>
                  <span style={{ fontSize: 16 }}>📍</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: INDIA_BLUE }}>Location set</div>
                    <div style={{ fontSize: 12, color: TEXT_MUTED, marginTop: 2 }}>
                      {parseFloat(manualLat).toFixed(5)}°N, {parseFloat(manualLng).toFixed(5)}°E
                    </div>
                  </div>
                </div>
              )}

              <div style={s.stepBtns} className="ch-step-btns">
                <button onClick={() => setStep(1)}
                  style={s.ghostBtn}>
                  ← Back
                </button>
                <button onClick={handleSubmit}
                  disabled={loading || !locationSet}
                  style={s.primaryBtn(loading || !locationSet)}>
                  {loading ? '🔄 Reviewing and filing…' : '✓ File this issue'}
                </button>
              </div>
            </div>
          )}

          {/* Info footer */}
          <div style={s.infoFooter}>
            <span style={{ fontSize: 14 }}>🏛️</span>
            <span>Your report will be publicly visible in the Case Ledger and routed to the relevant civic office.</span>
          </div>
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
    display: 'flex', flexDirection: 'column',
  },
  headerStrip: { background: INDIA_BLUE, padding: '12px 20px' },
  headerInner: {
    maxWidth: 1080, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 12 },
  ashokaWrap: {
    width: 48, height: 48, background: '#fff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  portalHi: {
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    fontSize: 11, color: 'rgba(255,255,255,.7)', lineHeight: 1.3,
  },
  portalEn: { fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
  portalTag: { fontSize: 10.5, color: 'rgba(255,255,255,.55)', marginTop: 1 },
  headerLink: {
    color: 'rgba(255,255,255,.7)', fontSize: 13,
    textDecoration: 'none', fontWeight: 500,
  },

  pageBody: {
    flex: 1, display: 'flex',
    alignItems: 'flex-start', justifyContent: 'center',
    padding: '36px 20px 48px',
  },
  card: {
    background: '#fff',
    border: `1px solid ${BORDER_COL}`,
    borderTop: `3px solid ${SAFFRON}`,
    borderRadius: 6,
    padding: '32px 32px 28px',
    width: '100%', maxWidth: 560,
  },

  kicker: {
    fontSize: 11, fontWeight: 600, color: SAFFRON,
    letterSpacing: '1.6px', textTransform: 'uppercase',
    marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
  },
  kickerLine: { display: 'inline-block', width: 20, height: 2, background: SAFFRON, borderRadius: 1 },
  heading: { fontSize: 22, fontWeight: 700, color: INDIA_BLUE, margin: '0 0 6px' },
  sub: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 20 },

  progressWrap: { marginBottom: 24 },
  progressBg: { height: 5, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFg: { height: '100%', background: SAFFRON, borderRadius: 3, transition: 'width .4s ease' },

  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 7 },
  input: {
    width: '100%', padding: '10px 13px',
    border: `1px solid ${BORDER_COL}`, borderRadius: 4,
    fontSize: 14.5, color: '#1a1a1a',
    fontFamily: "'Noto Sans', sans-serif",
    transition: 'border-color .2s',
  },
  hint: { fontSize: 12, color: TEXT_MUTED, marginTop: 5 },

  photoBtnRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  photoBtn: {
    background: INDIA_BLUE, color: '#fff',
    border: 'none', padding: '8px 16px',
    borderRadius: 4, cursor: 'pointer',
    fontSize: 13, fontWeight: 600,
    display: 'inline-block', position: 'relative',
  },
  photoBtnGhost: {
    background: '#fff', color: '#374151',
    border: `1px solid ${BORDER_COL}`,
    padding: '8px 16px', borderRadius: 4,
    cursor: 'pointer', fontSize: 13, fontWeight: 500,
    display: 'inline-block', position: 'relative',
    transition: 'border-color .2s',
  },
  hiddenInput: {
    position: 'absolute', width: 1, height: 1,
    opacity: 0, overflow: 'hidden', pointerEvents: 'none',
  },
  preview: {
    width: '100%', maxHeight: 200, objectFit: 'cover',
    borderRadius: 4, border: `1px solid ${BORDER_COL}`,
  },
  photoPlaceholder: {
    width: '100%', height: 120,
    border: `2px dashed ${BORDER_COL}`, borderRadius: 4,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  aiNote: {
    marginTop: 10, padding: '9px 13px',
    background: '#EEF4FF', border: `1px solid #C7D9F5`,
    borderLeft: `3px solid ${INDIA_BLUE}`,
    borderRadius: 4, fontSize: 12.5, color: INDIA_BLUE,
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },

  detectRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 6 },
  detectBtn: {
    padding: '9px 18px', borderRadius: 4,
    border: `1.5px solid ${INDIA_BLUE}`, background: '#fff',
    color: INDIA_BLUE, fontSize: 13.5, fontWeight: 600,
    cursor: 'pointer', transition: 'all .2s',
  },

  quickRow: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  quickBtn: {
    padding: '6px 14px', border: `1px solid ${BORDER_COL}`,
    borderRadius: 14, cursor: 'pointer',
    fontSize: 12.5, fontWeight: 500,
    transition: 'all .15s',
  },

  locPreview: {
    marginTop: -6, marginBottom: 16,
    padding: '10px 14px',
    background: '#EFFFEE', border: `1px solid #B7E8C8`,
    borderLeft: `3px solid ${INDIA_GREEN}`,
    borderRadius: 4, display: 'flex', gap: 10, alignItems: 'center',
  },

  stepBtns: { display: 'flex', gap: 10, marginTop: 24 },
  primaryBtn: (disabled) => ({
    flex: 1, padding: '12px',
    background: disabled ? '#9CA3AF' : INDIA_BLUE,
    color: '#fff', border: 'none', borderRadius: 4,
    fontSize: 15, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }),
  ghostBtn: {
    padding: '12px 20px', background: '#fff',
    border: `1.5px solid ${BORDER_COL}`, borderRadius: 4,
    color: '#374151', fontSize: 14, fontWeight: 500,
    cursor: 'pointer',
  },

  infoFooter: {
    marginTop: 22, padding: '10px 14px',
    background: '#F8F9FC', border: `1px solid ${BORDER_COL}`,
    borderRadius: 4, fontSize: 12.5, color: TEXT_MUTED,
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },
};