// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Design tokens (matches Landing.jsx) ──────────────────────────────────────
const INDIA_BLUE  = '#1a3c6e';
const SAFFRON     = '#FF6B00';
const OFF_WHITE   = '#F8F9FC';
const BORDER_COL  = '#D8DEE9';
const TEXT_MUTED  = '#6B7280';

const STATUS_META = {
  Reported:      { color: '#DC2626', bg: '#FEECEC', label: 'Reported'    },
  Verified:      { color: '#2563EB', bg: '#EAF1FE', label: 'Verified'   },
  'In Progress': { color: '#D4A017', bg: '#FEF9E0', label: 'In Progress' },
  Resolved:      { color: '#16A34A', bg: '#E9FBEF', label: 'Resolved'  },
};

const CATEGORY_EMOJI = {
  'Pothole': '🕳️', 'Broken Streetlight': '💡',
  'Water Leakage': '💧', 'Garbage': '🗑️',
  'Damaged Infrastructure': '🏗️', 'Other': '⚠️',
};

const mapStyle      = { width: '100%', height: '420px' };
const defaultCenter = [22.5726, 88.3639]; // [lat, lng] — Leaflet order

// ── Custom colored pin icons (no external icon files needed) ──
function makeIcon(color) {
  return L.divIcon({
    className: 'ch-custom-pin',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 2.5px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,.35);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

const PIN_ICONS = {
  Reported:      makeIcon(STATUS_META.Reported.color),
  Verified:      makeIcon(STATUS_META.Verified.color),
  'In Progress': makeIcon(STATUS_META['In Progress'].color),
  Resolved:      makeIcon(STATUS_META.Resolved.color),
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.Reported;
  return (
    <span style={{
      background: meta.bg, color: meta.color,
      border: `1px solid ${meta.color}30`,
      padding: '2px 10px', borderRadius: 3,
      fontSize: 12, fontWeight: 600,
    }}>{meta.label}</span>
  );
}

function SeverityBadge({ severity }) {
  const map = {
    High:   { bg: '#FEECEC', color: '#B91C1C' },
    Medium: { bg: '#FEF9C3', color: '#92400E' },
    Low:    { bg: '#DCFCE7', color: '#166534' },
  };
  const t = map[severity] || map.Low;
  return (
    <span style={{
      background: t.bg, color: t.color,
      padding: '2px 10px', borderRadius: 3,
      fontSize: 12, fontWeight: 600,
    }}>{severity}</span>
  );
}

// Recenters/flies the map when a marker is selected from the list below
function FlyToSelected({ selected }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.latitude, selected.longitude], 15, { duration: 0.6 });
    }
  }, [selected, map]);
  return null;
}

export default function Home() {
  const [issues, setIssues]       = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [expandedImg, setExpandedImg] = useState(null);
  const [votedIssues, setVotedIssues] = useState(
    () => JSON.parse(localStorage.getItem('votedIssues') || '[]')
  );
  const [filterStatus, setFilterStatus] = useState('All');

  const role    = localStorage.getItem('role');
  const token   = localStorage.getItem('token');
  const isAdmin = role === 'admin';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setIssues(data);
      setLoading(false);
      setSelected(prev => {
        if (!prev) return prev;
        return data.find(i => i.id === prev.id) || null;
      });
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const handleUpvote = async (id) => {
    if (votedIssues.includes(id)) { alert('You have already upvoted this issue.'); return; }
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/api/issues/${id}/upvote`, {}, { headers });
      const updated = [...votedIssues, id];
      setVotedIssues(updated);
      localStorage.setItem('votedIssues', JSON.stringify(updated));
    } catch (err) {
      alert(err.response?.status === 400 ? 'Already upvoted.' : 'Failed to upvote. Try again.');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.patch(`${process.env.REACT_APP_API_URL}/api/issues/${id}/status`, { status }, { headers });
    } catch { alert('Failed to update status. Admin access required.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue permanently?')) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/issues/${id}`, { headers });
      setSelected(null);
    } catch { alert('Failed to delete. Admin access required.'); }
  };

  const filtered = filterStatus === 'All' ? issues : issues.filter(i => i.status === filterStatus);
  const statuses = ['Reported', 'Verified', 'In Progress', 'Resolved'];

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ch-filter-btn:hover  { border-color: ${INDIA_BLUE} !important; color: ${INDIA_BLUE} !important; }
        .ch-issue-card:hover  { border-color: ${INDIA_BLUE}80 !important; box-shadow: 0 2px 8px rgba(26,60,110,0.1) !important; }
        .ch-upvote-btn:hover:not(:disabled) { background: ${INDIA_BLUE} !important; color: #fff !important; border-color: ${INDIA_BLUE} !important; }
        .ch-del-btn:hover { background: #FEECEC !important; }

        /* Leaflet popup restyle to match portal */
        .leaflet-popup-content-wrapper { border-radius: 6px !important; }
        .leaflet-popup-content { margin: 12px 14px !important; font-family: 'Noto Sans', sans-serif !important; }
        .leaflet-container { font-family: 'Noto Sans', sans-serif !important; }

        @media (max-width: 640px) {
          .ch-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ch-issue-meta { flex-wrap: wrap !important; gap: 6px !important; }
          .ch-issue-img  { width: 72px !important; height: 56px !important; }
          .ch-issue-actions { flex-direction: row !important; }
          .ch-filter-row { overflow-x: auto !important; flex-wrap: nowrap !important; padding-bottom: 4px !important; }
          .ch-section-pad { padding: 16px !important; }
        }
        @media (max-width: 400px) {
          .ch-stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      {/* Admin banner */}
      {isAdmin && (
        <div style={s.adminBanner}>
          👑 Signed in as <strong>Admin</strong> — you can verify, update status, and delete issues.
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid} className="ch-stats-grid">
        {statuses.map(st => {
          const meta = STATUS_META[st];
          const count = issues.filter(i => i.status === st).length;
          return (
            <div key={st} style={{ ...s.statCard, borderTop: `3px solid ${meta.color}` }}>
              <div style={{ ...s.statCount, color: meta.color }}>{count}</div>
              <div style={s.statLabel}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      {/* Map — OpenStreetMap via Leaflet (free, no API key) */}
      <div style={s.mapWrap}>
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={mapStyle}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToSelected selected={selected} />

          {issues.map(issue => (
            <Marker
              key={issue.id}
              position={[issue.latitude, issue.longitude]}
              icon={PIN_ICONS[issue.status] || PIN_ICONS.Reported}
              eventHandlers={{ click: () => setSelected(issue) }}
            >
              <Popup>
                <div style={s.popupInner}>
                  <strong style={{ fontSize: 14, color: INDIA_BLUE }}>
                    {CATEGORY_EMOJI[issue.category]} {issue.title}
                  </strong>
                  <p style={{ fontSize: 12.5, color: '#555', margin: '6px 0' }}>{issue.description}</p>
                  {issue.imageBase64 && (
                    <img src={issue.imageBase64} alt={issue.title}
                      onClick={() => setExpandedImg(issue.imageBase64)}
                      style={{ width: '100%', maxHeight: 110, objectFit: 'cover',
                        borderRadius: 3, marginBottom: 8, cursor: 'pointer' }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <SeverityBadge severity={issue.severity} />
                    <StatusBadge status={issue.status} />
                  </div>
                  {isAdmin && (
                    <select onChange={e => handleStatusChange(issue.id, e.target.value)}
                      value={issue.status}
                      style={{ ...s.select, width: '100%', marginBottom: 6 }}>
                      {statuses.map(st => <option key={st}>{st}</option>)}
                    </select>
                  )}
                  <button onClick={() => handleUpvote(issue.id)}
                    disabled={votedIssues.includes(issue.id)}
                    style={{
                      ...s.upvoteBtn,
                      background: votedIssues.includes(issue.id) ? '#e5e7eb' : INDIA_BLUE,
                      color: votedIssues.includes(issue.id) ? TEXT_MUTED : '#fff',
                      cursor: votedIssues.includes(issue.id) ? 'not-allowed' : 'pointer',
                      width: '100%', marginBottom: 4,
                    }}>
                    👍 {votedIssues.includes(issue.id) ? 'Upvoted' : 'Upvote'} ({issue.upvotes})
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(issue.id)} style={{ ...s.deleteBtn, width: '100%' }}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div style={s.mapLegend}>
          {statuses.map(st => (
            <span key={st} style={s.legendItem}>
              <span style={{ ...s.legendDot, background: STATUS_META[st].color }} />
              {STATUS_META[st].label}
            </span>
          ))}
        </div>
      </div>

      {/* Issue list */}
      <div style={s.listSection} className="ch-section-pad">
        {/* Header row */}
        <div style={s.listHeader}>
          <div>
            <div style={s.listKicker}><span style={s.kickerLine} />Case Ledger</div>
            <h2 style={s.listTitle}>
              All Reported Issues
              {loading && <span style={s.loadingBadge}>Loading…</span>}
              <span style={s.countBadge}>{issues.length} total</span>
            </h2>
          </div>
        </div>

        {/* Filter bar */}
        <div style={s.filterRow} className="ch-filter-row">
          {['All', ...statuses].map(st => (
            <button key={st} className="ch-filter-btn"
              onClick={() => setFilterStatus(st)}
              style={{
                ...s.filterBtn,
                background: filterStatus === st ? INDIA_BLUE : '#fff',
                color: filterStatus === st ? '#fff' : '#374151',
                borderColor: filterStatus === st ? INDIA_BLUE : BORDER_COL,
              }}>
              {st}
              <span style={{
                ...s.filterCount,
                background: filterStatus === st ? 'rgba(255,255,255,.25)' : '#f3f4f6',
                color: filterStatus === st ? '#fff' : TEXT_MUTED,
              }}>
                {st === 'All' ? issues.length : issues.filter(i => i.status === st).length}
              </span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: INDIA_BLUE, marginBottom: 4 }}>
              {filterStatus === 'All' ? 'No issues reported yet' : `No ${filterStatus} issues`}
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED }}>
              {filterStatus === 'All' ? 'Be the first to file a report.' : 'Try a different filter.'}
            </div>
          </div>
        )}

        {/* Cards */}
        {filtered.map(issue => (
          <div key={issue.id} className="ch-issue-card"
            onClick={() => setSelected(issue)}
            style={{ ...s.issueCard, borderLeft: `4px solid ${(STATUS_META[issue.status] || STATUS_META.Reported).color}`, cursor: 'pointer' }}>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.issueTitle}>
                      {CATEGORY_EMOJI[issue.category]} {issue.title}
                    </div>
                    <p style={s.issueDesc}>{issue.description}</p>
                    <div style={s.issueMeta} className="ch-issue-meta">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <span style={s.categoryTag}>{issue.category}</span>
                    </div>

                    {isAdmin && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={e => e.stopPropagation()}>
                        <select value={issue.status}
                          onChange={e => handleStatusChange(issue.id, e.target.value)}
                          style={s.select}>
                          {statuses.map(st => <option key={st}>{st}</option>)}
                        </select>
                        <span style={{ fontSize: 11.5, color: TEXT_MUTED }}>← Change status</span>
                      </div>
                    )}
                  </div>

                  {issue.imageBase64 && (
                    <img src={issue.imageBase64} alt={issue.title}
                      className="ch-issue-img"
                      onClick={e => { e.stopPropagation(); setExpandedImg(issue.imageBase64); }}
                      style={s.issueImg}
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={s.issueActions} className="ch-issue-actions" onClick={e => e.stopPropagation()}>
                <button className="ch-upvote-btn"
                  onClick={() => handleUpvote(issue.id)}
                  disabled={votedIssues.includes(issue.id)}
                  style={{
                    ...s.upvoteBtn,
                    opacity: votedIssues.includes(issue.id) ? 0.55 : 1,
                    cursor: votedIssues.includes(issue.id) ? 'not-allowed' : 'pointer',
                  }}>
                  👍 {issue.upvotes}
                </button>
                {isAdmin && (
                  <button className="ch-del-btn"
                    onClick={() => handleDelete(issue.id)}
                    style={s.deleteBtn}>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen image */}
      {expandedImg && (
        <div onClick={() => setExpandedImg(null)} style={s.imgOverlay}>
          <img src={expandedImg} alt="expanded"
            style={{ maxWidth: '92%', maxHeight: '88%', objectFit: 'contain', borderRadius: 6 }} />
          <span style={s.imgClose}>✕</span>
          <p style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,.6)', fontSize: 13 }}>
            Tap anywhere to close
          </p>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { fontFamily: "'Noto Sans', sans-serif", background: OFF_WHITE, minHeight: '100vh' },

  adminBanner: {
    background: '#FFF8E8', borderBottom: '1px solid #FFE48A',
    padding: '8px 20px', fontSize: 13, color: '#92400E',
    display: 'flex', alignItems: 'center', gap: 6,
  },

  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    borderBottom: `1px solid ${BORDER_COL}`, background: '#fff',
  },
  statCard: {
    padding: '18px 20px', textAlign: 'center',
    borderRight: `1px solid ${BORDER_COL}`,
  },
  statCount: { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 12, color: TEXT_MUTED, marginTop: 4, fontWeight: 500 },

  mapWrap: { borderBottom: `1px solid ${BORDER_COL}`, position: 'relative' },
  mapLegend: {
    position: 'absolute', bottom: 10, left: 10, zIndex: 1000,
    background: 'rgba(255,255,255,.95)', borderRadius: 4,
    padding: '6px 10px', display: 'flex', gap: 12, flexWrap: 'wrap',
    fontSize: 11, boxShadow: '0 1px 4px rgba(0,0,0,.15)',
    border: `1px solid ${BORDER_COL}`,
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, color: '#374151', fontWeight: 500 },
  legendDot:  { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },

  popupInner: { maxWidth: 220, fontFamily: "'Noto Sans', sans-serif" },

  listSection: { maxWidth: 1080, margin: '0 auto', padding: '28px 20px' },
  listHeader:  { marginBottom: 16 },
  listKicker: {
    fontSize: 11, fontWeight: 600, color: SAFFRON,
    letterSpacing: '1.6px', textTransform: 'uppercase',
    marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6,
  },
  kickerLine: { display: 'inline-block', width: 20, height: 2, background: SAFFRON, borderRadius: 1 },
  listTitle: {
    fontSize: 20, fontWeight: 700, color: INDIA_BLUE,
    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: 0,
  },
  loadingBadge: {
    fontSize: 13, color: TEXT_MUTED, fontWeight: 400,
    background: '#f3f4f6', padding: '2px 10px', borderRadius: 3,
  },
  countBadge: {
    fontSize: 13, color: TEXT_MUTED, fontWeight: 400,
    background: '#f3f4f6', padding: '2px 10px', borderRadius: 3,
  },

  filterRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 },
  filterBtn: {
    padding: '6px 14px', borderRadius: 3, border: `1px solid ${BORDER_COL}`,
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
    transition: 'all .15s', whiteSpace: 'nowrap',
  },
  filterCount: {
    padding: '1px 6px', borderRadius: 10,
    fontSize: 11, fontWeight: 600,
  },

  emptyState: {
    textAlign: 'center', padding: '48px 20px',
    background: '#fff', border: `1px solid ${BORDER_COL}`, borderRadius: 6,
  },

  issueCard: {
    background: '#fff', border: `1px solid ${BORDER_COL}`,
    borderRadius: 4, padding: '16px 18px', marginBottom: 10,
    transition: 'border-color .2s, box-shadow .2s',
  },
  issueTitle: { fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 4 },
  issueDesc:  { fontSize: 13, color: TEXT_MUTED, margin: '4px 0', lineHeight: 1.55 },
  issueMeta:  { display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' },
  categoryTag: {
    fontSize: 11.5, color: TEXT_MUTED,
    background: '#f3f4f6', padding: '2px 8px', borderRadius: 3,
  },
  issueImg: {
    width: 88, height: 68, objectFit: 'cover',
    borderRadius: 4, cursor: 'pointer', flexShrink: 0,
    border: `1px solid ${BORDER_COL}`,
  },
  issueActions: { display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, marginLeft: 6 },
  upvoteBtn: {
    background: '#fff', border: `1px solid ${BORDER_COL}`,
    padding: '6px 14px', borderRadius: 3,
    fontSize: 13, fontWeight: 500,
    transition: 'all .15s',
    whiteSpace: 'nowrap',
  },
  deleteBtn: {
    background: '#fff', border: '1px solid #F0B4B4',
    color: '#9A2D2D', padding: '6px 14px',
    borderRadius: 3, cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    transition: 'background .15s',
  },

  select: {
    padding: '5px 10px', borderRadius: 3,
    border: `1px solid ${BORDER_COL}`, fontSize: 13,
    cursor: 'pointer', background: '#f9fafb', color: '#111',
  },

  imgOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, cursor: 'pointer', flexDirection: 'column',
  },
  imgClose: {
    position: 'absolute', top: 20, right: 28,
    color: '#fff', fontSize: 26, fontWeight: 700, cursor: 'pointer',
  },
};