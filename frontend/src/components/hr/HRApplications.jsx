import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ApplicationStatus from '../applications/ApplicationStatus';

const STATUS_OPTIONS = [
  { value: 'pending',      label: '⏳ Pending' },
  { value: 'under_review', label: '🔍 Under Review' },
  { value: 'shortlisted',  label: '⭐ Shortlisted' },
  { value: 'interview',    label: '📅 Schedule Interview' },
  { value: 'hired',        label: '✅ Hired' },
  { value: 'rejected',     label: '❌ Rejected' },
];

// ── Interview Modal ──────────────────────────────────────────────────────────
const InterviewModal = ({ applicant, jobTitle, onConfirm, onCancel }) => {
  const [date, setDate]   = useState('');
  const [time, setTime]   = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleConfirm = () => {
    if (!date) { setError('Please select an interview date.'); return; }
    if (!time) { setError('Please select an interview time.'); return; }
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
            <label style={mS.label}>Date <span style={{color:'#ef4444'}}>*</span></label>
            <input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)} style={mS.input}/>
          </div>
          <div style={mS.field}>
            <label style={mS.label}>Time <span style={{color:'#ef4444'}}>*</span></label>
            <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={mS.input}/>
          </div>
          <div style={mS.field}>
            <label style={mS.label}>Notes <span style={{color:'#9ca3af',fontWeight:400}}>(optional)</span></label>
            <textarea rows={3} placeholder="e.g. Join via Jitsi. Be 5 mins early."
              value={notes} onChange={e=>setNotes(e.target.value)}
              style={{...mS.input,resize:'none'}}/>
          </div>
          <div style={mS.infoBox}>
            <span style={{fontSize:'18px'}}>📧</span>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:'13px'}}>Jitsi link + email auto-sent</p>
              <p style={{margin:'2px 0 0',fontSize:'12px',color:'#6b7280'}}>{applicant.candidate_name} will receive details at {applicant.candidate_email}</p>
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

// ── Recording Modal ──────────────────────────────────────────────────────────
const RecordingModal = ({ applicant, onConfirm, onCancel }) => {
  const [file, setFile]         = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState('');

  const handleUpload = async () => {
    if (!file) { setError('Please select a recording file.'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('application_id', applicant.application_id);
    fd.append('recording', file);
    try {
      const res = await api.post('/api/evaluation/upload', fd, { headers: {'Content-Type':'multipart/form-data'} });
      onConfirm(res.data);
    } catch (err) { setError(err.response?.data?.detail || 'Upload failed.'); }
    finally { setUploading(false); }
  };

  return (
    <div style={mS.overlay}>
      <div style={mS.box}>
        <div style={{...mS.header,background:'linear-gradient(135deg,#0D9488,#0369a1)'}}>
          <div style={{fontSize:'32px',marginBottom:'8px'}}>🎙️</div>
          <h2 style={mS.hTitle}>Upload Interview Recording</h2>
          <p style={mS.hSub}>{applicant.candidate_name}</p>
        </div>
        <div style={mS.body}>
          {error && <div style={mS.err}>{error}</div>}
          <div style={mS.field}>
            <label style={mS.label}>Recording File (mp3, mp4, wav, m4a)</label>
            <input type="file" accept=".mp3,.mp4,.wav,.m4a,.webm"
              onChange={e=>setFile(e.target.files[0])} style={mS.input}/>
          </div>
          <div style={mS.infoBox}>
            <span style={{fontSize:'18px'}}>🤖</span>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:'13px'}}>AI will automatically:</p>
              <p style={{margin:'2px 0 0',fontSize:'12px',color:'#6b7280'}}>Transcribe → Evaluate → Give hire/reject recommendation</p>
            </div>
          </div>
          {uploading && <div style={{textAlign:'center',padding:'16px',color:'#0D9488',fontSize:'13px'}}>⏳ Transcribing and evaluating... 30–60 seconds.</div>}
          <div style={mS.actions}>
            <button style={mS.cancelBtn} onClick={onCancel} disabled={uploading}>Cancel</button>
            <button style={{...mS.confirmBtn,background:'#0D9488'}} onClick={handleUpload} disabled={uploading}>
              {uploading ? '⏳ Processing...' : '🚀 Upload & Evaluate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── AI Result Modal ──────────────────────────────────────────────────────────
const AIResultModal = ({ result, onClose }) => (
  <div style={mS.overlay}>
    <div style={mS.box}>
      <div style={{...mS.header, background: result.recommendation==='hire'
        ? 'linear-gradient(135deg,#22C55E,#16A34A)'
        : 'linear-gradient(135deg,#EF4444,#DC2626)'}}>
        <div style={{fontSize:'32px',marginBottom:'8px'}}>{result.recommendation==='hire'?'✅':'❌'}</div>
        <h2 style={mS.hTitle}>{result.recommendation==='hire'?'Recommended: HIRE':'Recommended: REJECT'}</h2>
        <p style={mS.hSub}>AI Score: {result.ai_score}%</p>
      </div>
      <div style={mS.body}>
        <p style={{fontSize:'14px',color:'#374151',marginBottom:'16px'}}>{result.summary}</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
          <div style={{background:'#f0fdf4',borderRadius:'8px',padding:'12px'}}>
            <p style={{margin:0,fontWeight:700,fontSize:'12px',color:'#16a34a'}}>💪 Strengths</p>
            <p style={{margin:'6px 0 0',fontSize:'13px',color:'#374151'}}>{result.strengths}</p>
          </div>
          <div style={{background:'#fef2f2',borderRadius:'8px',padding:'12px'}}>
            <p style={{margin:0,fontWeight:700,fontSize:'12px',color:'#dc2626'}}>⚠️ Weaknesses</p>
            <p style={{margin:'6px 0 0',fontSize:'13px',color:'#374151'}}>{result.weaknesses}</p>
          </div>
        </div>
        {result.transcript && (
          <div style={{background:'#f8fafc',borderRadius:'8px',padding:'12px',maxHeight:'120px',overflowY:'auto',fontSize:'12px',color:'#6b7280',marginBottom:'16px'}}>
            {result.transcript.substring(0,500)}...
          </div>
        )}
        <button style={{...mS.confirmBtn,width:'100%'}} onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const HRApplications = () => {
  const { jobId } = useParams();
  const navigate  = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle]     = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [interviewModal, setInterviewModal] = useState(null);
  const [recordingModal, setRecordingModal] = useState(null);
  const [aiResult, setAiResult]     = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [jobId]);

  const fetchData = async () => {
    try {
      const [appRes, jobRes] = await Promise.all([
        api.get(`/api/applications/job/${jobId}`),
        api.get(`/api/jobs/${jobId}`)
      ]);
      setApplicants(appRes.data);
      setJobTitle(jobRes.data.title);
    } catch { setError('Failed to load applicants.'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (applicant, newStatus) => {
    if (newStatus === 'interview') { setInterviewModal(applicant); return; }
    await submitUpdate(applicant.application_id, newStatus);
  };

  const submitUpdate = async (id, status, date, time, notes) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/applications/${id}/status`, {
        status, interview_date: date||null, interview_time: time||null, interview_notes: notes||null,
      });
      setApplicants(prev => prev.map(a => a.application_id===id ? {...a,status} : a));
    } catch (err) {
      alert(typeof err.response?.data?.detail==='string' ? err.response.data.detail : 'Failed to update status.');
    } finally { setUpdatingId(null); }
  };

  const handleInterviewConfirm = async ({date,time,notes}) => {
    await submitUpdate(interviewModal.application_id,'interview',date,time,notes);
    setInterviewModal(null); fetchData();
  };

  const generateOfferLetter = async (applicationId, candidateName) => {
    try {
      const res = await api.post(`/api/evaluation/offer-letter/${applicationId}`,{},{responseType:'blob'});
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href=url;
      a.setAttribute('download',`Offer_Letter_${candidateName}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Failed to generate offer letter.'); }
  };

  const avatarColor = (name='') => {
    const colors=['#2563eb','#0D9488','#d97706','#7c3aed','#dc2626','#0891b2','#16a34a','#db2777'];
    let h=0; for(let i=0;i<name.length;i++) h=name.charCodeAt(i)+((h<<5)-h);
    return colors[Math.abs(h)%colors.length];
  };

  const statusBadge = (status) => {
    const map = {
      pending:      {label:'Pending',     bg:'#f3f4f6',color:'#6b7280'},
      under_review: {label:'Reviewing',   bg:'#eff6ff',color:'#2563eb'},
      shortlisted:  {label:'Shortlisted', bg:'#fef3c7',color:'#d97706'},
      interview:    {label:'Interview',   bg:'#f5f3ff',color:'#7c3aed'},
      hired:        {label:'Hired',       bg:'#dcfce7',color:'#16a34a'},
      rejected:     {label:'Rejected',    bg:'#fee2e2',color:'#dc2626'},
    };
    return map[status] || {label:status,bg:'#f3f4f6',color:'#6b7280'};
  };

  const scoreColor = (s) =>
    s>=75 ? {color:'#16a34a',bg:'#dcfce7'} :
    s>=50 ? {color:'#d97706',bg:'#fef3c7'} :
            {color:'#dc2626',bg:'#fee2e2'};

  const filtered = applicants
    .filter(a => filterStatus==='all' || a.status===filterStatus)
    .filter(a => {
      const q = search.toLowerCase();
      return !q || a.candidate_name.toLowerCase().includes(q) || a.candidate_email.toLowerCase().includes(q);
    });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }

        .app-root { display:flex; min-height:100vh; font-family:'Nunito',sans-serif; background:#f0f4f8; }

        /* SIDEBAR */
        .sidebar {
          width:220px; flex-shrink:0; background:#1a1d2e;
          display:flex; flex-direction:column; min-height:100vh;
          position:sticky; top:0; box-shadow:2px 0 12px rgba(0,0,0,0.15);
        }
        .sb-brand { display:flex; align-items:center; gap:10px; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .sb-brand-icon { width:36px; height:36px; background:#2563eb; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .sb-brand-name { font-size:15px; font-weight:800; color:white; }
        .sb-brand-name span { color:#60a5fa; }
        .sb-profile { display:flex; flex-direction:column; align-items:center; padding:22px 18px 18px; border-bottom:1px solid rgba(255,255,255,0.06); }
        .sb-avatar { width:62px; height:62px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#0D9488); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:white; margin-bottom:10px; border:3px solid rgba(255,255,255,0.12); box-shadow:0 4px 12px rgba(37,99,235,0.4); }
        .sb-uname { font-size:13.5px; font-weight:700; color:white; }
        .sb-urole { font-size:11px; color:#60a5fa; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; margin-top:3px; }
        .sb-nav { flex:1; padding:14px 0; }
        .sb-lbl { font-size:9.5px; font-weight:700; color:rgba(255,255,255,0.28); text-transform:uppercase; letter-spacing:1.2px; padding:10px 18px 5px; }
        .sb-item { display:flex; align-items:center; gap:11px; padding:10px 18px; cursor:pointer; font-size:13px; font-weight:600; color:rgba(255,255,255,0.55); border-left:3px solid transparent; transition:all 0.18s; }
        .sb-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.9); }
        .sb-item.active { background:rgba(37,99,235,0.2); color:white; border-left-color:#2563eb; }
        .sb-item .si { font-size:15px; width:20px; text-align:center; }
        .sb-logout { padding:14px 18px; border-top:1px solid rgba(255,255,255,0.06); }
        .sb-out-btn { width:100%; padding:10px; background:rgba(220,38,38,0.12); border:1px solid rgba(220,38,38,0.25); border-radius:8px; color:#fca5a5; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .sb-out-btn:hover { background:rgba(220,38,38,0.28); color:white; }

        /* MAIN */
        .main-area { flex:1; display:flex; flex-direction:column; overflow-y:auto; }
        .topbar { background:white; padding:0 30px; display:flex; align-items:center; justify-content:space-between; height:62px; flex-shrink:0; box-shadow:0 1px 4px rgba(0,0,0,0.06); position:sticky; top:0; z-index:50; }
        .topbar-left h2 { font-size:17px; font-weight:800; color:#1a1d2e; }
        .topbar-left p  { font-size:11.5px; color:#9ca3af; margin-top:1px; }
        .topbar-right { display:flex; align-items:center; gap:10px; }

        .page { padding:24px 28px; }

        /* FILTERS */
        .filters-bar { display:flex; gap:12px; align-items:center; margin-bottom:20px; flex-wrap:wrap; }
        .search-box { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e5e7eb; border-radius:10px; padding:9px 14px; flex:1; min-width:220px; max-width:340px; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .search-box input { border:none; background:transparent; outline:none; font-size:13.5px; font-family:'Nunito',sans-serif; color:#1a1d2e; width:100%; }
        .search-box input::placeholder { color:#9ca3af; }
        .filter-tabs { display:flex; gap:8px; flex-wrap:wrap; }
        .ftab { padding:7px 14px; border-radius:20px; border:1.5px solid #e5e7eb; background:white; cursor:pointer; font-size:12px; font-weight:700; color:#6b7280; transition:all 0.15s; font-family:'Nunito',sans-serif; }
        .ftab:hover { border-color:#2563eb; color:#2563eb; }
        .ftab.active { background:#2563eb; color:white; border-color:#2563eb; }

        /* TABLE CARD */
        .tbl-card { background:white; border-radius:14px; box-shadow:0 1px 4px rgba(0,0,0,0.06); overflow:hidden; margin-bottom:24px; }
        .tbl-hd { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #f3f4f6; }
        .tbl-title { font-size:14px; font-weight:800; color:#1a1d2e; }

        table { width:100%; border-collapse:collapse; }
        thead tr { background:#f8fafc; }
        th { padding:11px 16px; text-align:left; font-size:10.5px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.8px; white-space:nowrap; }
        tbody tr { border-top:1px solid #f3f4f6; transition:background 0.12s; }
        tbody tr:hover { background:#f8fafc; }
        td { padding:13px 16px; font-size:13px; color:#374151; vertical-align:middle; }

        .cand-cell { display:flex; align-items:center; gap:10px; }
        .cand-av { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:800; color:white; flex-shrink:0; }
        .cand-name  { font-weight:700; color:#1a1d2e; font-size:13px; }
        .cand-email { font-size:11px; color:#9ca3af; margin-top:1px; }

        .score-pill { padding:3px 10px; border-radius:20px; font-size:11.5px; font-weight:700; display:inline-block; }
        .status-pill { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; display:inline-block; }

        .td-acts { display:flex; gap:6px; flex-wrap:wrap; }
        .btn-xs { padding:5px 10px; border:none; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Nunito',sans-serif; transition:all 0.15s; white-space:nowrap; }
        .btn-resume  { background:#eff6ff; color:#2563eb; }
        .btn-resume:hover  { background:#dbeafe; }
        .btn-join    { background:#f5f3ff; color:#7c3aed; }
        .btn-join:hover    { background:#ede9fe; }
        .btn-rec     { background:#f0fdf4; color:#16a34a; }
        .btn-rec:hover     { background:#dcfce7; }
        .btn-offer   { background:#fefce8; color:#854d0e; }
        .btn-offer:hover   { background:#fef9c3; }
        .btn-expand  { background:#f3f4f6; color:#6b7280; }
        .btn-expand:hover  { background:#e5e7eb; }
        .btn-assess  { background:#fdf4ff; color:#7c3aed; }
        .btn-assess:hover  { background:#fae8ff; }

        /* STATUS SELECT */
        .status-select { padding:5px 8px; border:1.5px solid #e5e7eb; border-radius:7px; font-size:11.5px; font-family:'Nunito',sans-serif; background:white; color:#374151; outline:none; cursor:pointer; transition:border-color 0.15s; }
        .status-select:focus { border-color:#2563eb; }
        .status-select:disabled { opacity:0.5; cursor:not-allowed; }

        /* EXPANDED ROW */
        .exp-row td { padding:0; border-top:none; }
        .exp-body { padding:20px 22px; background:#fafbfc; border-top:1px solid #f3f4f6; }
        .exp-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .exp-section { background:white; border-radius:10px; padding:16px; border:1px solid #f3f4f6; }
        .exp-sec-title { font-size:11px; font-weight:800; color:#9ca3af; text-transform:uppercase; letter-spacing:0.7px; margin-bottom:10px; }
        .exp-feedback-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
        .exp-fitem { background:#f8fafc; border-radius:8px; padding:10px; }
        .exp-flabel { font-size:10px; color:#9ca3af; font-weight:600; margin-bottom:3px; }
        .exp-fval   { font-size:12px; font-weight:700; color:#374151; }
        .exp-cover  { font-size:13px; color:#6b7280; white-space:pre-wrap; line-height:1.6; }
        .exp-interview { background:#f5f3ff; border-radius:10px; padding:14px; margin-bottom:12px; }
        .exp-int-row { font-size:13px; color:#374151; margin-bottom:4px; }

        /* BADGES */
        .assess-pass { background:#dcfce7; color:#16a34a; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; display:inline-block; margin-top:4px; }
        .assess-fail { background:#fee2e2; color:#dc2626; font-size:11px; font-weight:700; padding:2px 8px; border-radius:20px; display:inline-block; margin-top:4px; }

        .tbl-footer { display:flex; align-items:center; justify-content:space-between; padding:13px 22px; border-top:1px solid #f3f4f6; font-size:13px; color:#6b7280; }

        .empty-state { text-align:center; padding:60px 20px; }
        .empty-icon  { font-size:52px; margin-bottom:14px; }
        .empty-title { font-size:16px; font-weight:700; color:#6b7280; margin-bottom:6px; }
        .empty-sub   { font-size:13px; color:#9ca3af; }

        .loading-row { text-align:center; padding:48px; color:#9ca3af; font-size:14px; }

        @media(max-width:700px) {
          .sidebar { display:none; }
          .page { padding:14px; }
          .exp-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="app-root">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-brand-icon">🎯</div>
            <div className="sb-brand-name">RECRUIT<span>-IQ</span></div>
          </div>
          <div className="sb-profile">
            <div className="sb-avatar">{(user.full_name||'H').charAt(0).toUpperCase()}</div>
            <div className="sb-uname">{user.full_name}</div>
            <div className="sb-urole">HR / Recruiter</div>
          </div>
          <nav className="sb-nav">
            <div className="sb-lbl">Main</div>
            <div className="sb-item" onClick={() => navigate('/dashboard')}><span className="si">⊞</span>Dashboard</div>
            <div className="sb-item" onClick={() => navigate('/jobs')}><span className="si">💼</span>All Jobs</div>
            <div className="sb-item" onClick={() => navigate('/create-job')}><span className="si">➕</span>Post Job</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban')}><span className="si">🗂️</span>Pipeline</div>
            <div className="sb-lbl" style={{marginTop:'10px'}}>Settings</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban',{state:{tab:'interviews'}})}><span className="si">📅</span>Calendar</div>
            <div className="sb-item" onClick={() => navigate('/hr/kanban',{state:{tab:'funnel'}})}><span className="si">📊</span>Chart / Report</div>
            <div className="sb-item" onClick={() => navigate('/settings')}><span className="si">⚙️</span>Settings</div>
            <div className="sb-item active"><span className="si">☰</span>Table</div>
          </nav>
          <div className="sb-logout">
            <button className="sb-out-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>
              <span>⏻</span>Log Out
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div className="main-area">
          <div className="topbar">
            <div className="topbar-left">
              <h2>Applicants Table</h2>
              <p>{jobTitle} · {applicants.length} applicant{applicants.length!==1?'s':''} · Ranked by ATS Score</p>
            </div>
            <div className="topbar-right">
              <button
                onClick={() => navigate(`/hr/assessment/${jobId}`)}
                style={{padding:'8px 16px',background:'#0D9488',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}}
              >📝 Create Assessment</button>
              <button
                onClick={() => navigate('/dashboard')}
                style={{padding:'8px 16px',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}}
              >← Back</button>
            </div>
          </div>

          <div className="page">
            {error && <div style={{background:'#fee2e2',border:'1px solid #fecaca',color:'#991b1b',padding:'12px 16px',borderRadius:'10px',marginBottom:'16px',fontSize:'13px'}}>{error}</div>}

            {/* FILTERS */}
            <div className="filters-bar">
              <div className="search-box">
                <span style={{color:'#9ca3af'}}>🔍</span>
                <input placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="filter-tabs">
                {['all','pending','under_review','shortlisted','interview','hired','rejected'].map(s => (
                  <button key={s} className={`ftab ${filterStatus===s?'active':''}`} onClick={()=>setFilterStatus(s)}>
                    {s==='all' ? `All (${applicants.length})` :
                     s==='under_review' ? `Reviewing (${applicants.filter(a=>a.status===s).length})` :
                     `${s.charAt(0).toUpperCase()+s.slice(1)} (${applicants.filter(a=>a.status===s).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE */}
            <div className="tbl-card">
              <div className="tbl-hd">
                <span className="tbl-title">👥 APPLICANTS LIST</span>
                <span style={{fontSize:'12px',color:'#9ca3af',fontWeight:600}}>Showing {filtered.length} of {applicants.length}</span>
              </div>

              {loading ? (
                <div className="loading-row">Loading applicants...</div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <div className="empty-title">No applicants found</div>
                  <div className="empty-sub">Try adjusting your search or filter</div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Candidate</th>
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
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="score-pill" style={{background:sc.bg,color:sc.color}}>
                                {Math.round(app.ats_score)}%
                              </span>
                            </td>
                            <td>
                              {app.assessment_result ? (
                                <span className={app.assessment_result.passed?'assess-pass':'assess-fail'}>
                                  {app.assessment_result.passed?'✅':'❌'} {app.assessment_result.score}%
                                </span>
                              ) : <span style={{color:'#d1d5db',fontSize:'12px'}}>—</span>}
                            </td>
                            <td>
                              {app.ai_score ? (
                                <span className="score-pill" style={{
                                  background: app.ai_recommendation==='hire'?'#dcfce7':'#fee2e2',
                                  color:      app.ai_recommendation==='hire'?'#16a34a':'#dc2626',
                                }}>
                                  🤖 {app.ai_score}%
                                </span>
                              ) : <span style={{color:'#d1d5db',fontSize:'12px'}}>—</span>}
                            </td>
                            <td>
                              <select
                                className="status-select"
                                value={app.status}
                                onChange={e=>handleStatusChange(app,e.target.value)}
                                disabled={updatingId===app.application_id}
                                style={{background:st.bg,color:st.color,borderColor:st.color+'40'}}
                              >
                                {STATUS_OPTIONS.map(o=>(
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{fontSize:'12px',color:'#9ca3af',whiteSpace:'nowrap'}}>
                              {new Date(app.applied_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                            </td>
                            <td>
                              <div className="td-acts">
                                <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="btn-xs btn-resume">📄 Resume</a>
                                {app.meet_link && <a href={app.meet_link} target="_blank" rel="noopener noreferrer" className="btn-xs btn-join">🎥 Join</a>}
                                {app.status==='interview' && (
                                  <button className="btn-xs btn-rec" onClick={()=>setRecordingModal(app)}>🎙️ Recording</button>
                                )}
                                {app.status==='hired' && (
                                  <button className="btn-xs btn-offer" onClick={()=>generateOfferLetter(app.application_id,app.candidate_name)}>📄 Offer</button>
                                )}
                                <button className="btn-xs btn-expand" onClick={()=>setExpandedId(isExpanded?null:app.application_id)}>
                                  {isExpanded?'▲ Less':'▼ More'}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED ROW */}
                          {isExpanded && (
                            <tr className="exp-row">
                              <td colSpan={8}>
                                <div className="exp-body">
                                  <div className="exp-grid">
                                    {/* ATS Breakdown */}
                                    {app.ats_feedback && (
                                      <div className="exp-section">
                                        <div className="exp-sec-title">📊 ATS Breakdown</div>
                                        <div className="exp-feedback-grid">
                                          {app.ats_feedback.split('|').map((part,idx) => {
                                            const [label,value] = part.split(':');
                                            if(!value||!label) return null;
                                            return (
                                              <div key={idx} className="exp-fitem">
                                                <div className="exp-flabel">{label.trim()}</div>
                                                <div className="exp-fval">{value.trim()}</div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Interview + Cover */}
                                    <div className="exp-section">
                                      {app.meet_link && (
                                        <div className="exp-interview">
                                          <div className="exp-sec-title">🎥 Interview Scheduled</div>
                                          <div className="exp-int-row">📅 {app.interview_date} &nbsp; ⏰ {app.interview_time}</div>
                                          <div style={{fontSize:'12px',color:'#7c3aed',marginTop:'4px',wordBreak:'break-all'}}>🔗 {app.meet_link}</div>
                                        </div>
                                      )}
                                      {app.cover_letter && (
                                        <>
                                          <div className="exp-sec-title">📝 Cover Letter</div>
                                          <div className="exp-cover">{app.cover_letter}</div>
                                        </>
                                      )}
                                      {!app.meet_link && !app.cover_letter && (
                                        <div style={{color:'#9ca3af',fontSize:'13px',padding:'10px 0'}}>No additional details available.</div>
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
              )}

              {!loading && filtered.length > 0 && (
                <div className="tbl-footer">
                  <span>Showing {filtered.length} of {applicants.length} applicants</span>
                  <span style={{fontSize:'12px',color:'#9ca3af'}}>Sorted by ATS Score ↓</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {interviewModal && (
        <InterviewModal applicant={interviewModal} jobTitle={jobTitle}
          onConfirm={handleInterviewConfirm} onCancel={()=>setInterviewModal(null)}/>
      )}
      {recordingModal && (
        <RecordingModal applicant={recordingModal}
          onConfirm={r=>{setRecordingModal(null);setAiResult(r);fetchData();}}
          onCancel={()=>setRecordingModal(null)}/>
      )}
      {aiResult && <AIResultModal result={aiResult} onClose={()=>setAiResult(null)}/>}
    </>
  );
};

const mS = {
  overlay:    {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px'},
  box:        {background:'white',borderRadius:'16px',width:'100%',maxWidth:'480px',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'},
  header:     {padding:'28px 24px',textAlign:'center'},
  hTitle:     {margin:0,color:'white',fontSize:'20px',fontWeight:800},
  hSub:       {margin:'6px 0 0',color:'rgba(255,255,255,0.8)',fontSize:'13px'},
  body:       {padding:'24px'},
  err:        {background:'#fee2e2',color:'#991b1b',padding:'10px 14px',borderRadius:'8px',marginBottom:'16px',fontSize:'13px'},
  field:      {marginBottom:'16px'},
  label:      {display:'block',fontWeight:700,fontSize:'12.5px',color:'#374151',marginBottom:'6px',letterSpacing:'0.3px'},
  input:      {width:'100%',padding:'10px 14px',border:'1.5px solid #e5e7eb',borderRadius:'8px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:'Nunito,sans-serif'},
  infoBox:    {display:'flex',gap:'10px',alignItems:'flex-start',background:'#eff6ff',borderRadius:'8px',padding:'12px',marginBottom:'18px'},
  actions:    {display:'flex',gap:'10px'},
  cancelBtn:  {flex:1,padding:'11px',background:'white',color:'#6b7280',border:'1px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontFamily:'Nunito,sans-serif'},
  confirmBtn: {flex:2,padding:'11px',background:'linear-gradient(135deg,#7C3AED,#4F46E5)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'14px',fontWeight:700,fontFamily:'Nunito,sans-serif'},
};

export default HRApplications; 