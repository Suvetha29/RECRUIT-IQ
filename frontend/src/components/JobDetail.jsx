import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import ApplyJob from './candidate/ApplyJob';
import ATSScore from './applications/ATSScore';

function JobDetail() {
  const params = useParams();
  const id = params.id || params.jobId;
  const navigate = useNavigate();
  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [user, setUser]             = useState(null);
  const [showApply, setShowApply]   = useState(false);
  const [atsResult, setAtsResult]   = useState(null);
  const [applied, setApplied]       = useState(false);
  const [visible, setVisible]       = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchJob();
  }, [id]);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisible(true), 50);
  }, [loading]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError('');
      // ✅ Use jobAPI.getJobDetail which calls /api/jobs/${jobId}
      const res = await jobAPI.getJobDetail(id);
      setJob(res.data);
      setApplied(res.data.already_applied || false);
    } catch (e) {
      console.error('JobDetail fetch error:', e);
      setError(e.response?.data?.detail || 'Failed to load job details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuccess = (result) => {
    setShowApply(false);
    setApplied(true);
    setAtsResult(result);
  };

  const isHR = user?.role === 'hr';

  const typeMap = {
    full_time:  { label: 'Full Time',  color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
    part_time:  { label: 'Part Time',  color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
    contract:   { label: 'Contract',   color: '#0891b2', bg: '#e0f2fe', border: '#bae6fd' },
    internship: { label: 'Internship', color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe' },
  };

  const avatarColor = (name = '') => {
    const colors = ['#2563eb','#0D9488','#d97706','#7c3aed','#dc2626','#0891b2','#16a34a','#db2777'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(160deg,#f0f4ff,#faf5ff)', fontFamily:'Nunito,sans-serif', gap:'14px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:'48px', height:'48px', border:'4px solid #e8eaf6', borderTop:'4px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#6366f1', fontWeight:700, fontSize:'14px' }}>Loading job details...</p>
    </div>
  );

  // ── Error / Not Found ────────────────────────────────────
  if (error || !job) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Nunito,sans-serif', gap:'14px', background:'linear-gradient(160deg,#f0f4ff,#faf5ff)', padding:'20px' }}>
      <div style={{ fontSize:'64px' }}>😕</div>
      <div style={{ fontSize:'22px', fontWeight:900, color:'#1e1b4b' }}>Job not found</div>
      <div style={{ fontSize:'14px', color:'#94a3b8', maxWidth:'320px', textAlign:'center', lineHeight:1.6 }}>
        {error || `The job with ID "${id}" could not be found. It may have been removed or the link is incorrect.`}
      </div>
      <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
        <button onClick={() => navigate(-1)} style={{ padding:'10px 20px', background:'white', color:'#6366f1', border:'2px solid #6366f1', borderRadius:'10px', cursor:'pointer', fontWeight:700, fontFamily:'Nunito,sans-serif', fontSize:'14px' }}>
          ← Go Back
        </button>
        <button onClick={() => navigate('/jobs')} style={{ padding:'10px 24px', background:'#6366f1', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:700, fontFamily:'Nunito,sans-serif', fontSize:'14px' }}>
          Browse All Jobs
        </button>
      </div>
    </div>
  );

  const tb             = typeMap[job.job_type] || { label: job.job_type, color:'#6b7280', bg:'#f3f4f6', border:'#e5e7eb' };
  const companyColor   = avatarColor(job.company);
  const companyInitials = getInitials(job.company);

  // Parse bullet lists
  const responsibilities = job.responsibilities
    ? job.responsibilities.split(/\n|•/).map(s => s.trim()).filter(s => s.length > 2)
    : [];
  const requirements = job.requirements
    ? job.requirements.split(/\n|•/).map(s => s.trim()).filter(s => s.length > 2)
    : [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }

        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes slideIn  { from { opacity:0; transform:translateX(-12px); } to { opacity:1; transform:translateX(0); } }
        @keyframes blobdrift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(30px,20px) scale(1.04); }
          66%     { transform: translate(-15px,35px) scale(0.97); }
        }

        .jd-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%);
          font-family: 'Nunito', sans-serif;
        }
        .blob1, .blob2 { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
        .blob1 { width:500px; height:500px; top:-150px; left:-150px; background:radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%); animation:blobdrift 14s ease-in-out infinite; }
        .blob2 { width:400px; height:400px; bottom:-100px; right:-100px; background:radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%); animation:blobdrift 18s ease-in-out infinite reverse; }

        /* TOPBAR */
        .jd-topbar {
          background: rgba(255,255,255,0.9); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(99,102,241,0.1);
          padding: 0 40px; height: 66px;
          display: flex; align-items: center; justify-content: space-between;
          position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 20px rgba(99,102,241,0.07);
        }
        .jd-topbar-left { display: flex; align-items: center; gap: 16px; }
        .jd-back { display:flex; align-items:center; gap:6px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:10px; padding:8px 16px; cursor:pointer; font-size:13px; font-weight:700; color:#64748b; font-family:'Nunito',sans-serif; transition:all 0.2s; }
        .jd-back:hover { background:#6366f1; color:white; border-color:#6366f1; transform:translateX(-2px); }
        .jd-breadcrumb { font-size:13px; color:#94a3b8; font-weight:600; }
        .jd-breadcrumb span { color:#6366f1; font-weight:700; }

        /* CONTENT */
        .jd-content { max-width: 1020px; margin: 0 auto; padding: 32px 28px 60px; position: relative; z-index: 1; }

        /* HERO */
        .jd-hero { background:white; border-radius:22px; border:1px solid rgba(99,102,241,0.1); box-shadow:0 8px 32px rgba(99,102,241,0.08); overflow:hidden; margin-bottom:22px; opacity:0; transform:translateY(20px); transition:opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.2,0.64,1); }
        .jd-hero.visible { opacity:1; transform:translateY(0); }
        .jd-hero-banner { height:6px; background:linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4); }
        .jd-hero-body { padding:28px 32px 26px; }
        .jd-hero-top { display:flex; align-items:flex-start; gap:20px; margin-bottom:22px; }
        .jd-company-logo { width:66px; height:66px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:900; color:white; flex-shrink:0; box-shadow:0 6px 20px rgba(0,0,0,0.15); }
        .jd-title-block { flex:1; }
        .jd-job-title { font-size:26px; font-weight:900; color:#1e1b4b; letter-spacing:-0.4px; margin-bottom:6px; line-height:1.2; }
        .jd-company-name { font-size:15px; font-weight:700; color:#6366f1; margin-bottom:10px; }
        .jd-badges { display:flex; flex-wrap:wrap; gap:8px; }
        .jd-badge { padding:5px 13px; border-radius:20px; font-size:12px; font-weight:700; border:1px solid; display:inline-flex; align-items:center; gap:4px; }

        .jd-meta-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(155px,1fr)); gap:12px; margin-bottom:22px; padding-bottom:22px; border-bottom:1px dashed rgba(99,102,241,0.15); }
        .jd-meta-item { display:flex; align-items:center; gap:10px; background:#fafbff; border:1px solid #f0f4ff; border-radius:12px; padding:12px 14px; transition:all 0.2s; }
        .jd-meta-item:hover { background:#f0f4ff; border-color:#c7d2fe; transform:translateY(-2px); box-shadow:0 4px 10px rgba(99,102,241,0.08); }
        .jd-meta-icon { font-size:20px; }
        .jd-meta-label { font-size:10px; color:#94a3b8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
        .jd-meta-val { font-size:13.5px; color:#1e1b4b; font-weight:800; }

        .jd-cta-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .jd-btn-apply { padding:13px 32px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; border:none; border-radius:12px; cursor:pointer; font-size:14.5px; font-weight:800; font-family:'Nunito',sans-serif; box-shadow:0 6px 20px rgba(99,102,241,0.4); transition:all 0.25s; display:flex; align-items:center; gap:8px; }
        .jd-btn-apply:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(99,102,241,0.5); background:linear-gradient(135deg,#4f46e5,#7c3aed); }
        .jd-btn-apply.applied { background:linear-gradient(135deg,#22c55e,#16a34a); box-shadow:0 6px 20px rgba(34,197,94,0.35); cursor:default; }
        .jd-btn-apply:disabled { opacity:0.7; cursor:not-allowed; }
        .jd-btn-teal { padding:13px 24px; background:#f0fdfa; color:#0D9488; border:1.5px solid #99f6e4; border-radius:12px; cursor:pointer; font-size:14px; font-weight:800; font-family:'Nunito',sans-serif; transition:all 0.2s; }
        .jd-btn-teal:hover { background:#ccfbf1; transform:translateY(-2px); }
        .jd-btn-purple { padding:13px 24px; background:#fdf4ff; color:#7c3aed; border:1.5px solid #e9d5ff; border-radius:12px; cursor:pointer; font-size:14px; font-weight:800; font-family:'Nunito',sans-serif; transition:all 0.2s; }
        .jd-btn-purple:hover { background:#f3e8ff; transform:translateY(-2px); }

        /* TWO COL */
        .jd-two-col { display:grid; grid-template-columns:1fr 340px; gap:20px; align-items:start; }

        /* SECTIONS */
        .jd-section { background:white; border-radius:18px; border:1px solid rgba(99,102,241,0.09); box-shadow:0 4px 16px rgba(99,102,241,0.06); padding:26px 30px; margin-bottom:18px; opacity:0; transform:translateY(16px); transition:opacity 0.5s ease, transform 0.5s ease; }
        .jd-section.visible { opacity:1; transform:translateY(0); }
        .jd-section:hover { box-shadow:0 8px 28px rgba(99,102,241,0.1); }
        .jd-sec-title { font-size:13.5px; font-weight:900; color:#1e1b4b; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:18px; display:flex; align-items:center; gap:10px; padding-bottom:12px; border-bottom:2px solid #f0f4ff; }
        .jd-sec-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .jd-description { font-size:14.5px; color:#475569; line-height:1.85; white-space:pre-wrap; }

        /* BULLET LIST */
        .jd-bullet-list { list-style:none; display:flex; flex-direction:column; gap:10px; }
        .jd-bullet-item { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; background:#fafbff; border-radius:10px; border:1px solid #f0f4ff; font-size:14px; color:#374151; line-height:1.6; transition:all 0.2s; animation:slideIn 0.4s ease both; }
        .jd-bullet-item:hover { background:#f0f4ff; border-color:#c7d2fe; transform:translateX(4px); }
        .jd-bullet-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; margin-top:7px; }

        /* STICKY APPLY CARD */
        .jd-apply-card { border-radius:18px; overflow:hidden; position:sticky; top:86px; box-shadow:0 12px 40px rgba(99,102,241,0.3); }
        .jd-apply-card-inner { background:linear-gradient(160deg,#6366f1,#8b5cf6); padding:28px 24px; text-align:center; }
        .jd-card-btn { width:100%; padding:14px; background:white; color:#6366f1; border:none; border-radius:12px; cursor:pointer; font-size:15px; font-weight:900; font-family:'Nunito',sans-serif; box-shadow:0 4px 14px rgba(0,0,0,0.1); transition:all 0.2s; margin-bottom:10px; }
        .jd-card-btn:hover { transform:scale(1.02); box-shadow:0 6px 20px rgba(0,0,0,0.16); }
        .jd-card-btn.applied-btn { background:#dcfce7; color:#16a34a; cursor:default; }
        .jd-card-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .jd-card-ghost { width:100%; padding:11px; background:rgba(255,255,255,0.15); color:white; border:1px solid rgba(255,255,255,0.3); border-radius:10px; cursor:pointer; font-size:13px; font-weight:700; font-family:'Nunito',sans-serif; transition:all 0.2s; }
        .jd-card-ghost:hover { background:rgba(255,255,255,0.25); }
        .jd-card-divider { height:1px; background:rgba(255,255,255,0.18); margin:18px 0; }
        .jd-quick-info { text-align:left; display:flex; flex-direction:column; gap:10px; }
        .jd-qi-row { display:flex; align-items:center; gap:8px; }
        .jd-qi-lbl { color:rgba(255,255,255,0.65); font-size:12px; font-weight:600; }
        .jd-qi-val { color:white; font-size:12.5px; font-weight:800; margin-left:auto; }

        @media (max-width: 860px) {
          .jd-two-col { grid-template-columns:1fr; }
          .jd-apply-card { position:static; }
          .jd-topbar { padding:0 16px; }
          .jd-content { padding:20px 16px 40px; }
          .jd-hero-body { padding:20px; }
          .jd-job-title { font-size:20px; }
        }
      `}</style>

      <div className="jd-root">
        <div className="blob1" />
        <div className="blob2" />

        {/* TOPBAR */}
        <div className="jd-topbar">
          <div className="jd-topbar-left">
            <button className="jd-back" onClick={() => navigate('/jobs')}>← Jobs</button>
            <div className="jd-breadcrumb">Browse Jobs › <span>{job.title}</span></div>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => navigate('/dashboard')}
              style={{ padding:'8px 16px', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:700, fontFamily:'Nunito,sans-serif', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background='#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background='#f1f5f9'}
            >⊞ Dashboard</button>
            {!isHR && (
              <button onClick={() => navigate('/my-applications')}
                style={{ padding:'8px 16px', background:'#f5f3ff', color:'#7c3aed', border:'1px solid #ddd6fe', borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight:700, fontFamily:'Nunito,sans-serif' }}>
                📋 My Applications
              </button>
            )}
          </div>
        </div>

        <div className="jd-content">

          {/* ── HERO ── */}
          <div className={`jd-hero ${visible ? 'visible' : ''}`}>
            <div className="jd-hero-banner" />
            <div className="jd-hero-body">
              <div className="jd-hero-top">
                <div className="jd-company-logo" style={{ background: companyColor }}>{companyInitials}</div>
                <div className="jd-title-block">
                  <div className="jd-job-title">{job.title}</div>
                  <div className="jd-company-name">🏢 {job.company}</div>
                  <div className="jd-badges">
                    <span className="jd-badge" style={{ background:tb.bg, color:tb.color, borderColor:tb.border }}>💼 {tb.label}</span>
                    <span className="jd-badge" style={{ background:job.status==='open'?'#dcfce7':'#fee2e2', color:job.status==='open'?'#16a34a':'#dc2626', borderColor:job.status==='open'?'#bbf7d0':'#fecaca' }}>
                      {job.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                    </span>
                    {applied && <span className="jd-badge" style={{ background:'#f0fdf4', color:'#16a34a', borderColor:'#bbf7d0' }}>✅ Applied</span>}
                  </div>
                </div>
              </div>

              {/* Meta chips */}
              <div className="jd-meta-row">
                <div className="jd-meta-item">
                  <span className="jd-meta-icon">📍</span>
                  <div><div className="jd-meta-label">Location</div><div className="jd-meta-val">{job.location}</div></div>
                </div>
                <div className="jd-meta-item">
                  <span className="jd-meta-icon">🎓</span>
                  <div><div className="jd-meta-label">Experience</div><div className="jd-meta-val">{job.experience_required}</div></div>
                </div>
                {job.salary_range && (
                  <div className="jd-meta-item">
                    <span className="jd-meta-icon">💰</span>
                    <div><div className="jd-meta-label">Salary</div><div className="jd-meta-val">{job.salary_range}</div></div>
                  </div>
                )}
                <div className="jd-meta-item">
                  <span className="jd-meta-icon">👤</span>
                  <div><div className="jd-meta-label">Posted By</div><div className="jd-meta-val">{job.recruiter_name}</div></div>
                </div>
              </div>

              {/* CTA */}
              <div className="jd-cta-row">
                {!isHR && (
                  <button
                    className={`jd-btn-apply ${applied ? 'applied' : ''}`}
                    onClick={() => !applied && setShowApply(true)}
                    disabled={applied || job.status !== 'open'}
                  >
                    {applied ? '✅ Application Submitted' : '🚀 Apply Now'}
                  </button>
                )}
                {isHR && <>
                  <button className="jd-btn-teal" onClick={() => navigate(`/hr/applications/${job.id}`)}>👥 View Applicants</button>
                  <button className="jd-btn-purple" onClick={() => navigate(`/hr/assessment/${job.id}`)}>📝 Create Assessment</button>
                </>}
              </div>
            </div>
          </div>

          {/* ── TWO COL ── */}
          <div className="jd-two-col">

            {/* LEFT */}
            <div>
              {job.description && (
                <div className={`jd-section ${visible ? 'visible' : ''}`} style={{ transitionDelay:'0.1s' }}>
                  <div className="jd-sec-title">
                    <div className="jd-sec-icon" style={{ background:'#eff6ff' }}>📄</div>
                    Job Description
                  </div>
                  <p className="jd-description">{job.description}</p>
                </div>
              )}

              {responsibilities.length > 0 && (
                <div className={`jd-section ${visible ? 'visible' : ''}`} style={{ transitionDelay:'0.17s' }}>
                  <div className="jd-sec-title">
                    <div className="jd-sec-icon" style={{ background:'#f0fdf4' }}>🎯</div>
                    Responsibilities
                  </div>
                  <ul className="jd-bullet-list">
                    {responsibilities.map((r, i) => (
                      <li key={i} className="jd-bullet-item" style={{ animationDelay:`${i * 0.04}s` }}>
                        <div className="jd-bullet-dot" style={{ background:'#22c55e' }} />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {requirements.length > 0 && (
                <div className={`jd-section ${visible ? 'visible' : ''}`} style={{ transitionDelay:'0.24s' }}>
                  <div className="jd-sec-title">
                    <div className="jd-sec-icon" style={{ background:'#fdf4ff' }}>⭐</div>
                    Requirements
                  </div>
                  <ul className="jd-bullet-list">
                    {requirements.map((r, i) => (
                      <li key={i} className="jd-bullet-item" style={{ animationDelay:`${i * 0.04}s` }}>
                        <div className="jd-bullet-dot" style={{ background:'#8b5cf6' }} />{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fallback: show raw requirements if not parsed into bullets */}
              {responsibilities.length === 0 && requirements.length === 0 && job.requirements && (
                <div className={`jd-section ${visible ? 'visible' : ''}`} style={{ transitionDelay:'0.17s' }}>
                  <div className="jd-sec-title">
                    <div className="jd-sec-icon" style={{ background:'#fdf4ff' }}>⭐</div>
                    Requirements
                  </div>
                  <p className="jd-description">{job.requirements}</p>
                </div>
              )}
            </div>

            {/* RIGHT — sticky apply card */}
            <div>
              <div className={`jd-section jd-apply-card ${visible ? 'visible' : ''}`} style={{ transitionDelay:'0.12s', padding:0, border:'none', background:'none', boxShadow:'none', marginBottom:0 }}>
                <div className="jd-apply-card-inner">
                  <div style={{ fontSize:'42px', marginBottom:'10px' }}>{applied ? '🎉' : '🚀'}</div>
                  <h3 style={{ color:'white', fontSize:'18px', fontWeight:900, marginBottom:'8px' }}>
                    {applied ? 'You Applied!' : 'Ready to Apply?'}
                  </h3>
                  <p style={{ color:'rgba(255,255,255,0.8)', fontSize:'13px', marginBottom:'20px', lineHeight:1.6 }}>
                    {applied
                      ? 'Your application is under review. Track it in My Applications.'
                      : 'AI instantly scores your resume against job requirements.'}
                  </p>

                  {!isHR && (
                    <button
                      className={`jd-card-btn ${applied ? 'applied-btn' : ''}`}
                      onClick={() => !applied && setShowApply(true)}
                      disabled={applied || job.status !== 'open'}
                    >
                      {applied ? '✅ Applied' : '🚀 Apply Now'}
                    </button>
                  )}
                  {!isHR && applied && (
                    <button className="jd-card-ghost" onClick={() => navigate('/my-applications')}>
                      📋 Track Application
                    </button>
                  )}
                  {isHR && (
                    <button className="jd-card-btn" onClick={() => navigate(`/hr/applications/${job.id}`)}>
                      👥 View Applicants
                    </button>
                  )}

                  <div className="jd-card-divider" />

                  {/* AI features */}
                  <div style={{ display:'flex', justifyContent:'space-around', marginBottom:'18px' }}>
                    {[['🤖','AI Scored'],['⚡','Instant'],['🔒','Secure']].map(([ic, lb]) => (
                      <div key={lb} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'20px' }}>{ic}</div>
                        <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.7)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginTop:'3px' }}>{lb}</div>
                      </div>
                    ))}
                  </div>

                  <div className="jd-card-divider" />

                  {/* Quick info */}
                  <div className="jd-quick-info">
                    {[
                      { icon:'💼', label:'Type',       val: tb.label },
                      { icon:'📍', label:'Location',   val: job.location },
                      { icon:'🎓', label:'Experience', val: job.experience_required },
                      ...(job.salary_range ? [{ icon:'💰', label:'Salary', val: job.salary_range }] : []),
                    ].map((item, i) => (
                      <div key={i} className="jd-qi-row">
                        <span style={{ fontSize:'14px' }}>{item.icon}</span>
                        <span className="jd-qi-lbl">{item.label}:</span>
                        <span className="jd-qi-val">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {showApply && (
        <ApplyJob job={job} onClose={() => setShowApply(false)} onSuccess={handleApplySuccess} />
      )}
      {atsResult && (
        <ATSScore
          score={atsResult.ats_score}
          feedback={atsResult.ats_feedback}
          matchedSkills={atsResult.matched_skills}
          missingSkills={atsResult.missing_skills}
          recommendations={atsResult.recommendations}
          onClose={() => navigate('/my-applications')}
        />
      )}
    </>
  );
}

export default JobDetail;