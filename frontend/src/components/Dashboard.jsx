import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './common/NotificationBell';
import api from '../services/api';
import Dock from './Dock';
import CountUp from './CountUp';

// ── Stat Card using CountUp ────────────────────────────────
function StatCard({ icon, value, label, accentColor, glowColor, bgColor, loading }) {
  return (
    <div className="stat-card" style={{'--accent': accentColor, '--glow': glowColor, '--ico-bg': bgColor}}>
      <div className="stat-flood" />
      <div className="stat-ico-wrap">
        <div className="stat-ico">{icon}</div>
      </div>
      <div className="stat-info">
        <div className="stat-num">
          <CountUp
            from={0}
            to={value}
            separator=","
            direction="up"
            duration={1.2}
            startCounting={!loading}
          />
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser]                       = useState(null);
  const [jobs, setJobs]                       = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [search, setSearch]                   = useState('');
  const [calMonth, setCalMonth]               = useState(new Date());

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token    = localStorage.getItem('token');
    if (!userData || !token) { navigate('/login'); return; }
    const u = JSON.parse(userData);
    setUser(u);
    fetchData(u);
  }, [navigate]);

  const fetchData = async (u) => {
    try {
      const res     = await api.get('/api/jobs/');
      const jobList = res.data;
      setJobs(jobList);
      if (u?.role === 'hr' && jobList.length > 0) {
        const results = await Promise.all(
          jobList.map(j => api.get(`/api/applications/job/${j.id}`).catch(() => ({ data: [] })))
        );
        const merged = [];
        results.forEach(r => merged.push(...r.data));
        setAllApplications(merged);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isHR       = user?.role === 'hr';
  const openJobs   = jobs.filter(j => j.status === 'open').length;
  const totalApps  = allApplications.length;
  const hired      = allApplications.filter(a => a.status === 'hired').length;
  const interviews = allApplications.filter(a => a.status === 'interview');

  const scheduledTasks = interviews
    .filter(a => a.interview_date && a.interview_time)
    .sort((a, b) => new Date(`${a.interview_date}T${a.interview_time}`) - new Date(`${b.interview_date}T${b.interview_time}`))
    .slice(0, 7);

  const today       = new Date();
  const year        = calMonth.getFullYear();
  const month       = calMonth.getMonth();
  const monthName   = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad    = firstDay === 0 ? 6 : firstDay - 1;
  const calDays     = [];
  for (let i = 0; i < startPad; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const interviewDays = new Set(
    scheduledTasks.map(t => {
      const d = new Date(t.interview_date + 'T00:00:00');
      return d.getMonth() === month && d.getFullYear() === year ? d.getDate() : null;
    }).filter(Boolean)
  );

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.company.toLowerCase().includes(search.toLowerCase()) ||
    j.location.toLowerCase().includes(search.toLowerCase())
  );

  const typeMap = {
    full_time:  { label: 'Full Time',   color: '#16a34a', bg: '#dcfce7' },
    part_time:  { label: 'Part Time',   color: '#d97706', bg: '#fef3c7' },
    contract:   { label: 'Contract',    color: '#0891b2', bg: '#e0f2fe' },
    internship: { label: 'Internship',  color: '#7c3aed', bg: '#ede9fe' },
  };

  const avatarColor = (name = '') => {
    const colors = ['#2563eb','#0D9488','#d97706','#7c3aed','#dc2626','#0891b2','#16a34a','#db2777'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  };

  // Dock items for sidebar
  const dockItems = isHR ? [
    { icon: <span style={{fontSize:'18px'}}>⊞</span>, label: 'Dashboard',  active: true,  onClick: () => navigate('/dashboard') },
    { icon: <span style={{fontSize:'18px'}}>💼</span>, label: 'All Jobs',              onClick: () => navigate('/jobs') },
    { icon: <span style={{fontSize:'18px'}}>➕</span>, label: 'Post Job',              onClick: () => navigate('/create-job') },
    { icon: <span style={{fontSize:'18px'}}>🗂️</span>, label: 'Pipeline',             onClick: () => navigate('/hr/kanban') },
    { icon: <span style={{fontSize:'18px'}}>📅</span>, label: 'Calendar',             onClick: () => navigate('/hr/kanban', { state: { tab: 'interviews' } }) },
    { icon: <span style={{fontSize:'18px'}}>📊</span>, label: 'Chart / Report',       onClick: () => navigate('/hr/kanban', { state: { tab: 'funnel' } }) },
    { icon: <span style={{fontSize:'18px'}}>⚙️</span>, label: 'Settings',            onClick: () => navigate('/settings') },
    { icon: <span style={{fontSize:'18px'}}>☰</span>,  label: 'Applicants Table',     onClick: () => navigate('/hr/applicants') },
  ] : [
    { icon: <span style={{fontSize:'18px'}}>⊞</span>, label: 'Dashboard',  active: true,  onClick: () => navigate('/dashboard') },
    { icon: <span style={{fontSize:'18px'}}>🔍</span>, label: 'Browse Jobs',            onClick: () => navigate('/jobs') },
    { icon: <span style={{fontSize:'18px'}}>📋</span>, label: 'My Applications',        onClick: () => navigate('/my-applications') },
    { icon: <span style={{fontSize:'18px'}}>⚙️</span>, label: 'Settings',              onClick: () => navigate('/settings') },
  ];

  if (!user) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html, body, #root { height: 100%; }

        .dash-root {
          display: flex; min-height: 100vh;
          font-family: 'Nunito', sans-serif;
          background: #f0f4f8;
        }

        /* ═══ SIDEBAR ═══ */
        .sidebar {
          width: 220px; flex-shrink: 0;
          background: #1a1d2e;
          display: flex; flex-direction: column;
          min-height: 100vh; position: sticky; top: 0;
          box-shadow: 2px 0 16px rgba(0,0,0,0.25);
          padding: 0 0 16px 0;
          z-index: 100;
        }

        .sb-logo-row {
          display: flex; align-items: center; gap: 10px;
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sb-logo {
          width: 36px; height: 36px; background: #2563eb;
          border-radius: 10px; display: flex; align-items: center;
          justify-content: center; font-size: 18px; flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(37,99,235,0.4);
        }
        .sb-logo-name { font-size: 15px; font-weight: 800; color: white; }
        .sb-logo-name span { color: #60a5fa; }

        .sb-profile {
          display: flex; flex-direction: column; align-items: center;
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .sb-avatar {
          width: 58px; height: 58px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #0D9488);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; color: white;
          margin-bottom: 8px;
          border: 2px solid rgba(255,255,255,0.15);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        .sb-uname { font-size: 13px; font-weight: 700; color: white; text-align: center; }
        .sb-urole { font-size: 10.5px; color: #60a5fa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 3px; }

        .sb-nav { flex: 1; padding: 14px 0; }
        .sb-section-label {
          font-size: 9.5px; font-weight: 700; color: rgba(255,255,255,0.28);
          text-transform: uppercase; letter-spacing: 1.5px;
          padding: 10px 18px 6px;
        }

        /* Dock-style nav items with magnification */
        .sb-item {
          display: flex; align-items: center; gap: 12px;
          padding: 0 12px; margin: 3px 8px;
          cursor: pointer; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.55);
          border-left: 3px solid transparent;
          transition: all 0.2s cubic-bezier(0.34,1.2,0.64,1);
          height: 42px;
          position: relative;
        }
        .sb-item:hover {
          background: rgba(255,255,255,0.07);
          color: white;
          transform: scale(1.04);
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }
        .sb-item.active {
          background: rgba(37,99,235,0.25);
          color: white;
          border-left-color: #2563eb;
          box-shadow: 0 2px 14px rgba(37,99,235,0.2);
        }
        .sb-item .si {
          font-size: 17px; width: 24px; text-align: center; flex-shrink: 0;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .sb-item:hover .si { transform: scale(1.25); }

        .sb-logout {
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .sb-logout-btn {
          width: 100%; padding: 10px 14px;
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 10px; color: #fca5a5;
          font-size: 13px; font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; gap: 10px;
        }
        .sb-logout-btn:hover { background: rgba(220,38,38,0.3); color: white; transform: scale(1.02); }

        /* ═══ MAIN ═══ */
        .main-area { flex: 1; display: flex; flex-direction: column; overflow-y: auto; }

        .topbar {
          background: white; padding: 0 30px;
          display: flex; align-items: center; justify-content: space-between;
          height: 62px; flex-shrink: 0;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-left h2 { font-size: 17px; font-weight: 800; color: #1a1d2e; }
        .topbar-left p  { font-size: 11.5px; color: #9ca3af; margin-top: 1px; }
        .topbar-right   { display: flex; align-items: center; gap: 14px; }

        .page { padding: 24px 28px; }

        /* ═══ STAT CARDS — radial hover flood + count-up ═══ */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          gap: 18px; margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 14px;
          padding: 22px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          display: flex; align-items: center; gap: 16px;
          border-top: 4px solid var(--accent);
          position: relative; overflow: hidden;
          cursor: default;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          z-index: 0;
        }

        /* Radial flood circle — starts hidden bottom-left */
        .stat-flood {
          position: absolute;
          bottom: -30px; left: -30px;
          width: 70px; height: 70px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--glow), var(--accent));
          transform: scale(0);
          transform-origin: center;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
          z-index: 0;
          pointer-events: none;
        }
        .stat-card:hover .stat-flood { transform: scale(10); }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.12); }

        /* Text flips to white on hover */
        .stat-card:hover .stat-num   { color: white; }
        .stat-card:hover .stat-label { color: rgba(255,255,255,0.8); }
        .stat-card:hover .stat-ico   { background: rgba(255,255,255,0.2) !important; }

        .stat-ico-wrap { position: relative; z-index: 1; flex-shrink: 0; }
        .stat-ico {
          width: 52px; height: 52px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px;
          background: var(--ico-bg);
          transition: background 0.4s;
        }
        .stat-info { position: relative; z-index: 1; }
        .stat-num {
          font-size: 30px; font-weight: 800; color: #1a1d2e;
          line-height: 1;
          transition: color 0.4s ease;
        }
        .stat-label {
          font-size: 11px; color: #6b7280; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px; margin-top: 5px;
          transition: color 0.4s ease;
        }

        /* ═══ QUICK ACTIONS ═══ */
        .section-hd {
          font-size: 15px; font-weight: 800; color: #1a1d2e;
          margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
        }
        .actions-row {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(190px,1fr));
          gap: 14px; margin-bottom: 24px;
        }
        .act-card {
          display: block; position: relative;
          background: linear-gradient(to bottom, #c3e6ec, #a7d1d9);
          border-radius: 14px; padding: 22px 18px;
          text-align: center; cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          overflow: hidden; z-index: 0;
          transition: transform 0.2s, box-shadow 0.2s;
          border: none;
        }
        .act-card::before {
          content: ''; position: absolute; z-index: -1;
          top: -16px; right: -16px;
          background: linear-gradient(135deg, #1a1d2e, #2563eb);
          height: 32px; width: 32px; border-radius: 32px;
          transform: scale(1); transform-origin: 50% 50%;
          transition: transform 0.4s ease-out;
        }
        .act-card:hover::before { transform: scale(28); }
        .act-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.2); }
        .act-card:hover .act-title { color: #ffffff; }
        .act-card:hover .act-desc  { color: rgba(255,255,255,0.75); }
        .act-card-corner {
          display: flex; align-items: center; justify-content: center;
          position: absolute; width: 2em; height: 2em; top: 0; right: 0;
          background: linear-gradient(135deg, #6293c8, #384c6c);
          border-radius: 0 14px 0 28px;
          font-size: 13px; color: white;
        }
        .act-icon  { font-size: 34px; margin-bottom: 10px; position: relative; z-index: 1; }
        .act-title { font-size: 13.5px; font-weight: 700; color: #1a1d2e; margin-bottom: 4px; position: relative; z-index: 1; transition: color 0.5s; }
        .act-desc  { font-size: 11.5px; color: #452c2c; line-height: 1.4; position: relative; z-index: 1; transition: color 0.5s; }

        /* ═══ JOBS TABLE ═══ */
        .card {
          background: white; border-radius: 14px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06); overflow: hidden;
          margin-bottom: 24px;
        }
        .card-hd {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; border-bottom: 1px solid #f3f4f6;
        }
        .card-title { font-size: 14px; font-weight: 800; color: #1a1d2e; }
        .search-box {
          display: flex; align-items: center; gap: 7px;
          background: #f9fafb; border: 1px solid #e5e7eb;
          border-radius: 8px; padding: 7px 12px;
        }
        .search-box input {
          border: none; background: transparent; outline: none;
          font-size: 13px; font-family: 'Nunito', sans-serif;
          color: #1a1d2e; width: 180px;
        }
        .search-box input::placeholder { color: #9ca3af; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; }
        th {
          padding: 11px 18px; text-align: left;
          font-size: 10.5px; font-weight: 700; color: #9ca3af;
          text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;
        }
        tbody tr { border-top: 1px solid #f3f4f6; transition: all 0.15s; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody tr:hover { background: #dbeafe; box-shadow: inset 4px 0 0 #2563eb; }
        tbody tr:hover td { color: #1a1d2e; }
        td { padding: 13px 18px; font-size: 13.5px; color: #374151; vertical-align: middle; }
        .co-logo {
          width: 36px; height: 36px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800; color: white;
          flex-shrink: 0; text-transform: uppercase;
        }
        .co-cell { display: flex; align-items: center; gap: 10px; }
        .co-name  { font-weight: 700; color: #1a1d2e; font-size: 13px; }
        .co-sub   { font-size: 11px; color: #9ca3af; margin-top: 1px; }
        .td-jobtitle { font-weight: 700; color: #1a1d2e; }
        .badge { padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 700; display: inline-block; }
        .badge-open   { background: #dcfce7; color: #16a34a; }
        .badge-closed { background: #fee2e2; color: #dc2626; }
        .td-acts { display: flex; gap: 7px; }
        .btn-sm { padding: 5px 12px; border: none; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif; transition: all 0.15s; }
        .btn-view  { background: #eff6ff; color: #2563eb; }
        .btn-view:hover { background: #dbeafe; }
        .btn-apps  { background: #f0fdfa; color: #0D9488; }
        .btn-apps:hover { background: #ccfbf1; }
        .btn-apply { background: #f0fdf4; color: #16a34a; }
        .btn-applied { background: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .tbl-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 13px 22px; border-top: 1px solid #f3f4f6;
          font-size: 13px; color: #6b7280;
        }
        .show-btn {
          padding: 5px 14px; border: 1px solid #d1d5db;
          border-radius: 6px; background: white; cursor: pointer;
          font-size: 12px; font-weight: 700; color: #374151;
          font-family: 'Nunito', sans-serif;
        }

        /* ═══ SCHEDULED TASKS ═══ */
        .sched-grid { display: grid; grid-template-columns: 1fr 320px; gap: 20px; margin-bottom: 32px; }
        .timeline-wrap { padding: 20px 22px; }
        .today-label { font-size: 13px; font-weight: 800; color: #1a1d2e; text-align: center; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .timeline { position: relative; padding-left: 30px; }
        .timeline::before { content: ''; position: absolute; left: 7px; top: 8px; bottom: 8px; width: 2px; background: #e5e7eb; border-radius: 2px; }
        .tl-item { position: relative; display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .tl-dot { position: absolute; left: -26px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; border-radius: 50%; background: white; border: 2.5px solid #2563eb; flex-shrink: 0; z-index: 1; }
        .tl-dot.joining { border-color: #16a34a; }
        .tl-time { font-size: 11.5px; font-weight: 700; color: #6b7280; white-space: nowrap; min-width: 56px; }
        .tl-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: white; }
        .tl-text { font-size: 13px; color: #374151; line-height: 1.4; }
        .tl-text strong { color: #1a1d2e; font-weight: 700; }
        .no-tasks { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; color: #9ca3af; text-align: center; }
        .no-tasks-icon { font-size: 40px; margin-bottom: 12px; }
        .no-tasks-text { font-size: 13px; }

        /* Calendar */
        .cal-wrap { padding: 20px 18px; }
        .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .cal-month { font-size: 13px; font-weight: 800; color: #1a1d2e; }
        .cal-nav-btn { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 16px; padding: 2px 6px; border-radius: 4px; font-family: 'Nunito', sans-serif; }
        .cal-nav-btn:hover { background: #f3f4f6; color: #1a1d2e; }
        .cal-dots { color: #9ca3af; font-size: 18px; cursor: pointer; }
        .cal-days-hd { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; margin-bottom: 8px; }
        .cal-day-hd { text-align: center; font-size: 10.5px; font-weight: 700; color: #9ca3af; text-transform: uppercase; }
        .cal-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 2px; }
        .cal-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 12.5px; color: #374151; font-weight: 500; cursor: default; transition: background 0.12s; position: relative; }
        .cal-cell.empty { pointer-events: none; }
        .cal-cell.today { background: #e53e7a; color: white; font-weight: 800; }
        .cal-cell.has-event::after { content: ''; position: absolute; bottom: 3px; width: 4px; height: 4px; border-radius: 50%; background: #2563eb; }
        .cal-cell.today.has-event::after { background: white; }
        .cal-cell:not(.empty):not(.today):hover { background: #f3f4f6; }
        .cal-summary { margin-top: 16px; padding-top: 14px; border-top: 1px solid #f3f4f6; }
        .cal-sum-label { font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .cal-sum-item  { font-size: 12.5px; color: #374151; margin-bottom: 4px; font-weight: 500; }

        .empty-row { text-align: center; padding: 36px; color: #9ca3af; font-size: 13px; }

        @media (max-width: 1100px) { .stats-row { grid-template-columns: repeat(2,1fr); } .sched-grid { grid-template-columns: 1fr; } }
        @media (max-width: 700px)  { .sidebar { display: none; } .stats-row { grid-template-columns: 1fr 1fr; } .page { padding: 14px; } }
      `}</style>

      <div className="dash-root">

        {/* ═══ SIDEBAR ═══ */}
        <aside className="sidebar">
          <div className="sb-logo-row">
            
            <div className="sb-logo-name">RECRUIT<span>-IQ</span></div>
          </div>

          <div className="sb-profile">
            <div className="sb-avatar">{user.full_name.charAt(0).toUpperCase()}</div>
            <div className="sb-uname">{user.full_name}</div>
            <div className="sb-urole">{isHR ? 'HR / Recruiter' : 'Candidate'}</div>
          </div>

          <nav className="sb-nav">
            <div className="sb-section-label">Main Menu</div>
            {dockItems.map((item, i) => (
              <div
                key={i}
                className={`sb-item ${item.active ? 'active' : ''}`}
                onClick={item.onClick}
              >
                <span className="si">{item.icon}</span>
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sb-logout">
            <button className="sb-logout-btn" onClick={handleLogout}>
              <span>⏻</span> Log Out
            </button>
          </div>
        </aside>

        {/* ═══ MAIN ═══ */}
        <div className="main-area">
          <div className="topbar">
            <div className="topbar-left">
              <h2>Dashboard</h2>
              <p>Welcome back, {user.full_name}! · {new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'long',year:'numeric'})} at {new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</p>
            </div>
            <div className="topbar-right">
              <NotificationBell />
            </div>
          </div>

          <div className="page">

            {/* ─── STATS ─── */}
            <div className="stats-row">
              {isHR ? (<>
                <StatCard icon="👁️" value={jobs.length}  label="Total Jobs"       accentColor="#2563eb" glowColor="#93c5fd" bgColor="#eff6ff" loading={loading} />
                <StatCard icon="👥" value={totalApps}     label="Total Candidates" accentColor="#16a34a" glowColor="#86efac" bgColor="#f0fdf4" loading={loading} />
                <StatCard icon="💼" value={openJobs}      label="Open Vacancies"   accentColor="#d97706" glowColor="#fcd34d" bgColor="#fffbeb" loading={loading} />
                <StatCard icon="✅" value={hired}         label="Total Placed"     accentColor="#7c3aed" glowColor="#c084fc" bgColor="#f5f3ff" loading={loading} />
              </>) : (<>
                <StatCard icon="🔍" value={jobs.length}                              label="Available Jobs"  accentColor="#2563eb" glowColor="#93c5fd" bgColor="#eff6ff" loading={loading} />
                <StatCard icon="📋" value={jobs.filter(j=>j.already_applied).length} label="Applied"         accentColor="#16a34a" glowColor="#86efac" bgColor="#f0fdf4" loading={loading} />
                <StatCard icon="🏢" value={[...new Set(jobs.map(j=>j.company))].length} label="Companies"    accentColor="#d97706" glowColor="#fcd34d" bgColor="#fffbeb" loading={loading} />
                <StatCard icon="💼" value={jobs.filter(j=>j.job_type==='full_time').length} label="Full-Time" accentColor="#7c3aed" glowColor="#c084fc" bgColor="#f5f3ff" loading={loading} />
              </>)}
            </div>

            {/* ─── QUICK ACTIONS ─── */}
            <div className="section-hd">⚡ Quick Actions</div>
            <div className="actions-row">
              {isHR ? (<>
                <div className="act-card" onClick={() => navigate('/create-job')}>
                  <div className="act-card-corner">→</div>
                  <div className="act-icon">➕</div>
                  <div className="act-title">Post New Job</div>
                  <div className="act-desc">Create a job with AI assistance</div>
                </div>
                <div className="act-card" onClick={() => navigate('/jobs')}>
                  <div className="act-card-corner">→</div>
                  <div className="act-icon">💼</div>
                  <div className="act-title">View All Jobs</div>
                  <div className="act-desc">Manage your posted jobs</div>
                </div>
                <div className="act-card" onClick={() => navigate('/hr/kanban')}>
                  <div className="act-card-corner">→</div>
                  <div className="act-icon">🗂️</div>
                  <div className="act-title">Pipeline Kanban</div>
                  <div className="act-desc">Drag & drop recruitment pipeline</div>
                </div>
              </>) : (<>
                <div className="act-card" onClick={() => navigate('/jobs')}>
                  <div className="act-card-corner">→</div>
                  <div className="act-icon">🔍</div>
                  <div className="act-title">Browse Jobs</div>
                  <div className="act-desc">Find and apply to matching jobs</div>
                </div>
                <div className="act-card" onClick={() => navigate('/my-applications')}>
                  <div className="act-card-corner">→</div>
                  <div className="act-icon">📋</div>
                  <div className="act-title">My Applications</div>
                  <div className="act-desc">Track your ATS scores & status</div>
                </div>
              </>)}
            </div>

            {/* ─── JOBS TABLE ─── */}
            <div className="card">
              <div className="card-hd">
                <span className="card-title">📋 {isHR ? 'JOBS LIST' : 'AVAILABLE JOBS'}</span>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                  <div className="search-box">
                    <span style={{color:'#9ca3af',fontSize:'13px'}}>🔍</span>
                    <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                  {isHR && (
                    <button onClick={() => navigate('/create-job')}
                      style={{padding:'7px 16px', background:'#2563eb', color:'white', border:'none', borderRadius:'7px', cursor:'pointer', fontSize:'12.5px', fontWeight:'700', fontFamily:'Nunito,sans-serif'}}>
                      + Post Job
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="empty-row">Loading...</div>
              ) : filteredJobs.length === 0 ? (
                <div className="empty-row">
                  {isHR ? 'No jobs posted yet.' : 'No jobs available.'}
                  {isHR && <button style={{marginLeft:'12px',padding:'6px 14px',background:'#2563eb',color:'white',border:'none',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight:'700',fontFamily:'Nunito,sans-serif'}} onClick={() => navigate('/create-job')}>Post First Job</button>}
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Recruiter / Company</th>
                        <th>Job Title / Position</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Experience</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => {
                        const tb = typeMap[job.job_type] || { label: job.job_type, color:'#6b7280', bg:'#f3f4f6' };
                        const col = avatarColor(job.company);
                        const initials = job.company.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
                        return (
                          <tr key={job.id}>
                            <td>
                              <div className="co-cell">
                                <div className="co-logo" style={{background: col}}>{initials}</div>
                                <div>
                                  <div className="co-name">{job.company}</div>
                                  <div className="co-sub">by {job.recruiter_name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="td-jobtitle">{job.title}</td>
                            <td><span className="badge" style={{background: tb.bg, color: tb.color}}>{tb.label}</span></td>
                            <td>📍 {job.location}</td>
                            <td>{job.experience_required}</td>
                            <td><span className={`badge ${job.status === 'open' ? 'badge-open' : 'badge-closed'}`}>{job.status}</span></td>
                            <td>
                              <div className="td-acts">
                                <button className="btn-sm btn-view" onClick={() => navigate(`/jobs/${job.id}`)}>View</button>
                                {isHR && <button className="btn-sm btn-apps" onClick={() => navigate(`/hr/applications/${job.id}`)}>👥 Applicants</button>}
                                {!isHR && (
                                  <button className={`btn-sm ${job.already_applied ? 'btn-applied' : 'btn-apply'}`}
                                    onClick={() => !job.already_applied && navigate(`/jobs/${job.id}`)} disabled={job.already_applied}>
                                    {job.already_applied ? '✓ Applied' : 'Apply'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="tbl-footer">
                    <span>Showing {filteredJobs.length} of {filteredJobs.length} jobs</span>
                    <button className="show-btn">Show {filteredJobs.length}</button>
                  </div>
                </>
              )}
            </div>

            {/* ─── SCHEDULED TASKS ─── */}
            <div className="section-hd">📅 SCHEDULED TASKS</div>
            <div className="sched-grid">
              <div className="card">
                <div className="timeline-wrap">
                  <div className="today-label">Today</div>
                  {scheduledTasks.length === 0 ? (
                    <div className="no-tasks">
                      <div className="no-tasks-icon">📭</div>
                      <div className="no-tasks-text">{isHR ? 'No interviews scheduled. Schedule from the Pipeline.' : 'No upcoming interviews yet.'}</div>
                    </div>
                  ) : (
                    <div className="timeline">
                      {scheduledTasks.map((task, i) => {
                        const col  = avatarColor(task.candidate_name || String(i));
                        const init = (task.candidate_name || 'C').charAt(0).toUpperCase();
                        return (
                          <div key={task.application_id} className="tl-item">
                            <div className={`tl-dot ${task.status === 'interview' ? 'interview' : 'joining'}`} />
                            <span className="tl-time">{task.interview_time || '–'}</span>
                            <div className="tl-avatar" style={{background: col}}>{init}</div>
                            <div className="tl-text">
                              {task.status === 'interview' ? 'Interview ' : 'Joining '}
                              <strong>{task.candidate_name}</strong>
                              {task.job_title && ` — ${task.job_title}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="cal-wrap">
                  <div className="cal-nav">
                    <button className="cal-nav-btn" onClick={() => setCalMonth(new Date(year, month-1, 1))}>‹</button>
                    <span className="cal-month">{monthName}</span>
                    <button className="cal-nav-btn" onClick={() => setCalMonth(new Date(year, month+1, 1))}>›</button>
                    <span className="cal-dots">⋮</span>
                  </div>
                  <div className="cal-days-hd">
                    {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="cal-day-hd">{d}</div>)}
                  </div>
                  <div className="cal-grid">
                    {calDays.map((d, i) => {
                      const isToday = d && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                      const hasEv   = d && interviewDays.has(d);
                      return (
                        <div key={i} className={`cal-cell ${!d?'empty':''} ${isToday?'today':''} ${hasEv?'has-event':''}`}>{d}</div>
                      );
                    })}
                  </div>
                  <div className="cal-summary">
                    <div className="cal-sum-label">Summary</div>
                    <div className="cal-sum-item">🗓️ {interviews.length} Interview{interviews.length!==1?'s':''} scheduled</div>
                    <div className="cal-sum-item">💼 {openJobs} Open position{openJobs!==1?'s':''}</div>
                    {isHR && <div className="cal-sum-item">🎉 {hired} Hired this cycle</div>}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;