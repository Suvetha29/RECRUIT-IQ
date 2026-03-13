import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const COLUMNS = [
  { key: 'pending',      label: 'Pending',     emoji: '⏳', color: '#6B7280', bg: '#F9FAFB', accent: '#E5E7EB' },
  { key: 'under_review', label: 'Reviewing',   emoji: '🔍', color: '#2563EB', bg: '#EFF6FF', accent: '#BFDBFE' },
  { key: 'shortlisted',  label: 'Shortlisted', emoji: '⭐', color: '#D97706', bg: '#FFFBEB', accent: '#FDE68A' },
  { key: 'interview',    label: 'Interview',   emoji: '📅', color: '#7C3AED', bg: '#F5F3FF', accent: '#DDD6FE' },
  { key: 'hired',        label: 'Hired',       emoji: '✅', color: '#059669', bg: '#ECFDF5', accent: '#A7F3D0' },
  { key: 'rejected',     label: 'Rejected',    emoji: '❌', color: '#DC2626', bg: '#FEF2F2', accent: '#FECACA' },
];

// ─── Interview Modal ────────────────────────────────────────────────────────
const InterviewModal = ({ applicant, jobTitle, onConfirm, onCancel }) => {
  const [date, setDate]   = useState('');
  const [time, setTime]   = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!date) { setError('Please select a date.'); return; }
    if (!time) { setError('Please select a time.'); return; }
    onConfirm({ date, time, notes });
  };

  return (
    <div style={mStyles.overlay}>
      <div style={mStyles.box}>
        <div style={mStyles.header}>
          <div style={mStyles.headerIcon}>📅</div>
          <h2 style={mStyles.headerTitle}>Schedule Interview</h2>
          <p style={mStyles.headerSub}>{applicant.candidate_name} · {jobTitle}</p>
        </div>
        <div style={mStyles.body}>
          {error && <div style={mStyles.error}>{error}</div>}
          <div style={mStyles.field}>
            <label style={mStyles.label}>Date <span style={{color:'#EF4444'}}>*</span></label>
            <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} style={mStyles.input} />
          </div>
          <div style={mStyles.field}>
            <label style={mStyles.label}>Time <span style={{color:'#EF4444'}}>*</span></label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={mStyles.input} />
          </div>
          <div style={mStyles.field}>
            <label style={mStyles.label}>Notes <span style={{color:'#9CA3AF', fontWeight:400}}>(optional)</span></label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Join via Jitsi. Be 5 mins early."
              style={{...mStyles.input, resize:'none'}} />
          </div>
          <div style={mStyles.emailNote}>
            <span>📧</span>
            <span>Jitsi link + email will be auto-sent to <strong>{applicant.candidate_name}</strong></span>
          </div>
          <div style={mStyles.actions}>
            <button style={mStyles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={mStyles.confirmBtn} onClick={handleConfirm}>✅ Confirm & Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Funnel Chart ───────────────────────────────────────────────────────────
const FunnelChart = ({ apps }) => {
  const counts = COLUMNS.map(col => ({
    ...col,
    count: apps.filter(a => a.status === col.key).length,
  }));
  const max = Math.max(...counts.map(c => c.count), 1);

  // Summary panel data
  const topCandidate = [...apps].sort((a, b) => b.ats_score - a.ats_score)[0] || null;
  const nextInterview = apps
    .filter(a => a.status === 'interview' && a.interview_date)
    .map(a => ({ ...a, dateObj: new Date(a.interview_date + 'T00:00:00') }))
    .filter(a => a.dateObj >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => a.dateObj - b.dateObj)[0] || null;

  const pendingCount    = counts.find(c => c.key === 'pending').count;
  const shortlistCount  = counts.find(c => c.key === 'shortlisted').count;
  const hiredCount      = counts.find(c => c.key === 'hired').count;

  const getTip = () => {
    if (apps.length === 0) return { emoji: '💡', text: 'No candidates yet. Post a job to get started!' };
    if (pendingCount > 3)  return { emoji: '⚠️', text: `${pendingCount} candidates are waiting for review. Consider shortlisting soon.` };
    if (shortlistCount > 2) return { emoji: '📅', text: `${shortlistCount} shortlisted candidates are waiting for an interview.` };
    if (hiredCount > 0)    return { emoji: '🎉', text: `You've hired ${hiredCount} candidate${hiredCount > 1 ? 's' : ''} so far.` };
    return { emoji: '💡', text: 'Keep reviewing candidates to move them through the pipeline.' };
  };
  const tip = getTip();

  return (
    <div style={fStyles.outerWrap}>
      {/* Left — Funnel */}
      <div style={fStyles.wrap}>
        <h3 style={fStyles.title}>📈 Pipeline Funnel</h3>
        <div style={fStyles.bars}>
          {counts.map(col => {
            const pct = Math.max((col.count / max) * 100, col.count > 0 ? 8 : 0);
            return (
              <div key={col.key} style={fStyles.barWrap}>
                <div style={fStyles.countLabel}>{col.count}</div>
                <div style={fStyles.barOuter}>
                  <div style={{
                    ...fStyles.barInner,
                    width: `${pct}%`,
                    background: col.color,
                    opacity: 0.85,
                  }} />
                </div>
                <div style={fStyles.barLabel}>
                  <span style={{marginRight:'4px'}}>{col.emoji}</span>{col.label}
                </div>
              </div>
            );
          })}
        </div>
        {apps.length > 0 && (
          <div style={fStyles.rateRow}>
            <div style={fStyles.rate}>
              <span style={fStyles.rateNum}>
                {Math.round((counts.find(c => c.key === 'hired').count / apps.length) * 100)}%
              </span>
              <span style={fStyles.rateLabel}>Hire Rate</span>
            </div>
            <div style={fStyles.rate}>
              <span style={fStyles.rateNum}>
                {Math.round((counts.find(c => c.key === 'interview').count / apps.length) * 100)}%
              </span>
              <span style={fStyles.rateLabel}>Interview Rate</span>
            </div>
            <div style={fStyles.rate}>
              <span style={fStyles.rateNum}>
                {Math.round((counts.find(c => c.key === 'shortlisted').count / apps.length) * 100)}%
              </span>
              <span style={fStyles.rateLabel}>Shortlist Rate</span>
            </div>
          </div>
        )}
      </div>

      {/* Right — Summary Panel */}
      <div style={fStyles.sidePanel}>
        <h3 style={fStyles.title}>📊 Summary</h3>

        {/* Total Candidates */}
        <div style={fStyles.summaryCard}>
          <div style={fStyles.summaryIcon}>👥</div>
          <div>
            <p style={fStyles.summaryNum}>{apps.length}</p>
            <p style={fStyles.summaryLabel}>Total Candidates</p>
          </div>
        </div>

        {/* Top Candidate */}
        <div style={{...fStyles.summaryCard, marginTop:'10px'}}>
          <div style={fStyles.summaryIcon}>🏆</div>
          <div style={{flex:1, minWidth:0}}>
            <p style={fStyles.summaryLabel}>Top Candidate</p>
            {topCandidate ? (
              <>
                <p style={{...fStyles.summaryNum, fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {topCandidate.candidate_name}
                </p>
                <p style={fStyles.summaryMeta}>ATS: {Math.round(topCandidate.ats_score)}% · {topCandidate.job_title}</p>
              </>
            ) : (
              <p style={fStyles.summaryMeta}>No candidates yet</p>
            )}
          </div>
        </div>

        {/* Next Interview */}
        <div style={{...fStyles.summaryCard, marginTop:'10px'}}>
          <div style={fStyles.summaryIcon}>📅</div>
          <div style={{flex:1, minWidth:0}}>
            <p style={fStyles.summaryLabel}>Next Interview</p>
            {nextInterview ? (
              <>
                <p style={{...fStyles.summaryNum, fontSize:'15px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                  {nextInterview.candidate_name}
                </p>
                <p style={fStyles.summaryMeta}>{nextInterview.interview_date} {nextInterview.interview_time && `· ${nextInterview.interview_time}`}</p>
              </>
            ) : (
              <p style={fStyles.summaryMeta}>No upcoming interviews</p>
            )}
          </div>
        </div>

        {/* Pipeline Tip */}
        <div style={fStyles.tipBox}>
          <p style={fStyles.tipEmoji}>{tip.emoji}</p>
          <p style={fStyles.tipText}>{tip.text}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Upcoming Interviews ────────────────────────────────────────────────────
const UpcomingInterviews = ({ apps }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = apps
    .filter(a => a.status === 'interview' && a.interview_date)
    .map(a => ({ ...a, dateObj: new Date(a.interview_date + 'T00:00:00') }))
    .filter(a => a.dateObj >= today)
    .sort((a, b) => a.dateObj - b.dateObj)
    .slice(0, 6);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { label: 'Today',    color: '#DC2626', bg: '#FEE2E2' };
    if (diffDays === 1) return { label: 'Tomorrow', color: '#D97706', bg: '#FEF3C7' };
    return {
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      color: '#2563EB', bg: '#EFF6FF',
    };
  };

  return (
    <div style={uStyles.wrap}>
      <h3 style={uStyles.title}>📅 Upcoming Interviews</h3>
      {upcoming.length === 0 ? (
        <div style={uStyles.empty}>No upcoming interviews scheduled</div>
      ) : (
        <div style={uStyles.list}>
          {upcoming.map(app => {
            const fmt = formatDate(app.interview_date);
            return (
              <div key={app.application_id} style={uStyles.item}>
                <div style={{...uStyles.dateBadge, background: fmt.bg, color: fmt.color}}>
                  <span style={uStyles.dateLabel}>{fmt.label}</span>
                  {app.interview_time && <span style={uStyles.time}>{app.interview_time}</span>}
                </div>
                <div style={uStyles.info}>
                  <p style={uStyles.name}>{app.candidate_name}</p>
                  <p style={uStyles.job}>{app.job_title} · {app.company}</p>
                </div>
                {app.meet_link && (
                  <a href={app.meet_link} target="_blank" rel="noopener noreferrer" style={uStyles.joinBtn}>
                    🎥 Join
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Kanban Card ────────────────────────────────────────────────────────────
const KanbanCard = ({ app, onDragStart, updatingId, colColor }) => {
  const [dragging, setDragging] = useState(false);
  const scoreColor = app.ats_score >= 75 ? '#059669' : app.ats_score >= 50 ? '#D97706' : '#DC2626';
  const scoreBg   = app.ats_score >= 75 ? '#ECFDF5' : app.ats_score >= 50 ? '#FFFBEB' : '#FEF2F2';

  return (
    <div
      draggable
      onDragStart={(e) => { setDragging(true); onDragStart(e, app); }}
      onDragEnd={() => setDragging(false)}
      style={{
        ...cardStyles.card,
        opacity: dragging ? 0.45 : 1,
        transform: dragging ? 'rotate(2deg) scale(1.02)' : 'none',
        borderLeft: `3px solid ${colColor}`,
        pointerEvents: updatingId === app.application_id ? 'none' : 'auto',
      }}
    >
      <div style={cardStyles.top}>
        <div style={cardStyles.avatar}>{app.candidate_name.charAt(0).toUpperCase()}</div>
        <div style={{flex:1, minWidth:0}}>
          <p style={cardStyles.name}>{app.candidate_name}</p>
          <p style={cardStyles.email}>{app.candidate_email}</p>
        </div>
        <div style={{...cardStyles.score, color: scoreColor, background: scoreBg}}>
          {Math.round(app.ats_score)}%
        </div>
      </div>

      <p style={cardStyles.jobTitle}>{app.job_title} · {app.company}</p>

      <div style={cardStyles.badges}>
        {app.assessment_result && (
          <span style={{...cardStyles.badge, background: app.assessment_result.passed ? '#DCFCE7' : '#FEE2E2', color: app.assessment_result.passed ? '#166534' : '#991B1B'}}>
            {app.assessment_result.passed ? '✅' : '❌'} MCQ {app.assessment_result.score}%
          </span>
        )}
        {app.ai_score && (
          <span style={{...cardStyles.badge, background: app.ai_recommendation === 'hire' ? '#DCFCE7' : '#FEE2E2', color: app.ai_recommendation === 'hire' ? '#166534' : '#991B1B'}}>
            🤖 AI {app.ai_score}%
          </span>
        )}
        {app.interview_date && (
          <span style={{...cardStyles.badge, background:'#EDE9FE', color:'#5B21B6'}}>
            📅 {app.interview_date}
          </span>
        )}
      </div>

      <p style={cardStyles.date}>
        Applied {new Date(app.applied_at).toLocaleDateString('en-US', {month:'short', day:'numeric'})}
      </p>

      <div style={cardStyles.links}>
        <a href={app.resume_url} target="_blank" rel="noopener noreferrer" style={cardStyles.link}>📄 Resume</a>
        {app.meet_link && <a href={app.meet_link} target="_blank" rel="noopener noreferrer" style={{...cardStyles.link, color:'#2563EB'}}>🎥 Join</a>}
      </div>

      {updatingId === app.application_id && (
        <div style={cardStyles.updating}>⏳ Updating...</div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const HRKanban = () => {
  const navigate = useNavigate();
  const [allApps, setAllApps]         = useState([]);
  const [jobs, setJobs]               = useState([]);
  const [selectedJob, setSelectedJob] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab]     = useState('board');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [updatingId, setUpdatingId]   = useState(null);
  const [dragOver, setDragOver]       = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [pendingDrop, setPendingDrop]       = useState(null);
  const dragApp = useRef(null);
  const onDragStart = (e, app) => {
  dragApp.current = app;

  e.dataTransfer.effectAllowed = "move";

  // Important: convert to string
  e.dataTransfer.setData("application_id", String(app.application_id));
};

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const jobsRes = await api.get('/api/jobs/');
      const hrJobs  = jobsRes.data;
      setJobs(hrJobs);

      const appResults = await Promise.all(
        hrJobs.map(j => api.get(`/api/applications/job/${j.id}`).catch(() => ({ data: [] })))
      );

      const merged = [];
      appResults.forEach((res, i) => {
        res.data.forEach(app => {
          merged.push({ ...app, job_title: hrJobs[i].title, company: hrJobs[i].company, job_id: hrJobs[i].id });
        });
      });
      setAllApps(merged);
    } catch (e) {
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  // Filter by job + search query
  const filteredApps = allApps
    .filter(a => selectedJob === 'all' || String(a.job_id) === String(selectedJob))
    .filter(a => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.candidate_name.toLowerCase().includes(q) ||
        a.candidate_email.toLowerCase().includes(q) ||
        a.job_title.toLowerCase().includes(q)
      );
    });

  const byStatus = (key) => filteredApps.filter(a => a.status === key);

  

 const onDrop = async (e, newStatus) => {
  e.preventDefault();

  const id = e.dataTransfer.getData("application_id");

  if (!id) return;

  const app = allApps.find(a => String(a.application_id) === String(id));

  if (!app) return;
  if (app.status === newStatus) return;

  setDragOver(null);

  // open interview modal if needed
  if (newStatus === "interview") {
    setPendingDrop({ app, newStatus });
    setInterviewModal(app);
    return;
  }

  await doUpdate(app, newStatus);
};

  const doUpdate = async (app, newStatus, date, time, notes) => {
    setUpdatingId(app.application_id);
    try {
      await api.patch(`/api/applications/${app.application_id}/status`, {
        status: newStatus,
        interview_date: date || null,
        interview_time: time || null,
        interview_notes: notes || null,
      });
      setAllApps(prev => prev.map(a =>
        a.application_id === app.application_id
          ? { ...a, status: newStatus, interview_date: date || a.interview_date, interview_time: time || a.interview_time }
          : a
      ));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInterviewConfirm = async ({ date, time, notes }) => {
    const { app } = pendingDrop;
    setInterviewModal(null);
    setPendingDrop(null);
    await doUpdate(app, 'interview', date, time, notes);
  };

  if (loading) return (
    <div style={styles.loadingWrap}>
      <div style={styles.spinner} />
      <p style={{color:'#6B7280', marginTop:'16px'}}>Loading pipeline...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
          <div>
            <h1 style={styles.title}>Recruitment Pipeline</h1>
            <p style={styles.subtitle}>{filteredApps.length} candidates · Drag cards to update status</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          {/* Search */}
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>
          {/* Job Filter */}
          <select
            value={selectedJob}
            onChange={e => setSelectedJob(e.target.value)}
            style={styles.jobFilter}
          >
            <option value="all">All Jobs ({allApps.length})</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>
                {j.title} ({allApps.filter(a => String(a.job_id) === String(j.id)).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {COLUMNS.map(col => (
          <div key={col.key} style={{...styles.statPill, background: col.bg, borderColor: col.accent}}>
            <span style={styles.statEmoji}>{col.emoji}</span>
            <span style={{...styles.statCount, color: col.color}}>{byStatus(col.key).length}</span>
            <span style={styles.statLabel}>{col.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {[
          { key: 'board',      label: '🗂️ Kanban Board' },
          { key: 'funnel',     label: '📈 Funnel Chart' },
          { key: 'interviews', label: '📅 Upcoming Interviews' },
        ].map(tab => (
          <button
            key={tab.key}
            style={{...styles.tab, ...(activeTab === tab.key ? styles.tabActive : {})}}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div style={styles.board}>
          {COLUMNS.map(col => {
            const cards = byStatus(col.key);
            const isOver = dragOver === col.key;
            return (
              <div
                key={col.key}
                style={{...styles.column, outline: isOver ? `2px dashed ${col.color}` : 'none', background: isOver ? col.bg : '#F8FAFC'}}
                onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.key);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={e => onDrop(e, col.key)}
              >
                <div style={{...styles.colHeader, borderBottom: `3px solid ${col.accent}`}}>
                  <span style={styles.colEmoji}>{col.emoji}</span>
                  <span style={{...styles.colLabel, color: col.color}}>{col.label}</span>
                  <span style={{...styles.colCount, background: col.accent, color: col.color}}>{cards.length}</span>
                </div>
                <div style={styles.cards}>
                  {cards.length === 0 ? (
                    <div style={{...styles.emptyCol, borderColor: col.accent, color: col.color + '80'}}>
                      Drop here
                    </div>
                  ) : (
                    cards.map(app => (
                      <KanbanCard
                        key={app.application_id}
                        app={app}
                        onDragStart={onDragStart}
                        updatingId={updatingId}
                        colColor={col.color}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Funnel Tab */}
      {activeTab === 'funnel' && (
        <div style={styles.tabContent}>
          <FunnelChart apps={filteredApps} />
        </div>
      )}

      {/* Interviews Tab */}
      {activeTab === 'interviews' && (
        <div style={styles.tabContent}>
          <UpcomingInterviews apps={filteredApps} />
        </div>
      )}

      {/* Interview Modal */}
      {interviewModal && (
        <InterviewModal
          applicant={interviewModal}
          jobTitle={jobs.find(j => String(j.id) === String(interviewModal.job_id))?.title || ''}
          onConfirm={handleInterviewConfirm}
          onCancel={() => { setInterviewModal(null); setPendingDrop(null); }}
        />
      )}
    </div>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  loadingWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTop: '4px solid #0D9488', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: {
    background: 'white', padding: '18px 32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    position: 'sticky', top: 0, zIndex: 10, flexWrap: 'wrap', gap: '12px',
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: '16px' },
  headerRight: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
  backBtn:  { background: 'none', border: 'none', color: '#0D9488', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '6px 0' },
  title:    { margin: 0, fontSize: '22px', fontWeight: '700', color: '#111827' },
  subtitle: { margin: '2px 0 0', fontSize: '13px', color: '#6B7280' },
  searchWrap:  { display: 'flex', alignItems: 'center', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0 10px', gap: '6px' },
  searchIcon:  { fontSize: '13px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', padding: '8px 0', width: '180px', color: '#111827' },
  clearBtn:    { background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', padding: '0' },
  jobFilter:   { padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', background: 'white', color: '#374151', cursor: 'pointer', outline: 'none' },
  errorBox:    { margin: '16px 24px', background: '#FEE2E2', border: '1px solid #FECACA', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '14px' },
  statsRow:    { display: 'flex', gap: '10px', padding: '16px 24px 0', overflowX: 'auto' },
  statPill:    { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '999px', border: '1px solid', whiteSpace: 'nowrap', fontSize: '13px' },
  statEmoji:   { fontSize: '14px' },
  statCount:   { fontWeight: '700', fontSize: '15px' },
  statLabel:   { color: '#6B7280' },
  tabRow:      { display: 'flex', gap: '4px', padding: '14px 24px 0', borderBottom: '1px solid #E5E7EB' },
  tab:         { padding: '9px 18px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6B7280', fontWeight: '500', borderBottom: '2px solid transparent', marginBottom: '-1px' },
  tabActive:   { color: '#0D9488', borderBottom: '2px solid #0D9488', fontWeight: '700' },
  tabContent:  { padding: '24px' },
  board:       { display: 'flex', gap: '14px', padding: '16px 24px 40px', overflowX: 'auto', alignItems: 'flex-start', minHeight: 'calc(100vh - 260px)' },
  column:      { minWidth: '230px', width: '230px', borderRadius: '12px', border: '1px solid #E5E7EB', flexShrink: 0, transition: 'outline 0.15s, background 0.15s' },
  colHeader:   { padding: '14px 14px 10px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' },
  colEmoji:    { fontSize: '16px' },
  colLabel:    { fontWeight: '700', fontSize: '13px', flex: 1 },
  colCount:    { fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' },
  cards:       { padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' },
  emptyCol:    { border: '2px dashed', borderRadius: '8px', padding: '24px 12px', textAlign: 'center', fontSize: '13px', fontStyle: 'italic' },
};

const cardStyles = {
  card:     { background: 'white', borderRadius: '10px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'grab',userSelect: 'none', transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative' },
  top:      { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' },
  avatar:   { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D9488, #0369a1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  name:     { margin: 0, fontSize: '13px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  email:    { margin: '2px 0 0', fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  score:    { fontSize: '12px', fontWeight: '700', padding: '3px 7px', borderRadius: '6px', flexShrink: 0 },
  jobTitle: { margin: '0 0 6px', fontSize: '11px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  badges:   { display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' },
  badge:    { fontSize: '10px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px' },
  date:     { margin: '0 0 8px', fontSize: '10px', color: '#9CA3AF' },
  links:    { display: 'flex', gap: '6px' },
  link:     { fontSize: '11px', color: '#0D9488', textDecoration: 'none', fontWeight: '600' },
  updating: { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '12px', color: '#6B7280' },
};

const fStyles = {
  outerWrap:   { display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" },
  wrap:        { background: "white", borderRadius: "16px", padding: "28px", flex: "1 1 400px", minWidth: "320px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  sidePanel:   { background: "white", borderRadius: "16px", padding: "28px", flex: "0 0 280px", minWidth: "260px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  title:       { margin: "0 0 24px", fontSize: "18px", fontWeight: "700", color: "#111827" },
  bars:        { display: "flex", flexDirection: "column", gap: "12px" },
  barWrap:     { display: "flex", alignItems: "center", gap: "12px" },
  countLabel:  { width: "24px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#374151", flexShrink: 0 },
  barOuter:    { flex: 1, height: "28px", background: "#F3F4F6", borderRadius: "6px", overflow: "hidden" },
  barInner:    { height: "100%", borderRadius: "6px", transition: "width 0.6s ease" },
  barLabel:    { width: "110px", fontSize: "13px", color: "#6B7280", flexShrink: 0 },
  rateRow:     { display: "flex", gap: "16px", marginTop: "28px", borderTop: "1px solid #F3F4F6", paddingTop: "20px" },
  rate:        { flex: 1, textAlign: "center", background: "#F9FAFB", borderRadius: "10px", padding: "14px 8px" },
  rateNum:     { display: "block", fontSize: "26px", fontWeight: "700", color: "#0D9488" },
  rateLabel:   { fontSize: "12px", color: "#6B7280", marginTop: "4px" },
  summaryCard: { display: "flex", alignItems: "flex-start", gap: "12px", background: "#F9FAFB", borderRadius: "10px", padding: "14px" },
  summaryIcon: { fontSize: "22px", flexShrink: 0 },
  summaryNum:  { margin: "2px 0 0", fontSize: "18px", fontWeight: "700", color: "#111827" },
  summaryLabel:{ margin: 0, fontSize: "11px", color: "#9CA3AF", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" },
  summaryMeta: { margin: "2px 0 0", fontSize: "12px", color: "#6B7280" },
  tipBox:      { marginTop: "14px", background: "linear-gradient(135deg, #ECFDF5, #EFF6FF)", borderRadius: "10px", padding: "14px", border: "1px solid #D1FAE5" },
  tipEmoji:    { margin: "0 0 6px", fontSize: "20px" },
  tipText:     { margin: 0, fontSize: "13px", color: "#374151", lineHeight: "1.5" },
};

const uStyles = {
  wrap:      { background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '700px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  title:     { margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#111827' },
  empty:     { textAlign: 'center', padding: '32px', color: '#9CA3AF', fontSize: '14px', background: '#F9FAFB', borderRadius: '10px' },
  list:      { display: 'flex', flexDirection: 'column', gap: '10px' },
  item:      { display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#F9FAFB', borderRadius: '10px', border: '1px solid #F3F4F6' },
  dateBadge: { borderRadius: '8px', padding: '8px 12px', textAlign: 'center', flexShrink: 0, minWidth: '80px' },
  dateLabel: { display: 'block', fontSize: '12px', fontWeight: '700' },
  time:      { display: 'block', fontSize: '11px', marginTop: '2px' },
  info:      { flex: 1, minWidth: 0 },
  name:      { margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' },
  job:       { margin: '2px 0 0', fontSize: '12px', color: '#6B7280' },
  joinBtn:   { padding: '7px 14px', background: '#EFF6FF', color: '#2563EB', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textDecoration: 'none', flexShrink: 0 },
};

const mStyles = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  box:         { background: 'white', borderRadius: '16px', width: '100%', maxWidth: '460px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' },
  header:      { background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', padding: '28px 24px', textAlign: 'center' },
  headerIcon:  { fontSize: '32px', marginBottom: '8px' },
  headerTitle: { margin: 0, color: 'white', fontSize: '20px', fontWeight: '700' },
  headerSub:   { margin: '6px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' },
  body:        { padding: '24px' },
  error:       { background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' },
  field:       { marginBottom: '16px' },
  label:       { display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' },
  input:       { width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#111827' },
  emailNote:   { display: 'flex', gap: '8px', alignItems: 'center', background: '#EFF6FF', borderRadius: '8px', padding: '12px', marginBottom: '20px', fontSize: '13px', color: '#1D4ED8' },
  actions:     { display: 'flex', gap: '10px' },
  cancelBtn:   { flex: 1, padding: '11px', background: 'white', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  confirmBtn:  { flex: 2, padding: '11px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

export default HRKanban;