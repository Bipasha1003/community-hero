// frontend/src/pages/Landing.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const STATUS_ORDER = ['Reported', 'Verified', 'In Progress', 'Resolved'];

const STATUS_META = {
  Reported:      { label: 'Reported',     note: 'Awaiting review',     color: '#6B7280' },
  Verified:      { label: 'Verified',     note: 'Confirmed by staff',  color: '#1a3c6e' },
  'In Progress': { label: 'In progress',  note: 'Field crew assigned', color: '#FF6B00' },
  Resolved:      { label: 'Resolved',     note: 'Closed out',          color: '#046A38' },
};

function useCountUp(value, durationMs = 900) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const tick = (now) => {
              const progress = Math.min((now - start) / durationMs, 1);
              setDisplay(Math.round(progress * value));
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return [ref, display];
}

function LedgerRow({ status, count, total }) {
  const meta = STATUS_META[status];
  const [ref, display] = useCountUp(count);
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div ref={ref} style={styles.ledgerRow} className="ch-ledger-row">
      <div>
        <div style={styles.statusName}>
          <span style={{ ...styles.statusDot, background: meta.color }} />
          {meta.label}
        </div>
        <div style={styles.statusNote}>{meta.note}</div>
      </div>
      <div style={styles.barBg}>
        <div style={{ ...styles.barFg, width: `${pct}%`, background: meta.color }} />
      </div>
      <div style={styles.countCell} className="ch-count-cell">{display}</div>
    </div>
  );
}

export default function Landing() {
  const [counts, setCounts] = useState(null);
  const [error, setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/issues`)
      .then((res) => {
        if (cancelled) return;
        const tally = { Reported: 0, Verified: 0, 'In Progress': 0, Resolved: 0 };
        (res.data || []).forEach((issue) => {
          if (tally[issue.status] !== undefined) tally[issue.status] += 1;
        });
        setCounts(tally);
      })
      .catch(() => !cancelled && setError(true));
    return () => { cancelled = true; };
  }, []);

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const resolvedPct =
    counts && total > 0 ? Math.round((counts.Resolved / total) * 100) : null;
  const inProgress = counts ? counts['In Progress'] : 0;

  return (
    <div style={styles.page}>
      <FontImports />

      {/* Tricolor top bar */}
      <TricolorBar />

      {/* ── SCROLLING TICKER BAR ── */}
      <div style={{
        background: '#f0f4ff',
        borderBottom: '1px solid #d0daf0',
        padding: '4px 0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div className="marquee-track">
          {[0, 1].map(n => (
            <span key={n} className="marquee-item">
              🏛️ Community Hero — Civic Issue Reporting Portal &nbsp;|&nbsp;
              📍 Report potholes, broken streetlights, water leaks &amp; garbage &nbsp;|&nbsp;
              ✅ Every case is logged, tracked &amp; resolved transparently &nbsp;|&nbsp;
              🇮🇳 Transparent governance for every Indian citizen &nbsp;|&nbsp;
              📞 National Helpline: 1800-XXX-XXXX &nbsp;|&nbsp;
              ⚖️ Satyameva Jayate — Truth Alone Triumphs &nbsp;|&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <header style={styles.header}>
        <div style={styles.headerInner} className="ch-header-inner">
          <div style={styles.emblemBlock} className="ch-emblem-block">
            <div style={styles.ashokaWrap} className="ch-ashoka-wrap">
              <AshokaChakra />
            </div>
            <div style={styles.portalName}>
              <div style={styles.portalNameHi}>सामुदायिक हीरो</div>
              <div style={styles.portalNameEn} className="ch-portal-name-en">Community Hero</div>
              <div style={styles.portalTagline} className="ch-portal-tagline">Civic Issue Reporting Portal — Government of India</div>
            </div>
          </div>
          <div style={styles.headerRight} className="ch-header-right">
            <Link to="/login"    style={styles.btnLogin}>Sign in</Link>
            <Link to="/register" style={styles.btnRegister}>Register now</Link>
          </div>
        </div>
      </header>

      {/* ── NAVIGATION ── */}
      <nav style={styles.govNav} className="ch-gov-nav-wrap">
        <div style={styles.govNavInner} className="ch-gov-nav">
          <a href="/"             style={{ ...styles.navItem, ...styles.navItemActive }}>Home</a>
          <a href="#ledger"       style={styles.navItem}>Case Ledger</a>
          <a href="#how-it-works" style={styles.navItem}>How It Works</a>
          <a href="#about"        style={styles.navItem}>About the Portal</a>
          <a href="#contact"      style={styles.navItem}>Contact Us</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={styles.heroBanner}>
        <div style={styles.heroPattern} aria-hidden="true" />
        <div style={styles.heroInner} className="ch-hero-inner">
          <div>
            <div style={styles.heroBadge}>
              <span style={styles.badgeDot} />
              Live public portal
            </div>
            <h1 style={styles.heroH1} className="ch-hero-h1">
              File it once.<br />
              <span style={styles.heroH1Accent}>We'll see it through.</span>
            </h1>
            <p style={styles.heroLead} className="ch-hero-lead">
              Report potholes, broken streetlights, water leaks or garbage — directly to the
              civic office. Every case is logged, tracked, and resolved in the open.
              Transparent governance for every citizen.
            </p>
            <div style={styles.heroBtns} className="ch-hero-btns">
              <Link to="/register" style={styles.heroBtnPrimary}>Report an issue</Link>
              <Link to="/login"    style={styles.heroBtnGhost}>Sign in to track</Link>
            </div>
            {resolvedPct !== null && (
              <p style={styles.heroStat}>
                <strong>{resolvedPct}%</strong> of {total} filed case{total === 1 ? '' : 's'} resolved to date.
              </p>
            )}
          </div>
          <div style={styles.heroSealSide} className="ch-hero-seal">
            <PortalSeal />
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      {counts && (
        <div style={styles.statsBand} className="ch-stats-band">
          <StatBlock icon="📋" num={total}                                              label="Total cases filed" />
          <StatBlock icon="⏳" num={inProgress}                                        label="Cases in progress" />
          <StatBlock icon="✅" num={counts.Resolved}                                   label="Cases resolved" />
          <StatBlock icon="📊" num={resolvedPct !== null ? `${resolvedPct}%` : '0%'}  label="Resolution rate" />
        </div>
      )}

      {/* ── CASE LEDGER ── */}
      <section id="ledger" style={styles.ledgerSection}>
        <div style={styles.sectionWrap}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionKicker}><span style={styles.kickerLine} />Public record</div>
            <div style={styles.sectionTitle} className="ch-section-title">Case Ledger</div>
            <div style={styles.sectionSubtitle}>
              {error ? 'Live counts unavailable right now' : 'Updated live from the records office'}
            </div>
          </div>

          <div style={styles.ledgerCard}>
            <div style={styles.ledgerColHead} className="ch-ledger-colhead">
              <span>Status</span>
              <span>Distribution</span>
              <span style={{ textAlign: 'right' }}>Count</span>
            </div>

            {counts && !error ? (
              STATUS_ORDER.map((status) => (
                <LedgerRow key={status} status={status} count={counts[status]} total={total} />
              ))
            ) : (
              <div style={styles.ledgerPlaceholder}>
                {error ? 'Live data is currently unavailable. Please refresh.' : 'Loading case data…'}
              </div>
            )}

            <div style={styles.ledgerTotalRow}>
              <span style={styles.ledgerTotalLabel}>Total cases on record</span>
              <span style={styles.ledgerTotalNum}>{total}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={styles.stepsSection}>
        <div style={styles.sectionWrap}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionKicker}><span style={styles.kickerLine} />Citizen services</div>
            <div style={styles.sectionTitle} className="ch-section-title">How a report moves through the office</div>
            <div style={styles.sectionSubtitle}>Simple 3-step process — from filing to resolution</div>
          </div>
          <div style={styles.serviceCards} className="ch-service-cards">
            <ServiceCard
              accent={INDIA_BLUE} iconBg="#EEF4FF" iconColor={INDIA_BLUE}
              n="Step 01" title="File a report"
              text="Add a photo and pin the location on the map. The portal automatically assigns a category and severity level to your report."
            />
            <ServiceCard
              accent={SAFFRON} iconBg="#FFF3E8" iconColor="#b34d00"
              n="Step 02" title="Staff verification"
              text="Government staff verify the report, assign it to the appropriate department or field crew, and update the case status in real time."
            />
            <ServiceCard
              accent={INDIA_GREEN} iconBg="#EFFFEE" iconColor={INDIA_GREEN}
              n="Step 03" title="Resolution and closure"
              text="Once the work is done, the case is closed and permanently added to the public ledger — a transparent record for all citizens."
            />
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ background: '#fff', borderBottom: `1px solid ${BORDER_COL}` }}>
        <div style={styles.sectionWrap}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionKicker}><span style={styles.kickerLine} />About</div>
            <div style={styles.sectionTitle} className="ch-section-title">About Community Hero</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {[
              { icon: '🏛️', title: 'Government Initiative', text: 'Community Hero is an official civic portal built to bridge the gap between citizens and local government authorities.' },
              { icon: '🔍', title: 'Full Transparency', text: 'Every report is publicly visible in the Case Ledger. No issue gets lost or ignored — the community watches together.' },
              { icon: '📱', title: 'Mobile First', text: 'Report issues directly from your phone. Take a photo, drop a pin, and submit in under 60 seconds from anywhere.' },
              { icon: '🤝', title: 'Community Driven', text: 'Citizens can upvote existing issues, add comments, and collaborate — making every voice count in local governance.' },
            ].map(c => (
              <div key={c.title} style={{
                background: '#f8f9fc', border: `1px solid ${BORDER_COL}`,
                borderRadius: 8, padding: '20px 18px',
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: INDIA_BLUE, marginBottom: 8 }}>{c.title}</div>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0 }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ background: OFF_WHITE, borderBottom: `1px solid ${BORDER_COL}` }}>
        <div style={styles.sectionWrap}>
          <div style={styles.sectionHead}>
            <div style={styles.sectionKicker}><span style={styles.kickerLine} />Contact</div>
            <div style={styles.sectionTitle} className="ch-section-title">Get in Touch</div>
            <div style={styles.sectionSubtitle}>Reach us through any of the channels below</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { icon: '📞', label: 'Helpline',      value: '1800-XXX-XXXX',              note: 'Mon–Sat, 9am–6pm IST' },
              { icon: '✉️', label: 'Email',          value: 'help@.gov.in',   note: 'Reply within 24 hours' },
              { icon: '📍', label: 'Headquarters',   value: 'New Delhi, India',            note: 'Government of India' },
              { icon: '🕐', label: 'Working Hours',  value: 'Mon–Sat, 9am–6pm',           note: 'Closed on public holidays' },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff', border: `1px solid ${BORDER_COL}`,
                borderLeft: `3px solid ${SAFFRON}`,
                borderRadius: 6, padding: '16px 18px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: INDIA_BLUE }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{c.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerTop} className="ch-footer-top">
            <div>
              <div style={styles.footerBrandName}>Community Hero — Civic Issue Reporting Portal</div>
              <div style={styles.footerBrandSub}>Government of India initiative for transparent civic governance</div>
            </div>
            <div style={styles.footerLinks} className="ch-footer-links">
              {['Terms of use', 'Privacy policy', 'Accessibility', 'RTI', 'Contact'].map(l => (
                <a key={l} href="#" style={styles.footerLink}>{l}</a>
              ))}
            </div>
          </div>
          <div style={styles.footerBottom} className="ch-footer-bottom">
            <span style={styles.footerCopy}>
              Content on this website is published and managed by the Civic Issue Office.
              For queries, contact the National Helpline.
            </span>
            <span style={styles.nicBadge}>Powered by NIC</span>
          </div>
        </div>
      </footer>

      <TricolorBar height={4} />
    </div>
  );
}

function StatBlock({ icon, num, label }) {
  return (
    <div style={styles.statBlock}>
      <div style={styles.statIcon}>{icon}</div>
      <div style={styles.statNum} className="ch-stat-num">{num}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function ServiceCard({ accent, iconBg, iconColor, n, title, text }) {
  return (
    <div style={{ ...styles.svcCard, borderTopColor: accent }}>
      <div style={{ ...styles.svcIcon, background: iconBg }}>
        <span style={{ fontSize: 22, color: iconColor }}>🗒️</span>
      </div>
      <div style={styles.svcNum}>{n}</div>
      <div style={styles.svcTitle}>{title}</div>
      <p style={styles.svcText}>{text}</p>
    </div>
  );
}

function TricolorBar({ height = 5 }) {
  return (
    <div style={{ display: 'flex', height }}>
      <span style={{ flex: 1, background: '#FF6B00' }} />
      <span style={{ flex: 1, background: '#FFFFFF', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }} />
      <span style={{ flex: 1, background: '#046A38' }} />
    </div>
  );
}

function AshokaChakra() {
  return (
    <svg width="38" height="38" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="none" stroke="#004080" strokeWidth="3" />
      <circle cx="40" cy="40" r="8"  fill="#004080" />
      <circle cx="40" cy="40" r="4"  fill="#fff" />
      {[0,15,30,45,60,75,90,105,120,135,150,165,180,195,210,225,240,255,270,285,300,315,330,345].map((deg, i) => {
        const r  = Math.PI / 180;
        const x1 = 40 + 10 * Math.cos(deg * r);
        const y1 = 40 + 10 * Math.sin(deg * r);
        const x2 = 40 + 33 * Math.cos(deg * r);
        const y2 = 40 + 33 * Math.sin(deg * r);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#004080" strokeWidth="1.8" />;
      })}
      {[0,90,180,270].map((deg, i) => {
        const r  = Math.PI / 180;
        const cx = 40 + 36 * Math.cos(deg * r);
        const cy = 40 + 36 * Math.sin(deg * r);
        return <circle key={i} cx={cx} cy={cy} r="2.5" fill="#FF6B00" />;
      })}
    </svg>
  );
}

function PortalSeal() {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg width="200" height="200" viewBox="0 0 240 240" aria-hidden="true" style={{ opacity: 0.9 }}>
      <defs>
        <path id="rp2" d="M120,120 m-98,0 a98,98 0 1,1 196,0 a98,98 0 1,1 -196,0" />
        <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,150,50,0.9)" />
          <stop offset="100%" stopColor="rgba(255,100,0,0.4)" />
        </radialGradient>
      </defs>

      {/* Outer rings */}
      <circle cx="120" cy="120" r="115" fill="none" stroke="rgba(11, 6, 6, 0.1)" strokeWidth="1" />
      <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(255,179,102,.30)" strokeWidth="0.8" strokeDasharray="2 4" />
      <circle cx="120" cy="120" r="98"  fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />

      {/* Circular text */}
      <text fill="rgba(255,179,102,.75)" fontSize="8.2" fontFamily="'Noto Sans',sans-serif" letterSpacing="3.2" fontWeight="600">
        <textPath href="#rp2" startOffset="2%">
          COMMUNITY HERO  •  CIVIC ISSUE PORTAL  •  OPEN TO ALL  • SATYAMEVA JAYATE • JAI HIND •
        </textPath>
      </text>

      {/* Chakra rim */}
      <circle cx="120" cy="120" r="78" fill="rgba(255,255,255,.04)" stroke="rgba(255,200,120,.55)" strokeWidth="1.8" />

      {/* 24 spokes — one per 15° */}
      <g stroke="rgba(255,200,120,.80)" strokeWidth="1.5" strokeLinecap="round">
        {spokes.map((deg) => (
          <line key={deg} x1="120" y1="102" x2="120" y2="42" transform={`rotate(${deg} 120 120)`} />
        ))}
      </g>

      {/* Rim dots at each spoke tip */}
      <g fill="rgba(255,200,120,.65)">
        {spokes.map((deg) => (
          <circle key={deg} cx="120" cy="42" r="2.2" transform={`rotate(${deg} 120 120)`} />
        ))}
      </g>

      {/* Hub rings */}
      <circle cx="120" cy="120" r="18" fill="rgba(255,255,255,.06)" stroke="rgba(255,200,120,.70)" strokeWidth="1.8" />
      <circle cx="120" cy="120" r="13" fill="rgba(255,255,255,.04)" stroke="rgba(255,179,102,.40)" strokeWidth="1" />

      {/* Hub center */}
      <circle cx="120" cy="120" r="6"   fill="url(#hubGlow)" stroke="rgba(255,150,50,.8)" strokeWidth="1" />
      <circle cx="120" cy="120" r="2.5" fill="rgba(255,220,150,.95)" />

      
    </svg>
  );
}

function FontImports() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
      * { box-sizing: border-box; }
      a, button { font-family: inherit; }

      @keyframes govBlink {
        0%,100% { opacity:1 }
        50%      { opacity:.2 }
      }

      /* ── TRUE MARQUEE ── */
      .marquee-track {
        display: flex;
        width: max-content;
        animation: marqueeScroll 32s linear infinite;
      }
      .marquee-track:hover {
        animation-play-state: paused;
      }
      .marquee-item {
        white-space: nowrap;
        padding-right: 40px;
        font-size: 11px;
        font-weight: 500;
        color: #1a3c6e;
        font-family: 'Noto Sans', sans-serif;
        display: inline-block;
      }
      @keyframes marqueeScroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }

      /* ── DESKTOP NAV HOVER ── */
      .ch-nav-item:hover {
        color: #1a3c6e !important;
        border-bottom-color: #FF6B00 !important;
      }

      /* ── TABLET 860px ── */
      @media (max-width: 860px) {
        .ch-header-inner {
          flex-wrap: wrap !important;
          gap: 10px !important;
          padding: 10px 16px !important;
        }
        .ch-header-right {
          width: 100% !important;
          justify-content: flex-start !important;
        }
        .ch-portal-tagline { display: none !important; }
        .ch-gov-nav {
          overflow-x: auto !important;
          white-space: nowrap !important;
          -webkit-overflow-scrolling: touch !important;
          scrollbar-width: none !important;
        }
        .ch-gov-nav::-webkit-scrollbar { display: none !important; }
        .ch-hero-inner {
          grid-template-columns: 1fr !important;
          padding: 28px 16px !important;
          gap: 0 !important;
        }
        .ch-hero-seal { display: none !important; }
        .ch-hero-h1   { font-size: 24px !important; }
        .ch-hero-lead { font-size: 13.5px !important; }
        .ch-hero-btns { flex-direction: column !important; gap: 10px !important; }
        .ch-hero-btns a { text-align: center !important; display: block !important; }
        .ch-stats-band  { grid-template-columns: repeat(2,1fr) !important; }
        .ch-service-cards { grid-template-columns: 1fr !important; }
        .ch-ledger-colhead,
        .ch-ledger-row  { grid-template-columns: 130px 1fr 52px !important; }
        .ch-section-title { font-size: 18px !important; }
        .ch-footer-top   { flex-direction: column !important; gap: 16px !important; }
        .ch-footer-links { flex-wrap: wrap !important; gap: 12px !important; }
        .ch-footer-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
      }

      /* ── MOBILE 480px ── */
      @media (max-width: 480px) {
        .ch-emblem-block  { gap: 8px !important; }
        .ch-ashoka-wrap   { width: 38px !important; height: 38px !important; }
        .ch-portal-name-en { font-size: 15px !important; }
        .ch-hero-h1       { font-size: 21px !important; }
        .ch-stats-band    { grid-template-columns: repeat(2,1fr) !important; }
        .ch-stat-num      { font-size: 20px !important; }
        .ch-ledger-colhead,
        .ch-ledger-row    { grid-template-columns: 100px 1fr 42px !important; gap: 8px !important; padding: 12px 12px !important; }
        .ch-count-cell    { font-size: 15px !important; }
        .ch-section-title { font-size: 16px !important; }
        .ch-header-inner  { padding: 8px 12px !important; }
      }
    `}</style>
  );
}

// ── Palette ──
const SAFFRON     = '#FF6B00';
const INDIA_BLUE  = '#1a3c6e';
const INDIA_GREEN = '#046A38';
const OFF_WHITE   = '#F8F9FC';
const BORDER_COL  = '#D8DEE9';

// ── Styles ──
const styles = {
  page: {
    fontFamily: "'Noto Sans', sans-serif",
    color: '#1A1A1A',
    background: OFF_WHITE,
    minHeight: '100vh',
    overflowX: 'hidden',
  },

  // Header
  header: { background: INDIA_BLUE, padding: '12px 20px' },
  headerInner: {
    maxWidth: 1080, margin: '0 auto',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 16,
  },
  emblemBlock: { display: 'flex', alignItems: 'center', gap: 14 },
  ashokaWrap: {
    width: 52, height: 52, background: '#fff', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  portalName: { color: '#fff' },
  portalNameHi: {
    fontFamily: "'Noto Sans Devanagari', sans-serif",
    fontSize: 12, color: 'rgba(255,255,255,.7)', lineHeight: 1.3,
  },
  portalNameEn: { fontSize: 19, fontWeight: 700, lineHeight: 1.2, letterSpacing: '.2px' },
  portalTagline: { fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 1 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  btnLogin: {
    background: 'transparent', border: '1.5px solid rgba(255,255,255,.55)',
    color: '#fff', padding: '7px 16px', borderRadius: 4,
    fontSize: 13, fontWeight: 500, textDecoration: 'none',
  },
  btnRegister: {
    background: SAFFRON, border: 'none', color: '#fff',
    padding: '7px 18px', borderRadius: 4,
    fontSize: 13, fontWeight: 600, textDecoration: 'none',
  },

  // Nav
  govNav: { background: '#fff', borderBottom: `2px solid ${INDIA_BLUE}`, overflowX: 'auto' },
  govNavInner: { maxWidth: 1080, margin: '0 auto', display: 'flex' },
  navItem: {
    padding: '11px 18px', fontSize: 13.5, fontWeight: 500, color: '#444',
    textDecoration: 'none', borderBottom: '3px solid transparent', whiteSpace: 'nowrap',
    transition: 'color .2s, border-color .2s',
  },
  navItemActive: {
    color: INDIA_BLUE, borderBottom: `3px solid ${SAFFRON}`, fontWeight: 600,
  },

  // Hero
  heroBanner: { background: INDIA_BLUE, position: 'relative', overflow: 'hidden' },
  heroPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 50%)',
    backgroundSize: '20px 20px', pointerEvents: 'none',
  },
  heroInner: {
    maxWidth: 1080, margin: '0 auto',
    padding: '44px 20px 40px',
    display: 'grid', gridTemplateColumns: '1.2fr 0.8fr',
    gap: 40, alignItems: 'center',
    position: 'relative', zIndex: 1,
  },
  heroBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(255,107,0,.15)', border: '1px solid rgba(255,107,0,.4)',
    color: '#FFB366', padding: '4px 12px', borderRadius: 3,
    fontSize: 11.5, fontWeight: 600, letterSpacing: '.8px', textTransform: 'uppercase',
    marginBottom: 16,
  },
  badgeDot: {
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: SAFFRON, animation: 'govBlink 1.8s infinite',
  },
  heroH1: {
    fontSize: 32, fontWeight: 700, color: '#fff',
    lineHeight: 1.25, marginBottom: 14, letterSpacing: '-.3px',
  },
  heroH1Accent: { color: '#FFB366' },
  heroLead: {
    fontSize: 14.5, lineHeight: 1.75, color: 'rgba(255,255,255,.75)',
    marginBottom: 28, maxWidth: 460,
  },
  heroBtns: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  heroBtnPrimary: {
    background: SAFFRON, color: '#fff', fontWeight: 600, fontSize: 14,
    textDecoration: 'none', padding: '11px 22px', borderRadius: 4,
  },
  heroBtnGhost: {
    color: '#fff', fontWeight: 500, fontSize: 14,
    textDecoration: 'none', padding: '11px 22px', borderRadius: 4,
    border: '1.5px solid rgba(255,255,255,.4)',
  },
  heroStat: { marginTop: 20, fontSize: 12.5, color: 'rgba(255,255,255,.5)' },
  heroSealSide: { display: 'flex', justifyContent: 'center', alignItems: 'center' },

  // Stats band
  statsBand: {
    background: INDIA_BLUE, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
  },
  statBlock: {
    padding: '22px 20px', textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,.1)',
  },
  statIcon:  { fontSize: 20, marginBottom: 6, opacity: .5 },
  statNum:   { fontSize: 26, fontWeight: 700, color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 3, letterSpacing: '.3px' },

  // Section shared
  sectionWrap: { maxWidth: 1080, margin: '0 auto', padding: '36px 20px' },
  sectionHead: { marginBottom: 22 },
  sectionKicker: {
    fontSize: 11.5, fontWeight: 600, color: SAFFRON,
    letterSpacing: '1.6px', textTransform: 'uppercase',
    marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6,
  },
  kickerLine: { display: 'inline-block', width: 24, height: 2, background: SAFFRON, borderRadius: 1 },
  sectionTitle:    { fontSize: 22, fontWeight: 700, color: INDIA_BLUE },
  sectionSubtitle: { fontSize: 13.5, color: '#666', marginTop: 4 },

  // Ledger
  ledgerSection: { background: '#fff', borderBottom: `1px solid ${BORDER_COL}` },
  ledgerCard: {
    background: '#fff', border: `1px solid ${BORDER_COL}`,
    borderTop: `3px solid ${INDIA_BLUE}`, borderRadius: 4,
  },
  ledgerColHead: {
    display: 'grid', gridTemplateColumns: '180px 1fr 70px',
    gap: 14, padding: '10px 20px',
    borderBottom: '1px solid #eef0f5', background: '#f5f8ff',
    fontSize: 12, fontWeight: 600, color: '#555',
  },
  ledgerRow: {
    display: 'grid', gridTemplateColumns: '180px 1fr 70px',
    alignItems: 'center', gap: 14, padding: '15px 20px',
    borderBottom: '1px solid #f0f2f7',
  },
  statusName: {
    fontSize: 14, fontWeight: 600, color: '#1a1a1a',
    display: 'flex', alignItems: 'center', gap: 7,
  },
  statusDot:  { width: 9, height: 9, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  statusNote: { fontSize: 11.5, color: '#666' },
  barBg:      { height: 7, background: '#EEF0F5', borderRadius: 2, overflow: 'hidden' },
  barFg:      { height: '100%', borderRadius: 2, transition: 'width .8s ease' },
  countCell:  {
    fontSize: 20, fontWeight: 700, color: INDIA_BLUE,
    textAlign: 'right', fontVariantNumeric: 'tabular-nums',
  },
  ledgerPlaceholder: { padding: '28px 20px', fontSize: 13, color: '#888' },
  ledgerTotalRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', background: INDIA_BLUE,
  },
  ledgerTotalLabel: {
    fontSize: 12, color: 'rgba(255,255,255,.65)',
    letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500,
  },
  ledgerTotalNum: { fontSize: 18, fontWeight: 700, color: '#fff' },

  // Steps
  stepsSection: { background: OFF_WHITE, borderBottom: `1px solid ${BORDER_COL}` },
  serviceCards: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 4 },
  svcCard: {
    background: '#fff', border: `1px solid ${BORDER_COL}`,
    borderTop: '3px solid transparent', borderRadius: 6, padding: '20px 18px',
  },
  svcIcon: {
    width: 44, height: 44, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  svcNum:   { fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 },
  svcTitle: { fontSize: 16, fontWeight: 700, color: INDIA_BLUE, marginBottom: 8 },
  svcText:  { fontSize: 13, lineHeight: 1.65, color: '#666' },

  // Footer
  footer: { background: '#0F2848', borderTop: `4px solid ${SAFFRON}` },
  footerInner: { maxWidth: 1080, margin: '0 auto', padding: '28px 20px' },
  footerTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: 20, paddingBottom: 20,
    borderBottom: '1px solid rgba(255,255,255,.1)',
  },
  footerBrandName: { fontSize: 15, fontWeight: 700, color: '#fff' },
  footerBrandSub:  { fontSize: 11.5, color: 'rgba(255,255,255,.5)', marginTop: 3 },
  footerLinks:  { display: 'flex', gap: 24, flexWrap: 'wrap' },
  footerLink:   { fontSize: 12.5, color: 'rgba(255,255,255,.55)', textDecoration: 'none' },
  footerBottom: {
    paddingTop: 16, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 8,
  },
  footerCopy: { fontSize: 11.5, color: 'rgba(255,255,255,.35)' },
  nicBadge: {
    fontSize: 11, color: 'rgba(255,255,255,.3)',
    border: '1px solid rgba(255,255,255,.15)',
    padding: '3px 10px', borderRadius: 3,
  },
};