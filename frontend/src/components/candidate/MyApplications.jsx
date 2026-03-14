import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

// ── Animated Score Ring ──────────────────────────────────────
const ScoreRing = ({ score, size = 100, stroke = 9, animate = true }) => {
  const [displayed, setDisplayed] = useState(0);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = score != null ? Math.min(Math.max(score, 0), 100) : 0;
  const offset = circ - (displayed / 100) * circ;

  const color =
    pct >= 75 ? '#22c55e' :
    pct >= 50 ? '#f59e0b' :
    pct >= 30 ? '#f97316' : '#ef4444';

  const glow =
    pct >= 75 ? 'rgba(34,197,94,0.35)' :
    pct >= 50 ? 'rgba(245,158,11,0.35)' :
    pct >= 30 ? 'rgba(249,115,22,0.35)' : 'rgba(239,68,68,0.35)';

  const trackColor =
    pct >= 75 ? '#dcfce7' :
    pct >= 50 ? '#fef3c7' :
    pct >= 30 ? '#ffedd5' : '#fee2e2';

  useEffect(() => {
    if (!animate) { setDisplayed(pct); return; }
    let start = null;
    const duration = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(pct * ease));
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [pct, animate]);

  const displayScore = score != null ? displayed : null;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Glow behind ring */}
      <div style={{
        position: 'absolute', inset: '8px', borderRadius: '50%',
        background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
        filter: 'blur(6px)', opacity: 0.7,
      }} />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 1 }}>
        <defs>
          <linearGradient id={`ring-grad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#ring-grad-${score})`}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <span style={{ fontSize: '18px', fontWeight: 900, color, lineHeight: 1, fontFamily: 'Nunito,sans-serif' }}>
          {displayScore != null ? `${displayScore}%` : '—'}
        </span>
        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '3px' }}>ATS</span>
      </div>
    </div>
  );
};

// ── Pipeline ─────────────────────────────────────────────────
const Pipeline = ({ status }) => {
  const stages = [
    { key: 'pending',      label: 'Applied',   icon: '📨' },
    { key: 'under_review', label: 'Review',    icon: '🔍' },
    { key: 'shortlisted',  label: 'Shortlist', icon: '⭐' },
    { key: 'interview',    label: 'Interview', icon: '🎥' },
    { key: 'hired',        label: 'Hired',     icon: '🎉' },
  ];
  const isRejected = status === 'rejected';
  const currentIdx = stages.findIndex(s => s.key === status);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
      {stages.map((s, i) => {
        const isPast    = !isRejected && i < currentIdx;
        const isCurrent = s.key === status && !isRejected;
        const isLast    = i === stages.length - 1;

        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 0 : 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              {/* Node */}
              <div style={{
                width: isCurrent ? 40 : 32, height: isCurrent ? 40 : 32,
                borderRadius: '50%',
                background: isCurrent
                  ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                  : isPast
                    ? 'linear-gradient(135deg,#a5b4fc,#c7d2fe)'
                    : 'white',
                border: isCurrent
                  ? '3px solid #818cf8'
                  : isPast ? '2px solid #a5b4fc' : '2px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: isCurrent ? '15px' : '13px',
                boxShadow: isCurrent
                  ? '0 0 0 5px rgba(99,102,241,0.18), 0 4px 12px rgba(99,102,241,0.3)'
                  : isPast ? '0 2px 6px rgba(165,180,252,0.4)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
                zIndex: 1,
              }}>
                {isPast
                  ? <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 900 }}>✓</span>
                  : <span style={{ filter: isCurrent ? 'none' : 'grayscale(0.5) opacity(0.5)' }}>{s.icon}</span>
                }
                {/* Pulse ring for current */}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', inset: '-6px', borderRadius: '50%',
                    border: '2px solid rgba(99,102,241,0.3)',
                    animation: 'pulsering 2s ease-in-out infinite',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: '10.5px', marginTop: '6px', fontWeight: isCurrent ? 800 : isPast ? 600 : 500,
                color: isCurrent ? '#6366f1' : isPast ? '#818cf8' : '#cbd5e1',
                whiteSpace: 'nowrap', letterSpacing: '0.2px',
              }}>{s.label}</span>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: '3px', marginBottom: '22px',
                background: isPast
                  ? 'linear-gradient(90deg,#a5b4fc,#c7d2fe)'
                  : isCurrent
                    ? 'linear-gradient(90deg,#c7d2fe,#e8eaf6)'
                    : '#e8eaf6',
                borderRadius: '2px',
                transition: 'background 0.4s',
              }} />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div style={{
          marginLeft: '12px', marginBottom: '22px',
          padding: '4px 12px', background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
          color: '#ef4444', borderRadius: '20px', fontSize: '11.5px', fontWeight: 800,
          alignSelf: 'center', whiteSpace: 'nowrap', border: '1px solid #fca5a5',
          boxShadow: '0 2px 8px rgba(239,68,68,0.2)',
        }}>❌ Not Selected</div>
      )}
    </div>
  );
};

// ── Status Badge ─────────────────────────────────────────────
const Badge = ({ status }) => {
  const map = {
    pending:      { label: 'Pending',     bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' },
    under_review: { label: 'In Review',   bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    shortlisted:  { label: 'Shortlisted', bg: '#fefce8', color: '#ca8a04', border: '#fde68a' },
    interview:    { label: 'Interview',   bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
    hired:        { label: '🎉 Hired',    bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    rejected:     { label: 'Rejected',    bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
  };
  const s = map[status] || { label: status, bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      padding: '4px 12px', borderRadius: '20px', fontSize: '11px',
      fontWeight: 700, background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      display: 'inline-block', letterSpacing: '0.3px',
    }}>{s.label}</span>
  );
};

// ── Animated Card ────────────────────────────────────────────
const AppCard = ({ app, index, onNavigate, onExpand, isExpanded }) => {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timeout);
  }, [index]);

  const accentColors = {
    pending:      '#94a3b8',
    under_review: '#3b82f6',
    shortlisted:  '#f59e0b',
    interview:    '#8b5cf6',
    hired:        '#22c55e',
    rejected:     '#ef4444',
  };
  const accent = accentColors[app.status] || '#94a3b8';

  const hasDetails = app.ats_feedback || app.meet_link || app.assessment_result ||
    (app.status === 'shortlisted' && !app.assessment_result);

  return (
    <div
      ref={cardRef}
      style={{
        background: 'white',
        borderRadius: '20px',
        border: '1px solid rgba(99,102,241,0.1)',
        boxShadow: '0 4px 20px rgba(99,102,241,0.07)',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 0.07}s, transform 0.5s cubic-bezier(0.34,1.2,0.64,1) ${index * 0.07}s, box-shadow 0.25s ease`,
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 12px 36px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.12)`;
        e.currentTarget.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.07)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top accent bar with gradient */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
      }} />

      {/* Main card body */}
      <div style={{ padding: '24px 28px 20px' }}>
        {/* TOP ROW */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
          {/* Job info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '17px', fontWeight: 900, color: '#1e1b4b', letterSpacing: '-0.3px' }}>{app.job_title}</span>
              <Badge status={app.status} />
            </div>
            <div style={{ fontSize: '13.5px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
              🏢 {app.company}{app.location ? ` · 📍 ${app.location}` : ''}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Applied {new Date(app.applied_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {/* Mini badges row */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {app.assessment_result && (
                <span style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  background: app.assessment_result.passed ? '#f0fdf4' : '#fef2f2',
                  color: app.assessment_result.passed ? '#16a34a' : '#ef4444',
                  border: `1px solid ${app.assessment_result.passed ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {app.assessment_result.passed ? '✅' : '❌'} MCQ {app.assessment_result.score}%
                </span>
              )}
              {app.ai_score && (
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                  🤖 AI Score {app.ai_score}%
                </span>
              )}
              {app.meet_link && (
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe' }}>
                  🎥 Interview Scheduled
                </span>
              )}
            </div>
          </div>

          {/* ATS Ring */}
          <ScoreRing score={app.ats_score} size={100} stroke={9} />
        </div>

        {/* PIPELINE */}
        <div style={{
          marginTop: '22px', paddingTop: '18px',
          borderTop: '1px dashed rgba(99,102,241,0.15)',
        }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '14px' }}>
            🗺 Application Pipeline
          </div>
          <Pipeline status={app.status} />
        </div>
      </div>

      {/* Expand button */}
      {hasDetails && (
        <button
          onClick={() => onExpand(app.application_id)}
          style={{
            width: '100%', padding: '11px 28px',
            background: isExpanded ? '#f5f3ff' : '#fafbff',
            border: 'none', borderTop: '1px solid rgba(99,102,241,0.08)',
            cursor: 'pointer', fontSize: '12.5px', fontWeight: 700,
            color: '#6366f1', fontFamily: 'Nunito,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
          onMouseLeave={e => e.currentTarget.style.background = isExpanded ? '#f5f3ff' : '#fafbff'}
        >
          <span style={{
            display: 'inline-block',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            fontSize: '13px',
          }}>▼</span>
          {isExpanded ? 'Hide Details' : 'View Details'}
        </button>
      )}

      {/* Expanded details */}
      {isExpanded && (
        <div style={{
          padding: '22px 28px 24px',
          background: 'linear-gradient(180deg,#fafbff,#f5f3ff22)',
          borderTop: '1px solid rgba(99,102,241,0.08)',
          animation: 'slideDown 0.3s ease',
        }}>

          {/* ATS Breakdown */}
          {app.ats_feedback && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>📊 ATS Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '10px' }}>
                {app.ats_feedback.split('|').map((part, i) => {
                  const [label, value] = part.split(':');
                  if (!value) return null;
                  return (
                    <div key={i} style={{
                      background: 'white', border: '1px solid #e8eaf6',
                      borderRadius: '12px', padding: '12px 14px',
                      boxShadow: '0 1px 4px rgba(99,102,241,0.05)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(99,102,241,0.05)'; }}
                    >
                      <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label?.trim()}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e1b4b' }}>{value?.trim()}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assessment Pending */}
          {app.status === 'shortlisted' && !app.assessment_result && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
                border: '1px solid #fcd34d', borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
                boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>📝 Skill Assessment Pending</div>
                  <div style={{ fontSize: '12.5px', color: '#b45309' }}>Complete the MCQ to proceed to interview stage</div>
                </div>
                <button
                  onClick={() => onNavigate(`/assessment/${app.job_id}/${app.application_id}`)}
                  style={{
                    padding: '10px 20px', background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 800,
                    fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(245,158,11,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)'; }}
                >
                  Take Assessment →
                </button>
              </div>
            </div>
          )}

          {/* Assessment Result */}
          {app.assessment_result && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>📝 Assessment Result</div>
              <div style={{
                background: app.assessment_result.passed ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                border: `1px solid ${app.assessment_result.passed ? '#bbf7d0' : '#fecaca'}`,
                borderRadius: '12px', padding: '14px 16px',
                boxShadow: `0 4px 12px ${app.assessment_result.passed ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'}`,
              }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: app.assessment_result.passed ? '#15803d' : '#dc2626', marginBottom: '4px' }}>
                  {app.assessment_result.passed ? '✅ Assessment Passed' : '❌ Assessment Not Passed'} — Score: {app.assessment_result.score}%
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  {app.assessment_result.passed ? 'Great job! You cleared the skill assessment and moved forward.' : 'Keep practicing and apply again when the position reopens.'}
                </div>
              </div>
            </div>
          )}

          {/* Interview */}
          {app.meet_link && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '10px' }}>🎥 Interview Scheduled</div>
              <div style={{
                background: 'linear-gradient(135deg,#eff6ff,#f0f4ff)',
                border: '1px solid #bfdbfe', borderRadius: '14px',
                padding: '16px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px',
                boxShadow: '0 4px 12px rgba(59,130,246,0.12)',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e40af', marginBottom: '4px' }}>
                    📅 {app.interview_date} &nbsp;&nbsp; ⏰ {app.interview_time}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#3b82f6' }}>Virtual Interview via Jitsi Meet</div>
                </div>
                <button
                  onClick={() => {
                    const room = app.meet_link.replace('https://meet.jit.si/', '');
                    window.open(`/interview/${room}`, '_blank');
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                    color: 'white', border: 'none', borderRadius: '10px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 800,
                    fontFamily: 'Nunito,sans-serif', whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(59,130,246,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.4)'; }}
                >
                  🎥 Join Now
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [expandedId, setExpandedId]     = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/api/applications/my');
      setApplications(res.data);
    } catch { setError('Failed to load applications.'); }
    finally { setLoading(false); }
  };

  const handleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg,#f0f4ff,#faf5ff)', fontFamily: 'Nunito,sans-serif', gap: '12px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: '48px', height: '48px', border: '4px solid #e8eaf6', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#6366f1', fontWeight: 700, fontSize: '14px' }}>Loading your applications...</p>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        @keyframes pulsering {
          0%   { transform: scale(1);   opacity: 0.7; }
          50%  { transform: scale(1.3); opacity: 0.2; }
          100% { transform: scale(1);   opacity: 0.7; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }

        .mya-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0f4ff 0%, #faf5ff 40%, #f0fdf4 100%);
          font-family: 'Nunito', sans-serif;
        }

        /* Mesh background blobs */
        .mya-blob1 {
          position: fixed; width: 600px; height: 600px;
          border-radius: 50%; pointer-events: none; z-index: 0;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          top: -200px; left: -200px;
          animation: blobmove1 12s ease-in-out infinite;
        }
        .mya-blob2 {
          position: fixed; width: 500px; height: 500px;
          border-radius: 50%; pointer-events: none; z-index: 0;
          background: radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%);
          bottom: -150px; right: -100px;
          animation: blobmove2 15s ease-in-out infinite;
        }
        @keyframes blobmove1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,30px) scale(1.05); }
          66%  { transform: translate(-20px,50px) scale(0.97); }
        }
        @keyframes blobmove2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-30px,-40px) scale(1.08); }
        }

        /* TOP BAR */
        .mya-topbar {
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(99,102,241,0.1);
          padding: 0 40px;
          height: 66px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 20px rgba(99,102,241,0.08);
          animation: fadeInUp 0.4s ease;
        }
        .mya-topbar-left { display: flex; align-items: center; gap: 14px; }
        .mya-back {
          background: #f1f5f9; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 8px 16px; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #64748b;
          font-family: 'Nunito',sans-serif; transition: all 0.2s;
        }
        .mya-back:hover { background: #6366f1; color: white; border-color: #6366f1; transform: translateX(-2px); }
        .mya-title-wrap h2 { font-size: 19px; font-weight: 900; color: #1e1b4b; letter-spacing: -0.3px; }
        .mya-title-wrap p  { font-size: 12px; color: #94a3b8; font-weight: 600; margin-top: 1px; }
        .mya-browse {
          padding: 10px 22px;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color: white; border: none; border-radius: 12px;
          cursor: pointer; font-size: 13.5px; font-weight: 800;
          font-family: 'Nunito',sans-serif; transition: all 0.25s;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
          letter-spacing: 0.2px;
        }
        .mya-browse:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(99,102,241,0.5);
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
        }

        /* STATS STRIP */
        .stats-strip {
          display: flex; gap: 14px; max-width: 1100px;
          margin: 0 auto; padding: 20px 32px 0;
          animation: fadeInUp 0.5s ease 0.1s both;
        }
        .stat-chip {
          background: white; border: 1px solid rgba(99,102,241,0.12);
          border-radius: 12px; padding: 10px 18px;
          display: flex; align-items: center; gap: 10px;
          box-shadow: 0 2px 8px rgba(99,102,241,0.06);
          transition: all 0.2s;
        }
        .stat-chip:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(99,102,241,0.12); }
        .stat-chip-num { font-size: 20px; font-weight: 900; color: #1e1b4b; }
        .stat-chip-lbl { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        /* CARD LIST */
        .mya-list {
          max-width: 1100px;
          margin: 0 auto;
          padding: 20px 32px 48px;
          display: flex; flex-direction: column; gap: 20px;
          position: relative; z-index: 1;
        }

        /* EMPTY */
        .mya-empty {
          text-align: center; padding: 100px 20px;
          animation: fadeInUp 0.6s ease;
        }

        @media(max-width:700px) {
          .mya-topbar { padding: 0 16px; }
          .mya-list { padding: 16px; }
          .stats-strip { padding: 16px 16px 0; flex-wrap: wrap; }
        }
      `}</style>

      <div className="mya-root">
        {/* Background blobs */}
        <div className="mya-blob1" />
        <div className="mya-blob2" />

        {/* TOP BAR */}
        <div className="mya-topbar">
          <div className="mya-topbar-left">
            <button className="mya-back" onClick={() => navigate('/dashboard')}>← Back</button>
            <div className="mya-title-wrap">
              <h2>My Applications</h2>
              <p>{applications.length} application{applications.length !== 1 ? 's' : ''} tracked</p>
            </div>
          </div>
          <button className="mya-browse" onClick={() => navigate('/jobs')}>🔍 Browse Jobs</button>
        </div>

        {/* STATS STRIP */}
        {applications.length > 0 && (
          <div className="stats-strip">
            {[
              { num: applications.length,                                        lbl: 'Total',       icon: '📋', color: '#6366f1' },
              { num: applications.filter(a => a.status === 'interview').length,  lbl: 'Interviews',  icon: '🎥', color: '#8b5cf6' },
              { num: applications.filter(a => a.status === 'hired').length,      lbl: 'Hired',       icon: '🎉', color: '#22c55e' },
              { num: applications.filter(a => a.assessment_result?.passed).length, lbl: 'MCQ Passed', icon: '✅', color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="stat-chip">
                <span style={{ fontSize: '20px' }}>{s.icon}</span>
                <div>
                  <div className="stat-chip-num" style={{ color: s.color }}>{s.num}</div>
                  <div className="stat-chip-lbl">{s.lbl}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CARD LIST */}
        <div className="mya-list">
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '14px', fontSize: '13px', fontWeight: 600 }}>{error}</div>
          )}

          {applications.length === 0 && !error ? (
            <div className="mya-empty">
              <div style={{ fontSize: '72px', marginBottom: '20px' }}>📋</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e1b4b', marginBottom: '10px' }}>No applications yet</div>
              <div style={{ fontSize: '14.5px', color: '#94a3b8', marginBottom: '28px', maxWidth: '320px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                Start applying to jobs and track your entire journey here — from application to offer.
              </div>
              <button className="mya-browse" onClick={() => navigate('/jobs')} style={{ fontSize: '14px', padding: '12px 28px' }}>
                Find Jobs →
              </button>
            </div>
          ) : (
            applications.map((app, i) => (
              <AppCard
                key={app.application_id}
                app={app}
                index={i}
                onNavigate={navigate}
                onExpand={handleExpand}
                isExpanded={expandedId === app.application_id}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default MyApplications;