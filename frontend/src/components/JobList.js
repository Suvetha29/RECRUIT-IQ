import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../services/api';
import ApplyJob from './candidate/ApplyJob';
import ATSScore from './applications/ATSScore';

function JobList() {
  const navigate = useNavigate();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [user, setUser]         = useState(null);
  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [atsResult, setAtsResult]     = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await jobAPI.getAllJobs();
      setJobs(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleApplySuccess = (result) => {
    setSelectedJob(null);
    setAtsResult(result);
    fetchJobs();
  };

  const isHR = user?.role === 'hr';

  const typeMap = {
    full_time:  { label: 'Full Time',   color: '#16a34a', bg: '#dcfce7' },
    part_time:  { label: 'Part Time',   color: '#d97706', bg: '#fef3c7' },
    contract:   { label: 'Contract',    color: '#0891b2', bg: '#e0f2fe' },
    internship: { label: 'Internship',  color: '#7c3aed', bg: '#ede9fe' },
  };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q);
    const matchType = filterType === 'all' || j.job_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

        .jl-root {
          display: flex; min-height: 100vh;
          font-family: 'Nunito', sans-serif;
          background: #f0f4f8;
        }

        /* SIDEBAR */
        .sidebar {
          width: 230px; flex-shrink: 0;
          background: #1e2139;
          display: flex; flex-direction: column;
          min-height: 100vh; position: sticky; top: 0;
        }
        .sb-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .sb-brand-icon {
          width: 36px; height: 36px; background: #2563eb;
          border-radius: 9px; display: flex; align-items: center;
          justify-content: center; font-size: 18px;
        }
        .sb-brand-text { font-size: 16px; font-weight: 800; color: white; }
        .sb-brand-text span { color: #60a5fa; }
        .sb-profile {
          display: flex; flex-direction: column; align-items: center;
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .sb-avatar {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 800; color: white; margin-bottom: 10px;
          border: 3px solid rgba(255,255,255,0.15);
        }
        .sb-name { font-size: 14px; font-weight: 700; color: white; text-align: center; }
        .sb-role { font-size: 11px; color: #60a5fa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }
        .sb-nav { flex: 1; padding: 16px 0; }
        .sb-nav-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; padding: 10px 20px 6px; }
        .sb-nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 20px; cursor: pointer;
          font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.6);
          transition: all 0.18s; border-left: 3px solid transparent;
        }
        .sb-nav-item:hover { background: rgba(255,255,255,0.06); color: white; }
        .sb-nav-item.active { background: rgba(37,99,235,0.18); color: white; border-left-color: #2563eb; }
        .sb-nav-item .nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .sb-logout { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.07); }
        .sb-logout-btn {
          width: 100%; padding: 10px;
          background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3);
          border-radius: 8px; color: #fca5a5;
          font-size: 13px; font-weight: 700; font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sb-logout-btn:hover { background: rgba(220,38,38,0.3); color: white; }

        /* MAIN */
        .main-area { flex: 1; display: flex; flex-direction: column; overflow: auto; }

        /* TOPBAR */
        .topbar {
          background: white; padding: 0 32px;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          position: sticky; top: 0; z-index: 50; flex-shrink: 0;
        }
        .topbar-title { font-size: 18px; font-weight: 800; color: #1e2139; }
        .topbar-sub { font-size: 12px; color: #6b7280; }
        .topbar-right { display: flex; gap: 10px; align-items: center; }

        .page-content { padding: 28px 32px; }

        /* FILTERS BAR */
        .filters-bar {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 24px; flex-wrap: wrap;
        }
        .search-box {
          display: flex; align-items: center; gap: 8px;
          background: white; border: 1px solid #e5e7eb;
          border-radius: 10px; padding: 10px 16px;
          flex: 1; min-width: 220px; max-width: 360px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .search-box input {
          border: none; background: transparent; outline: none;
          font-size: 14px; font-family: 'Nunito', sans-serif;
          color: #1e2139; width: 100%;
        }
        .search-box input::placeholder { color: #9ca3af; }

        .filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .filter-tab {
          padding: 8px 16px; border-radius: 20px; border: 1.5px solid #e5e7eb;
          background: white; cursor: pointer; font-size: 12.5px; font-weight: 700;
          color: #6b7280; transition: all 0.15s; font-family: 'Nunito', sans-serif;
        }
        .filter-tab:hover { border-color: #2563eb; color: #2563eb; }
        .filter-tab.active { background: #2563eb; color: white; border-color: #2563eb; }

        /* JOBS GRID */
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 20px;
        }

        .job-card {
          background: white; border-radius: 14px;
          padding: 22px; border: 2px solid transparent;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: all 0.2s; cursor: default;
        }
        .job-card:hover {
          border-color: #2563eb;
          box-shadow: 0 4px 20px rgba(37,99,235,0.1);
          transform: translateY(-2px);
        }

        .jc-top {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 14px;
        }
        .jc-title { font-size: 16px; font-weight: 800; color: #1e2139; flex: 1; margin-right: 10px; }
        .type-badge {
          padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
        }

        .jc-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
        .jc-meta-item {
          font-size: 13px; color: #6b7280; font-weight: 500;
          display: flex; align-items: center; gap: 4px;
        }

        .jc-desc {
          font-size: 13px; color: #6b7280; line-height: 1.6;
          margin-bottom: 16px;
          display: -webkit-box; -webkit-line-clamp: 3;
          -webkit-box-orient: vertical; overflow: hidden;
        }

        .jc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 14px; border-top: 1px solid #f3f4f6;
        }
        .jc-posted { font-size: 12px; color: #9ca3af; }

        .btn-view {
          padding: 7px 14px; background: #eff6ff; color: #2563eb;
          border: none; border-radius: 7px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'Nunito', sans-serif;
          transition: background 0.15s;
        }
        .btn-view:hover { background: #dbeafe; }
        .btn-apply {
          padding: 7px 14px; background: #f0fdf4; color: #16a34a;
          border: none; border-radius: 7px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'Nunito', sans-serif;
        }
        .btn-apply.applied { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .btn-applicants {
          padding: 7px 14px; background: #f0fdfa; color: #0D9488;
          border: none; border-radius: 7px; cursor: pointer;
          font-size: 12px; font-weight: 700; font-family: 'Nunito', sans-serif;
        }

        .btn-actions { display: flex; gap: 8px; }

        .empty-state {
          text-align: center; padding: 60px 20px;
          grid-column: 1 / -1;
        }
        .empty-icon { font-size: 52px; margin-bottom: 14px; }
        .empty-title { font-size: 18px; font-weight: 700; color: #6b7280; margin-bottom: 6px; }
        .empty-sub { font-size: 14px; color: #9ca3af; }

        .spinner-wrap {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 80px; grid-column: 1 / -1; color: #9ca3af;
        }
        .spinner {
          width: 36px; height: 36px;
          border: 4px solid #e5e7eb; border-top-color: #2563eb;
          border-radius: 50%; animation: spin 0.8s linear infinite;
          margin-bottom: 12px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .results-count { font-size: 13px; color: #6b7280; font-weight: 600; }

        @media (max-width: 700px) {
          .sidebar { display: none; }
          .page-content { padding: 16px; }
          .jobs-grid { grid-template-columns: 1fr; }
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
            <div className="sb-nav-item" onClick={() => navigate('/dashboard')}>
              <span className="nav-icon">⊞</span> Dashboard
            </div>
            <div className="sb-nav-item active" onClick={() => navigate('/jobs')}>
              <span className="nav-icon">💼</span> {isHR ? 'All Jobs' : 'Browse Jobs'}
            </div>
            {isHR && (<>
              <div className="sb-nav-item" onClick={() => navigate('/create-job')}>
                <span className="nav-icon">➕</span> Post New Job
              </div>
              <div className="sb-nav-item" onClick={() => navigate('/hr/kanban')}>
                <span className="nav-icon">🗂️</span> Pipeline
              </div>
            </>)}
            {!isHR && (
              <div className="sb-nav-item" onClick={() => navigate('/my-applications')}>
                <span className="nav-icon">📋</span> My Applications
              </div>
            )}
          </nav>
          <div className="sb-logout">
            <button className="sb-logout-btn" onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}>🚪 Log Out</button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          <div className="topbar">
            <div>
              <div className="topbar-title">{isHR ? 'Job Listings' : 'Available Positions'}</div>
              <div className="topbar-sub">{jobs.length} jobs found</div>
            </div>
            <div className="topbar-right">
              {isHR && (
                <button
                  onClick={() => navigate('/create-job')}
                  style={{padding:'9px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Nunito,sans-serif'}}
                >+ Post New Job</button>
              )}
              {!isHR && (
                <button
                  onClick={() => navigate('/my-applications')}
                  style={{padding:'9px 20px', background:'#f5f3ff', color:'#7c3aed', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', fontFamily:'Nunito,sans-serif'}}
                >📋 My Applications</button>
              )}
            </div>
          </div>

          <div className="page-content">
            {/* FILTERS */}
            <div className="filters-bar">
              <div className="search-box">
                <span style={{color:'#9ca3af'}}>🔍</span>
                <input
                  placeholder="Search by title, company, location..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-tabs">
                {['all','full_time','part_time','contract','internship'].map(t => (
                  <button
                    key={t}
                    className={`filter-tab ${filterType === t ? 'active' : ''}`}
                    onClick={() => setFilter(t)}
                  >
                    {t === 'all' ? 'All Types' : typeMap[t]?.label || t}
                  </button>
                ))}
              </div>
            </div>

            <div className="results-bar">
              <span className="results-count">{filtered.length} results</span>
            </div>

            {/* GRID */}
            <div className="jobs-grid">
              {loading ? (
                <div className="spinner-wrap">
                  <div className="spinner" />
                  <span>Loading jobs...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-title">No jobs found</div>
                  <div className="empty-sub">Try adjusting your search or filters</div>
                </div>
              ) : (
                filtered.map(job => {
                  const tb = typeMap[job.job_type] || { label: job.job_type, color:'#6b7280', bg:'#f3f4f6' };
                  return (
                    <div key={job.id} className="job-card">
                      <div className="jc-top">
                        <div className="jc-title">{job.title}</div>
                        <span className="type-badge" style={{background: tb.bg, color: tb.color}}>{tb.label}</span>
                      </div>
                      <div className="jc-meta">
                        <span className="jc-meta-item">🏢 {job.company}</span>
                        <span className="jc-meta-item">📍 {job.location}</span>
                        <span className="jc-meta-item">💼 {job.experience_required}</span>
                        {job.salary_range && <span className="jc-meta-item">💰 {job.salary_range}</span>}
                      </div>
                      <p className="jc-desc">{job.description}</p>
                      <div className="jc-footer">
                        <span className="jc-posted">By {job.recruiter_name}</span>
                        <div className="btn-actions">
                          <button className="btn-view" onClick={() => navigate(`/jobs/${job.id}`)}>View Details</button>
                          {!isHR && (
                            <button
                              className={`btn-apply ${job.already_applied ? 'applied' : ''}`}
                              onClick={() => !job.already_applied && setSelectedJob(job)}
                              disabled={job.already_applied}
                            >
                              {job.already_applied ? '✓ Applied' : '🚀 Apply'}
                            </button>
                          )}
                          {isHR && (
                            <button className="btn-applicants" onClick={() => navigate(`/hr/applications/${job.id}`)}>
                              👥 Applicants
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedJob && (
        <ApplyJob job={selectedJob} onClose={() => setSelectedJob(null)} onSuccess={handleApplySuccess} />
      )}
      {atsResult && (
        <ATSScore
          score={atsResult.ats_score} feedback={atsResult.ats_feedback}
          matchedSkills={atsResult.matched_skills} missingSkills={atsResult.missing_skills}
          recommendations={atsResult.recommendations}
          onClose={() => navigate('/my-applications')}
        />
      )}
    </>
  );
}

export default JobList;