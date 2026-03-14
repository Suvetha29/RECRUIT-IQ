import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'pending',      label: '⏳ Pending' },
  { value: 'under_review', label: '🔍 Under Review' },
  { value: 'shortlisted',  label: '⭐ Shortlisted' },
  { value: 'interview',    label: '📅 Interview' },
  { value: 'hired',        label: '✅ Hired' },
  { value: 'rejected',     label: '❌ Rejected' },
];

// ── Interview Modal ───────────────────────────────────────────
const InterviewModal = ({ applicant, jobTitle, onConfirm, onCancel }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const handleConfirm = () => {
    if (!date) { setError('Please select a date.'); return; }
    if (!time) { setError('Please select a time.'); return; }
    onConfirm({ date, time, notes });
  };
  return (
    <div style={mS.overlay}>
      <div style={mS.box}>
        <div style={{...mS.header, background:'linear-gradient(135deg,#7C3AED,#4F46E5)'}}>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>📅</div>
          <h2 style={mS.hTitle}>Schedule Interview</h2>
          <p style={mS.hSub}>{applicant.candidate_name} · {jobTitle}</p>
        </div>
        <div style={mS.body}>
          {error && <div style={mS.err}>{error}</div>}
          <div style={mS.field}>
            <label style={mS.label}>Date *</label>
            <input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} style={mS.input}/>
          </div>
          <div style={mS.field}>
            <label style={mS.label}>Time *</label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={mS.input}/>
          </div>
          <div style={mS.field}>
            <label style={mS.label}>Notes (optional)</label>
            <textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} style={{...mS.input,resize:'none'}} placeholder="e.g. Join via Jitsi. Be 5 mins early."/>
          </div>
          <div style={mS.infoBox}>
            <span style={{fontSize:'18px'}}>📧</span>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:'13px'}}>Jitsi link + email auto-sent</p>
              <p style={{margin:'2px 0 0',fontSize:'12px',color:'#6b7280'}}>{applicant.candidate_name} will receive details</p>
            </div>
          </div>
          <div style={mS.actions}>
            <button style={mS.cancelBtn} onClick={onCancel}>Cancel</button>
            <button style={mS.confirmBtn} onClick={handleConfirm}>✅ Confirm & Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Recording Modal ───────────────────────────────────────────
const RecordingModal = ({ applicant, onConfirm, onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const handleUpload = async () => {
    if (!file) { setError('Please select a recording file.'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('application_id', applicant.application_id);
    fd.append('recording', file);
    try {
      const res = await api.post('/api/evaluation/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onConfirm(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally { setUploading(false); }
  };
  return (
    <div style={mS.overlay}>
      <div style={mS.box}>
        <div style={{...mS.header, background:'linear-gradient(135deg,#0D9488,#0369a1)'}}>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>🎙️</div>
          <h2 style={mS.hTitle}>Upload Interview Recording</h2>
          <p style={mS.hSub}>{applicant.candidate_name}</p>
        </div>
        <div style={mS.body}>
          {error && <div style={mS.err}>{error}</div>}
          <div style={mS.field}>
            <label style={mS.label}>Recording File (mp3, mp4, wav, m4a)</label>
            <input type="file" accept=".mp3,.mp4,.wav,.m4a,.webm" onChange={e=>setFile(e.target.files[0])} style={mS.input}/>
          </div>
          <div style={mS.infoBox}>
            <span style={{fontSize:'18px'}}>🤖</span>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:'13px'}}>AI will automatically:</p>
              <p style={{margin:'2px 0 0',fontSize:'12px',color:'#6b7280'}}>Transcribe audio → Evaluate performance → Give hire/reject recommendation</p>
            </div>
          </div>
          {uploading && <div style={{textAlign:'center',padding:'16px',color:'#0D9488',fontSize:'13px',fontWeight:600}}>⏳ Transcribing and evaluating... 30–60 seconds.</div>}
          <div style={mS.actions}>
            <button style={mS.cancelBtn} onClick={onCancel} disabled={uploading}>Cancel</button>
            <button style={{...mS.confirmBtn,background:'linear-gradient(135deg,#0D9488,#0369a1)'}} onClick={handleUpload} disabled={uploading}>
              {uploading ? '⏳ Processing...' : '🚀 Upload & Evaluate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Actions Dropdown ──────────────────────────────────────────
const ActionsDropdown = ({ app, hasAI, isExpanded, onResume, onJoin, onAssessment, onRecording, onAIReport, onOffer, onJob, onExpand }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const Item = ({ icon, label, onClick, color = '#374151', bg = 'transparent' }) => (
    <button
      onClick={() => { onClick(); setOpen(false); }}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '9px 14px', border: 'none',
        background: bg, color, cursor: 'pointer',
        fontSize: '13px', fontWeight: 600, fontFamily: 'Nunito,sans-serif',
        textAlign: 'left', transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = bg}
    >
      <span style={{fontSize:'15px',width:'18px',textAlign:'center'}}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display:'flex', alignItems:'center', gap:'6px',
          padding:'6px 12px', background: open ? '#1a1d2e' : '#f8fafc',
          color: open ? 'white' : '#374151',
          border:'1.5px solid #e5e7eb', borderRadius:'8px',
          cursor:'pointer', fontSize:'12px', fontWeight:700,
          fontFamily:'Nunito,sans-serif', whiteSpace:'nowrap',
          transition:'all 0.15s',
        }}
      >
        ⚡ Actions <span style={{fontSize:'10px'}}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          position:'absolute', right:0, top:'calc(100% + 4px)',
          background:'white', borderRadius:'10px', minWidth:'200px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.15)', border:'1px solid #f0f0f0',
          zIndex:200, overflow:'hidden',
        }}>
          {/* Section: View */}
          <div style={{padding:'6px 14px 4px',fontSize:'10px',fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.8px',borderBottom:'1px solid #f3f4f6'}}>View</div>
          <Item icon="📄" label="Resume"       onClick={onResume} color="#2563eb" />
          {app.meet_link && <Item icon="🎥" label="Join Interview" onClick={onJoin} color="#7c3aed" />}
          <Item icon="👥" label="View Job"     onClick={onJob}    color="#0D9488" />

          {/* Section: Actions */}
          <div style={{padding:'6px 14px 4px',fontSize:'10px',fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.8px',borderBottom:'1px solid #f3f4f6',borderTop:'1px solid #f3f4f6',marginTop:'4px'}}>Actions</div>
          <Item icon="📝" label="Create Assessment" onClick={onAssessment} color="#7c3aed" />
          <Item icon="🎙️" label="Upload Recording"  onClick={onRecording}  color="#16a34a" />
          {hasAI && <Item icon="🤖" label="View AI Report" onClick={onAIReport} color="#c2410c" />}
          {app.status === 'hired' && <Item icon="📄" label="Generate Offer"  onClick={onOffer}  color="#854d0e" />}

          {/* Section: Expand */}
          <div style={{borderTop:'1px solid #f3f4f6',marginTop:'4px'}}>
            <Item icon={isExpanded ? '▲' : '▼'} label={isExpanded ? 'Collapse Details' : 'Expand Details'} onClick={onExpand} color="#6b7280" />
          </div>
        </div>
      )}
    </div>
  );
};

const AllApplicants = () => {
  const navigate = useNavigate();
  const [allApps, setAllApps]               = useState([]);
  const [jobs, setJobs]                     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [filterJob, setFilterJob]           = useState('all');
  const [updatingId, setUpdatingId]         = useState(null);
  const [expandedId, setExpandedId]         = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const [pendingDrop, setPendingDrop]       = useState(null);
  const [recordingModal, setRecordingModal] = useState(null);
  const [aiResult, setAiResult]             = useState(null);
  const [aiResultsMap, setAiResultsMap]     = useState({});
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const jobsRes = await api.get('/api/jobs/');
      const hrJobs  = jobsRes.data;
      setJobs(hrJobs);
      const results = await Promise.all(
        hrJobs.map(j => api.get(`/api/applications/job/${j.id}`).catch(() => ({ data: [] })))
      );
      const merged = [];
      results.forEach((res, i) => {
        res.data.forEach(app => merged.push({
          ...app,
          job_title:   hrJobs[i].title,
          job_company: hrJobs[i].company,
          job_id:      hrJobs[i].id,
        }));
      });
      merged.sort((a, b) => b.ats_score - a.ats_score);
      setAllApps(merged);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (app, newStatus) => {
    if (newStatus === 'interview') { setPendingDrop({ app }); setInterviewModal(app); return; }
    await submitUpdate(app.application_id, newStatus);
  };

  const submitUpdate = async (id, status, date, time, notes) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/applications/${id}/status`, {
        status, interview_date: date||null, interview_time: time||null, interview_notes: notes||null,
      });
      setAllApps(prev => prev.map(a => a.application_id === id ? { ...a, status } : a));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update status.');
    } finally { setUpdatingId(null); }
  };

  const handleInterviewConfirm = async ({ date, time, notes }) => {
    const { app } = pendingDrop;
    setInterviewModal(null); setPendingDrop(null);
    await submitUpdate(app.application_id, 'interview', date, time, notes);
    fetchAll();
  };

  const generateOfferLetter = async (applicationId, candidateName) => {
    try {
      const res = await api.post(`/api/evaluation/offer-letter/${applicationId}`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a'); a.href = url;
      a.setAttribute('download', `Offer_Letter_${candidateName}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Failed to generate offer letter.'); }
  };

  const handleRecordingDone = (result, applicationId) => {
    setRecordingModal(null);
    setAiResultsMap(prev => ({ ...prev, [applicationId]: result }));
    setAiResult(result);
    fetchAll();
    setExpandedId(applicationId);
  };

  const avatarColor = (name = '') => {
    const colors = ['#2563eb','#0D9488','#d97706','#7c3aed','#dc2626','#0891b2','#16a34a','#db2777'];
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const statusBadge = (status) => {
    const map = {
      pending:      { bg: '#f3f4f6', color: '#6b7280' },
      under_review: { bg: '#eff6ff', color: '#2563eb' },
      shortlisted:  { bg: '#fef3c7', color: '#d97706' },
      interview:    { bg: '#f5f3ff', color: '#7c3aed' },
      hired:        { bg: '#dcfce7', color: '#16a34a' },
      rejected:     { bg: '#fee2e2', color: '#dc2626' },
    };
    return map[status] || { bg: '#f3f4f6', color: '#6b7280' };
  };

  const scoreColor = (s) =>
    s >= 75 ? { color: '#16a34a', bg: '#dcfce7' } :
    s >= 50 ? { color: '#d97706', bg: '#fef3c7' } :
              { color: '#dc2626', bg: '#fee2e2' };

  const filtered = allApps
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => filterJob === 'all' || String(a.job_id) === String(filterJob))
    .filter(a => {
      const q = search.toLowerCase();
      return !q || a.candidate_name.toLowerCase().includes(q) || a.candidate_email.toLowerCase().includes(q) || a.job_title.toLowerCase().includes(q);
    });

  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.value] = allApps.filter(a => a.status === s.value).length;
    return acc;
  }, {});

  // ── Build AI data object from either live upload result or stored app fields ──
  const getAIData = (app, liveAI) => {
    if (liveAI) return liveAI;
    if (!app.ai_score) return null;
    return {
      ai_score:       app.ai_score,
      recommendation: app.ai_recommendation,
      // The backend stores these in ai_evaluation JSON or separate columns
      // Try all possible field names the backend might return
      strengths:  app.strengths  || app.ai_strengths  || app.ai_evaluation?.strengths  || null,
      weaknesses: app.weaknesses || app.ai_weaknesses || app.ai_evaluation?.weaknesses || null,
      summary:    app.summary    || app.ai_summary    || app.ai_evaluation?.summary    || null,
      transcript: app.transcript || null,
    };
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        .aa-root { display:flex; min-height:100vh; font-family:'Nunito',sans-serif; background:#f0f4f8; }

        /* SIDEBAR */
        .sidebar { width:220px; flex-shrink:0; background:#1a1d2e; display:flex; flex-direction:column; min-height:100vh; position:sticky; top:0; box-shadow:2px 0 12px rgba(0,0,0,0.15); }
        .sb-brand { display:flex; align-items:center; gap:10px; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .sb-brand-icon { width:36px; height:36px; background:#2563eb; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .sb-brand-name { font-size:15px; font-weight:800; color:white; }
        .sb-brand-name span { color:#60a5fa; }
        .sb-profile { display:flex; flex-direction:column; align-items:center; padding:20px 18px 16px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .sb-avatar { width:58px; height:58px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#0D9488); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:white; margin-bottom:8px; border:3px solid rgba(255,255,255,0.12); box-shadow:0 4px 12px rgba(37,99,235,0.4); }
        .sb-uname { font-size:13px; font-weight:700; color:white; }
        .sb-urole { font-size:10.5px; color:#60a5fa; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; margin-top:3px; }
        .sb-nav { flex:1; padding:14px 0; }
        .sb-lbl { font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:1.2px; padding:10px 18px 5px; }
        .sb-item { display:flex; align-items:center; gap:11px; padding:10px 18px; cursor:pointer; font-size:13px; font-weight:600; color:rgba(255,255,255,0.55); border-left:3px solid transparent; transition:all 0.18s; }
        .sb-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.9); }
        .sb-item.active { background:rgba(37,99,235,0.2); color:white; border-left-color:#2563eb; }
        .sb-item .si { font-size:16px; width:22px; text-align:center; transition:transform 0.2s; }
        .sb-item:hover .si { transform:scale(1.2); }
        .sb-logout { padding:14px 18px; border-top:1px solid rgba(255,255,255,0.06); }
        .sb-out-btn { width:100%; padding:10px 14px; background:rgba(220,38,38,0.12); border:1px solid rgba(220,38,38,0.25); border-radius:8px; color:#fca5a5; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; gap:8px; }
        .sb-out-btn:hover { background:rgba(220,38,38,0.28); color:white; }

        /* MAIN */
        .main-area { flex:1; display:flex; flex-direction:column; overflow-y:auto; }
        .topbar { background:white; padding:0 30px; display:flex; align-items:center; justify-content:space-between; height:62px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.06); position:sticky; top:0; z-index:50; }
        .topbar-left h2 { font-size:17px; font-weight:800; color:#1a1d2e; }
        .topbar-left p  { font-size:11.5px; color:#9ca3af; margin-top:1px; }
        .topbar-right { display:flex; align-items:center; gap:10px; }
        .page { padding:24px 28px; }

        /* STATS PILLS */
        .stats-pills { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px; }
        .stat-pill { display:flex; align-items:center; gap:8px; padding:10px 16px; background:white; border-radius:10px; box-shadow:0 1px 4px rgba(0,0,0,0.06); cursor:pointer; transition:all 0.2s; border:2px solid transparent; }
        .stat-pill:hover { border-color:#2563eb; transform:translateY(-1px); }
        .stat-pill.active { border-color:#2563eb; background:#eff6ff; }
        .pill-num   { font-size:20px; font-weight:800; color:#1a1d2e; }
        .pill-label { font-size:11px; color:#6b7280; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }

        /* FILTERS */
        .filters-bar { display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap; }
        .search-box { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e5e7eb; border-radius:10px; padding:9px 14px; flex:1; min-width:220px; max-width:360px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .search-box input { border:none; background:transparent; outline:none; font-size:13.5px; font-family:'Nunito',sans-serif; color:#1a1d2e; width:100%; }
        .search-box input::placeholder { color:#9ca3af; }
        .job-filter { padding:9px 14px; border:1px solid #e5e7eb; border-radius:10px; font-size:13px; background:white; color:#374151; cursor:pointer; outline:none; font-family:'Nunito',sans-serif; }

        /* TABLE */
        .tbl-card { background:white; border-radius:14px; box-shadow:0 1px 4px rgba(0,0,0,0.06); overflow:visible; margin-bottom:24px; }
        .tbl-hd { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #f3f4f6; }
        .tbl-title { font-size:14px; font-weight:800; color:#1a1d2e; }
        table { width:100%; border-collapse:collapse; }
        thead tr { background:#f8fafc; }
        th { padding:11px 16px; text-align:left; font-size:10.5px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.8px; white-space:nowrap; }
        tbody tr { border-top:1px solid #f3f4f6; transition:background 0.12s; }
        tbody tr:hover { background:#f8fafc; }
        td { padding:12px 16px; font-size:13px; color:#374151; vertical-align:middle; }

        .cand-cell { display:flex; align-items:center; gap:10px; }
        .cand-av { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:white; flex-shrink:0; }
        .cand-name  { font-weight:700; color:#1a1d2e; font-size:13px; }
        .cand-email { font-size:11px; color:#9ca3af; margin-top:1px; }
        .cand-phone { font-size:11px; color:#9ca3af; margin-top:1px; }
        .job-cell { font-size:12px; }
        .job-title-cell { font-weight:700; color:#1a1d2e; }
        .job-company-cell { color:#9ca3af; margin-top:2px; }
        .score-pill  { padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:700; display:inline-block; }
        .assess-pass { background:#dcfce7; color:#16a34a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; display:inline-block; }
        .assess-fail { background:#fee2e2; color:#dc2626; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; display:inline-block; }
        .status-select { padding:5px 8px; border:1.5px solid #e5e7eb; border-radius:7px; font-size:11.5px; font-family:'Nunito',sans-serif; background:white; color:#374151; outline:none; cursor:pointer; }
        .status-select:disabled { opacity:0.5; cursor:not-allowed; }

        /* EXPANDED ROW */
        .exp-row td { padding:0; border-top:none; }
        .exp-body { padding:20px 22px; background:#fafbfc; border-top:2px solid #e5e7eb; }
        .exp-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .exp-section { background:white; border-radius:12px; padding:18px; border:1px solid #f0f0f0; box-shadow:0 1px 4px rgba(0,0,0,0.04); }
        .exp-sec-title { font-size:11px; font-weight:800; color:#6b7280; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px; display:flex; align-items:center; gap:6px; }
        .exp-feedback-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:8px; margin-bottom:12px; }
        .exp-fitem { background:#f8fafc; border-radius:8px; padding:10px; }
        .exp-flabel { font-size:10px; color:#9ca3af; font-weight:600; margin-bottom:3px; }
        .exp-fval   { font-size:13px; font-weight:700; color:#1a1d2e; }
        .exp-int-box { background:#f5f3ff; border-radius:10px; padding:14px; margin-top:12px; }
        .exp-cover  { font-size:13px; color:#6b7280; white-space:pre-wrap; line-height:1.6; }

        /* AI Report Panel */
        .ai-banner { padding:14px 18px; display:flex; align-items:center; gap:12px; border-radius:10px 10px 0 0; }
        .ai-banner-hire   { background:linear-gradient(135deg,#22C55E,#16A34A); }
        .ai-banner-reject { background:linear-gradient(135deg,#EF4444,#DC2626); }
        .ai-body { padding:14px; }
        .ai-summary-box { background:#f8fafc; border-radius:8px; padding:12px; margin-bottom:14px; font-size:13px; color:#374151; line-height:1.6; border-left:3px solid #e5e7eb; }
        .ai-sw-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px; }
        .ai-sw-card { border-radius:8px; padding:12px; }
        .ai-sw-card-hire   { background:#f0fdf4; border:1px solid #bbf7d0; }
        .ai-sw-card-reject { background:#fef2f2; border:1px solid #fecaca; }
        .ai-sw-head { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
        .ai-sw-content { font-size:12.5px; color:#374151; line-height:1.6; }
        .ai-transcript-box { background:#f8fafc; border-radius:8px; padding:12px; max-height:110px; overflow-y:auto; font-size:12px; color:#6b7280; line-height:1.6; border:1px solid #f0f0f0; }
        .ai-upload-prompt { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:30px 20px; text-align:center; gap:10px; background:white; border-radius:12px; border:2px dashed #e5e7eb; }
        .btn-upload-now { padding:9px 20px; background:linear-gradient(135deg,#0D9488,#0369a1); color:white; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; }

        .tbl-footer { display:flex; align-items:center; justify-content:space-between; padding:13px 22px; border-top:1px solid #f3f4f6; font-size:13px; color:#6b7280; }
        .empty-state { text-align:center; padding:60px 20px; }
        .empty-icon  { font-size:52px; margin-bottom:14px; }
        .empty-title { font-size:16px; font-weight:700; color:#6b7280; margin-bottom:6px; }
        .empty-sub   { font-size:13px; color:#9ca3af; }

        @media(max-width:700px) {
          .sidebar { display:none; }
          .page { padding:14px; }
          .exp-grid { grid-template-columns:1fr; }
          .stats-pills { gap:6px; }
        }
      `}</style>

      <div className="aa-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-brand-icon">🎯</div>
            <div className="sb-brand-name">RECRUIT<span>-IQ</span></div>
          </div>
          <div className="sb-profile">
            <div className="sb-avatar">{(user.full_name || 'H').charAt(0).toUpperCase()}</div>
            <div className="sb-uname">{user.full_name}</div>
            <div className="sb-urole">HR / Recruiter</div>
          </div>
          <nav className="sb-nav">
            <div className="sb-lbl">Main Menu</div>
            <div className="sb-item" onClick={() => navigate('/dashboard')}><span className="si">⊞</span>Dashboard</div>
            <div className="sb-item" onClick={() => navigate('/jobs')}><span className="si">💼</span>All Jobs</div>
            <div className="sb-item" onClick={() => navigate('/create-job')}><span className="si">➕</span>Post Job</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban')}><span className="si">🗂️</span>Pipeline</div>
            <div className="sb-lbl" style={{marginTop:'8px'}}>Settings</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban', { state: { tab: 'interviews' } })}><span className="si">📅</span>Calendar</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban', { state: { tab: 'funnel' } })}><span className="si">📊</span>Chart / Report</div>
            <div className="sb-item" onClick={() => navigate('/settings')}><span className="si">⚙️</span>Settings</div>
            <div className="sb-item active"><span className="si">☰</span>Table</div>
          </nav>
          <div className="sb-logout">
            <button className="sb-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>
              <span>⏻</span> Log Out
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          <div className="topbar">
            <div className="topbar-left">
              <h2>Applicants Table</h2>
              <p>{allApps.length} total applicants across {jobs.length} jobs · Ranked by ATS Score</p>
            </div>
            <div className="topbar-right">
              <button onClick={() => navigate('/hr/kanban')} style={{padding:'8px 16px',background:'#f5f3ff',color:'#7c3aed',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}}>🗂️ Kanban View</button>
              <button onClick={() => navigate('/dashboard')} style={{padding:'8px 16px',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}}>← Dashboard</button>
            </div>
          </div>

          <div className="page">
            {/* STATS PILLS */}
            <div className="stats-pills">
              <div className={`stat-pill ${filterStatus==='all'?'active':''}`} onClick={() => setFilterStatus('all')}>
                <div><div className="pill-num">{allApps.length}</div><div className="pill-label">All</div></div>
              </div>
              {STATUS_OPTIONS.map(s => (
                <div key={s.value} className={`stat-pill ${filterStatus===s.value?'active':''}`} onClick={() => setFilterStatus(s.value)}>
                  <div><div className="pill-num">{statusCounts[s.value] || 0}</div><div className="pill-label">{s.label.replace(/[^\w\s]/g,'').trim()}</div></div>
                </div>
              ))}
            </div>

            {/* FILTERS */}
            <div className="filters-bar">
              <div className="search-box">
                <span style={{color:'#9ca3af'}}>🔍</span>
                <input placeholder="Search by name, email, or job..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="job-filter" value={filterJob} onChange={e => setFilterJob(e.target.value)}>
                <option value="all">All Jobs ({jobs.length})</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} — {j.company}</option>)}
              </select>
            </div>

            {/* TABLE */}
            <div className="tbl-card">
              <div className="tbl-hd">
                <span className="tbl-title">👥 ALL APPLICANTS</span>
                <span style={{fontSize:'12px',color:'#9ca3af',fontWeight:600}}>Showing {filtered.length} of {allApps.length}</span>
              </div>

              {loading ? (
                <div style={{textAlign:'center',padding:'48px',color:'#9ca3af',fontSize:'14px'}}>Loading applicants...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No applicants found</div>
                  <div className="empty-sub">Try adjusting your search or filter</div>
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Candidate</th>
                        <th>Applied For</th>
                        <th>ATS Score</th>
                        <th>Assessment</th>
                        <th>AI Score</th>
                        <th>Status</th>
                        <th>Applied</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((app, i) => {
                        const sc  = scoreColor(app.ats_score);
                        const st  = statusBadge(app.status);
                        const col = avatarColor(app.candidate_name);
                        const isExpanded = expandedId === app.application_id;
                        const liveAI = aiResultsMap[app.application_id];
                        const ai = getAIData(app, liveAI);
                        const hasAI = !!ai;

                        return (
                          <React.Fragment key={app.application_id}>
                            <tr>
                              <td style={{color:'#9ca3af',fontWeight:700,fontSize:'12px'}}>#{i+1}</td>
                              <td>
                                <div className="cand-cell">
                                  <div className="cand-av" style={{background:col}}>{app.candidate_name.charAt(0).toUpperCase()}</div>
                                  <div>
                                    <div className="cand-name">{app.candidate_name}</div>
                                    <div className="cand-email">{app.candidate_email}</div>
                                    {app.candidate_phone && <div className="cand-phone">📞 {app.candidate_phone}</div>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="job-cell">
                                  <div className="job-title-cell">{app.job_title}</div>
                                  <div className="job-company-cell">🏢 {app.job_company}</div>
                                </div>
                              </td>
                              <td>
                                <span className="score-pill" style={{background:sc.bg,color:sc.color}}>{Math.round(app.ats_score)}%</span>
                              </td>
                              <td>
                                {app.assessment_result
                                  ? <span className={app.assessment_result.passed?'assess-pass':'assess-fail'}>{app.assessment_result.passed?'✅':'❌'} {app.assessment_result.score}%</span>
                                  : <span style={{color:'#d1d5db',fontSize:'12px'}}>—</span>}
                              </td>
                              <td>
                                {ai
                                  ? <span className="score-pill" style={{background:ai.recommendation==='hire'?'#dcfce7':'#fee2e2',color:ai.recommendation==='hire'?'#16a34a':'#dc2626'}}>🤖 {ai.ai_score}%</span>
                                  : <span style={{color:'#d1d5db',fontSize:'12px'}}>—</span>}
                              </td>
                              <td>
                                <select className="status-select"
                                  value={app.status}
                                  onChange={e => handleStatusChange(app, e.target.value)}
                                  disabled={updatingId === app.application_id}
                                  style={{background:st.bg,color:st.color,borderColor:st.color+'40'}}
                                >
                                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                              </td>
                              <td style={{fontSize:'12px',color:'#9ca3af',whiteSpace:'nowrap'}}>
                                {new Date(app.applied_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                              </td>
                              <td>
                                {/* ✅ CLEAN DROPDOWN */}
                                <ActionsDropdown
                                  app={app}
                                  hasAI={hasAI}
                                  isExpanded={isExpanded}
                                  onResume={() => window.open(app.resume_url, '_blank')}
                                  onJoin={() => window.open(app.meet_link, '_blank')}
                                  onAssessment={() => navigate(`/hr/assessment/${app.job_id}`)}
                                  onRecording={() => setRecordingModal(app)}
                                  onAIReport={() => setExpandedId(isExpanded ? null : app.application_id)}
                                  onOffer={() => generateOfferLetter(app.application_id, app.candidate_name)}
                                  onJob={() => navigate(`/hr/applications/${app.job_id}`)}
                                  onExpand={() => setExpandedId(isExpanded ? null : app.application_id)}
                                />
                              </td>
                            </tr>

                            {/* EXPANDED ROW */}
                            {isExpanded && (
                              <tr className="exp-row">
                                <td colSpan={9}>
                                  <div className="exp-body">
                                    <div className="exp-grid">

                                      {/* LEFT: ATS + Interview */}
                                      <div className="exp-section">
                                        {app.ats_feedback ? (
                                          <>
                                            <div className="exp-sec-title">📊 ATS Breakdown</div>
                                            <div className="exp-feedback-grid">
                                              {app.ats_feedback.split('|').map((part, idx) => {
                                                const [label, value] = part.split(':');
                                                if (!value || !label) return null;
                                                return (
                                                  <div key={idx} className="exp-fitem">
                                                    <div className="exp-flabel">{label.trim()}</div>
                                                    <div className="exp-fval">{value.trim()}</div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </>
                                        ) : (
                                          <div style={{color:'#9ca3af',fontSize:'13px',marginBottom:'12px'}}>No ATS breakdown available.</div>
                                        )}
                                        {app.cover_letter && (
                                          <>
                                            <div className="exp-sec-title" style={{marginTop:'12px'}}>📝 Cover Letter</div>
                                            <div className="exp-cover">{app.cover_letter}</div>
                                          </>
                                        )}
                                        {app.meet_link && (
                                          <div className="exp-int-box">
                                            <div className="exp-sec-title">🎥 Interview Scheduled</div>
                                            <div style={{fontSize:'13px',color:'#374151',marginBottom:'4px'}}>📅 {app.interview_date} &nbsp; ⏰ {app.interview_time}</div>
                                            <div style={{fontSize:'12px',color:'#7c3aed',wordBreak:'break-all'}}>🔗 {app.meet_link}</div>
                                          </div>
                                        )}
                                      </div>

                                      {/* RIGHT: AI Evaluation Report */}
                                      <div>
                                        {ai ? (
                                          <div style={{borderRadius:'12px',overflow:'hidden',border:'1px solid #f0f0f0',boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
                                            {/* Banner */}
                                            <div className={`ai-banner ${ai.recommendation==='hire'?'ai-banner-hire':'ai-banner-reject'}`}>
                                              <span style={{fontSize:'28px'}}>{ai.recommendation==='hire'?'✅':'❌'}</span>
                                              <div>
                                                <div style={{color:'white',fontWeight:800,fontSize:'15px',marginBottom:'2px'}}>
                                                  {ai.recommendation==='hire' ? 'Recommended: HIRE' : 'Recommended: REJECT'}
                                                </div>
                                                <div style={{color:'rgba(255,255,255,0.85)',fontSize:'13px'}}>🤖 AI Score: <strong>{ai.ai_score}%</strong></div>
                                              </div>
                                            </div>

                                            <div className="ai-body">
                                              {/* Summary */}
                                              {ai.summary && (
                                                <div className="ai-summary-box">
                                                  <div style={{fontSize:'10px',fontWeight:800,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:'6px'}}>📋 Summary</div>
                                                  {ai.summary}
                                                </div>
                                              )}

                                              {/* Strengths & Weaknesses */}
                                              <div className="ai-sw-row">
                                                <div className="ai-sw-card ai-sw-card-hire">
                                                  <div className="ai-sw-head" style={{color:'#16a34a'}}>
                                                    <span>💪</span> Strengths
                                                  </div>
                                                  <div className="ai-sw-content">
                                                    {ai.strengths && ai.strengths !== '—' && ai.strengths !== 'None'
                                                      ? ai.strengths
                                                      : <span style={{color:'#9ca3af',fontStyle:'italic'}}>No notable strengths identified.</span>
                                                    }
                                                  </div>
                                                </div>
                                                <div className="ai-sw-card ai-sw-card-reject">
                                                  <div className="ai-sw-head" style={{color:'#dc2626'}}>
                                                    <span>⚠️</span> Weaknesses
                                                  </div>
                                                  <div className="ai-sw-content">
                                                    {ai.weaknesses && ai.weaknesses !== '—'
                                                      ? ai.weaknesses
                                                      : <span style={{color:'#9ca3af',fontStyle:'italic'}}>No major weaknesses noted.</span>
                                                    }
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Transcript */}
                                              {ai.transcript && (
                                                <>
                                                  <div style={{fontSize:'10px',fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.7px',marginBottom:'6px'}}>📝 Transcript Preview</div>
                                                  <div className="ai-transcript-box">
                                                    {ai.transcript.substring(0,500)}{ai.transcript.length>500?'...':''}
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          /* No AI yet */
                                          <div className="ai-upload-prompt">
                                            <div style={{fontSize:'40px'}}>🎙️</div>
                                            <div style={{fontWeight:800,fontSize:'14px',color:'#374151'}}>No AI Evaluation Yet</div>
                                            <div style={{fontSize:'12.5px',color:'#9ca3af',maxWidth:'220px',lineHeight:1.5}}>
                                              Upload the interview recording to get an AI-powered hire/reject recommendation
                                            </div>
                                            <button className="btn-upload-now" onClick={() => setRecordingModal(app)}>
                                              🎙️ Upload Recording
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="tbl-footer">
                    <span>Showing {filtered.length} of {allApps.length} applicants</span>
                    <span style={{fontSize:'12px',color:'#9ca3af'}}>Sorted by ATS Score ↓</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {interviewModal && (
        <InterviewModal
          applicant={interviewModal}
          jobTitle={jobs.find(j => String(j.id) === String(interviewModal.job_id))?.title || ''}
          onConfirm={handleInterviewConfirm}
          onCancel={() => { setInterviewModal(null); setPendingDrop(null); }}
        />
      )}
      {recordingModal && (
        <RecordingModal
          applicant={recordingModal}
          onConfirm={(result) => handleRecordingDone(result, recordingModal.application_id)}
          onCancel={() => setRecordingModal(null)}
        />
      )}
      {aiResult && (
        <div style={mS.overlay}>
          <div style={{...mS.box, maxWidth:'520px'}}>
            <div style={{...mS.header, background: aiResult.recommendation==='hire' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#EF4444,#DC2626)'}}>
              <div style={{fontSize:'36px',marginBottom:'8px'}}>{aiResult.recommendation==='hire'?'✅':'❌'}</div>
              <h2 style={mS.hTitle}>{aiResult.recommendation==='hire'?'Recommended: HIRE':'Recommended: REJECT'}</h2>
              <p style={mS.hSub}>AI Score: {aiResult.ai_score}%</p>
            </div>
            <div style={mS.body}>
              {aiResult.summary && (
                <div style={{background:'#f8fafc',borderRadius:'8px',padding:'12px',marginBottom:'16px',fontSize:'13px',color:'#374151',lineHeight:1.6}}>
                  <div style={{fontWeight:800,fontSize:'11px',color:'#6b7280',marginBottom:'6px',textTransform:'uppercase'}}>📋 Summary</div>
                  {aiResult.summary}
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontWeight:800,fontSize:'11px',color:'#16a34a',marginBottom:'8px'}}>💪 STRENGTHS</div>
                  <div style={{fontSize:'13px',color:'#374151',lineHeight:1.6}}>
                    {aiResult.strengths && aiResult.strengths !== '—' ? aiResult.strengths : <span style={{color:'#9ca3af',fontStyle:'italic'}}>None identified</span>}
                  </div>
                </div>
                <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px'}}>
                  <div style={{fontWeight:800,fontSize:'11px',color:'#dc2626',marginBottom:'8px'}}>⚠️ WEAKNESSES</div>
                  <div style={{fontSize:'13px',color:'#374151',lineHeight:1.6}}>
                    {aiResult.weaknesses && aiResult.weaknesses !== '—' ? aiResult.weaknesses : <span style={{color:'#9ca3af',fontStyle:'italic'}}>None noted</span>}
                  </div>
                </div>
              </div>
              {aiResult.transcript && (
                <>
                  <div style={{fontWeight:800,fontSize:'11px',color:'#6b7280',marginBottom:'6px',textTransform:'uppercase'}}>📝 Transcript Preview</div>
                  <div style={{background:'#f8fafc',borderRadius:'8px',padding:'12px',maxHeight:'120px',overflowY:'auto',fontSize:'12px',color:'#6b7280',lineHeight:1.6,marginBottom:'16px'}}>
                    {aiResult.transcript.substring(0,500)}{aiResult.transcript.length>500?'...':''}
                  </div>
                </>
              )}
              <button style={{...mS.confirmBtn,width:'100%',background:'#1a1d2e'}} onClick={() => setAiResult(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const mS = {
  overlay:    {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'},
  box:        {background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'},
  header:     {padding:'28px 24px',textAlign:'center'},
  hTitle:     {margin:0,color:'white',fontSize:'20px',fontWeight:800},
  hSub:       {margin:'6px 0 0',color:'rgba(255,255,255,0.8)',fontSize:'13px'},
  body:       {padding:'24px'},
  err:        {background:'#fee2e2',color:'#991b1b',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'13px'},
  field:      {marginBottom:'16px'},
  label:      {display:'block',fontWeight:700,fontSize:'12.5px',color:'#374151',marginBottom:'6px'},
  input:      {width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif'},
  infoBox:    {display:'flex',gap:'10px',alignItems:'flex-start',background:'#eff6ff',borderRadius:'8px',padding:'12px',marginBottom:'18px'},
  actions:    {display:'flex',gap:'10px'},
  cancelBtn:  {flex:1,padding:'11px',background:'white',color:'#6b7280',border:'1px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontFamily:'Nunito,sans-serif'},
  confirmBtn: {flex:2,padding:'11px',background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:700,fontFamily:'Nunito,sans-serif'},
};

export default AllApplicants;