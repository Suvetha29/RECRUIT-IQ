import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import ApplyJob from './candidate/ApplyJob';
import ATSScore from './applications/ATSScore';

// ── Delete Modal ─────────────────────────────────────────────
const DeleteModal = ({ job, onConfirm, onCancel, deleting }) => (
  <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px',backdropFilter:'blur(4px)' }}>
    <div style={{ background:'white',borderRadius:'20px',width:'100%',maxWidth:'400px',overflow:'hidden',boxShadow:'0 24px 64px rgba(0,0,0,0.25)',animation:'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}`}</style>
      <div style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)',padding:'30px 24px',textAlign:'center' }}>
        <div style={{ fontSize:'46px',marginBottom:'10px' }}> </div>
        <h2 style={{ margin:0,color:'white',fontSize:'20px',fontWeight:900 }}>Delete Job Post?</h2>
        <p style={{ margin:'6px 0 0',color:'rgba(255,255,255,0.85)',fontSize:'13px' }}>{job.title} · {job.company}</p>
      </div>
      <div style={{ padding:'24px' }}>
        <p style={{ fontSize:'14px',color:'#374151',lineHeight:1.7,marginBottom:'20px',textAlign:'center' }}>
          This will <strong>permanently delete</strong> this job posting and all associated data. This cannot be undone.
        </p>
        <div style={{ display:'flex',gap:'10px' }}>
          <button onClick={onCancel} disabled={deleting}
            style={{ flex:1,padding:'12px',background:'#f3f4f6',color:'#374151',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontWeight:700,fontFamily:'Nunito,sans-serif' }}
            onMouseEnter={e=>e.currentTarget.style.background='#e5e7eb'}
            onMouseLeave={e=>e.currentTarget.style.background='#f3f4f6'}
          >Cancel</button>
          <button onClick={onConfirm} disabled={deleting}
            style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',border:'none',borderRadius:'10px',cursor:'pointer',fontSize:'14px',fontWeight:800,fontFamily:'Nunito,sans-serif',opacity:deleting?0.7:1 }}>
            {deleting ? '⏳ Deleting...' : ' Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [user, setUser]                 = useState(null);
  const [search, setSearch]             = useState('');
  const [filterType, setFilter]         = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedJob, setSelectedJob]   = useState(null);
  const [atsResult, setAtsResult]       = useState(null);
  const [deleteModal, setDeleteModal]   = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [toggling, setToggling]         = useState(null);
  const [toast, setToast]               = useState(null);
  const [closingId, setClosingId]       = useState(null); // for close animation

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchJobs();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchJobs = async () => {
    try {
      const res = await jobAPI.getAllJobs();
      setJobs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggleStatus = async (job) => {
    setToggling(job.id);
    // If closing, animate first
    if (job.status === 'open' && filterStatus === 'open') {
      setClosingId(job.id);
      await new Promise(r => setTimeout(r, 400));
    }
    try {
      await jobAPI.toggleJobStatus(job.id);
      const newStatus = job.status === 'open' ? 'closed' : 'open';
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
      showToast(`"${job.title}" is now ${newStatus === 'open' ? '🟢 Open' : '🔴 Closed'}`);
    } catch (e) {
      showToast('Failed to update job status.', 'error');
    } finally {
      setToggling(null);
      setClosingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await jobAPI.deleteJob(deleteModal.id);
      setJobs(prev => prev.filter(j => j.id !== deleteModal.id));
      showToast(`"${deleteModal.title}" deleted successfully.`);
      setDeleteModal(null);
    } catch (e) {
      showToast('Failed to delete job.', 'error');
    } finally { setDeleting(false); }
  };

  const handleApplySuccess = (result) => {
    setSelectedJob(null);
    setAtsResult(result);
    fetchJobs();
  };

  const isHR = user?.role === 'hr';

  const typeMap = {
    full_time:  { label:'Full Time',  color:'#16a34a', bg:'#dcfce7' },
    part_time:  { label:'Part Time',  color:'#d97706', bg:'#fef3c7' },
    contract:   { label:'Contract',   color:'#0891b2', bg:'#e0f2fe' },
    internship: { label:'Internship', color:'#7c3aed', bg:'#ede9fe' },
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    const matchType   = filterType === 'all' || j.job_type === filterType;
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .jl-root { display:flex; min-height:100vh; font-family:'Nunito',sans-serif; background:#f0f4f8; }

        /* SIDEBAR */
        .sidebar { width:230px; flex-shrink:0; background:#1e2139; display:flex; flex-direction:column; min-height:100vh; position:sticky; top:0; box-shadow:2px 0 12px rgba(0,0,0,0.15); }
        .sb-brand { display:flex; align-items:center; gap:10px; padding:24px 20px 20px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .sb-brand-icon { width:36px; height:36px; background:#2563eb; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:18px; }
        .sb-brand-text { font-size:16px; font-weight:800; color:white; }
        .sb-brand-text span { color:#60a5fa; }
        .sb-profile { display:flex; flex-direction:column; align-items:center; padding:24px 20px 20px; border-bottom:1px solid rgba(255,255,255,0.07); }
        .sb-avatar { width:60px; height:60px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#0D9488); display:flex; align-items:center; justify-content:center; font-size:24px; font-weight:800; color:white; margin-bottom:10px; border:3px solid rgba(255,255,255,0.15); }
        .sb-name { font-size:14px; font-weight:700; color:white; text-align:center; }
        .sb-role { font-size:11px; color:#60a5fa; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; margin-top:3px; }
        .sb-nav { flex:1; padding:16px 0; }
        .sb-nav-label { font-size:10px; font-weight:700; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:1px; padding:10px 20px 6px; }
        .sb-nav-item { display:flex; align-items:center; gap:12px; padding:11px 20px; cursor:pointer; font-size:13.5px; font-weight:600; color:rgba(255,255,255,0.6); transition:all 0.18s; border-left:3px solid transparent; }
        .sb-nav-item:hover { background:rgba(255,255,255,0.06); color:white; }
        .sb-nav-item.active { background:rgba(37,99,235,0.18); color:white; border-left-color:#2563eb; }
        .sb-nav-item .nav-icon { font-size:16px; width:20px; text-align:center; }
        .sb-logout { padding:16px 20px; border-top:1px solid rgba(255,255,255,0.07); }
        .sb-logout-btn { width:100%; padding:10px; background:rgba(220,38,38,0.15); border:1px solid rgba(220,38,38,0.3); border-radius:8px; color:#fca5a5; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .sb-logout-btn:hover { background:rgba(220,38,38,0.3); color:white; }

        /* MAIN */
        .main-area { flex:1; display:flex; flex-direction:column; overflow:auto; }
        .topbar { background:white; padding:0 32px; display:flex; align-items:center; justify-content:space-between; height:64px; box-shadow:0 1px 4px rgba(0,0,0,0.06); position:sticky; top:0; z-index:50; flex-shrink:0; }
        .topbar-title { font-size:18px; font-weight:800; color:#1e2139; }
        .topbar-sub { font-size:12px; color:#6b7280; margin-top:1px; }
        .topbar-right { display:flex; gap:10px; align-items:center; }
        .page-content { padding:28px 32px; }

        /* FILTERS */
        .filters-bar { display:flex; align-items:center; gap:10px; margin-bottom:20px; flex-wrap:wrap; }
        .search-box { display:flex; align-items:center; gap:8px; background:white; border:1px solid #e5e7eb; border-radius:10px; padding:10px 16px; flex:1; min-width:220px; max-width:340px; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s; }
        .search-box:focus-within { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .search-box input { border:none; background:transparent; outline:none; font-size:14px; font-family:'Nunito',sans-serif; color:#1e2139; width:100%; }
        .search-box input::placeholder { color:#9ca3af; }
        .filter-tabs { display:flex; gap:7px; flex-wrap:wrap; }
        .ftab { padding:8px 14px; border-radius:20px; border:1.5px solid #e5e7eb; background:white; cursor:pointer; font-size:12px; font-weight:700; color:#6b7280; transition:all 0.18s; font-family:'Nunito',sans-serif; }
        .ftab:hover { border-color:#6366f1; color:#6366f1; transform:translateY(-1px); }
        .ftab.active { background:#6366f1; color:white; border-color:#6366f1; }
        .ftab-open { border-color:#16a34a; color:#16a34a; }
        .ftab-open.active { background:#16a34a; color:white; border-color:#16a34a; }
        .ftab-closed { border-color:#dc2626; color:#dc2626; }
        .ftab-closed.active { background:#dc2626; color:white; border-color:#dc2626; }

        .results-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
        .results-count { font-size:13px; color:#6b7280; font-weight:600; }

        /* GRID */
        .jobs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:20px; }

        /* ── JOB CARD ── */
        .job-card {
          background: white;
          border-radius: 18px;
          border: 1.5px solid #e8edf5;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.34,1.2,0.64,1);
          position: relative;
        }

        /* ✅ HOVER EFFECT — lift + glow */
        .job-card:hover {
          box-shadow: 0 16px 40px rgba(99,102,241,0.18);
          transform: translateY(-6px) scale(1.012);
          border-color: #a5b4fc;
        }

        /* Closing animation */
        .job-card.is-closing {
          animation: closeSlide 0.4s ease forwards;
        }
        @keyframes closeSlide {
          0%   { opacity:1; transform:translateY(0) scale(1); }
          40%  { opacity:0.6; transform:translateY(-8px) scale(1.02); }
          100% { opacity:0; transform:translateY(20px) scale(0.95); }
        }

        /* ✅ CLOSED CARD — dimmed with lock overlay mark */
        .job-card.is-closed {
          border-color: #fecaca;
          background: #fffafa;
        }
        .job-card.is-closed:hover {
          box-shadow: 0 12px 32px rgba(239,68,68,0.12);
          border-color: #fca5a5;
        }

        /* Closed overlay badge — top right corner */
        .closed-badge {
          position: absolute;
          top: 14px; right: 14px;
          background: #fee2e2;
          color: #dc2626;
          border: 1.5px solid #fca5a5;
          border-radius: 20px;
          padding: 4px 11px;
          font-size: 11px;
          font-weight: 800;
          display: flex; align-items: center; gap: 5px;
          z-index: 2;
          letter-spacing: 0.3px;
        }

        /* Diagonal watermark for closed */
        .closed-watermark {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(-20deg);
          font-size: 52px;
          opacity: 0.045;
          pointer-events: none;
          user-select: none;
          z-index: 1;
          filter: grayscale(1);
        }

        /* Card body */
        .jc-body { padding: 20px 20px 16px; position: relative; z-index: 2; }
        .jc-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:10px; }
        .jc-title { font-size:15.5px; font-weight:800; color:#1e2139; margin-bottom:3px; line-height:1.3; }
        .jc-company { font-size:12.5px; color:#6366f1; font-weight:700; }
        .type-badge { padding:4px 11px; border-radius:20px; font-size:11px; font-weight:700; white-space:nowrap; flex-shrink:0; margin-top:2px; }

        .jc-meta { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .jc-meta-item { font-size:12px; color:#6b7280; font-weight:500; display:flex; align-items:center; gap:3px; background:#f8faff; padding:3px 9px; border-radius:6px; border:1px solid #f0f4ff; }
        .is-closed .jc-meta-item { background:#fff5f5; border-color:#fee2e2; }

        .jc-desc { font-size:13px; color:#6b7280; line-height:1.65; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:4px; }

        /* ── OPTION 2: Two-row actions ── */
        .jc-actions {
          padding: 14px 18px 16px;
          border-top: 1px solid #f0f4ff;
          display: flex; flex-direction: column; gap: 8px;
          position: relative; z-index: 2;
          background: white;
        }
        .is-closed .jc-actions { background: #fffafa; border-top-color: #fee2e2; }

        /* Row 1 — primary actions */
        .jc-row1 { display:flex; gap:8px; }
        /* Row 2 — secondary actions */
        .jc-row2 { display:flex; gap:8px; }

        /* Button base */
        .jb { padding:9px 0; border-radius:10px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; transition:all 0.18s; border:none; display:flex; align-items:center; justify-content:center; gap:6px; }
        .jb:hover { transform:translateY(-2px); }
        .jb:active { transform:scale(0.97); }
        .jb:disabled { opacity:0.55; cursor:not-allowed; transform:none !important; }

        /* Primary row */
        .jb-view { flex:1; background:#eff6ff; color:#2563eb; }
        .jb-view:hover { background:#dbeafe; box-shadow:0 4px 12px rgba(37,99,235,0.15); }
        .jb-applicants { flex:1; background:#6366f1; color:white; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
        .jb-applicants:hover { background:#4f46e5; box-shadow:0 6px 16px rgba(99,102,241,0.4); }

        /* Secondary row */
        .jb-close  { flex:1; background:#fef3c7; color:#92400e; border:1.5px solid #fde68a !important; }
        .jb-close:hover  { background:#fde68a; box-shadow:0 4px 10px rgba(217,119,6,0.2); }
        .jb-reopen { flex:1; background:#dcfce7; color:#166534; border:1.5px solid #bbf7d0 !important; }
        .jb-reopen:hover { background:#bbf7d0; box-shadow:0 4px 10px rgba(22,163,74,0.2); }
        .jb-delete { flex:1; background:#fee2e2; color:#991b1b; border:1.5px solid #fecaca !important; }
        .jb-delete:hover { background:#fecaca; box-shadow:0 4px 10px rgba(220,38,38,0.2); }

        /* Candidate buttons */
        .jb-view-c { flex:1; background:#eff6ff; color:#2563eb; }
        .jb-view-c:hover { background:#dbeafe; }
        .jb-apply-c { flex:1; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; box-shadow:0 3px 10px rgba(99,102,241,0.3); }
        .jb-apply-c:hover { box-shadow:0 6px 16px rgba(99,102,241,0.45); }
        .jb-applied-c { flex:1; background:#f3f4f6; color:#9ca3af; cursor:not-allowed; }

        /* Status info row */
        .jc-status-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 18px 12px;
          position: relative; z-index: 2;
        }
        .status-indicator { display:flex; align-items:center; gap:6px; }
        .status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .status-label { font-size:12px; font-weight:700; }
        .posted-by { font-size:11.5px; color:#9ca3af; font-weight:500; }

        /* EMPTY / LOADING */
        .empty-state { text-align:center; padding:60px 20px; grid-column:1/-1; }
        .empty-icon  { font-size:56px; margin-bottom:14px; }
        .empty-title { font-size:18px; font-weight:700; color:#6b7280; margin-bottom:6px; }
        .empty-sub   { font-size:14px; color:#9ca3af; }
        .spinner-wrap { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px; grid-column:1/-1; color:#9ca3af; }
        .spinner { width:36px; height:36px; border:4px solid #e5e7eb; border-top-color:#6366f1; border-radius:50%; animation:spin 0.8s linear infinite; margin-bottom:12px; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* TOAST */
        .toast { position:fixed; bottom:28px; right:28px; z-index:9999; padding:14px 20px; border-radius:12px; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; display:flex; align-items:center; gap:10px; max-width:340px; animation:slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1); }
        .toast-success { background:#1e2139; color:white; box-shadow:0 8px 24px rgba(0,0,0,0.2); }
        .toast-error   { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)} }

        @media(max-width:700px) {
          .sidebar { display:none; }
          .page-content { padding:16px; }
          .jobs-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="jl-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-brand">
            <div className="sb-brand-icon">🎯</div>
            <div className="sb-brand-text">RECRUIT<span>-IQ</span></div>
          </div>
          {user && (
            <div className="sb-profile">
              <div className="sb-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
              <div className="sb-name">{user.full_name}</div>
              <div className="sb-role">{isHR ? 'HR / Recruiter' : 'Candidate'}</div>
            </div>
          )}
          <nav className="sb-nav">
            <div className="sb-nav-label">Main Menu</div>
            <div className="sb-nav-item" onClick={() => navigate('/dashboard')}><span className="nav-icon">⊞</span> Dashboard</div>
            <div className="sb-nav-item active" onClick={() => navigate('/jobs')}><span className="nav-icon">💼</span> {isHR ? 'All Jobs' : 'Browse Jobs'}</div>
            {isHR && (<>
              <div className="sb-nav-item" onClick={() => navigate('/create-job')}><span className="nav-icon">➕</span> Post New Job</div>
              <div className="sb-nav-item" onClick={() => navigate('/hr/kanban')}><span className="nav-icon">🗂️</span> Pipeline</div>
            </>)}
            {!isHR && <div className="sb-nav-item" onClick={() => navigate('/my-applications')}><span className="nav-icon">📋</span> My Applications</div>}
          </nav>
          <div className="sb-logout">
            <button className="sb-logout-btn" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}>🚪 Log Out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">{isHR ? 'Job Listings' : 'Available Positions'}</div>
              <div className="topbar-sub">
                {isHR
                  ? `${jobs.length} total · ${jobs.filter(j=>j.status==='open').length} open · ${jobs.filter(j=>j.status!=='open').length} closed`
                  : `${jobs.length} jobs available`}
              </div>
            </div>
            <div className="topbar-right">
              {isHR && (
                <button onClick={() => navigate('/create-job')}
                  style={{padding:'9px 20px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',border:'none',borderRadius:'9px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif',boxShadow:'0 4px 12px rgba(99,102,241,0.35)',transition:'all 0.2s'}}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 20px rgba(99,102,241,0.45)';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 12px rgba(99,102,241,0.35)';}}
                >➕ Post New Job</button>
              )}
              {!isHR && (
                <button onClick={() => navigate('/my-applications')}
                  style={{padding:'9px 20px',background:'#f5f3ff',color:'#7c3aed',border:'1px solid #ddd6fe',borderRadius:'9px',cursor:'pointer',fontSize:'13px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}}>
                  📋 My Applications
                </button>
              )}
            </div>
          </div>

          <div className="page-content">
            {/* FILTERS */}
            <div className="filters-bar">
              <div className="search-box">
                <span style={{color:'#9ca3af'}}>🔍</span>
                <input placeholder="Search by title, company, location..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="filter-tabs">
                {['all','full_time','part_time','contract','internship'].map(t => (
                  <button key={t} className={`ftab ${filterType===t?'active':''}`} onClick={() => setFilter(t)}>
                    {t==='all' ? 'All Types' : typeMap[t]?.label || t}
                  </button>
                ))}
              </div>
              {isHR && (
                <div className="filter-tabs">
                  <button className={`ftab ${filterStatus==='all'?'active':''}`} onClick={() => setFilterStatus('all')}>All</button>
                  <button className={`ftab ftab-open ${filterStatus==='open'?'active':''}`} onClick={() => setFilterStatus('open')}>🟢 Open</button>
                  <button className={`ftab ftab-closed ${filterStatus==='closed'?'active':''}`} onClick={() => setFilterStatus('closed')}>🔴 Closed</button>
                </div>
              )}
            </div>

            <div className="results-bar">
              <span className="results-count">{filtered.length} result{filtered.length!==1?'s':''}</span>
            </div>

            {/* GRID */}
            <div className="jobs-grid">
              {loading ? (
                <div className="spinner-wrap"><div className="spinner"/><span>Loading jobs...</span></div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-title">No jobs found</div>
                  <div className="empty-sub">Try adjusting your search or filters</div>
                </div>
              ) : (
                filtered.map(job => {
                  const tb       = typeMap[job.job_type] || {label:job.job_type,color:'#6b7280',bg:'#f3f4f6'};
                  const isClosed = job.status !== 'open';
                  const isToggling = toggling === job.id;
                  const isClosing  = closingId === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`job-card ${isClosed ? 'is-closed' : ''} ${isClosing ? 'is-closing' : ''}`}
                    >
                      {/* ✅ Closed badge — top right corner (no stripe) */}
                      {isClosed && (
                        <div className="closed-badge">
                          🔒 Closed
                        </div>
                      )}

                      {/* ✅ Faint watermark for closed */}
                      {isClosed && (
                        <div className="closed-watermark">🔒</div>
                      )}

                      {/* CARD BODY */}
                      <div className="jc-body">
                        <div className="jc-top">
                          <div style={{flex:1,minWidth:0,paddingRight: isClosed ? '80px' : '0'}}>
                            <div className="jc-title">{job.title}</div>
                            <div className="jc-company">🏢 {job.company}</div>
                          </div>
                          {!isClosed && (
                            <span className="type-badge" style={{background:tb.bg,color:tb.color}}>{tb.label}</span>
                          )}
                        </div>

                        {isClosed && (
                          <div style={{marginBottom:'8px'}}>
                            <span className="type-badge" style={{background:tb.bg,color:tb.color}}>{tb.label}</span>
                          </div>
                        )}

                        <div className="jc-meta">
                          <span className="jc-meta-item">📍 {job.location}</span>
                          <span className="jc-meta-item">🎓 {job.experience_required}</span>
                          {job.salary_range && <span className="jc-meta-item">💰 {job.salary_range}</span>}
                        </div>

                        <p className="jc-desc" style={{color: isClosed ? '#9ca3af' : '#6b7280'}}>{job.description}</p>
                      </div>

                      {/* Status info row */}
                      <div className="jc-status-row">
                        <div className="status-indicator">
                          <div className="status-dot" style={{background: isClosed ? '#ef4444' : '#22c55e'}} />
                          <span className="status-label" style={{color: isClosed ? '#ef4444' : '#16a34a'}}>
                            {isClosed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                        <span className="posted-by">by {job.recruiter_name}</span>
                      </div>

                      {/* ── OPTION 2: Two-row actions ── */}
                      {isHR ? (
                        <div className="jc-actions">
                          {/* Row 1 — primary */}
                          <div className="jc-row1">
                            <button className="jb jb-view" onClick={() => navigate(`/jobs/${job.id}`)}>
                              👁 View Details
                            </button>
                            <button className="jb jb-applicants" onClick={() => navigate(`/hr/applications/${job.id}`)}>
                              👥 Applicants
                            </button>
                          </div>
                          {/* Row 2 — secondary */}
                          <div className="jc-row2">
                            <button
                              className={`jb ${isClosed ? 'jb-reopen' : 'jb-close'}`}
                              onClick={() => handleToggleStatus(job)}
                              disabled={isToggling}
                            >
                              {isToggling ? '⏳ Updating...' : isClosed ? '🟢 Reopen Job' : '🔴 Close Job'}
                            </button>
                            <button className="jb jb-delete" onClick={() => setDeleteModal(job)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="jc-actions">
                          <div className="jc-row1">
                            <button className="jb jb-view-c" onClick={() => navigate(`/jobs/${job.id}`)}>👁 View Details</button>
                            {job.already_applied
                              ? <button className="jb jb-applied-c">✓ Applied</button>
                              : <button className="jb jb-apply-c" onClick={() => !isClosed && setSelectedJob(job)} disabled={isClosed}>
                                  {isClosed ? '🔒 Closed' : '🚀 Apply Now'}
                                </button>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {deleteModal && (
        <DeleteModal job={deleteModal} onConfirm={handleDeleteConfirm} onCancel={() => !deleting && setDeleteModal(null)} deleting={deleting} />
      )}
      {selectedJob && <ApplyJob job={selectedJob} onClose={() => setSelectedJob(null)} onSuccess={handleApplySuccess} />}
      {atsResult && (
        <ATSScore
          score={atsResult.ats_score} feedback={atsResult.ats_feedback}
          matchedSkills={atsResult.matched_skills} missingSkills={atsResult.missing_skills}
          recommendations={atsResult.recommendations}
          onClose={() => navigate('/my-applications')}
        />
      )}
      {toast && (
        <div className={`toast ${toast.type==='error'?'toast-error':'toast-success'}`}>
          <span>{toast.type==='error'?'❌':'✅'}</span>{toast.msg}
        </div>
      )}
    </>
  );
}

export default JobList;