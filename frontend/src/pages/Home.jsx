// frontend/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';

// ── Design tokens (matches Landing.jsx) ──────────────────────────────────────
const INDIA_BLUE  = '#1a3c6e';
const SAFFRON     = '#FF6B00';
const INDIA_GREEN = '#046A38';
const OFF_WHITE   = '#F8F9FC';
const BORDER_COL  = '#D8DEE9';
const TEXT_MUTED  = '#6B7280';

const STATUS_META = {
  Reported:      { color: '#6B7280', bg: '#F3F4F6', label: 'Reported'    },
  Verified:      { color: INDIA_BLUE, bg: '#EEF4FF', label: 'Verified'   },
  'In Progress': { color: SAFFRON,   bg: '#FFF3E8', label: 'In Progress' },
  Resolved:      { color: INDIA_GREEN, bg: '#EFFFEE', label: 'Resolved'  },
};

const CATEGORY_EMOJI = {
  'Pothole': '🕳️', 'Broken Streetlight': '💡',
  'Water Leakage': '💧', 'Garbage': '🗑️',
  'Damaged Infrastructure': '🏗️', 'Other': '⚠️',
};

const mapStyle    = { width: '100%', height: '420px' };
const defaultCenter = { lat: 22.5726, lng: 88.3639 };

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

      {/* Map */}
      <div style={s.mapWrap}>
        <LoadScript googleMapsApiKey={process.env.REACT_APP_MAPS_API_KEY}>
          <GoogleMap mapContainerStyle={mapStyle} center={defaultCenter} zoom={13}>
            {issues.map(issue => (
              <Marker key={issue.id}
                position={{ lat: issue.latitude, lng: issue.longitude }}
                onClick={() => setSelected(issue)}
              />
            ))}
            {selected && (
              <InfoWindow
                position={{ lat: selected.latitude, lng: selected.longitude }}
                onCloseClick={() => setSelected(null)}>
                <div style={s.infoWin}>
                  <strong style={{ fontSize: 14, color: INDIA_BLUE }}>
                    {CATEGORY_EMOJI[selected.category]} {selected.title}
                  </strong>
                  <p style={{ fontSize: 12.5, color: '#555', margin: '6px 0' }}>{selected.description}</p>
                  {selected.imageBase64 && (
                    <img src={selected.imageBase64} alt={selected.title}
                      onClick={() => setExpandedImg(selected.imageBase64)}
                      style={{ width: '100%', maxHeight: 110, objectFit: 'cover',
                        borderRadius: 3, marginBottom: 8, cursor: 'pointer' }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    <SeverityBadge severity={selected.severity} />
                    <StatusBadge status={selected.status} />
                  </div>
                  {isAdmin && (
                    <select onChange={e => handleStatusChange(selected.id, e.target.value)}
                      value={selected.status}
                      style={{ ...s.select, width: '100%', marginBottom: 6 }}>
                      {statuses.map(st => <option key={st}>{st}</option>)}
                    </select>
                  )}
                  <button onClick={() => handleUpvote(selected.id)}
                    disabled={votedIssues.includes(selected.id)}
                    style={{
                      ...s.upvoteBtn,
                      background: votedIssues.includes(selected.id) ? '#e5e7eb' : INDIA_BLUE,
                      color: votedIssues.includes(selected.id) ? TEXT_MUTED : '#fff',
                      cursor: votedIssues.includes(selected.id) ? 'not-allowed' : 'pointer',
                      width: '100%', marginBottom: 4,
                    }}>
                    👍 {votedIssues.includes(selected.id) ? 'Upvoted' : 'Upvote'} ({selected.upvotes})
                  </button>
                  {isAdmin && (
                    <button onClick={() => handleDelete(selected.id)} style={{ ...s.deleteBtn, width: '100%' }}>
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
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
            style={{ ...s.issueCard, borderLeft: `4px solid ${(STATUS_META[issue.status] || STATUS_META.Reported).color}` }}>

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
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                      onClick={() => setExpandedImg(issue.imageBase64)}
                      style={s.issueImg}
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={s.issueActions} className="ch-issue-actions">
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

  mapWrap: { borderBottom: `1px solid ${BORDER_COL}` },

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

  infoWin: { maxWidth: 230, fontFamily: "'Noto Sans', sans-serif" },

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